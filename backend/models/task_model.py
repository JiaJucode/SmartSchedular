from psycopg2 import sql
from datetime import datetime
from typing import List, Optional, Dict
from flask import current_app as app
from models.db_pool import get_connection, return_connection

tasks_columns = ['id', 'title', 'description', 'start_datetime', 
                 'end_datetime', 'priority', 'estimated_time', 'completed']

class TaskDB:
    def __init__(self):
        pass

    def create_table():
        conn, cursor = get_connection()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                start_datetime TIMESTAMP,
                end_datetime TIMESTAMP,
                priority INTEGER,
                estimated_time INTEGER,
                completed BOOLEAN
            )
            """
        )
        conn.commit()

        # task hierarchy table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS task_links (
                parent_id INTEGER NOT NULL,
                child_id INTEGER NOT NULL,
                PRIMARY KEY (parent_id, child_id),
                FOREIGN KEY (parent_id) REFERENCES tasks(id),
                FOREIGN KEY (child_id) REFERENCES tasks(id)
            )
            """
        )
        conn.commit()

        # if root task does not exist, create it
        # all projects are children of the root task
        cursor.execute(
            """
            SELECT * FROM tasks
            WHERE id = 0
            """
        )
        if not cursor.fetchone():
            cursor.execute(
                """
                INSERT INTO tasks (id, title, description, start_datetime, end_datetime, completed)
                VALUES (0, 'root', '', NULL, NULL, TRUE)
                """
            )
            conn.commit()
        
        return_connection(conn, cursor)

    def get_task(id: int) -> Dict:
        conn, cursor = get_connection()
        query = sql.SQL(
            """
            SELECT * FROM tasks
            WHERE id = {id}
            """
        ).format(
            id=sql.Literal(id)
        )
        cursor.execute(query)
        task = dict(zip(tasks_columns, cursor.fetchone()))
        return_connection(conn, cursor)
        return task
    
    def get_tasks_by_date_range(start_date: datetime, end_date: datetime) -> List[Dict]:
        conn, cursor = get_connection()
        query = sql.SQL(
            """
            SELECT * FROM tasks
            WHERE (
                (start_datetime IS NOT NULL AND start_datetime BETWEEN {start_date} AND {end_date})
                OR (end_datetime IS NOT NULL AND end_datetime BETWEEN {start_date} AND {end_date})
                OR (start_datetime < {start_date} AND end_datetime > {end_date})
            )
            """
        ).format(
            start_date=sql.Literal(start_date),
            end_date=sql.Literal(end_date)
        )
        cursor.execute(query)
        tasks = [dict(zip(tasks_columns, row)) for row in cursor.fetchall()]
        return_connection(conn, cursor)
        return tasks

    def get_child_tasks(parent_id: int) -> List[Dict]:
        conn, cursor = get_connection()
        query = sql.SQL(
            """
            SELECT * FROM task_links
            WHERE parent_id = {parent_id}
            """
        ).format(
            parent_id=sql.Literal(parent_id)
        )
        cursor.execute(query)
        try: 
            child_ids = [row[1] for row in cursor.fetchall()]
            return_connection(conn, cursor)
            return [TaskDB.get_task(child_id) for child_id in child_ids]
        except:
            return_connection(conn, cursor)
            return []
    
    def update_task(id: int | None, title: str | None,
                    description: str | None, start_datetime: datetime | None,
                    end_datetime: datetime | None, priority: int | None,
                    estimated_time: int | None, completed: bool | None) -> None:
        conn, cursor = get_connection()
        if (id == 0):
            raise ValueError("id cannot be root task")

        set_clause = {}
        input = [id, title, description, start_datetime, end_datetime, 
                 priority, estimated_time, completed]
        for i, column in enumerate(tasks_columns):
            if input[i] is not None:
                set_clause[column] = input[i]
        query = sql.SQL(
            """
            UPDATE tasks
            SET {set_clause}
            WHERE id = {id}
            """
        ).format(
            set_clause=sql.SQL(', ').join([sql.SQL("{column} = {value}").format(
                column=sql.Identifier(column),
                value=sql.Literal(set_clause[column])
            ) for column in set_clause]),
            id=sql.Literal(id)
        )

        cursor.execute(query)
        conn.commit()

        return_connection(conn, cursor)

    def add_task(parent_id: int, title: str, description: str = "",
                 start_datetime: Optional[datetime] = None, end_datetime: Optional[datetime] = None,
                 priority: Optional[int] = None, estimated_time: Optional[int] = None,
                 completed: Optional[bool] = False) -> int:
        conn, cursor = get_connection()
        query = sql.SQL(
            """
            INSERT INTO tasks ({columns})   
            VALUES ({values})
            RETURNING id         
            """
        ).format(
            columns=sql.SQL(', ').join([sql.Identifier(column) for column in tasks_columns[1:]]),
            values=sql.SQL(', ').join([sql.Literal(value) for value in 
                                        [title, description, start_datetime, 
                                        end_datetime, priority, estimated_time, completed]])
        )
        cursor.execute(query)
        task_id = cursor.fetchone()[0]
        conn.commit()

        cursor.execute(
            """
            INSERT INTO task_links (parent_id, child_id)
            VALUES (%s, %s)
            """,
            (parent_id, task_id)
        )
        conn.commit()
        return_connection(conn, cursor)
        return task_id
    
    def delete_task(id: int) -> None:
        conn, cursor = get_connection()
        if (id == 0):
            raise ValueError("id cannot be root task")
        
        # get all children of task
        cursor.execute(
            """
            SELECT * FROM task_links
            WHERE parent_id = %s
            """,
            (id,)
        )
        child_ids = [row[1] for row in cursor.fetchall()]

        # delete all children
        for child_id in child_ids:
            TaskDB.delete_task(child_id)

        # delete all links to children and to parent

        cursor.execute(
            """
            DELETE FROM task_links
            WHERE parent_id = %s OR child_id = %s
            """,
            (id, id)
        )
        conn.commit()

        cursor.execute(
            """
            DELETE FROM tasks
            WHERE id = %s
            """,
            (id,)
        )
        conn.commit()

        return_connection(conn, cursor)
