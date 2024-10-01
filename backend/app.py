from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
from controllers.calendar_event_controller import bp as calendar_bp
from controllers.task_controller import bp as task_bp

app = Flask(__name__)
app.register_blueprint(calendar_bp, url_prefix='/calendar')
app.register_blueprint(task_bp, url_prefix='/task')
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000'}})

@app.route('/')
def ping_test():
    return jsonify({'message': 'pong'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5148, debug=True)