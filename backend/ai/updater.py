from llama_index.llms.nvidia import NVIDIA
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.llms import ChatMessage, MessageRole
from jsonschema import validate, ValidationError
from dotenv import load_dotenv
from flask import current_app as app
import os
import json

load_dotenv()
api_key = os.getenv("NVIDIA_API_KEY")

text_splitter = SentenceSplitter(chunk_size=400)
llm = NVIDIA(
    # model="nvidia/nemotron-4-340b-instruct",
    model="nvidia/llama-3.1-nemotron-51b-instruct",
    nvidia_api_key=api_key,
    base_url="https://integrate.api.nvidia.com/v1",
    temperature=0.3,
    max_tokens=3000,
)

response_schema = {
    "type": "object",
    "properties": {
        "content": {
            "type": "array",
            "items": {
                "oneOf": [
                    {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "title": {"type": "string"},
                            "tags": {"type": "array", "items": {"type": "string"}},
                            "description": {"type": "string"},
                            "start_datetime": {"type": "string"},
                            "end_datetime": {"type": "string"}
                        },
                        "required": ["id", "title", "tags", "description", "start_datetime", "end_datetime"]
                    },
                    {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "start_datetime": {"type": "string"},
                            "end_datetime": {"type": "string"},
                            "priority": {"type": "integer"},
                            "estimated_time": {"type": "integer"}
                        },
                        "required": ["id", "title", "description", "start_datetime", "end_datetime", "priority", "estimated_time"]
                    }
                ]
            }
        }
    },
    "required": ["content"]
}

# TODO: also ask it to filter out the content that is not needed
system_content = \
"""You are an assistant that help user with updating their calendar events and tasks. You will receive the current context and a list of calendar events or tasks. 

consider the following guidelines when updating the calendar events or tasks:
1. DO NOT change the id of the calendar event or task.
2. DO NOT add any new calendar event or task.
3. if the task or calendar event matches the input, DO NOT update it.
4. Only update if there is key information that needs to be changed.
5. If there is not enough information to update the task or calendar event, DO NOT update it.
6. number of items in the content array have to be less than the number of items in the input array.
7. Pay attention to key dates in the context and make sure the calendar events or tasks are updated accordingly.

This is the format for the user input:
{
    "context": "string",
    "date": "iso date string", // current date
    "content": calendar_event[] or task[]
}

This is the format for the calendar event:
{
    "id": "int",
    "title": "string",
    "tags": "string[]",
    "description": "string",
    "start_datetime": "iso date string",
    "end_datetime": "iso date string"
}
This is the format for the task:
{
    "id": "int",
    "title": "string",
    "description": "string",
    "start_datetime": "iso date string",
    "end_datetime": "iso date string",
    "priority": "int",
    "estimated_time": "int",
}

Only update if there is key information that needs to be changed.
your response should not have anything other than the following json format(no extra text):
{
    "content": calendar_event[] or task[] # If there is no update needed, content should be an empty array.
}

The format for the calendar event and task is the same as the input format.
There shouldnt be any extra sentences in the response other than the json format.
"""

def llm_decode(llm_response: str) -> dict | None:
    try:
        response = json.loads(llm_response)
    except json.JSONDecodeError as e:
        # app.logger.error("Error decoding LLM response: %s", e)
        print(e)
        return None
    
    try:
        validate(response, response_schema)
    except ValidationError as e:
        # app.logger.error("Error validating LLM response: %s", e)
        print(e)
        return None
    return response


def update_changes(content: dict, date: str, context: str) -> dict | None:
    input = {
        "context": context,
        "date": date,
        "content": content
    }
    # app.logger.info("LLM input: %s", input)
    messages = [
        ChatMessage(role=MessageRole.SYSTEM, content=(system_content)),
        ChatMessage(role=MessageRole.USER, content=(json.dumps(input)))
    ]

    raw_response = llm.chat(messages).message.content
    # app.logger.info("LLM response: %s", raw_response)
    print(raw_response)
    try:
        return llm_decode(raw_response)
    except Exception as e:
    #     # app.logger.error("Error decoding LLM response: %s", e)
        return None

# for basic testing
if __name__ == "__main__":
    test_input = {
        'context': '\ufeffDate: November 8, 2024 \r\n Prepared By: FitConnect Product Team \r\n ________________ \r\n\r\n\r\n 1. Project Overview \r\n * Project Name: FitConnect \r\n * Objective: Develop a mobile app to help users track fitness progress, connect with friends, and join virtual challenges. \r\n * Current Phase: Beta Testing \r\n 2. Key Achievements \r\n * Beta Release: Successfully launched the beta version to a group of 1,000 users for initial feedback. \r\n * Feature Completion: Finalized core features such as workout tracking, friend connectivity, and leaderboard functionality. \r\n * UI/UX Enhancements: Improved navigation flow based on early feedback and redesigned some interface elements. \r\n 3. Challenges Encountered \r\n * Performance Issues: Some users reported slow loading times for workout tracking. Engineering team is optimizing backend queries to resolve this. \r\n * Security Concerns: Identified potential vulnerabilities in friend connection features. Additional security patches are planned. \r\n 4. Next Steps and Coordination Needs \r\n * Weekly Stand-Up \r\n    * Continue weekly stand-up meetings every Wednesday at 10 AM to track progress and address any blockers. \r\n * Beta Feedback Review Session \r\n    * Gather and analyze feedback from beta users to plan further feature enhancements. Tentatively scheduled for November 23, 2024. \r\n * Feature Freeze and Code Review \r\n    * Conduct a full code review and initiate a feature freeze to stabilize the app. Target date for code review: November 27, 2024. \r\n * Performance Benchmark Meeting \r\n    * Meeting with the backend team to evaluate performance optimization progress and identify further improvements. Schedule this meeting in early December. \r\n 5. Action Items for Team \r\n * Data monitoring Setup: \r\n    * Set up analytics dashboards to track user behavior and feedback data. Analytics team to complete setup by November 4, 2024. \r\n * User Guide Preparation: \r\n    * Prepare a user guide to address common questions and support the full app release. Content team to finalize the guide by November 10, 2024. \r\n 6. Milestones for Next Phase \r\n * Prepare for Public Release: \r\n    * After incorporating beta feedback and finalizing features, aim for a public release of the app in January 2025. \r\n * QA and Final Testing: \r\n    * Schedule a comprehensive QA phase in mid-December to ensure all bugs are resolved before public launch.', 
        'date': '2024-11-10T16:19:38.982332', 
        'content': [
                {"id": 60, "title": "Weekly Stand-Up Meetings", "description": "Continue weekly stand-up meetings every Wednesday at 10 AM", "start_datetime": "2024-11-13T10:00:00", "end_datetime": "2024-11-13T11:00:00", "priority": 2, "estimated_time": 1}, 
                {"id": 61, "title": "Beta Feedback Review Session", "description": "Gather and analyze feedback from beta users to plan further feature enhancements", "start_datetime": "2024-11-23T00:00:00", "end_datetime": "2024-11-23T23:59:59.999000", "priority": 2, "estimated_time": 2}, 
                {"id": 62, "title": "Feature Freeze and Code Review", "description": "Conduct a full code review and initiate a feature freeze to stabilize the app", "start_datetime": "2024-11-22T00:00:00", "end_datetime": "2024-11-22T23:59:59.999000", "priority": 2, "estimated_time": 2}, 
                {"id": 63, "title": "Performance Benchmark Meeting", "description": "Meet with the backend team to evaluate performance optimization progress and identify further improvements", "start_datetime": "2024-12-01T00:00:00", "end_datetime": "2024-12-01T23:59:59.999000", "priority": 2, "estimated_time": 2}
            ]
    }
    print(update_changes(test_input['content'], test_input['date'], test_input['context']))
