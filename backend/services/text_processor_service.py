import spacy
import difflib
import dateparser
from services.calendar_event_service import get_calendar_events
from services.task_service import get_tasks_by_parent_id, get_tasks_by_date_range
from datetime import datetime
from typing import List
from flask import current_app as app
import re

nlp = spacy.load("en_core_web_sm")
d = difflib.Differ()

abbreviation_map = {
    "e.g.": "for example",
    "i.e.": "that is",
    "etc.": "and so on",
    "vs.": "versus",
    "etc": "and so on",
    "Mr.": "Mister",
    "Mrs.": "Missus",
    "Dr.": "Doctor",
    "Prof.": "Professor",
    "St.": "Saint",
    "Co.": "Company",
    "Ltd.": "Limited",
    "Inc.": "Incorporated",
    "Jr.": "Junior",
    "Sr.": "Senior",
    "vs.": "versus",
}

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

def text_preprocessing(text: str) -> str:
    # text = text.replace("\n-", ".\n")
    # text = text.replace("\n–", ".\n")
    # text = text.replace("\n•", ".\n")
    for abbr, replacement in abbreviation_map.items():
        text = text.replace(abbr, replacement)
    return text


def text_to_sentences(text: str) -> List[str]:
    doc = nlp(text)
    text_sentences = [sent.text for sent in doc.sents]
    text_sentences = [t for sentence in text_sentences
                      for t in re.split(r'(?:(\s*\r?\n\s*)+)', str(sentence)) if t != ""]
    # reattach back the delimiters
    final_text_sentences = []
    current_sentence = ""
    for i in range(len(text_sentences)):
        if text_sentences[i].strip() == "":
            current_sentence += text_sentences[i]
        else:
            if current_sentence != "":
                final_text_sentences.append(current_sentence)
            current_sentence = text_sentences[i]
    if current_sentence != "":
        final_text_sentences.append(current_sentence)
    return text_sentences

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
        [(start_sentence_index, end_sentence_index), ...]
        end_sentence_index is inclusive
    """
    original_text_sentences = text_to_sentences(original_text)
    # split the result into smaller sentences withouth the new line character
    chunk_ranges = []
    start_sentence_index = 0
    if len(chunks[0]) >= len(original_text):
        return [(0, len(original_text_sentences) - 1)]
    for chunk in chunks:
        # find the start sentence index
        while start_sentence_index < len(original_text_sentences) \
            and not chunk.startswith(str(original_text_sentences[start_sentence_index]).strip()):
            start_sentence_index += 1
        # find the end sentence index
        i = start_sentence_index
        while i < len(original_text_sentences):
            if chunk.endswith(str(original_text_sentences[i]).strip()):
                # if there's a next sentence and if it's part of the chunk
                if i + 1 < len(original_text_sentences) and str(original_text_sentences[i + 1]).strip() in chunk:
                    # If the next sentence is part of the chunk, continue looping
                    i += 1
                else:
                    # If the next sentence isn't part of the chunk, exit the loop
                    break
            else:
                # If the current sentence doesn't match, increment `i` to check the next sentence
                i += 1
        if start_sentence_index >= len(original_text_sentences) or i >= len(original_text_sentences):
            app.logger.error("unable to find sentence range for chunk: " + repr(chunk))
            break
        chunk_ranges.append((start_sentence_index, i))
        start_sentence_index += 1
    app.logger.info("chunk_ranges: " + str(chunk_ranges))
    return chunk_ranges
