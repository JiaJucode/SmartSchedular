from flask import Blueprint, jsonify, request
from flask_cors import CORS
from services.calendar_event_service import get_calendar_events

bp = Blueprint('calendar_event_controller', __name__)

CORS(bp, resources={r'/*': {'origins': 'http://localhost:3000'}})

@bp.route('/get_events', methods=['GET'])
def get_events():
    """
    Params:
        "start_datetime": str,
        "end_datetime": str
    
    Returns:
        JSON list of events
        example:
            "events": [
                {
                    "id": 1,
                    "name": "Event 1",
                    "Tags": ["tag1", "tag2"],
                    "start_datetime": "2021-01-01 12:00:00",
                    "end_datetime": "2021-01-01 13:00:00",
                    "description": "Description 1"
                },
                ...
            ]
    """
    start_datetime = request.args.get('start_datetime')
    end_datetime = request.args.get('end_datetime')
    if not start_datetime or not end_datetime:
        return jsonify({'error': 'start_datetime and end_datetime are required'}), 400

    events = get_calendar_events(start_datetime, end_datetime)

    return jsonify({'events': events})