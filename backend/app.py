from flask import Flask, jsonify
from flask_cors import CORS
from controllers.task_controller import bp as task_bp
from controllers.calendar_event_controller import bp as calendar_bp
from controllers.chat_controller import bp as chat_bp
from controllers.google_controller import bp as google_bp
from models.task_calendar_link_model import TaskCalendarLinkDB
from models.task_model import TaskDB
from models.calendar_model import CalendarEventDB
from models.google_model import GoogleDB
from milvus.milvus_client import milvus_client

app = Flask(__name__)

app.register_blueprint(task_bp, url_prefix='/task')
app.register_blueprint(calendar_bp, url_prefix='/calendar')
app.register_blueprint(chat_bp, url_prefix='/chat')
app.register_blueprint(google_bp, url_prefix='/google')
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000'}})

@app.route('/')
def ping_test():
    return jsonify({'message': 'pong'})

if __name__ == '__main__':
    # create all tables
    TaskDB.create_table()
    CalendarEventDB.create_table()
    TaskCalendarLinkDB.create_table()
    GoogleDB.create_table()
    milvus_client.setup()
    app.run(host='0.0.0.0', port=5148, debug=True)
