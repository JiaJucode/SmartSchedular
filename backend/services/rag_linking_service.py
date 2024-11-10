from models.google_file_link_model import GoogleFileLinkDB
from models.task_model import TaskDB
from models.calendar_model import CalendarEventDB
from ai.updater import update_changes
from milvus.milvus_client import milvus_client
from flask import current_app as app
from datetime import datetime
from typing import List, Dict

def link_document_segments_to_task(user_id: int, task_id: str, document_segments: Dict) -> None:
    """
    params:
        document_segments: {
            file_id: [[start, end], ...]
        }
    """
    app.logger.info("linking document segments: " + str(document_segments) 
                    + " to task: " + str(task_id))
    for file_id, segments in document_segments.items():
        app.logger.info("file_id: " + str(file_id))
        app.logger.info("segments: " + str(segments))
        for segment in segments:
            GoogleFileLinkDB.add_task_link(user_id, task_id,
                                        file_id, segment[0], segment[1])
        
def link_document_segments_to_event(user_id: int, calendar_id: str, document_segments: Dict) -> None:
    """
    params:
        document_segments: {
            file_id: [[start, end], ...]
        }
    """
    app.logger.info("linking document segments: " + str(document_segments)
                    + " to event: " + str(calendar_id))
    for file_id, segments in document_segments.values():
        for segment in segments:
            GoogleFileLinkDB.add_calendar_link(user_id, calendar_id,
                                            file_id, segment[0], segment[1])

def unlink_generated_item(item_id: int, is_task: bool) -> None:
    GoogleFileLinkDB.delete_link(item_id, is_task)

def update_document_segment(user_id: int, file_id: str, old_range: tuple, 
                            embeddings: List[float] | None, index_ranges: List[tuple],
                            raw_text: str) -> None:
    for i in range(1, len(embeddings)):
        milvus_client.inserts(user_id, file_id, embeddings[i], index_ranges[i])
    # if there is linked task or event,
    # get the task/event, get the segment text, pass it to the model, check if update to the task/event is needed
    # if so, update the task/event, link the segments used by model to the task/event
    linked_items = GoogleFileLinkDB.get_linked_items(user_id, file_id, old_range[0], old_range[1])
    app.logger.info("linked_items: " + str(linked_items))
    current_datetime = datetime.now()
    all_task_info = []
    for task_id in linked_items["tasks"]:
        task_info = TaskDB.get_task(task_id)
        app.logger.info("task_info: " + str(task_info))
        # filter out important information from task_info
        if task_info["end_datetime"] < current_datetime:
            continue
        info = {
            "id": task_info["id"],
            "title": task_info["title"],
            "description": task_info["description"],
            "start_datetime": task_info["start_datetime"].isoformat(),
            "end_datetime": task_info["end_datetime"].isoformat(),
            "priority": task_info["priority"],
            "estimated_time": task_info["estimated_time"],
        }
        all_task_info.append(info)
    if len(all_task_info) > 0:
        result = update_changes(all_task_info, datetime.now().isoformat(), raw_text)
        app.logger.info("result: " + str(result))
        if result:
            app.logger.info("changes: " + str(result["content"]))
            for i in range(len(result["content"])):
                for task in result["content"]:
                    app.logger.info("updating task: " + str(task["id"]))
                    TaskDB.update_task(**task)

    all_calendar_info = []
    for calendar_id in linked_items["calendar_events"]:
        calendar_info = CalendarEventDB.get_event(calendar_id)
        if calendar_info["end_datetime"] < current_datetime:
            continue
        # filter out important information from calendar_info
        info = {
            "id": calendar_info["id"],
            "title": calendar_info["title"],
            "tags": calendar_info["tags"],
            "description": calendar_info["description"],
            "start_datetime": calendar_info["start_datetime"],
            "end_datetime": calendar_info["end_datetime"]
        }
        all_calendar_info.append(info)

    GoogleFileLinkDB.update_segment_link(user_id, file_id, old_range, index_ranges)
    milvus_client.update_segment(user_id, file_id, old_range, embeddings[0], index_ranges[0])

    if len(all_calendar_info) > 0:
        result = update_changes(all_calendar_info, datetime.now().isoformat(), raw_text)
        app.logger.info("result: " + str(result))
        if result:
            app.logger.info("changes: " + str(result["content"]))
            for i in range(len(result["content"])):
                for event in result["content"]:
                    app.logger.info("updating event: " + str(event["id"]))
                    CalendarEventDB.update_event(**event)
        

def delete_document_segment(file_id: str, start_sentence_index: int, end_sentence_index: int) -> None:
    GoogleFileLinkDB.delete_segment_link(file_id, start_sentence_index, end_sentence_index)
    milvus_client.delete(file_id, start_sentence_index, end_sentence_index)