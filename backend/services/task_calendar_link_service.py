from datetime import datetime, timedelta
from models.task_calendar_link_model import TaskCalendarLinkDB
from services.calendar_event_service import get_calendar_events, add_calendar_event, \
    delete_calendar_event, edit_calendar_event, get_calendar_event
from utils.calendar_utils import get_empty_timeslots_util
from flask import current_app as app
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
        return -1

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
        
def reschedule_tasks(start_datetime: datetime) -> None:
    """
    Reschedule all task events starting from start_datetime, goal is to fit as many tasks
    as possible into the user's calendar (not using priority for now)
    """
    # get all events starting from start_datetime and filter out tasks
    events = get_calendar_events(start_datetime.isoformat(), datetime.now().isoformat())
    task_events = {}

    # filter out events that are linked to tasks
    for event in events:
        task = TaskCalendarLinkDB.get_task_for_calendar_event(event['id'])
        if task is not None:
            # delete the current event
            delete_calendar_event(event['id'])
            if task not in task_events:
                task_events[task['id']] = task
                task_events[task['id']]['estimated_time'] = \
                    event['end_datetime'] - event['start_datetime']
            else:
                task_events[task['id']]['estimated_time'] += \
                    event['end_datetime'] - event['start_datetime']
    
    # sort tasks by start date
    sorted_tasks = sorted(task_events.values(), key=lambda x: x['start_datetime'])
    unfilled_tasks = []
    free_timeslots = get_free_timeslots(start_datetime, datetime.max, timedelta(hours=0))
    for task in sorted_tasks and len(free_timeslots) > 0:
        # remove all timeslots before the task start date
        while len(free_timeslots) > 0 and free_timeslots[0]['end_datetime'] < task['start_datetime']:
            free_timeslots.pop(0)
        time_left = task['estimated_time']
        while time_left > 0 and len(free_timeslots) > 0:
            free_slot = free_timeslots.pop(0)

            if free_slot['end_datetime'] > free_slot['start_datetime'] + time_left:
                # break the slot into 2
                next_free_slot = {
                    "start_datetime": free_slot['start_datetime'] + time_left,
                    "end_datetime": free_slot['end_datetime']
                }
                free_timeslots.insert(0, next_free_slot)
            event_end_datetime = min(free_slot['start_datetime'] + time_left, free_slot['end_datetime'])
            slot_size = event_end_datetime - free_slot['start_datetime']
            event_id = add_calendar_event(task['title'], task['id'], int(task['id']), [],
                            free_slot['start_datetime'].isoformat(), event_end_datetime.isoformat(),
                            task['description'])
            TaskCalendarLinkDB.link_task_to_event(task['id'], event_id)
            time_left -= slot_size

            if task['end_datetime'] > free_slot['end_datetime'] and time_left > 0:
                unfilled_tasks.append({
                    "id": task['id'],
                    "time_left": time_left
                })
                break
    
    for task in sorted_tasks:
        unfilled_tasks.append({
            "id": task['id'],
            "time_left": task['estimated_time']
        })

    return unfilled_tasks

def reschedule_task(task) -> int:
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
    """

    # find all events linked to task
    event_ids = TaskCalendarLinkDB.get_calendar_id_for_task(task['id'])
    for event_id in event_ids:
        TaskCalendarLinkDB.unlink_task_from_event(task['id'], event_id)
        delete_calendar_event(event_id)
    return schedule_task(task)

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
    return:
        time_left: int

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
        return reschedule_task(task)

    


    


