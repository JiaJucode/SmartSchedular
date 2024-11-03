from models.db_pool import get_connection, return_connection
from typing import List, Dict

class GoogleFileLinkDB:
    def __init__(self) -> None:
        pass

    def create_table() -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS google_file_links (
                link_id SERIAL PRIMARY KEY,
                file_id TEXT,
                file_segment_start INTEGER,
                file_segment_end INTEGER,
                user_id INTEGER
            )
            """
        )
        conn.commit()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS task_google_file_links (
                task_id INTEGER,
                link_id INTEGER,
                PRIMARY KEY (task_id, link_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id),
                FOREIGN KEY (link_id) REFERENCES google_file_links(link_id)
            )
            """
        )
        conn.commit()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS calendar_google_file_links (
                calendar_id INTEGER,
                link_id INTEGER,
                PRIMARY KEY (calendar_id, link_id),
                FOREIGN KEY (calendar_id) REFERENCES calendar_events(id),
                FOREIGN KEY (link_id) REFERENCES google_file_links(link_id)
            )
            """
        )
        conn.commit()
        return_connection(conn, cursor)

    def add_task_link(
            user_id: int, 
            task_id: int, 
            file_id: str, 
            file_segment_start: int, 
            file_segment_end: int) -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            INSERT INTO google_file_links (file_id, file_segment_start, file_segment_end, user_id)
            VALUES (%s, %s, %s, %s)
            RETURNING link_id
            """, (file_id, file_segment_start, file_segment_end, user_id)
        )
        link_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO task_google_file_links (task_id, link_id)
            VALUES (%s, %s)
            """, (task_id, link_id)
        )
        conn.commit()
        return_connection(conn, cursor)

    def add_calendar_link(
            user_id: int, 
            calendar_id: int, 
            file_id: str, 
            file_segment_start: int, 
            file_segment_end: int) -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            INSERT INTO google_file_links (file_id, file_segment_start, file_segment_end, user_id)
            VALUES (%s, %s, %s, %s)
            RETURNING link_id
            """, (file_id, file_segment_start, file_segment_end, user_id)
        )
        link_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO calendar_google_file_links (calendar_id, link_id)
            VALUES (%s, %s)
            """, (calendar_id, link_id)
        )
        conn.commit()
        return_connection(conn, cursor)

    def get_linked_items(user_id: int, file_id: str, file_segment_start: int, file_segment_end: int) -> Dict:
        """
        Get all tasks and calendar events linked to a file segment
        return: {
            "tasks": [task_id],
            "calendar_events": [calendar_id]
        }
        """
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT link_id FROM google_file_links
            WHERE file_id = %s AND file_segment_start = %s AND file_segment_end = %s AND user_id = %s
            """, (file_id, file_segment_start, file_segment_end, user_id)
        )
        try:
            link_id = cursor.fetchone()[0]
        except TypeError:
            return []
        cursor.execute(
            """
            SELECT task_id FROM task_google_file_links
            WHERE link_id = %s
            """, (link_id,)
        )
        task_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute(
            """
            SELECT calendar_id FROM calendar_google_file_links
            WHERE link_id = %s
            """, (link_id,)
        )
        calendar_ids = [row[0] for row in cursor.fetchall()]
        return_connection(conn, cursor)
        return {
            "tasks": task_ids,
            "calendar_events": calendar_ids
        }

    def delete_link(item_id: int, isTask: bool) -> None:
        """
        Delete
        """
        conn, cursor = get_connection()
        if isTask:
            cursor.execute(
                """
                SELECT link_id FROM task_google_file_links
                WHERE task_id = %s
                """, (item_id,)
            )
            link_ids = cursor.fetchall()
            if len(link_ids) == 0:
                return
            cursor.execute(
                """
                DELETE FROM task_google_file_links
                WHERE task_id = %s
                """, (item_id,)
            )
        else:
            cursor.execute(
                """
                SELECT link_id FROM calendar_google_file_links
                WHERE calendar_id = %s
                """, (item_id,)
            )
            link_ids = cursor.fetchall()
            if len(link_ids) == 0:
                return
            cursor.execute(
                """
                DELETE FROM calendar_google_file_links
                WHERE calendar_id = %s
                """, (item_id,)
            )
        for link_id in link_ids:
            cursor.execute(
                """
                DELETE FROM google_file_links
                WHERE link_id = %s
                """, (link_id[0],)
            )
        conn.commit()
        return_connection(conn, cursor)
