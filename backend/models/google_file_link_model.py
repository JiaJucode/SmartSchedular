from models.db_pool import get_connection, return_connection
from typing import List, Dict
from flask import current_app as app

class GoogleFileLinkDB:
    def __init__(self) -> None:
        pass

    def create_table() -> None:
        conn, cursor = get_connection()

        # drop tables   
        # cursor.execute(
        #     """
        #     DROP TABLE IF EXISTS task_google_file_links
        #     """
        # )
        # conn.commit()
        # cursor.execute(
        #     """
        #     DROP TABLE IF EXISTS calendar_google_file_links
        #     """
        # )
        # conn.commit()
        # cursor.execute(
        #     """
        #     DROP TABLE IF EXISTS google_file_links
        #     """
        # )
        # conn.commit()
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
        # check if link already exists
        cursor.execute(
            """
            SELECT link_id FROM google_file_links
            WHERE file_id = %s AND file_segment_start = %s AND file_segment_end = %s AND user_id = %s
            """, (file_id, file_segment_start, file_segment_end, user_id)
        )
        link_id = cursor.fetchone()
        if link_id is None:
            cursor.execute(
                """
                INSERT INTO google_file_links (file_id, file_segment_start, file_segment_end, user_id)
                VALUES (%s, %s, %s, %s)
                RETURNING link_id
                """, (file_id, file_segment_start, file_segment_end, user_id)
            )
            link_id = cursor.fetchone()
        link_id = link_id[0]
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
            return_connection(conn, cursor)
            return {
                "tasks": [],
                "calendar_events": []
            }
        cursor.execute(
            """
            SELECT task_id FROM task_google_file_links
            WHERE link_id = %s
            """, (link_id,)
        )
        result = cursor.fetchall()
        app.logger.info("result: " + str(result))
        # print all rows in tasks_google_file_links
        cursor.execute(
            """
            SELECT * FROM task_google_file_links
            """
        )
        app.logger.info("all rows in task_google_file_links: " + str(cursor.fetchall()))

        task_ids = [row[0] for row in result]
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
        link_ids = []
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
                return_connection(conn, cursor)
                return
            for link_id in link_ids:
                cursor.execute(
                    """
                    DELETE FROM task_google_file_links
                    WHERE link_id = %s
                    """, (link_id[0],)
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
                return_connection(conn, cursor)
                return
            for link_id in link_ids:
                cursor.execute(
                    """
                    DELETE FROM calendar_google_file_links
                    WHERE link_id = %s
                    """, (link_id[0],)
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

    def delete_segment_link(file_id: str, start_sentence_index: int, end_sentence_index: int) -> None:
        conn, cursor = get_connection()
        # get link_id
        cursor.execute(
            """
            SELECT link_id FROM google_file_links
            WHERE file_id = %s AND file_segment_start = %s AND file_segment_end = %s
            """, (file_id, start_sentence_index, end_sentence_index)
        )
        link_id = cursor.fetchone()[0]
        # delete from task_google_file_links
        cursor.execute(
            """
            DELETE FROM task_google_file_links
            WHERE link_id = %s
            """, (link_id,)
        )
        # delete from calendar_google_file_links
        cursor.execute(
            """
            DELETE FROM calendar_google_file_links
            WHERE link_id = %s
            """, (link_id,)
        )
        # delete from google_file_links
        cursor.execute(
            """
            DELETE FROM google_file_links
            WHERE link_id = %s
            """, (link_id,)
        )
        conn.commit()
        return_connection(conn, cursor)

    def update_segment_link(user_id: int, file_id: str, old_range: tuple, 
                       new_ranges: List[tuple]) -> None:
        if len(new_ranges) == 0:
            return
        # update current google_file_links with first new range
        conn, cursor = get_connection()
        cursor.execute(
            """
            UPDATE google_file_links
            SET file_segment_start = %s, file_segment_end = %s
            WHERE file_id = %s AND file_segment_start = %s AND file_segment_end = %s AND user_id = %s
            """, (new_ranges[0][0], new_ranges[0][1], file_id, old_range[0], old_range[1], user_id)
        )
        conn.commit()
        
        # create new google_file_links for the rest of the new ranges
        for new_range in new_ranges[1:]:
            cursor.execute(
                """
                INSERT INTO google_file_links (file_id, file_segment_start, file_segment_end, user_id)
                VALUES (%s, %s, %s, %s)
                """, (file_id, new_range[0], new_range[1], user_id)
            )
            conn.commit()
        return_connection(conn, cursor)
