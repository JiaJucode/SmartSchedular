from ai.llm import generate_response, response_schema
from jsonschema import validate, ValidationError
import dateparser
from datetime import datetime
from services.calendar_event_service import get_calendar_events
from services.task_service import get_tasks_by_parent_id, get_tasks_by_date_range
import spacy
from flask import current_app as app
import json

NER = spacy.load("en_core_web_sm")

def ner_extraction(message: str, today: datetime) -> str:
    parsed_message = NER(message)
    # filter out dates
    dates = [ent.text for ent in parsed_message.ents if ent.label_ == "DATE"]
    # convert to absolute date
    dates = [dateparser.parse(date, settings={"RETURN_AS_TIMEZONE_AWARE": True, "RELATIVE_BASE": today}) for date in dates]
    app.logger.info("dates: " + str(dates))
    app.logger.info("today: " + str(today))
    dates += [today]
    latest_date = max(dates)
    earliest_date = min(dates)
    app.logger.info("range: " + str(earliest_date) + " to " + str(latest_date))
    # find all calendar events between earliest_date and latest_date
    events = get_calendar_events(earliest_date.isoformat(), latest_date.isoformat())
    # find all tasks between earliest_date and latest_date
    tasks = get_tasks_by_date_range(earliest_date.isoformat(), latest_date.isoformat())
    # get all project tasks
    project_tasks = get_tasks_by_parent_id(0)
    results = "relevant events: " + str(events) + "\n"
    results += "relevant tasks: " + str(tasks) + "\n"
    results += "projects: " + str(project_tasks) + "\n"
    app.logger.info(results)
    return results


def handle_chat_message(message: str, str_current_date: str, tags: list, context: str) -> dict:
    """
    return response following the schema
    """
    context += "\n" + ner_extraction(message, datetime.fromisoformat(str_current_date))
    response = generate_response(message, str_current_date, tags, context)
    # parse string json
    try:
        content = json.loads(response)
    except json.JSONDecodeError as e:
        app.logger.info(e)
        app.logger.info(response)
        app.logger.info("failed to parse response")
        return {"error": "invalid response from AI"}
    
    # check if response is valid
    try:
        validate(content, response_schema)
    except ValidationError as e:
        app.logger.info(e)
        app.logger.info("response does not follow schema")
        return {"error": "invalid response from AI"}
    
    return content


    

    

    
    