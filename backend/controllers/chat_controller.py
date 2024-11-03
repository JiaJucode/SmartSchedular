from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.chat_service import handle_chat_message
from flask import current_app as app

bp = Blueprint("chat_controller", __name__)

@bp.route("/query", methods=["POST"])
def query():
    """
    params:
        "message": str,
        "allTags": List[str],
        "currentDate": iso_date_string
        "context": Optional[String]
    Returns:
        {
            "response": str,
        }
    """
    tags = request.json.get("allTags")
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

    response, context_used, document_segments = handle_chat_message(
        message, current_date, tags, context, user_id)
    if not context_used:
        return jsonify({"error": response}), 500
    return jsonify({"response": response, "context": context_used, 
                    "document_segments": document_segments}), 200