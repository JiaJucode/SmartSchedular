from datetime import datetime, timedelta
from typing import List, Dict
from queue import PriorityQueue
from collections import deque

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

def add_event(sorted_tasks: List[Dict], free_time_slots: List[Dict]) -> List[Dict]:
    """
    Given tasks sorted by start_datetime and free_time_slots sorted by start_datetime,
    schedule the tasks within the free_time_slots.
    """
    # "id": {}
    if len(sorted_tasks) == 0 or len(free_time_slots) == 0:
        return []
    free_time_slots = deque(free_time_slots)
    scheduled = [False] * len(sorted_tasks)
    current_tasks = PriorityQueue()
    scheduled_events = []
    earliest_start_time = sorted_tasks[0]["start_datetime"]
    # schedule tasks
    while len(free_time_slots) > 0:
        end_time = free_time_slots[0]["end_datetime"]
        start_time = free_time_slots[0]["start_datetime"]
        free_time_slots.popleft()
        # remove expired tasks
        new_pq = PriorityQueue()
        while not current_tasks.empty():
            _, task = current_tasks.get()
            if task["end_datetime"] > start_time:
                new_pq.put((-task["priority"], task))
        # add back the unexpired tasks
        while not new_pq.empty():
            current_tasks.put(new_pq.get())
        # add tasks that can be scheduled to current_tasks
        for i in range(len(sorted_tasks) - 1, -1, -1):
            if sorted_tasks[i]["start_datetime"] <= end_time and not scheduled[i]:
                current_tasks.put((-sorted_tasks[i]["priority"], sorted_tasks[i]))
                earliest_start_time = min(earliest_start_time, sorted_tasks[i]["start_datetime"])
                scheduled[i] = True
            else:
                break
        # cant schedule more tasks and break
        if current_tasks.empty():
            break
        _, task = current_tasks.get()
        # if task starts after start_time, add the free time slot back before the task
        to_insert = None
        if task["start_datetime"] > start_time:
            to_insert = {
                "start_datetime": start_time,
                "end_datetime": task["start_datetime"]
            }
            start_time = task["start_datetime"]
        time_diff = (end_time - start_time).total_seconds() // 3600
        task["estimated_time"] = min((task["end_datetime"] - start_time).total_seconds() // 3600,
                                     task["estimated_time"])
        if time_diff < task["estimated_time"]:
            task["estimated_time"] -= time_diff
            current_tasks.put((-task["priority"], task))
            scheduled_events.append({
                "title": task["title"],
                "tags": [],
                "str_start_datetime": start_time,
                "str_end_datetime": end_time,
                "description": task["description"]
            })
        else:
            scheduled_events.append({
                "title": task["title"],
                "tags": [],
                "str_start_datetime": start_time,
                "str_end_datetime": (start_time + timedelta(hours=task["estimated_time"])),
                "description": task["description"]
            })
            start_time += timedelta(hours=task["estimated_time"])
            if start_time < end_time:
                free_time_slots.appendleft({
                    "start_datetime": start_time,
                    "end_datetime": end_time
                })
        if to_insert is not None:
            free_time_slots.insert(0, to_insert)
        # remove free time slots that cannot be scheduled
        while len(free_time_slots) > 0:
            if free_time_slots[0]["end_datetime"] <= earliest_start_time:
                free_time_slots.popleft()
            else:
                break
    
    return scheduled_events

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

def trim_events(events: List[Dict], start_datetime: datetime, end_datetime: datetime) -> List[Dict]:
    """
    Trim events to the requested time range
    """
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
    return trimmed_events
