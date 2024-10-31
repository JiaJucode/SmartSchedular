from ai.llm import generate_response, response_schema
from jsonschema import validate, ValidationError
from services.google_service import get_doc
from ai.embedder import get_embeddings
from milvus.milvus_client import milvus_client
from flask import current_app as app
from datetime import datetime
from services.text_processor_service import ner_extraction, text_to_sentences
import json

def document_context_extraction(message: str, user_id: int) -> str:
    """
    extract document context from message
    """
    question_embeddings, _ = get_embeddings(message, "")
    context = {}
    for embedding in question_embeddings:
        context.update(milvus_client.get(user_id, embedding))
    app.logger.info("context: " + str(context))
    result = ""
    if len(context) > 0:
        for file_id, ranges in context.items():
            content, metadata = get_doc(user_id, file_id)
            app.logger.info("content: " + str(content))
            app.logger.info("metadata: " + str(metadata))
            if content:
                content = text_to_sentences(content)
                result += "metadata: " + metadata + "\n" + "file content: "
                for start, end in ranges:
                    content = content[start:end]
                    result += " ".join([str(sent) for sent in content])
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
        return {"error": "invalid response from AI"}, context
    app.logger.info("response: " + str(content))
    # check if response is valid
    try:
        validate(content, response_schema)
    except ValidationError as e:
        app.logger.info(e)
        app.logger.info("response does not follow schema")
        return {"error": "invalid response from AI"}, context
    
    return content, context

