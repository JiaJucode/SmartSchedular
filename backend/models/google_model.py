from models.db_pool import get_connection, return_connection



class GoogleAuthenDB:
    def __init__(self) -> None:
        pass

    def create_table() -> None:
        conn, cursor = get_connection()
        # TODO: link user_id to user table
        # TODO: redis the syncing status

        # cursor.execute(
        #     """
        #     DROP TABLE IF EXISTS google_drive_tokens
        #     """
        # )
        # conn.commit()
        
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS google_drive_tokens (
                user_id INTEGER PRIMARY KEY,
                refresh_token TEXT NOT NULL,
                access_token TEXT NOT NULL,
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
