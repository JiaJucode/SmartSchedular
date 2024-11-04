from models.db_pool import get_connection, return_connection
import time


class GoogleAuthenDB:
    def __init__(self) -> None:
        pass

    def create_table() -> None:
        conn, cursor = get_connection()
        # TODO: link user_id to user table
        # TODO: redis the syncing status
        
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS google_drive_tokens (
                user_id INTEGER PRIMARY KEY,
                refresh_token TEXT NOT NULL,
                access_token TEXT NOT NULL,
                channel_id TEXT,
                page_token TEXT,
                expiration_time INTEGER,
                is_syncing BOOLEAN DEFAULT FALSE
            )
            """
        )
        conn.commit()
        return_connection(conn, cursor)

    def add_token(user_id: int, access_token: str, refresh_token: str) -> None:
        conn, cursor = get_connection()
        # Try to add the token, if it already exists, update it
        cursor.execute(
            """
            SELECT * FROM google_drive_tokens WHERE user_id = %s
            """,
            (user_id,)
        )
        if cursor.fetchone():
            GoogleAuthenDB.update_token(user_id, access_token, refresh_token)
            return_connection(conn, cursor)
            return
        cursor.execute(
            """
            INSERT INTO google_drive_tokens (user_id, refresh_token, access_token)
            VALUES (%s, %s, %s)
            """,
            (user_id, refresh_token, access_token)
        )
        conn.commit()
        return_connection(conn, cursor)

    def update_token(user_id: int, access_token: str, refresh_token: str) -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            UPDATE google_drive_tokens
            SET access_token = %s, refresh_token = %s
            WHERE user_id = %s
            """,
            (access_token, refresh_token, user_id)
        )
        conn.commit()
        return_connection(conn, cursor)

    def get_tokens(user_id: int) -> tuple:
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT access_token, refresh_token FROM google_drive_tokens
            WHERE user_id = %s
            """,
            (user_id,)
        )
        tokens = cursor.fetchone()
        return_connection(conn, cursor)
        return tokens
    
    def check_connected(user_id: int) -> bool:
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT * FROM google_drive_tokens
            WHERE user_id = %s
            """,
            (user_id,)
        )
        result = cursor.fetchone()
        return_connection(conn, cursor)
        return result is not None
    
    def set_syncing(user_id: int, is_syncing: bool) -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            UPDATE google_drive_tokens
            SET is_syncing = %s
            WHERE user_id = %s
            """,
            (is_syncing, user_id)
        )
        conn.commit()
        return_connection(conn, cursor)

    def check_syncing(user_id: int) -> bool:
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT is_syncing FROM google_drive_tokens
            WHERE user_id = %s
            """,
            (user_id,)
        )
        result = cursor.fetchone()
        if result is None:
            return_connection(conn, cursor)
            return False
        return_connection(conn, cursor)
        return result[0]
    
    def get_user(channel_id: str) -> dict:
        """
        Returns:
            {"user_id": int, "access_token": str, "refresh_token": str}
        """
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT user_id, access_token, refresh_token, page_token FROM google_drive_tokens
            WHERE channel_id = %s
            """,
            (channel_id,)
        )
        result = cursor.fetchone()
        return_connection(conn, cursor)
        return {
            "user_id": result[0], 
            "access_token": result[1], 
            "refresh_token": result[2],
            "page_token": result[3]
        } if result else None

    def update_page_token(user_id: str, page_token: str) -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            UPDATE google_drive_tokens
            SET page_token = %s
            WHERE user_id = %s
            """,
            (page_token, user_id)
        )
        conn.commit()
        return_connection(conn, cursor)
    
    def update_channel_id(user_id: int, channel_id: str) -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            UPDATE google_drive_tokens
            SET channel_id = %s
            WHERE user_id = %s
            """,
            (channel_id, user_id)
        )
        conn.commit()
        return_connection(conn, cursor)

    def get_expiration_time(user_id: int) -> int:
        conn, cursor = get_connection()
        cursor.execute(
            """
            SELECT expiration_time FROM google_drive_tokens
            WHERE user_id = %s
            """,
            (user_id,)
        )
        result = cursor.fetchone()
        return_connection(conn, cursor)
        return result[0] if result else 0
    
    def update_push_notification(user_id: int, channel_id: str, page_token: str, expiration_time: int) -> None:
        conn, cursor = get_connection()
        cursor.execute(
            """
            UPDATE google_drive_tokens
            SET channel_id = %s, page_token = %s, expiration_time = %s
            WHERE user_id = %s
            """,
            (channel_id, page_token, expiration_time, user_id)
        )
        conn.commit()
        return_connection(conn, cursor)
