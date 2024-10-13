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
            "type": "object",
            "oneOf": [
                {
                    "properties": {
                        "response": {
                            "type": "string"
                        }
                    },
                    "required": ["response"],
                    "additionalProperties": False
                },
                {
                    "properties": {
                        "message": {
                            "type": "string"
                        },
                        "action": {
                            "type": "string",
                            "enum": ["add", "update", "delete", "list"]
                        },
                        "parent_id": {
                            "type": "integer"
                        },
                        "tasks": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "task": {
                                        "type": "object",
                                        "properties": {
                                            "id": {
                                                "type": "integer"
                                            },
                                            "title": {
                                                "type": "string"
                                            },
                                            "description": {
                                                "type": "string"
                                            },
                                            "start_date": {
                                                "type": "string",
                                                "format": "date-time"
                                            },
                                            "end_date": {
                                                "type": "string",
                                                "format": "date-time"
                                            },
                                            "priority": {
                                                "type": "integer"
                                            },
                                            "estimated_time": {
                                                "type": "integer"
                                            },
                                            "completed": {
                                                "type": "boolean"
                                            }
                                        },
                                        "required": ["id", "title", "description", "start_date", "end_date", 
                                                     "priority", "estimated_time", "completed"]
                                    }
                                },
                                "required": ["action", "task"]
                            }
                        }
                    },
                    "required": ["message", "action", "tasks"]
                },
                {
                    "properties": {
                        "message": {
                            "type": "string"
                        },
                        "action": {
                            "type": "string",
                            "enum": ["add", "update", "delete", "list"]
                        },
                        "events": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "event": {
                                        "type": "object",
                                        "properties": {
                                            "id": {
                                                "type": "integer"
                                            },
                                            "title": {
                                                "type": "string"
                                            },
                                            "tags": {
                                                "type": "array",
                                                "items": {
                                                    "type": "string"
                                                }
                                            },
                                            "description": {
                                                "type": "string"
                                            },
                                            "start_date": {
                                                "type": "string",
                                                "format": "date-time"
                                            },
                                            "end_date": {
                                                "type": "string",
                                                "format": "date-time"
                                            },
                                        },
                                        "required": ["id", "title", "tags", "start_date", "end_date", "description"]
                                    }
                                },
                                "required": ["event"]
                            }
                        }
                    },
                    "required": ["message", "action", "events"]
                }
            ]
        }
    },
    "required": ["action_type", "content"],
    "additionalProperties": False
}


system_content = \
"""You are an assistant that helps user with scheduling and task management. Analyze user input and execute the specified actions based on the structured input format:
{
    "user_query": "string",
    "context": {
        "current_date": "iso date string",
        "reference_data": "string"
    }
}

your reponse should not have anything other than the following format(no extra text):
{
    "action_type": "string" in ["question", "chat", "task", "calendar"],
    "content": json
}
If the action_type is "question", only question when there isnt enough reference data for response, general estimation of facts can be used.
the content is the response to the user query in the following format:
{
    "response": "string"
}
Only delete or list when there is reference data for response
If the action_type is "chat", the content is the response to the user query in the following format:
{
    "response": "string"
}
If the action_type is "task", parent_id is the id of the project tasks fed as reference data, if no project fits the task, use parent_id = 0 to create a new project, 
task id should be -1 when action is add, otherwise use the reference data id. The content is in the following format:
{
    "message": "string",
    "action": "string" in ["add", "update", "delete", "list"],
    "parent_id": "int",
    "tasks": [
        {
            "task": {
                "id": "int",
                "title": "string",
                "description": "string",
                "start_date": "iso date string",
                "end_date": "iso date string",
                "priority": "int",
                "estimated_time": "int",
                "completed": "bool"
            }
        },
        ...
    ]
}
If the action_type is "calendar", event id should be -1 when action is add, otherwise use the reference data id. The content is in the following format:
{
    "message": "string",
    "action": "string" in ["add", "update", "delete", "list"],
    "events": [
        {
            "event": {
                "id": "int",
                "title": "string",
                "tags": "string[]",
                "description": "string",
                "start_date": "iso date string",
                "end_date": "iso date string"
            }
        },
        ...
    ]
}
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
