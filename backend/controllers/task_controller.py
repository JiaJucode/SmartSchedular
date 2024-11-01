from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.task_service import *
from services.task_schedular_service import get_time_left_to_schedule
from services.rag_linking_service import link_document_segments_to_task

bp = Blueprint("task_controller", __name__)

CORS(bp, resources={r"/*": {"origins": "http://localhost:3000"}})

@bp.route("/get_tasks", methods=["GET"])
def get_tasks():
    """
    params:
        "parentId": int
    Returns:
        JSON list of tasks
        example:
            "tasks": [
                {
                    "id": 1,
                    "name": "Task 1",
                    "description": "Description 1",
                    "startDate": iso_date_string | None,
                    "endDate": iso_date_string | None,
                    "priority": int,
                    "estimated_time": int | None,
                    "hours_to_schedule": int | None,
                    "completed": bool,
                },
                ...
            ]
    """
    parent_id = request.args.get("parentId")
    if not parent_id:
        return jsonify({"error": "parentId is required"}), 400
    
    tasks = get_tasks_by_parent_id(parent_id)
    for task in tasks:
        task["hours_to_schedule"] = get_time_left_to_schedule(task)

    return jsonify({"tasks": tasks})

@bp.route("/add_task", methods=["POST"])
def add_task():
    """
    params:
        "parentId": int,
        "title": str,
        "description": str,
        "startDate": iso_date_string | None,
        "endDate": iso_date_string | None,
        "priority": int,
        "estimatedTime": int | None,
        "completed": bool
        "documentSegments": List[Dict[str, Any]]
    Returns:
        {"id": int,` "timeLeft": int}
    """
    app.logger.info("add_task received: %s", request.json)
    parent_id = request.json.get("parentId")
    title = request.json.get("title")
    description = request.json.get("description")
    start_date = request.json.get("startDate")
    end_date = request.json.get("endDate")
    priority = request.json.get("priority")
    estimated_time = request.json.get("estimatedTime")
    completed = request.json.get("completed")
    document_segments = request.json.get("documentSegments")
    user_id = 0
    task_id = service_add_task(parent_id, title, description, start_date, end_date, 
                          priority, estimated_time, completed)
    if len(document_segments) > 0:
        link_document_segments_to_task(user_id, task_id, document_segments)
    return jsonify({"id": task_id})

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
    return jsonify({})

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

@bp.route("/schedule_task", methods=["POST"])
def schedule_task():
    """
    params:
        "id": int
    Returns:
        {"timeLeft": int}
    """
    task_id = request.json.get("id")
    time_left = schedule_task_from_id(task_id)
    return jsonify({"timeLeft": time_left})

@bp.route("/deschedule_task", methods=["POST"])
def deschedule_task():
    """
    params:
        "id": int
    Returns:
        None
    """
    task_id = request.json.get("id")
    deschedule_task_from_id(task_id)
    return jsonify({})
