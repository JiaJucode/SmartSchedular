from calendar_utils import get_empty_timeslots_util, add_event
from datetime import datetime, timedelta

empty_event_test_cases = [
    {
        "input": ([], "2024-10-05T10:00:00", "2024-10-05T11:00:00"),
        "expected": [{"start_datetime": "2024-10-05T10:00:00", "end_datetime": "2024-10-05T11:00:00"}]
    },
    {
        "input": (
            [
                {"id": 1, "start_datetime": "2024-10-05T10:00:00", "end_datetime": "2024-10-05T11:00:00"},
                {"id": 2, "start_datetime": "2024-10-05T12:00:00", "end_datetime": "2024-10-05T13:00:00"},
            ], 
            "2024-10-05T09:00:00",
            "2024-10-05T14:00:00"
        ),
        "expected": [
            {"start_datetime": "2024-10-05T09:00:00", "end_datetime": "2024-10-05T10:00:00"},
            {"start_datetime": "2024-10-05T11:00:00", "end_datetime": "2024-10-05T12:00:00"},
            {"start_datetime": "2024-10-05T13:00:00", "end_datetime": "2024-10-05T14:00:00"}
        ]
    },
    {
        "input": (
            [
                {"id": 1, "start_datetime": "2024-10-05T10:00:00", "end_datetime": "2024-10-05T11:30:00"},
                {"id": 2, "start_datetime": "2024-10-05T11:00:00", "end_datetime": "2024-10-05T12:00:00"},
            ], 
            "2024-10-05T09:00:00",
            "2024-10-05T13:00:00"
        ),
        "expected": [
            {"start_datetime": "2024-10-05T09:00:00", "end_datetime": "2024-10-05T10:00:00"},
            {"start_datetime": "2024-10-05T12:00:00", "end_datetime": "2024-10-05T13:00:00"}
        ]
    },
    {
        "input": (
            [
                {"id": 1, "start_datetime": "2024-10-05T08:00:00", "end_datetime": "2024-10-05T09:00:00"},
                {"id": 2, "start_datetime": "2024-10-05T09:30:00", "end_datetime": "2024-10-05T10:30:00"},
            ],
            "2024-10-05T09:00:00",
            "2024-10-05T11:00:00"
        ),
        "expected": [
            {"start_datetime": "2024-10-05T09:00:00", "end_datetime": "2024-10-05T09:30:00"},
            {"start_datetime": "2024-10-05T10:30:00", "end_datetime": "2024-10-05T11:00:00"}
        ]
    },
    {
        "input": (
            [
                {"id": 1, "start_datetime": "2024-10-05T09:00:00", "end_datetime": "2024-10-05T10:00:00"},
                {"id": 2, "start_datetime": "2024-10-05T10:30:00", "end_datetime": "2024-10-05T11:30:00"},
            ],
            "2024-10-05T09:00:00",
            "2024-10-05T14:00:00"
        ),
        "expected": [
            {"start_datetime": "2024-10-05T10:00:00", "end_datetime": "2024-10-05T10:30:00"},
            {"start_datetime": "2024-10-05T11:30:00", "end_datetime": "2024-10-05T14:00:00"}
        ]
    },
        {
        "input": (
            [
                {"id": 1, "start_datetime": "2024-10-05T09:00:00", "end_datetime": "2024-10-05T10:00:00"},
                {"id": 2, "start_datetime": "2024-10-05T10:30:00", "end_datetime": "2024-10-05T13:30:00"},
                {"id": 3, "start_datetime": "2024-10-05T09:40:00", "end_datetime": "2024-10-05T11:00:00"},
                {"id": 4, "start_datetime": "2024-10-05T09:50:00", "end_datetime": "2024-10-05T13:50:00"},
            ],
            "2024-10-05T09:00:00",
            "2024-10-05T14:00:00"
        ),
        "expected": [
            {"start_datetime": "2024-10-05T13:50:00", "end_datetime": "2024-10-05T14:00:00"}
        ]
    },
]

start_time = datetime(2024, 10, 5, 9, 0, 0)
multi_schedule_test_cases = [
    {
        "input": ([], [{
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=5)
        }]),
        "expected": []
    },
    {
        "input": ([{
            "title": "Task 1",
            "priority": 1,
            "start_datetime": start_time + timedelta(hours=1),
            "end_datetime": start_time + timedelta(hours=2),
            "estimated_time": 1,
            "description": "Description of Task 1"
        }], []),
        "expected": []
    },
    {
        "input": ([{
            "title": "Task 1",
            "priority": 1,
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=5),
            "estimated_time": 5,
            "description": "Description of Task 1"
        }], [{
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=5)
        }]),
        "expected": [{
            "title": "Task 1",
            "tags": [],
            "str_start_datetime": start_time.isoformat(),
            "str_end_datetime": (start_time + timedelta(hours=5)).isoformat(),
            "description": "Description of Task 1"
        }]
    },
    {
        "input": ([{
            "title": "Task 1",
            "priority": 1,
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=6),
            "estimated_time": 6,
            "description": "Description of Task 1"
        }], [{
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=5)
        }]),
        "expected": [{
            "title": "Task 1",
            "tags": [],
            "str_start_datetime": start_time.isoformat(),
            "str_end_datetime": (start_time + timedelta(hours=5)).isoformat(),
            "description": "Description of Task 1"
        }]
    },
    {
        "input": ([{
            "title": "Task 1",
            "priority": 1,
            "start_datetime": start_time + timedelta(hours=1),
            "end_datetime": start_time + timedelta(hours=3),
            "estimated_time": 2,
            "description": "Description of Task 1"
        }, {
            "title": "Task 2",
            "priority": 2,
            "start_datetime": start_time + timedelta(hours=4),
            "end_datetime": start_time + timedelta(hours=5),
            "estimated_time": 1,
            "description": "Description of Task 2"
        }], [{
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=5)
        }]),
        "expected": [
            {
                "title": "Task 1",
                "tags": [],
                "str_start_datetime": (start_time + timedelta(hours=1)).isoformat(),
                "str_end_datetime": (start_time + timedelta(hours=3)).isoformat(),
                "description": "Description of Task 1"
            },
            {
                "title": "Task 2",
                "tags": [],
                "str_start_datetime": (start_time + timedelta(hours=4)).isoformat(),
                "str_end_datetime": (start_time + timedelta(hours=5)).isoformat(),
                "description": "Description of Task 2"
            }
        ]
    },
    {
        "input": ([{
            "title": "Task 1",
            "priority": 1,
            "start_datetime": start_time + timedelta(hours=1),
            "end_datetime": start_time + timedelta(hours=2),
            "estimated_time": 1,
            "description": "Description of Task 1"
        }, {
            "title": "Task 2",
            "priority": 2,
            "start_datetime": start_time + timedelta(hours=3),
            "end_datetime": start_time + timedelta(hours=4),
            "estimated_time": 1,
            "description": "Description of Task 2"
        }], [{
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=5)
        }]),
        "expected": [
            {
                "title": "Task 1",
                "tags": [],
                "str_start_datetime": (start_time + timedelta(hours=1)).isoformat(),
                "str_end_datetime": (start_time + timedelta(hours=2)).isoformat(),
                "description": "Description of Task 1"
            },
            {
                "title": "Task 2",
                "tags": [],
                "str_start_datetime": (start_time + timedelta(hours=3)).isoformat(),
                "str_end_datetime": (start_time + timedelta(hours=4)).isoformat(),
                "description": "Description of Task 2"
            }
        ]
    },
    {
        "input": ([{
            "title": "Task 1",
            "priority": 1,
            "start_datetime": start_time + timedelta(hours=1),
            "end_datetime": start_time + timedelta(hours=4),
            "estimated_time": 3,
            "description": "Description of Task 1"
        }, {
            "title": "Task 2",
            "priority": 2,
            "start_datetime": start_time + timedelta(hours=2),
            "end_datetime": start_time + timedelta(hours=3),
            "estimated_time": 1,
            "description": "Description of Task 2"
        }], [{
            "start_datetime": start_time,
            "end_datetime": start_time + timedelta(hours=5)
        }]),
        "expected": [
            {
                "title": "Task 1",
                "tags": [],
                "str_start_datetime": (start_time + timedelta(hours=1)).isoformat(),
                "str_end_datetime": (start_time + timedelta(hours=2)).isoformat(),
                "description": "Description of Task 1"
            },
            {
                "title": "Task 2",
                "tags": [],
                "str_start_datetime": (start_time + timedelta(hours=2)).isoformat(),
                "str_end_datetime": (start_time + timedelta(hours=3)).isoformat(),
                "description": "Description of Task 2"
            },
            {
                "title": "Task 1",
                "tags": [],
                "str_start_datetime": (start_time + timedelta(hours=3)).isoformat(),
                "str_end_datetime": (start_time + timedelta(hours=4)).isoformat(),
                "description": "Description of Task 1"
            }
        ]
    }
]

def run_tests():
    for i, case in enumerate(empty_event_test_cases):
        current_events, start_datetime_str, end_datetime_str = case["input"]
        expected_output = case["expected"]
        
        timeslots = get_empty_timeslots_util(current_events, start_datetime_str, end_datetime_str)
        
        assert timeslots == expected_output, f"Test case {i + 1} failed: expected {expected_output}, \ngot {timeslots}"
    print("All empty event test cases passed.")
    for i, case in enumerate(multi_schedule_test_cases):
        tasks, free_time_slots = case["input"]
        expected_output = case["expected"]
        expected_output = sorted(expected_output, key=lambda x: x["str_start_datetime"])
        scheduled_events = add_event(tasks, free_time_slots)
        scheduled_events = sorted(scheduled_events, key=lambda x: x["str_start_datetime"])
        
        assert scheduled_events == expected_output,\
            f"Test case {i + 1} failed: expected {expected_output}, \ngot {scheduled_events}"
    print("All multi schedule test cases passed.")

run_tests()