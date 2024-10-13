from models.calendar_model import CalendarEventDB
from models.task_calendar_link_model import TaskCalendarLinkDB
from typing import Dict, List
from datetime import datetime, timedelta

def _split_event(event: Dict) -> List[Dict]:
    """
    Split an event that spans multiple days into multiple events
    """
    start = event['start_datetime']
    end = event['end_datetime']
    split_events = []
    while start < end:
        current_end = start.replace(hour=23, minute=59, second=59)
        event_copy = event.copy()
        event_copy['start_datetime'] = start
        event_copy['end_datetime'] = current_end
        start = current_end + timedelta(seconds=1)
        split_events.append(event_copy)
    return split_events

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

    # trim the events to the requested time range 
    # and split events that span multiple days
    trimmed_events = []
    for event in events:
        if event['start_datetime'] < start_datetime:
            event['start_datetime'] = start_datetime
        if event['end_datetime'] > end_datetime:
            event['end_datetime'] = end_datetime
        if event['start_datetime'].date() != event['end_datetime'].date():
            trimmed_events.extend(_split_event(event))
        else:
            trimmed_events.append(event)

    # convert datetime objects to isoformat strings
    for event in trimmed_events:
        event['start_datetime'] = event['start_datetime'].isoformat()
        event['end_datetime'] = event['end_datetime'].isoformat()
    return trimmed_events


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

def delete_calendar_event(id: int):
    CalendarEventDB.delete_event(id)
    TaskCalendarLinkDB.unlink_task_from_event(id)
    # TODO: delete link

def get_calendar_event(event_id: int) -> Dict:
    return CalendarEventDB.get_event(event_id)
