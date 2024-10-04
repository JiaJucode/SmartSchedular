import os
import psycopg2
from psycopg2 import sql
from datetime import datetime
from typing import List, Optional, Dict

DATABASE_URL = os.getenv('DATABASE_URL')

calendar_events_columns = ['id', 'title', 'source', 'tags', 'start_datetime', 'end_datetime', 'description']

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
                title TEXT NOT NULL,
                source INTEGER,
                tags TEXT[],
                start_datetime TIMESTAMP NOT NULL,
                end_datetime TIMESTAMP NOT NULL,
                description TEXT,
                FOREIGN KEY (source) REFERENCES tasks(id)
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
    
    def add_event(self, title: str | None, tags: List[str], source: int, start_datetime: datetime, 
                  end_datetime: datetime, description: str) -> int:

        query = sql.SQL(
            """
            INSERT INTO calendar_events ({columns})
            VALUES ({values})
            RETURNING id
            """
        ).format(
            columns=sql.SQL(', ').join(map(sql.Identifier, calendar_events_columns[1:])),
            values=sql.SQL(', ').join(map(sql.Literal, [title, source, tags, start_datetime, 
                                                        end_datetime, description]))
        )
        self.cursor.execute(query)
        event_id = self.cursor.fetchone()[0]
        self.conn.commit()
        return event_id

    def delete_event(self, event_id: int) -> None:
        self.cursor.execute(
            """
            DELETE FROM calendar_events
            WHERE id = %s
            """,
            (event_id,)
        )
        self.conn.commit()

    def update_event(self, event_id: int, title: Optional[str] = None,
                     tags: Optional[List[str]] = None, source: Optional[int] = None,
                     start_datetime: Optional[datetime] = None,
                     end_datetime: Optional[datetime] = None, 
                     description: Optional[str] = None) -> None:

        set_clause = {}
        input = [event_id, title, tags, source, start_datetime, end_datetime, description]
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
        self.cursor.execute(query)
        self.conn.commit()

    def close(self) -> None:
        self.cursor.close()
        self.conn.close()
        