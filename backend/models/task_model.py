import os
import psycopg2
from psycopg2 import sql
from datetime import datetime
from typing import List, Optional, Dict
from flask import current_app as app

DATABASE_URL = os.getenv('DATABASE_URL')

tasks_columns = ['id', 'title', 'description', 'start_datetime', 
                 'end_datetime', 'priority', 'estimated_time', 'completed']

class TaskDB:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.cursor = self.conn.cursor()
        self.create_table()

    def create_table(self):
        self.cursor.execute(
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
        self.conn.commit()

        self.cursor.execute(
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
        self.conn.commit()

        # if root task does not exist, create it
        # all projects are children of the root task
        self.cursor.execute(
            """
            SELECT * FROM tasks
            WHERE id = 0
            """
        )
        if not self.cursor.fetchone():
            self.cursor.execute(
                """
                INSERT INTO tasks (id, title, description, start_datetime, end_datetime, completed)
                VALUES (0, 'root', '', NULL, NULL, TRUE)
                """
            )
            self.conn.commit()


    def __get_task(self, id: int) -> Dict:
        query = sql.SQL(
            """
            SELECT * FROM tasks
            WHERE id = {id}
            """
        ).format(
            id=sql.Literal(id)
        )
        self.cursor.execute(query)
        return dict(zip(tasks_columns, self.cursor.fetchone()))

    def get_child_tasks(self, parent_id: int) -> List[Dict]:
        query = sql.SQL(
            """
            SELECT * FROM task_links
            WHERE parent_id = {parent_id}
            """
        ).format(
            parent_id=sql.Literal(parent_id)
        )
        self.cursor.execute(query)
        try: 
            child_ids = [row[1] for row in self.cursor.fetchall()]
            return [self.__get_task(child_id) for child_id in child_ids]
        except:
            return []
    
    def update_task(self, id: int | None, title: str | None,
                    description: str | None, start_datetime: datetime | None,
                    end_datetime: datetime | None, priority: int | None,
                    estimated_time: int | None, completed: bool | None) -> None:
        if (id == 0):
            raise ValueError("id cannot be root task")

        set_clause = {}
        input = [id, title, description, start_datetime, end_datetime, 
                 priority, estimated_time, completed]
        for i, column in enumerate(tasks_columns):
            if input[i] is not None:
                set_clause[column] = input[i]

        app.logger.info(f'id: {id}')
        app.logger.info(f"set_clause: {set_clause}")
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

        self.cursor.execute(query)
        self.conn.commit()

    def add_task(self, parent_id: int, title: str, description: str = "",
                 start_datetime: Optional[datetime] = None, end_datetime: Optional[datetime] = None,
                 priority: Optional[int] = None, estimated_time: Optional[int] = None,
                 completed: Optional[bool] = False) -> int:
            app.logger.info(f"input: {parent_id}, {title}, {description}, {start_datetime}, {end_datetime}, {priority}, {estimated_time}, {completed}")
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
            self.cursor.execute(query)
            task_id = self.cursor.fetchone()[0]
            self.conn.commit()

            self.cursor.execute(
                """
                INSERT INTO task_links (parent_id, child_id)
                VALUES (%s, %s)
                """,
                (parent_id, task_id)
            )
            self.conn.commit()
            return task_id
    
    def delete_task(self, id: int) -> None:
        if (id == 0):
            raise ValueError("id cannot be root task")
        
        # get all children of task
        self.cursor.execute(
            """
            SELECT * FROM task_links
            WHERE parent_id = %s
            """,
            (id,)
        )
        child_ids = [row[1] for row in self.cursor.fetchall()]

        # delete all children
        for child_id in child_ids:
            self.delete_task(child_id)

        # delete all links to children and to parent

        self.cursor.execute(
            """
            DELETE FROM task_links
            WHERE parent_id = %s OR child_id = %s
            """,
            (id, id)
        )
        self.conn.commit()

        self.cursor.execute(
            """
            DELETE FROM tasks
            WHERE id = %s
            """,
            (id,)
        )
        self.conn.commit()