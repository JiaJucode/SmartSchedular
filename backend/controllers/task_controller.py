from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.task_service import *
from flask import current_app as app

bp = Blueprint("task_controller", __name__)

CORS(bp, resources={r"/*": {"origins": "http://localhost:3000"}})

@bp.route("/get_tasks", methods=["GET"])
def get_tasks():
    """
    params:
        "parent_id": int
    Returns:
        JSON list of tasks
        example:
            "tasks": [
                {
                    "id": 1,
                    "name": "Task 1",
                    "description": "Description 1",
                    "start_date": iso_date_string | None,
                    "end_date": iso_date_string | None,
                    "priority": int,
                    "estimated_time": int | None,
                    completed: bool,
                },
                ...
            ]
    """
    parent_id = request.args.get("parent_id")
    if not parent_id:
        return jsonify({"error": "parent_id is required"}), 400

    tasks = get_tasks_by_parent_id(parent_id)

    return jsonify({"tasks": tasks})

@bp.route("/add_task", methods=["POST"])
def add_task():
    """
    params:
        "parent_id": int,
        "title": str,
        "description": str,
        "startDate": iso_date_string | None,
        "endDate": iso_date_string | None,
        "priority": int,
        "estimatedTime": int | None,
        "completed": bool
    Returns:
        {"id": int,` "time_left": int}
    """
    parent_id = request.json.get("parent_id")
    title = request.json.get("title")
    description = request.json.get("description")
    start_date = request.json.get("startDate")
    end_date = request.json.get("endDate")
    priority = request.json.get("priority")
    estimated_time = request.json.get("estimatedTime")
    completed = request.json.get("completed")
    id = service_add_task(parent_id, title, description, start_date, end_date, 
                          priority, estimated_time, completed)
    return jsonify({"id": id})

@bp.route("/update_task", methods=["POST"])
def update_task():
    """
    params:
        "id": int,
        "title": str | None,
        "description": str | None,
        "startDate": iso_date_string | None,
        "endDate": iso_date_string | None,
        "priority": int | None,
        "estimatedTime": int | None,
        "completed": bool | None
    """
    id = request.json.get("id")
    title = request.json.get("title")
    description = request.json.get("description")
    start_date = request.json.get("startDate")
    end_date = request.json.get("endDate")
    priority = request.json.get("priority")
    estimated_time = request.json.get("estimatedTime")
    completed = request.json.get("completed")
    service_update_task(id, title, description, start_date, end_date, 
                        priority, estimated_time, completed)

@bp.route("/delete_task", methods=["POST"])
def delete_task():
    """
    params:
        "id": int
    Returns:
        None
    """
    id = request.json.get("id")
    service_delete_task(id)
    return jsonify({})
