from models.google_file_link_model import GoogleFileLinkDB

def link_document_segments_to_task(user_id, file_id, document_segments):
    for segment in document_segments:
        GoogleFileLinkDB.add_task_link(user_id, segment["task_id"], 
                                       file_id, segment["start"], segment["end"])
        
def link_document_segments_to_event(user_id, file_id, document_segments):
    for segment in document_segments:
        GoogleFileLinkDB.add_calendar_link(user_id, segment["calendar_id"], 
                                          file_id, segment["start"], segment["end"])
        
def get_linked_items(user_id, file_id, file_segment_start, file_segment_end):
    return GoogleFileLinkDB.get_linked_items(user_id, file_id, 
                                             file_segment_start, file_segment_end)

def unlink_document_segment(item_id: int, is_task: bool) -> None:
    GoogleFileLinkDB.delete_link(item_id, is_task)