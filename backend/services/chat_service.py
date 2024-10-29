from ai.llm import generate_response, response_schema
from jsonschema import validate, ValidationError
from services.google_service import get_doc
from ai.embedder import get_embeddings
from milvus.milvus_client import milvus_client
from flask import current_app as app
from datetime import datetime
from services.text_processor_service import ner_extraction
import json

def document_context_extraction(message: str, user_id: int) -> str:
    """
    extract document context from message
    """
    question_embeddings, _ = get_embeddings(message, "")
    context = []
    for embedding in question_embeddings:
        context += milvus_client.get(user_id, embedding)
    text = []
    metadata = []
    if len(context) > 0:
        for item in context:
            if len(item) == 0:
                break
            content = get_doc(user_id, item["file_id"], item["segment_id"])
            if content:
                text.append(content[0])
                metadata.append(content[1])
    result = ""
    for i in range(len(text)):
        result += "for file: " + metadata[i] + "\n"
        result += text[i] + "\n"
    return result


def handle_chat_message(message: str, str_current_date: str, tags: list, context: str, user_id: int) -> dict:
    """
    return response following the schema
    """
    context += "\n" + ner_extraction(message, datetime.fromisoformat(str_current_date))
    context += "\n from documents: \n" + document_context_extraction(message, user_id)
    app.logger.info("context: " + context)
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
    
    return content, context


    

    

    
    