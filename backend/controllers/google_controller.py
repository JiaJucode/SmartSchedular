from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.google_service import google_drive_setup, update_changes
from models.google_model import GoogleAuthenDB
from flask import current_app as app
from urllib.parse import urlparse, parse_qs

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
    """
    header example:
    X-Real-Ip: 66.249.83.75
    X-Forwarded-For: 66.249.83.75
    X-Forwarded-Proto: https
    Connection: close
    Content-Length: 0
    Accept: */*
    X-Goog-Channel-Id: db4912dc-2500-4ab6-b717-3c45a29360fe
    X-Goog-Channel-Expiration: Sun, 03 Nov 2024 20:20:09 GMT
    X-Goog-Resource-State: change
    X-Goog-Message-Number: 330465
    X-Goog-Resource-Id: 5TzSs6V-L1-e8yG4kk3114sNKoo
    X-Goog-Resource-Uri: https://www.googleapis.com/drive/v3/changes?alt=json&pageToken=241
    User-Agent: APIs-Google; (+https://developers.google.com/webmasters/APIs-Google.html)
    Accept-Encoding: gzip, deflate, br
    """
    app.logger.info(str(request.headers))
    channel_id = request.headers.get("X-Goog-Channel-Id")
    update_changes(channel_id)

    return jsonify({"message": "success"}), 200

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
