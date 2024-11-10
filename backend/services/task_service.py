from models.task_model import TaskDB
from typing import List, Dict
from datetime import datetime
from services.task_schedular_service import schedule_task, deschedule_task,\
    update_scheduled_task, get_calendar_id_for_task
from services.rag_linking_service import unlink_generated_item
from flask import current_app as app

def get_tasks_by_parent_id(parent_id: int) -> List[Dict]:
    """
    return:
        [{
            "id": int,
            "name": str,
            "description": str,
            "start_date": iso_date_string,
            "end_date": iso_date_string,
            "priority": int,
            "estimated_time": int,
            "completed": bool
        },
        ...]
    """
    tasks = TaskDB.get_child_tasks(parent_id)
    return tasks

def get_tasks_by_date_range(str_start_date: str, str_end_date: str) -> List[Dict]:
    """
    return:
        [{
            "id": int,
            "name": str,
            "description": str,
            "start_date": iso_date_string,
            "end_date": iso_date_string,
            "priority": int,
            "estimated_time": int,
            "completed": bool
        },
        ...]
    """
    start_date = datetime.fromisoformat(str_start_date).replace(tzinfo=None)
    end_date = datetime.fromisoformat(str_end_date).replace(tzinfo=None)
    tasks = TaskDB.get_tasks_by_date_range(start_date, end_date)
    return tasks

def service_add_task(parent_id: int, title: str, 
                     description: str, str_start_date: str | None, 
                     str_end_date: str | None, priority: int,
                     estimated_time: int | None, completed: bool) -> int:
    """
    params:
        parent_id: int,
        title: str,
        description: str,
        start_date: iso_date_string,
        str_end_date: iso_date_string,
        priority: int,
        estimated_time: int,
        completed: bool
    Returns:
        event_id: int
    """
    start_date = None
    end_date = None
    if str_start_date is not None:
        start_date = datetime.fromisoformat(str_start_date).replace(tzinfo=None)
    if str_end_date is not None:
        end_date = datetime.fromisoformat(str_end_date).replace(tzinfo=None)

    event_id = TaskDB.add_task(parent_id, title, description, start_date, end_date,
                            priority, estimated_time, completed)
    
    # TODO: this should be a user setting, to automatically schedule tasks
    if start_date is not None and end_date is not None \
        and estimated_time is not None and parent_id != 0:
        schedule_task({
            "id": event_id,
            "title": title,
            "description": description,
            "start_datetime": start_date,
            "end_datetime": end_date,
            "priority": priority,
            "estimated_time": estimated_time,
            "completed": completed
        })
    return event_id
    
def service_update_task(id: int, title: str | None,
                        description: str | None, str_start_date: str | None, 
                        str_end_date: str | None, priority: int | None,
                        estimated_time: int | None, completed: bool | None) -> None:
    """
    if param is None, then the value is not updated
    """
    start_date = None
    end_date = None
    if str_start_date is not None:
        start_date = datetime.fromisoformat(str_start_date).replace(tzinfo=None)
    if str_end_date is not None:
        end_date = datetime.fromisoformat(str_end_date).replace(tzinfo=None)
    TaskDB.update_task(id, title, description, start_date, end_date, 
                   priority, estimated_time, completed)
    
    # if task is scheduled, update the scheduled task event
    if len(get_calendar_id_for_task(id)) > 0:
        update_scheduled_task({
            "id": id,
            "title": title,
            "description": description,
            "start_datetime": start_date,
            "end_datetime": end_date,
            "priority": priority,
            "estimated_time": estimated_time,
            "completed": completed
        })
    
    # if task is linked with any document segments, cut the link
    unlink_generated_item(id, is_task=True)
    
def service_delete_task(id: int) -> None:
    """
    params:
        id: int
    Returns:
        None
    """
    all_ids = TaskDB.get_child_hierarchy_ids(id)
    for i in range(len(all_ids) - 1, -1, -1):
        for id in all_ids[i]:
            deschedule_task(id)
            unlink_generated_item(id, is_task=True)
            TaskDB.delete_task(id)

def schedule_task_from_id(task_id: int) -> int:
    """
    return:
        time_left: int
    schedule task from task_id
    """
    task = TaskDB.get_task(task_id)
    app.logger.info(f"task: {task}")
    return schedule_task(task)

def deschedule_task_from_id(task_id: int) -> int:
    """
    deschedule task from task_id
    """
    deschedule_task(task_id)
    
