from psycopg2 import pool
import time
import os

SCHEDULING_DATABASE_URL = os.getenv('SCHEDULING_DATABASE_URL')
# Create a single connection pool
for i in range(5):
    try:
        scheduling_connection_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=50,
            dsn=SCHEDULING_DATABASE_URL
        )
        break
    except:
        print("Failed to connect to database, retrying in 5 seconds")
        time.sleep(5)

def get_connection():
    """Get a connection from the pool."""
    conn = scheduling_connection_pool.getconn()
    return conn, conn.cursor()

def return_connection(conn, cursor):
    """Return a connection to the pool."""
    cursor.close()
    scheduling_connection_pool.putconn(conn)
