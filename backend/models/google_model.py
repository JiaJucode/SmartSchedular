from psycopg2 import sql
from models.db_pool import get_google_services_connection, return_google_services_connection


class GoogleDB:
    def __init__(self) -> None:
        pass

    def create_table() -> None:
        conn, cursor = get_google_services_connection()
        # TODO: link user_id to user table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS google_drive_tokens (
                user_id INTEGER PRIMARY KEY,
                refresh_token TEXT NOT NULL,
                access_token TEXT NOT NULL
            )
            """
        )
        conn.commit()
        return_google_services_connection(conn, cursor)

    def add_token(user_id: int, access_token: str, refresh_token: str) -> None:
        conn, cursor = get_google_services_connection()
        # Try to add the token, if it already exists, update it
        cursor.execute(
            """
            SELECT * FROM google_drive_tokens WHERE user_id = %s
            """,
            (user_id,)
        )
        if cursor.fetchone():
            GoogleDB.update_token(user_id, access_token, refresh_token)
            return_google_services_connection(conn, cursor)
            return
        cursor.execute(
            """
            INSERT INTO google_drive_tokens (user_id, refresh_token, access_token)
            VALUES (%s, %s, %s)
            """,
            (user_id, refresh_token, access_token)
        )
        conn.commit()
        return_google_services_connection(conn, cursor)

    def update_token(user_id: int, access_token: str, refresh_token: str) -> None:
        conn, cursor = get_google_services_connection()
        cursor.execute(
            """
            UPDATE google_drive_tokens
            SET access_token = %s, refresh_token = %s
            WHERE user_id = %s
            """,
            (access_token, refresh_token, user_id)
        )
        conn.commit()
        return_google_services_connection(conn, cursor)