from models.task_model import TaskDB
from typing import List, Dict

db = TaskDB()

def get_tasks_by_parent_id(parent_id: int) -> List[Dict]:
    """
    return:
        [{
            "id": int,
            "name": str,
            "description": str,
            "start_date": "YYYY-MM-DD",
            "due_date": "YYYY-MM-DD",
            "completed": bool
        },
        ...]
    """
    tasks = db.get_child_tasks(parent_id)
    return tasks

    