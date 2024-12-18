from typing import List
from models.db_pool import get_connection, return_connection
from flask import current_app as app


class TaskCalendarLinkDB:
    def __init__(self):
        pass

    def create_table():
        conn, cursor = get_connection()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS task_calendar_links (
                task_id INTEGER NOT NULL,
                calendar_id INTEGER NOT NULL,
                PRIMARY KEY (task_id, calendar_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id),
                FOREIGN KEY (calendar_id) REFERENCES calendar_events(id)
            )
            """
        )
        conn.commit()
        return_connection(conn, cursor)

    def link_task_to_event(task_id, calendar_id):
        conn, cursor = get_connection()
        cursor.execute(
            """
            INSERT INTO task_calendar_links (task_id, calendar_id)
            VALUES (%s, %s)
            """, (task_id, calendar_id)
        )
        conn.commit()
        return_connection(conn, cursor)

    def unlink_task_from_event(calendar_id: int):
        conn, cursor = get_connection()
        cursor.execute(
            """
            DELETE FROM task_calendar_links
            WHERE calendar_id = %s
            """, (calendar_id,)
        )
        conn.commit()
        return_connection(conn, cursor)

    def get_calendar_id_for_task(task_id: int) -> List[int]:
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT calendar_id FROM task_calendar_links
            WHERE task_id = %s
            """, (task_id,)
        )
        result = cursor.fetchall()
        if len(result) == 0:
            return []
        calendar_ids = [row[0] for row in result]
        return_connection(conn, cursor)
        return calendar_ids
    
    def get_task_for_calendar_event(calendar_id: int) -> int:
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT task_id FROM task_calendar_links
            WHERE calendar_id = %s
            """, (calendar_id,)
        )
        try:
            result = cursor.fetchone()[0]
        except TypeError:
            result = -1
        return_connection(conn, cursor)
        return result
