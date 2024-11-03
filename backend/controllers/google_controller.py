from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.google_service import google_drive_setup
from models.google_model import GoogleAuthenDB
from flask import current_app as app

bp = Blueprint("google_controller", __name__)

@bp.route("/setup_token", methods=["POST"])
def setup_refresh_token():
    """
    params:
        "code": str
    Returns:
        {"message": str}
    """
    code = request.json.get("code")
    # temporary user_id
    user_id = 0

    if not code:
        return jsonify({"error": "authorization code is required"}), 400
    
    result = google_drive_setup(user_id, code)
    if "error" in result:
        app.logger.error(result["error"])
        return jsonify(result), 400
    return jsonify(result)

# TODO: receive push notification from google drive
@bp.route("/push_notification", methods=["POST"])
def push_notification():
    pass

@bp.route("/check_connected", methods=["GET"])
def check_connected():
    """
    params:
        userId: int
    Returns:
        {"connected": bool}
    """
    # temporary user_id = 0
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    connected = GoogleAuthenDB.check_connected(user_id)
    syncing = GoogleAuthenDB.check_syncing(user_id)
    return jsonify({"connected": connected, "syncing": syncing})