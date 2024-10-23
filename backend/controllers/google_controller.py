from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.google_service import google_drive_setup
from models.google_model import GoogleDB

bp = Blueprint("google_controller", __name__)

CORS(bp, resources={r"/*": {"origins": "http://localhost:3000"}})

@bp.route("/setup_token", methods=["POST"])
def setup_refresh_token():
    """
    params:
        "idToken": str
        "refreshToken": str
        "accessToken": str
    Returns:
        {"message": str}
    """
    id_token = request.json.get("idToken")
    refresh_token = request.json.get("refreshToken")
    access_token = request.json.get("accessToken")
    # temporary user_id = 0
    user_id = 0

    if not id_token or not refresh_token or not access_token:
        return jsonify({"error": "idToken, refreshToken, and accessToken are required"}), 400
    
    result = google_drive_setup(user_id, id_token, refresh_token, access_token)
    if "error" in result:
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
    result = GoogleDB.check_connected(user_id)
    return jsonify({"connected": result})