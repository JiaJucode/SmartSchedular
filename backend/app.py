from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
# need to be in this order for import
from controllers.task_controller import bp as task_bp
from controllers.calendar_event_controller import bp as calendar_bp

app = Flask(__name__)

app.register_blueprint(task_bp, url_prefix='/task')
app.register_blueprint(calendar_bp, url_prefix='/calendar')
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000'}})

@app.route('/')
def ping_test():
    return jsonify({'message': 'pong'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5148, debug=True)