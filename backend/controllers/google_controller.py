from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.google_service import google_drive_setup


bp = Blueprint("google_controller", __name__)

CORS(bp, resources={r"/*": {"origins": "http://localhost:3000"}})

@bp.route("/setup_token", methods=["POST"])
def setup_refresh_token():
    """
    params:
        "id_token": str
        "refresh_token": str
        "access_token": str
    Returns:
        {"message": str}
    """
    id_token = request.json.get("id_token")
    refresh_token = request.json.get("refresh_token")
    access_token = request.json.get("access_token")
    # temporary user_id = 0
    user_id = 0

    if not refresh_token:
        return jsonify({"error": "refresh_token is required"}), 400
    if not access_token:
        return jsonify({"error": "access_token is required"}), 400
    
    result = google_drive_setup(user_id, id_token, refresh_token, access_token)
    if "error" in result:
        return jsonify(result), 400
    return jsonify({"message": "Refresh token set up successfully"})

# TODO: receive push notification from google drive
@bp.route("/push_notification", methods=["POST"])
def push_notification():
    pass