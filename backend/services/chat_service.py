from ai.ai import generate_response, response_schema
import jsonschema
from jsonschema import validate, ValidationError
from flask import current_app as app
import json

def handle_chat_message(message: str, str_current_date: str) -> dict:
    """
    return response following the schema
    """
    response = generate_response(message, str_current_date)
    # parse string json
    try:
        content = json.loads(response)
    except json.JSONDecodeError:
        app.logger.info(response)
        return {"error": "invalid response from AI"}
    
    # check if response is valid
    try:
        validate(content, response_schema)
    except ValidationError as e:
        app.logger.info(e)
        return {"error": "invalid response from AI"}
    
    return content


    

    

    
    