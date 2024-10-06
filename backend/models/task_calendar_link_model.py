import os
import psycopg2
from psycopg2 import sql
from datetime import datetime
from typing import List, Optional, Dict
from flask import current_app as app

DATABASE_URL = os.getenv('DATABASE_URL')

class TaskCalendarLinkDB:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.cursor = self.conn.cursor()
        self.create_table()

    def create_table(self):
        self.cursor.execute(
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
        self.conn.commit()

    def link_task_to_event(self, task_id, calendar_id):
        self.cursor.execute(
            """
            INSERT INTO task_calendar_links (task_id, calendar_id)
            VALUES (%s, %s)
            """, (task_id, calendar_id)
        )
        self.conn.commit()

    def unlink_task_from_event(self, task_id, calendar_id):
        self.cursor.execute(
            """
            DELETE FROM task_calendar_links
            WHERE task_id = %s AND calendar_id = %s
            """, (task_id, calendar_id)
        )
        self.conn.commit()

    def get_calendar_events_for_task(self, task_id):
        self.cursor.execute(
            """
            SELECT * FROM calendar_events
            WHERE id IN (SELECT calendar_id FROM task_calendar_links WHERE task_id = %s)
            """, (task_id,)
        )
        return self.cursor.fetchall()
    
    def check_if_event_linked_to_task(self, calendar_id):
        self.cursor.execute(
            """
            SELECT * FROM task_calendar_links
            WHERE calendar_id = %s
            """, (calendar_id)
        )
        return self.cursor.fetchone() is not None
