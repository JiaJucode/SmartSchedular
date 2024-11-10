from psycopg2 import sql
from datetime import datetime
from typing import List, Optional, Dict
from models.db_pool import get_connection, return_connection
from flask import current_app as app

# for deleting link before removing event
from models.task_calendar_link_model import TaskCalendarLinkDB

calendar_events_columns = ['id', 'title', 'tags', 'start_datetime', 'end_datetime', 'description']

class CalendarEventDB:
    def __init__(self):
        pass

    def create_table():
        conn, cursor = get_connection()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS calendar_events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                tags TEXT[],
                start_datetime TIMESTAMP NOT NULL,
                end_datetime TIMESTAMP NOT NULL,
                description TEXT
            )
            """
        )
        conn.commit()
        return_connection(conn, cursor)
    
    def get_events(start_datetime: datetime, end_datetime: datetime) -> List[Dict]:
        conn, cursor = get_connection()
        query = sql.SQL(
            """
            SELECT * FROM calendar_events
            WHERE (start_datetime BETWEEN {start_datetime} AND {end_datetime}) 
            OR (end_datetime BETWEEN {start_datetime} AND {end_datetime})
            OR (start_datetime < {start_datetime} AND end_datetime > {end_datetime})
            """
        ).format(
            start_datetime=sql.Literal(start_datetime),
            end_datetime=sql.Literal(end_datetime)
        )
        cursor.execute(query)
        events = [dict(zip(calendar_events_columns, row)) for row in cursor.fetchall()]
        return_connection(conn, cursor)
        return events
    
    def get_event(event_id: int) -> Dict:
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT * FROM calendar_events
            WHERE id = %s
            """,
            (event_id,)
        )
        event = dict(zip(calendar_events_columns, cursor.fetchone()))
        return_connection(conn, cursor)
        return event
    
    def add_event(title: str | None, tags: List[str], start_datetime: datetime, 
                  end_datetime: datetime, description: str) -> int:
        conn, cursor = get_connection()
        query = sql.SQL(
            """
            INSERT INTO calendar_events ({columns})
            VALUES ({values})
            RETURNING id
            """
        ).format(
            columns=sql.SQL(', ').join(map(sql.Identifier, calendar_events_columns[1:])),
            values=sql.SQL(', ').join(map(sql.Literal, [title, tags, start_datetime, 
                                                        end_datetime, description]))
        )
        cursor.execute(query)
        event_id = cursor.fetchone()[0]
        conn.commit()
        return_connection(conn, cursor)
        return event_id

    def delete_event(event_id: int) -> None:
        TaskCalendarLinkDB.unlink_task_from_event(event_id)
        conn, cursor = get_connection()
        cursor.execute(
            """
            DELETE FROM calendar_events
            WHERE id = %s
            """,
            (event_id,)
        )
        conn.commit()
        return_connection(conn, cursor)

    def update_event(event_id: int, title: Optional[str] = None,
                     tags: Optional[List[str]] = None,
                     start_datetime: Optional[datetime] = None,
                     end_datetime: Optional[datetime] = None, 
                     description: Optional[str] = None) -> None:
        conn, cursor = get_connection()
        set_clause = {}
        input = [event_id, title, tags, start_datetime, end_datetime, description]
        for i in range(1, len(calendar_events_columns)):
            if input[i]:
                set_clause[calendar_events_columns[i]] = input[i]

        query = sql.SQL(
            """
            UPDATE calendar_events
            SET {set_clause}
            WHERE id = {event_id}
            """
        ).format(
            set_clause=sql.SQL(', ').join(
                sql.SQL("{column} = {value}").format(
                    column=sql.Identifier(column),
                    value=sql.Literal(set_clause[column])
                ) for column in set_clause
            ),
            event_id=sql.Literal(event_id)
        )
        cursor.execute(query)
        conn.commit()
        return_connection(conn, cursor)
        