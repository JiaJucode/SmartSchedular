import spacy
import difflib
import dateparser
from services.calendar_event_service import get_calendar_events
from services.task_service import get_tasks_by_parent_id, get_tasks_by_date_range
from datetime import datetime
from typing import List

nlp = spacy.load("en_core_web_sm")
d = difflib.Differ()

def ner_extraction(message: str, today: datetime) -> str:
    parsed_message = nlp(message)
    # filter out dates
    dates = [ent.text for ent in parsed_message.ents if ent.label_ == "DATE"]
    # convert to absolute date
    dates = [dateparser.parse(date, settings={"RETURN_AS_TIMEZONE_AWARE": True, "RELATIVE_BASE": today}) for date in dates]
    dates += [today]
    latest_date = max(dates)
    earliest_date = min(dates)
    # find all calendar events between earliest_date and latest_date
    events = get_calendar_events(earliest_date.isoformat(), latest_date.isoformat())
    # find all tasks between earliest_date and latest_date
    tasks = get_tasks_by_date_range(earliest_date.isoformat(), latest_date.isoformat())
    # get all project tasks
    project_tasks = get_tasks_by_parent_id(0)
    results = "relevant events: " + str(events) + "\n"
    results += "relevant tasks: " + str(tasks) + "\n"
    results += "projects: " + str(project_tasks) + "\n"
    return results

def text_to_sentences(text: str) -> List[str]:
    return nlp(text).sents

def get_text_difference(text1: str, text2: str) -> str:
    """
    return difference between two texts sorted by sentence number
        [(sentence_number, "insert" | "delete" | "replace"), ...]
    """
    text1_sentences = text_to_sentences(text1)
    text2_sentences = text_to_sentences(text2)
    diff = list(d.compare(text1_sentences, text2_sentences))
    index = 0
    changes = []
    while index < len(diff):
        if diff[index].startswith('+ '):
            changes.append((index, "insert"))
        elif diff[index].startswith('- '):
            if index + 1 < len(diff) and diff[index + 1].startswith('? '):
                changes.append((index, "replace"))
                index += 4
            else:
                changes.append((index, "delete"))
        index += 1
    return changes

def get_chunks_sentence_range(original_text: str, chunks: List[str]) -> List[tuple]:
    """
    return the sentence range of each chunk
    """
    original_text_sentences = list(nlp(original_text).sents)
    chunk_ranges = []
    start_sentence_index = 0
    for chunk in chunks:
        # find the start sentence index
        while True:
            if chunk.startswith(str(original_text_sentences[start_sentence_index])):
                break
            start_sentence_index += 1
            if start_sentence_index >= len(original_text_sentences):
                # something went wrong
                break
        # find the end sentence index
        i = start_sentence_index
        while True:
            if chunk.endswith(str(original_text_sentences[i])):
                break
            i += 1
            if i >= len(original_text_sentences):
                # something went wrong
                break
        chunk_ranges.append((start_sentence_index, i))
    return chunk_ranges
