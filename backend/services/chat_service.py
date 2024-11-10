from ai.llm import generate_response, response_schema
from jsonschema import validate, ValidationError
from services.google_service import get_doc_metadata
from ai.embedder import get_embeddings
from milvus.milvus_client import milvus_client
from flask import current_app as app
from datetime import datetime
from services.text_processor_service import ner_extraction, text_to_sentences
from models.file_storage_model import FileStorageModel
import json

def document_context_extraction(message: str, user_id: int) -> tuple:
    """
    extract document context from message
    return:
        context: str
        document_Segments: {
            file_id: [(start, end), ...]
        }
    """
    question_embeddings, _ = get_embeddings(message, "")
    context = {}
    for embedding in question_embeddings:
        context.update(milvus_client.get(user_id, embedding))
    app.logger.info("context: " + str(context))
    result = ""
    if len(context) > 0:
        for file_id, ranges in context.items():
            metadata = get_doc_metadata(user_id, file_id)
            content = FileStorageModel.get_file_content(file_id)
            if content:
                content = text_to_sentences(content)
                result += "metadata: " + metadata + "\n" + "file content: "
                for start, end in ranges:
                    sub_content = content[start:end + 1]
                    result += " ".join([str(sent) for sent in sub_content])
    return result, context

def handle_chat_message(message: str, str_current_date: str, tags: list, context: str, user_id: int) -> dict:
    """
    return response following the schema
    return:
        response: dict
        generated_context: str
        document_Segments: {
            file_id: [(start, end), ...]
        }
    """
    # TODO: send the context relavent to RAG documents(ids)
    generated_context = ner_extraction(context, datetime.fromisoformat(str_current_date))
    document_context, document_Segments = document_context_extraction(message, user_id)
    generated_context += "\n from documents: \n" + document_context
    context += "\n" + generated_context
    app.logger.info("context: " + context)
    response = generate_response(message, str_current_date, tags, context)
    # parse string json
    app.logger.info("string response: " + response)
    try:
        content = json.loads(response)
    except json.JSONDecodeError as e:
        app.logger.info(e)
        app.logger.info(response)
        app.logger.info("failed to parse response")
        return "invalid response from AI", None, None
    app.logger.info("response: " + str(content))
    # check if response is valid
    try:
        validate(content, response_schema)
    except ValidationError as e:
        app.logger.info(e)
        app.logger.info("response does not follow schema")
        return "invalid response from AI", None, None
    
    return content, generated_context, document_Segments

