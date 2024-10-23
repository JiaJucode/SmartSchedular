from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.chat_service import handle_chat_message

bp = Blueprint("chat_controller", __name__)

CORS(bp, resources={r"/*": {"origins": "http://localhost:3000"}})

@bp.route("/query", methods=["POST"])
def query():
    """
    params:
        "message": str,
        "all_tags": List[str],
        "currentDate": iso_date_string
        "history": Optional[String]
    Returns:
        {
            "response": str,
        }
    """
    tags = request.json.get("all_tags")
    message = request.json.get("message")
    current_date = request.json.get("currentDate")
    context = request.json.get("context")
    user_id = 0
    if not message:
        return jsonify({"error": "message is required"}), 400
    if not current_date:
        return jsonify({"error": "current_date is required"}), 400
    if not context:
        context = ""

    response, context_used = handle_chat_message(message, current_date, tags, context, user_id)
    return jsonify({"response": response, "context": context_used}), 200