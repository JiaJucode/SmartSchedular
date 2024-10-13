from llama_index.embeddings.nvidia import NVIDIAEmbedding
from llama_index.llms.nvidia import NVIDIA
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.llms import ChatMessage, MessageRole
import json

api_key = "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"

text_splitter = SentenceSplitter(chunk_size=400)
llm = NVIDIA(
    # model="nvidia/nemotron-4-340b-instruct",
    model="nvidia/llama-3.1-nemotron-51b-instruct",
    nvidia_api_key=api_key,
    base_url="https://integrate.api.nvidia.com/v1",
    temperature=0.7,
    max_tokens=3000,
)
embeddings = NVIDIAEmbedding(
    model="nvidia/nv-embedqa-e5-v5",
    nvidia_api_key=api_key,
    base_url="https://integrate.api.nvidia.com/v1"
)

response_schema = {
    "type": "object",
    "properties": {
        "action_type": {
            "type": "string",
            "enum": ["question", "chat", "task", "calendar"]
        },
        "content": {
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "response": {"type": "string"}
                    },
                    "required": ["response"]
                },
                {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["add", "update", "delete", "list"]
                            },
                            "task": {
                                "type": "object",
                                "properties": {
                                    "parent_id": {"type": "integer"},
                                    "title": {"type": "string"},
                                    "description": {"type": "string"},
                                    "start_date": {"type": "string", "format": "date-time"},
                                    "end_date": {"type": "string", "format": "date-time"},
                                    "priority": {"type": "integer"},
                                    "estimated_time": {"type": "integer"},
                                    "completed": {"type": "boolean"}
                                },
                                "required": ["title", "description", "start_date", "end_date", "priority", "estimated_time", "completed"]
                            }
                        },
                        "required": ["action", "task"]
                    }
                },  # For "task"
                {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["add", "update", "delete", "list"]
                            },
                            "event": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "description": {"type": "string"},
                                    "start_date": {"type": "string", "format": "date-time"},
                                    "end_date": {"type": "string", "format": "date-time"},
                                    "location": {"type": "string"},
                                    "reminder": {"type": "boolean"}
                                },
                                "required": ["title", "description", "start_date", "end_date", "location", "reminder"]
                            }
                        },
                        "required": ["action", "event"]
                    }
                }  # For "calendar"
            ]
        }
    },
    "required": ["action_type", "content"]
}



# this is below 250 tokens(estimate)
# keep the reference date below 1500 (3 reference documents) tokens(on top of the 250 tokens)
system_content = \
"""You are an assistant that helps user with scheduling and task management. Analyze user input and execute the specified actions based on the structured input format:
{
    "user_query": "string",
    "context": {
        "current_date": "iso date string",
        "reference_data": "string",
    },
}

your reponse should not have anything other than the following format(no extra text):
{
    "action_type": "string" in ["question", "chat", "task", "calendar"],
    "content": json
}
If the action_type is "question", only question when there isnt enough reference data for response, the content is the response to the user query in the following format:
{
    "response": "string",
}
Only delete or list when there is reference data for response
If the action_type is "chat", the content is the response to the user query in the following format:
{
    "response": "string",
}
If the action_type is "task", the content is in the following format:
[
    {
        "action": "string" in ["add", "update", "delete", "list"],
        "task": {
            "parent_id": "int",
            "title": "string",
            "description": "string",
            "start_date": "iso date string",
            "end_date": "iso date string",
            "priority": "int",
            "estimated_time": "int",
            "completed": "bool",
        },
    },
    ...
]
If the action_type is "calendar", the content is in the following format:
[
    {
        "action": "string" in ["add", "update", "delete", "list"],
        "event": {
            "title": "string",
            "description": "string",
            "start_date": "iso date string",
            "end_date": "iso date string",
            "location": "string",
            "reminder": "bool",
        },
    },
    ...
]
"""

def generate_response(message, current_date, user_id = 0):
    # TODO: NER to get key dates and retreive all relevant calendar events in those months
    # TODO: embed the message and get relevant text from vector search for documents
    relevant_text = ""
    user_content = json.dumps({
        "user_query": message,
        "context": {
            "current_date": current_date,
            "reference_data": relevant_text,
        }
    })
    messages = [
        ChatMessage(
            role=MessageRole.SYSTEM,
            content=(system_content)
        ),
        ChatMessage(
            role=MessageRole.USER,
            content=(user_content)
        )
    ]
    # TODO stream_chat in future
    return llm.chat(messages).message.content

# for testing
if __name__ == "__main__":
    # while True:
    message = """do you have memory of chat history"""
    print(generate_response(message, "2024-10-10"))