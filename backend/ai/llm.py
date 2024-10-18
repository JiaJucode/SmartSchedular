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
    temperature=0.8,
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
        "tag": {
            "type": "string"
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
                                "required": ["task"]
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
    "required": ["action_type", "tag", "content"],
    "additionalProperties": False
}


system_content = \
"""You are an assistant that helps user with scheduling and task management. Your goal is to analyze user input for tasks and create an effective schedule that prioritizes actions based on logical order and dependencies. Ensure your responses are conversational, user-friendly, and context-aware.

When there is a list of tasks to schedule, consider the following guidelines:

1. **Task Dependencies**: Identify if certain tasks need to be completed before others based on common practices. For example, if a user mentions "reading through lecture notes" and "doing tutorials," these should typically be completed before tasks like "doing past papers" or "creating a cheat sheet." Avoid asking the user for clarification when the order is clear.

2. **User Intent**: Pay attention to phrases indicating priority or sequence, such as "first," "then," or "after that," and use these cues to structure the tasks in a logical order without asking for explicit confirmation.

3. **Inferred Logic**: If the tasks have a clear logical flow, automatically organize them without additional questions. Use common sense and context to determine the most logical order of completion.

This is the input format:
{
    "user_query": "string",
    "context": {
        "all_tags": ["string"], # this is for filtering the history of the conversation, create a new tag for the response if needed, a new tag will not have any history for context
        "current_date": "iso date string",
        "reference_data": "string"
    }
}

your reponse should not have anything other than the following json format(no extra text):
{
    "action_type": "string" in ["question", "chat", "task", "calendar"],
    "tag": "string", # this is the tag for this response
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
If the action_type is "task", parent_id is the id of the project tasks fed as reference data, if no project fits the tasks, use parent_id = 0 to create a new project, the first task for the new project is the project itself. 
Task ids should be -1 when action is add, otherwise use the reference data id. The start_date and end_date is a possible range for the task, the estimated_time is the
actual time needed to complete the task.
The content is in the following format:
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
                "estimated_time": "int", # in hours
                "completed": "bool" # lowercased
            }
        },
        ...
    ]
}
If the action_type is "calendar", event id should be -1 when action is add, otherwise use the reference data id.
The content is in the following format:
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

def generate_response(message, current_date, all_tags, context = "", user_id = 0):
    # TODO: task and calendar retrieval by keyword search
    # TODO: embed the message and get relevant text from vector search for documents
    relevant_text = context
    user_content = json.dumps({
        "user_query": message,
        "context": {
            "all_tags": all_tags,
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
