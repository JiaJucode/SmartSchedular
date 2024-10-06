from datetime import datetime
from typing import List, Dict

def get_empty_timeslots_util(current_events: List[Dict], 
                         start_datetime: datetime, end_datetime: datetime) -> List[Dict]:
    event_times = []
    for event in current_events:
        event_times.append((event['start_datetime'], True, event['id']))
        event_times.append((event['end_datetime'], False, event['id']))
    event_times.sort()
    timeslots = []
    start = start_datetime
    current_events = []
    for time, is_start, id in event_times:
        if len(current_events) == 0:
            if time > start and is_start:
                timeslots.append({
                    "start_datetime": start,
                    "end_datetime": time
                })
                current_events = [id]
            elif time == start and is_start:
                current_events = [id]
        else:
            if is_start:
                current_events.append(id)
            else:
                current_events.remove(id)
                if len(current_events) == 0:
                    start = time

    if start < end_datetime:
        timeslots.append({
            "start_datetime": start,
            "end_datetime": end_datetime
        })

    return timeslots
