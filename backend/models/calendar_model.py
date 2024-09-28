import os
import psycopg2
from psycopg2 import sql
from datetime import datetime
from typing import List, Optional, Dict

DATABASE_URL = os.getenv('DATABASE_URL')

calendar_events_columns = ['id', 'name', 'tags', 'start_datetime', 'end_datetime', 'description']

class CalendarEventDB:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.cursor = self.conn.cursor()
        self.create_table()

    def create_table(self):
        self.cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS calendar_events (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                tags TEXT[],
                start_datetime TIMESTAMP NOT NULL,
                end_datetime TIMESTAMP NOT NULL,
                description TEXT
            )
            """
        )
        self.conn.commit()
    
    def get_events(self, start_datetime: datetime, end_datetime: datetime) -> List[Dict]:
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
        self.cursor.execute(query)
        return [dict(zip(calendar_events_columns, row)) for row in self.cursor.fetchall()]
    
    def add_event(self, name: str, tags: List[str], start_datetime: datetime, 
                  end_datetime: datetime, description: str) -> None:
        self.cursor.execute(
            """
            INSERT INTO calendar_events (name, tags, start_datetime, end_datetime, description)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (name, tags, start_datetime, end_datetime, description)
        )
        self.conn.commit()

    def delete_event(self, event_id: int) -> None:
        self.cursor.execute(
            """
            DELETE FROM calendar_events
            WHERE id = %s
            """,
            (event_id,)
        )
        self.conn.commit()

    def update_event(self, event_id: int, name: Optional[str] = None,
                     tags: Optional[List[str]] = None, start_datetime: Optional[datetime] = None,
                     end_datetime: Optional[datetime] = None, 
                     description: Optional[str] = None) -> None:
        set_clause = []
        if name is not None:
            set_clause.append(f"name = {name}")
        if tags is not None:
            set_clause.append(f"tags = {tags}")
        if start_datetime is not None:
            set_clause.append(f"start_datetime = {start_datetime}")
        if end_datetime is not None:
            set_clause.append(f"end_datetime = {end_datetime}")
        if description is not None:
            set_clause.append(f"description = {description}")

        query = sql.SQL(
            """
            UPDATE calendar_events
            SET {}
            WHERE id = {}
            """
        ).format(
            sql.SQL(', ').join(map(sql.Identifier, set_clause)),
            sql.Literal(event_id)
        )
        self.cursor.execute(query)
        self.conn.commit()

    def close(self) -> None:
        self.cursor.close()
        self.conn.close()
        