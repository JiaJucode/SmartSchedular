from models.task_model import TaskDB
from typing import List, Dict
from datetime import datetime

db = TaskDB()

def get_tasks_by_parent_id(parent_id: int) -> List[Dict]:
    """
    return:
        [{
            "id": int,
            "name": str,
            "description": str,
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD",
            "completed": bool
        },
        ...]
    """
    tasks = db.get_child_tasks(parent_id)
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
        completed: bool
    Returns:
        int
    """
    start_date = None
    end_date = None
    if str_start_date is not None:
        start_date = datetime.fromisoformat(str_start_date)
    if str_end_date is not None:
        end_date = datetime.fromisoformat(str_end_date)
    return db.add_task(parent_id, title, description, start_date, end_date, 
                       priority, estimated_time, completed)
    
def service_update_task(id: int, title: str, description: str,
                        str_start_date: str | None, str_end_date: str | None, 
                        priority: int, estimated_time: int | None,
                        completed: bool) -> None:
    """
    params:
        id: int,
        title: str,
        description: str,
        start_date: iso_date_string,
        end_date: iso_date_string,
        priority: int,
        estimated_time: int,
        completed: bool
    Returns:
        None
    """
    start_date = None
    end_date = None
    if str_start_date is not None:
        start_date = datetime.fromisoformat(str_start_date)
    if str_end_date is not None:
        end_date = datetime.fromisoformat(str_end_date)
    db.update_task(id, title, description, start_date, end_date, 
                   priority, estimated_time, completed)