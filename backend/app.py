from flask import Flask, jsonify
from flask_cors import CORS
from controllers.task_controller import bp as task_bp
from controllers.calendar_event_controller import bp as calendar_bp
from models.task_calendar_link_model import TaskCalendarLinkDB
from models.task_model import TaskDB
from models.calendar_model import CalendarEventDB
from flask import current_app as current_app

app = Flask(__name__)

app.register_blueprint(task_bp, url_prefix='/task')
app.register_blueprint(calendar_bp, url_prefix='/calendar')
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000'}})

@app.route('/')
def ping_test():
    return jsonify({'message': 'pong'})

if __name__ == '__main__':
    # create all tables
    TaskDB.create_table()
    CalendarEventDB.create_table()
    TaskCalendarLinkDB.create_table()
    app.run(host='0.0.0.0', port=5148, debug=True)
