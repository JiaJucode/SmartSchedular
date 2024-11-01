from models.calendar_model import CalendarEventDB
from models.task_calendar_link_model import TaskCalendarLinkDB
from typing import Dict, List
from datetime import datetime
from utils.calendar_utils import trim_events
from services.rag_linking_service import unlink_document_segment

def get_calendar_events(start_datetime_str: str, end_datetime_str: str) -> List[Dict]:
    """
    return:
        [{
            "id": int,
            "name": str,
            "Tags": [str],
            "start_datetime": iso_datetime_string,
            "end_datetime": iso_datetime_string,
            "description": str
        },
        ...]
    """
    start_datetime = datetime.fromisoformat(start_datetime_str).replace(tzinfo=None)
    end_datetime = datetime.fromisoformat(end_datetime_str).replace(tzinfo=None)
    if start_datetime > end_datetime:
        raise ValueError("start_datetime must be before end_datetime,\
                         got {} and {}".format(start_datetime, end_datetime))
    # query database for events between start_datetime and end_datetime
    events = CalendarEventDB.get_events(start_datetime, end_datetime)
    return trim_events(events, start_datetime, end_datetime)

def add_calendar_event(title: str, tags: List[str], str_start_datetime: str,
                       str_end_datetime: str, description: str):
    start_datetime = datetime.fromisoformat(str_start_datetime)
    end_datetime = datetime.fromisoformat(str_end_datetime)
    if start_datetime > end_datetime:
        raise ValueError("start_datetime must be before end_datetime")
    return CalendarEventDB.add_event(title, tags, start_datetime, end_datetime, description)

def edit_calendar_event(id: int, title: str, tags: List[str], str_start_datetime: str,
                        str_end_datetime: str, description: str):
    start_datetime = datetime.fromisoformat(str_start_datetime)
    end_datetime = datetime.fromisoformat(str_end_datetime)
    CalendarEventDB.update_event(id, title, tags, start_datetime, end_datetime, description)
    unlink_document_segment(id, is_task=False)

def delete_calendar_event(id: int):
    TaskCalendarLinkDB.unlink_task_from_event(id)
    CalendarEventDB.delete_event(id)
    unlink_document_segment(id, is_task=False)

def get_calendar_event(event_id: int) -> Dict:
    return CalendarEventDB.get_event(event_id)
