from calendar_utils import get_empty_timeslots_util

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

def run_tests():
    for i, case in enumerate(empty_event_test_cases):
        current_events, start_datetime_str, end_datetime_str = case["input"]
        expected_output = case["expected"]
        
        timeslots = get_empty_timeslots_util(current_events, start_datetime_str, end_datetime_str)
        
        assert timeslots == expected_output, f"Test case {i + 1} failed: expected {expected_output}, \ngot {timeslots}"

    print("All test cases passed.")

run_tests()