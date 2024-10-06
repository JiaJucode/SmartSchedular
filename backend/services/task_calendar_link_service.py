from datetime import datetime, timedelta
from models.task_calendar_link_model import TaskCalendarLinkDB
from services.calendar_event_service import get_calendar_events, add_calendar_event
from services.task_service import db as task_db
from services.calendar_event_service import db as calendar_db
from utils.calendar_utils import get_empty_timeslots_util
from typing import List, Dict

db = TaskCalendarLinkDB()

def get_free_timeslots(start_datetime: datetime, end_datetime: datetime,
                       required_free_time: timedelta) -> List[Dict]:
    """
    return timeslots not occupied by events
    """
    current_events = get_calendar_events(start_datetime.isoformat(), end_datetime.isoformat())
    timeslots = []
    total_time = timedelta(hours=0)
    # for each day
    for i in range((end_datetime - start_datetime).days + 1) and total_time < required_free_time:
        # assume user working hours are from 9am to 5pm, this will be configurable
        # in the user settings in the future
        current_date = start_datetime + timedelta(days=i)
        current_date = current_date.replace(hour=9, minute=0, second=0)
        end_datetime = current_date.replace(hour=17, minute=0, second=0)
        current_events_day = [event for event in current_events if event['start_datetime'].date() == current_date.date()]
        timeslots.extend(get_empty_timeslots_util(current_events_day, current_date, end_datetime))
        total_time += end_datetime - current_date

    return timeslots

def schedule_task(task) -> None:
    """
    "task": {
        "id": int,
        "start_datetime": "YYYY-MM-DD",
        "end_datetime": "YYYY-MM-DD",
        "priority": int,
        "time_left": int,
    }
    Schedule a task by adding it to the calendar
    """
    # get all free timeslots
    if task['start_datetime'] is not None and task['end_datetime'] is not None:
        free_timeslots = get_free_timeslots(task['start_datetime'], task['end_datetime'],
                                            task['time_left'])
    else:
        free_timeslots = get_free_timeslots(datetime.now(), datetime.max, task['time_left'])

    time_left = task['time_left']
    for free_slot in free_timeslots and time_left > 0:
        slot_size = free_slot['end_datetime'] - free_slot['start_datetime']
        event_id = add_calendar_event(task['name'], task['id'], int(task['id']), [],
                            free_slot['start_datetime'], free_slot['end_datetime'],
                            task['description'])
        db.link_task_to_event(task['id'], event_id)
        time_left -= slot_size
    return time_left
        


def reschedule_tasks(start_datetime: datetime) -> None:
    """
    Reschedule all task events starting from start_datetime
    """
    # get all events starting from start_datetime and filter out tasks
    events = get_calendar_events(start_datetime.isoformat(), datetime.now().isoformat())
    task_events = {}

    for event in events:
        task_id = db.get_task_for_calendar_event(event['id'])
        if task_id is not None:
            if task_id not in task_events:
                task_info = task_db.add_task(task_id)
                task_events[task_id] = {
                    "task_id": task_id,
                    "start_datetime": task_info['start_datetime'],
                    "end_datetime": task_info['end_datetime'],
                    "time_left": event['end_datetime'] - event['start_datetime'],
                    "priority": task_info['priority'],
                }
            else:
                task_events[task_id]['time_left'] += \
                    event['end_datetime'] - event['start_datetime']
    
    # sort tasks by priority
    sorted_tasks = sorted(task_events.values(), key=lambda x: x['priority'])
    unfilled_tasks = []
    for task in sorted_tasks:
        time_left = schedule_task(task)
        if time_left > 0:
            unfilled_tasks.append({
                "task_id": task['task_id'],
                "time_left": time_left
            })
    return unfilled_tasks



    


    


