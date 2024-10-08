from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.task_service import *

bp = Blueprint("chat_controller", __name__)

CORS(bp, resources={r"/*": {"origins": "http://localhost:3000"}})

@bp.route("/query", methods=["POST"])
def query():
    """
    params:
        "message": str,
        "current_date": iso_date_string
    Returns:
        {
            "response": str,
            "action_type": str in ["task", "calendar"],
            "content": List[Dict]
        }
    """
    message = request.json.get("message")
    current_date = request.json.get("current_date")
    if not message:
        return jsonify({"error": "message is required"}), 400
    if not current_date:
        return jsonify({"error": "current_date is required"}), 400

    response = handle_chat_message(message, current_date)
    return jsonify(response)