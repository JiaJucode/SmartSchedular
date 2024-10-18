from psycopg2 import pool
import os

SCHEDULING_DATABASE_URL = os.getenv('SCHEDULING_DATABASE_URL')
GOOGLE_SERVICES_DATABASE_URL = os.getenv('GOOGLE_SERVICES_DATABASE_URL')

# Create a single connection pool
scheduling_connection_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=SCHEDULING_DATABASE_URL
)

google_services_connection_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=GOOGLE_SERVICES_DATABASE_URL
)

def get_scheduling_connection():
    """Get a connection from the pool."""
    conn = scheduling_connection_pool.getconn()
    return conn, conn.cursor()

def return_scheduling_connection(conn, cursor):
    """Return a connection to the pool."""
    cursor.close()
    scheduling_connection_pool.putconn(conn)

def get_google_services_connection():
    """Get a connection from the pool."""
    conn = google_services_connection_pool.getconn()
    return conn, conn.cursor()

def return_google_services_connection(conn, cursor):
    """Return a connection to the pool."""
    cursor.close()
    google_services_connection_pool.putconn(conn)
