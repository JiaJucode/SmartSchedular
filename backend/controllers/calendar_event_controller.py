from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.calendar_event_service import *

bp = Blueprint("calendar_event_controller", __name__)

CORS(bp, resources={r"/*": {"origins": "http://localhost:3000"}})

@bp.route("/get_events", methods=["GET"])
def get_events():
    """
    Params:
        "start_datetime": ISO datetime string,
        "end_datetime": ISO datetime string
    
    Returns:
        JSON list of events
        example:
            "events": [
                {
                    "id": 1,
                    "name": "Event 1",
                    "Tags": ["tag1", "tag2"],
                    "start_datetime": iso_datetime_string,
                    "end_datetime": iso_datetime_string,
                    "description": "Description 1"
                },
                ...
            ]
    """
    start_datetime = request.args.get("start_datetime")
    end_datetime = request.args.get("end_datetime")
    if not start_datetime or not end_datetime:
        return jsonify({"error": "start_datetime and end_datetime are required"}), 400

    events = get_calendar_events(start_datetime, end_datetime)

    return jsonify({"events": events})

@bp.route("/add_event", methods=["POST"])
def add_event():
    """
    params:
        "title": str,
        "source": int | None,
        "tags": [str],
        "start_datetime": ISO datetime string,
        "end_datetime": ISO datetime string,
        "description": str

    Returns:
        {"id": int}
    """
    title = request.json.get("title")
    source = request.json.get("source")
    tags = request.json.get("tags")
    str_start_datetime = request.json.get("start_datetime")
    str_end_datetime = request.json.get("end_datetime")
    description = request.json.get("description")
    id = add_calendar_event(title, source, tags, str_start_datetime, 
                            str_end_datetime, description)
    return jsonify({"id": id})

@bp.route("/edit_event", methods=["POST"])
def edit_event():
    """
    params:
        "id": int,
        "title": str,
        "source": int | None,
        "tags": [str],
        "start_datetime": ISO datetime string,
        "end_datetime": ISO datetime string,
        "description": str

    Returns:
        None
    """
    id = request.json.get("id")
    title = request.json.get("title")
    source = request.json.get("source")
    tags = request.json.get("tags")
    str_start_datetime = request.json.get("start_datetime")
    str_end_datetime = request.json.get("end_datetime")
    description = request.json.get("description")
    edit_calendar_event(id, title, source, tags, str_start_datetime, 
                        str_end_datetime, description)
    return jsonify({})

@bp.route("/delete_event", methods=["POST"])
def delete_event():
    """
    params:
        "id": int

    Returns:
        None
    """
    id = int(request.json.get("id"))
    delete_calendar_event(id)
    return jsonify({})

