from psycopg2 import pool
import os

DATABASE_URL = os.getenv('DATABASE_URL')

# Create a single connection pool
connection_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=DATABASE_URL
)

def get_connection():
    """Get a connection from the pool."""
    conn = connection_pool.getconn()
    return conn, conn.cursor()

def return_connection(conn, cursor):
    """Return a connection to the pool."""
    cursor.close()
    connection_pool.putconn(conn)
