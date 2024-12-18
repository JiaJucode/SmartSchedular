from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.calendar_event_service import *
from services.rag_linking_service import link_document_segments_to_event

bp = Blueprint("calendar_event_controller", __name__)

@bp.route("/get_events", methods=["GET"])
def get_events():
    """
    Params:
        "startDatetime": ISO datetime string,
        "endDatetime": ISO datetime string
    
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
    start_datetime = request.args.get("startDatetime")
    end_datetime = request.args.get("endDatetime")
    if not start_datetime or not end_datetime:
        return jsonify({"error": "startDatetime and endDatetime are required"}), 400

    events = get_calendar_events(start_datetime, end_datetime)

    return jsonify({"events": events})

@bp.route("/add_event", methods=["POST"])
def add_event():
    """
    params:
        "title": str,
        "tags": [str],
        "startDatetime": ISO datetime string,
        "endDatetime": ISO datetime string,
        "description": str
        "documentSegments": List[Dict[str, (int, int)]]

    Returns:
        {"id": int}
    """
    title = request.json.get("title")
    tags = request.json.get("tags")
    str_start_datetime = request.json.get("startDatetime")
    str_end_datetime = request.json.get("endDatetime")
    description = request.json.get("description")
    document_segments = request.json.get("documentSegments")
    user_id = 0
    event_id = add_calendar_event(title, tags, str_start_datetime, 
                            str_end_datetime, description)
    if len(document_segments) > 0:
        link_document_segments_to_event(user_id, event_id, document_segments)
    return jsonify({"id": event_id})

@bp.route("/edit_event", methods=["POST"])
def edit_event():
    """
    params:
        "id": int,
        "title": str,
        "tags": [str],
        "startDatetime": ISO datetime string,
        "endDatetime": ISO datetime string,
        "description": str

    Returns:
        None
    """
    id = request.json.get("id")
    title = request.json.get("title")
    tags = request.json.get("tags")
    str_start_datetime = request.json.get("startDatetime")
    str_end_datetime = request.json.get("endDatetime")
    description = request.json.get("description")
    edit_calendar_event(id, title, tags, str_start_datetime, 
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

