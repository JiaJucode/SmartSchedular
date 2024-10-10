from datetime import datetime, timedelta
from models.task_calendar_link_model import TaskCalendarLinkDB
from services.calendar_event_service import get_calendar_events, add_calendar_event, \
    delete_calendar_event, edit_calendar_event, get_calendar_event
from utils.calendar_utils import get_empty_timeslots_util, add_event
from typing import List, Dict

# TODO: prevent 2 reschedule tasks from running at the same time for the same user

def get_free_timeslots(start_datetime: datetime, end_datetime: datetime,
                       required_free_time: int) -> List[Dict]:
    """
    return timeslots not occupied by events
    """
    required_free_time = timedelta(hours=required_free_time)
    current_events = get_calendar_events(start_datetime.isoformat(), end_datetime.isoformat())
    timeslots = []
    total_time = timedelta(hours=0)
    # for each day
    for i in range((end_datetime - start_datetime).days + 1):
        if total_time >= required_free_time:
            break
        # assume user working hours are from 9am to 5pm
        # this will be configurable in the user settings in the future
        current_date = start_datetime + timedelta(days=i)
        current_date = current_date.replace(hour=9, minute=0, second=0)
        end_datetime = current_date.replace(hour=17, minute=0, second=0)
        current_events_day = [event for event in current_events if 
                                datetime.fromisoformat(
                                    event['start_datetime']
                                ).date() == current_date.date()]
        timeslots.extend(get_empty_timeslots_util(current_events_day, current_date, end_datetime))
        total_time += end_datetime - current_date

    return timeslots

def get_scheduled_tasks(start_datetime: datetime, end_datetime: datetime) -> Dict:
    """
    return:
    {
        "[task_id]": {
            "estimated_time": int,
        },
        ...
    }
    """
    events = get_calendar_events(start_datetime.isoformat(), end_datetime.isoformat())
    task_events = {}

    # filter out events that are linked to tasks
    for event in events:
        task_id = TaskCalendarLinkDB.get_task_for_calendar_event(event['id'])
        if task_id is not None:
            # delete the current event
            delete_calendar_event(event['id'])
            if task_id not in task_events:
                task_events[task_id] = {}
                task_events[task_id]['estimated_time'] = \
                    event['end_datetime'] - event['start_datetime']
            else:
                task_events[task_id]['estimated_time'] += \
                    event['end_datetime'] - event['start_datetime']
                
    return task_events

def schedule_task(task) -> int:
    """
    "task": {
        "id": int,
        "title": str,
        "description": str,
        "start_datetime": datetime,
        "end_datetime": datetime,
        "priority": int,
        "estimated_time": int,
        "completed": bool
    }
    return:
        time_left: int
    Schedule a task by adding it to the calendar
    """
    # get all free timeslots
    if task['start_datetime'] is not None and \
        task['end_datetime'] is not None and \
        task['estimated_time'] is not None:
        free_timeslots = get_free_timeslots(task['start_datetime'], task['end_datetime'],
                                            task['estimated_time'])
    else:
        # not enough information to schedule task
        return

    time_left = task['estimated_time']
    for free_slot in free_timeslots:
        if time_left <= 0:
            break
        slot_size = (free_slot['end_datetime'] - free_slot['start_datetime']).total_seconds() // 3600
        used_slot = min(time_left, slot_size)
        event_id = add_calendar_event(task['title'], [], free_slot['start_datetime'].isoformat(),
                                      (free_slot['start_datetime'] + 
                                       timedelta(hours=used_slot)).isoformat(),
                                      task['description'])
        TaskCalendarLinkDB.link_task_to_event(task['id'], event_id)
        time_left -= used_slot

    return time_left

def batch_schedule_tasks(tasks: List[Dict]) -> Dict:
    """
    tasks: [
        {
            "id": int,
            "title": str,
            "description": str,
            "start_datetime": datetime,
            "end_datetime": datetime,
            "priority": int,
            "estimated_time": int,
            "completed": bool
        },
        ...
    ]
    """
    # TODO: sort tasks by priority instead of start_datetime
    # TODO: use a priority queue to schedule tasks, at each event point test with all tasks that can be scheduled and find the one with lowest value
    # value is related to priority of task and the finished time
    sorted_tasks = sorted(tasks, key=lambda x: x['start_datetime'])
    start_datetime = sorted_tasks[0]['start_datetime']
    free_timeslots = get_free_timeslots(start_datetime, datetime.max, timedelta(hours=0))
    new_events = add_event(sorted_tasks, free_timeslots)
    for event in new_events:
        add_calendar_event(**event)

def deschedule_task(task) -> None:
    """
    "task": {
        "id": int,
        "title": str,
        "description": str,
        "start_datetime": datetime,
        "end_datetime": datetime,
        "priority": int,
        "estimated_time": int,
        "completed": bool
    }
    """
    # find all events linked to task
    event_ids = TaskCalendarLinkDB.get_calendar_id_for_task(task['id'])
    for event_id in event_ids:
        TaskCalendarLinkDB.unlink_task_from_event(task['id'], event_id)
        delete_calendar_event(event_id)

def get_calendar_id_for_task(task_id: int) -> List[int]:
    """
    return all calendar event ids linked to task
    """
    return TaskCalendarLinkDB.get_calendar_id_for_task(task_id)

def get_calendar_events_for_task(task_id: int) -> List[int]:
    """
    return all calendar event ids linked to task
    """
    calendar_ids = TaskCalendarLinkDB.get_calendar_id_for_task(task_id)
    calendar_events = []
    for calendar_id in calendar_ids:
        calendar_events.extend(get_calendar_event(calendar_id))
    return calendar_events

def update_scheduled_task(task) -> int:
    """
    "task": {
        "id": int,
        "title": str,
        "description": str,
        "start_datetime": datetime,
        "end_datetime": datetime,
        "priority": int,
        "estimated_time": int,
        "completed": bool
    }

    Only reschedule if there is a change to the estimated time, start_datetime
    or end_datetime
    """
    if task['start_datetime'] is None and task['end_datetime'] is None and task['estimated_time'] is None:
        # find all events linked to task
        events = get_calendar_events_for_task(task['id'])
        for event in events:
            title = task['title'] if task['title'] is not None else event['title']
            description = task['description'] if task['description'] is not None \
                else event['description']
            edit_calendar_event(event['id'], title, event['tags'], task['start_datetime'].isoformat(),
                                task['end_datetime'].isoformat(), description)
        return 0
    else:
        deschedule_task(task)
        return schedule_task(task)

def get_time_left_to_schedule(task) -> int:
    """
    "task": {
        "id": int,
        "title": str,
        "description": str,
        "start_datetime": datetime,
        "end_datetime": datetime,
        "priority": int,
        "estimated_time": int,
        "completed": bool
    }
    """
    if task['estimated_time'] is None or task['start_datetime'] is None or \
        task['end_datetime'] is None:
        return 0
    event_ids = TaskCalendarLinkDB.get_calendar_id_for_task(task['id'])
    total_time = 0
    for event_id in event_ids:
        event = get_calendar_event(event_id)
        total_time += (event['end_datetime'] - event['start_datetime']).total_seconds() // 3600
    return task['estimated_time'] - total_time
    


    


