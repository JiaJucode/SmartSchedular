from models.task_model import TaskDB
from typing import List, Dict
from datetime import datetime
from services.task_calendar_link_service import schedule_task, \
    update_scheduled_task, get_calendar_id_for_task

def get_tasks_by_parent_id(parent_id: int) -> List[Dict]:
    """
    return:
        [{
            "id": int,
            "name": str,
            "description": str,
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD",
            "priority": int,
            "estimated_time": int,
            "completed": bool
        },
        ...]
    """
    tasks = TaskDB.get_child_tasks(parent_id)
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
        (event_id: int, time_left: int)
        if time_left is -1, then the task was not scheduled
    """
    start_date = None
    end_date = None
    if str_start_date is not None:
        start_date = datetime.fromisoformat(str_start_date)
    if str_end_date is not None:
        end_date = datetime.fromisoformat(str_end_date)

    event_id = TaskDB.add_task(parent_id, title, description, start_date, end_date,
                            priority, estimated_time, completed)
    
    time_left = -1
    task = TaskDB.get_task(event_id)
    if start_date is not None and end_date is not None and estimated_time is not None:
        time_left = schedule_task(task)
    return event_id, time_left
    
def service_update_task(id: int, title: str | None,
                        description: str | None, str_start_date: str | None, 
                        str_end_date: str | None, priority: int | None,
                        estimated_time: int | None, completed: bool | None) -> int:
    """
    if param is None, then the value is not updated
    return:
        time_left: int
    """
    start_date = None
    end_date = None
    if str_start_date is not None:
        start_date = datetime.fromisoformat(str_start_date)
    if str_end_date is not None:
        end_date = datetime.fromisoformat(str_end_date)
    TaskDB.update_task(id, title, description, start_date, end_date, 
                   priority, estimated_time, completed)
    
    task = TaskDB.get_task(id)
    # if task is scheduled, update the scheduled task event
    if len(get_calendar_id_for_task(id)) > 0:
        return update_scheduled_task(task)
    else:
        schedule_task(task)
    return 0
    
    
def service_delete_task(id: int) -> None:
    """
    params:
        id: int
    Returns:
        None
    """
    TaskDB.delete_task(id)
    # TODO: delete task calendar links