from flask import Flask, jsonify, request, redirect
from flask_cors import CORS

app = Flask(__name__)

# CORS settings for development
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000'}})

# TODO: API routes

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)