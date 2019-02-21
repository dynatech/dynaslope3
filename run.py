"""
File Runner of the whole server
Contains the Flask App initialization function
"""

import os
import json
from connection import create_app
from flask import Blueprint, jsonify
from flask_socketio import SocketIO, emit
from src.api.inbox_controller import get_unregistered_inbox

CONFIG_NAME = os.getenv("FLASK_CONFIG")
APP = create_app(CONFIG_NAME)
SOCKETIO = SocketIO(APP)

@SOCKETIO.on('getData')
def new_function(methods=['GET', 'POST']):
    data = get_unregistered_inbox(2)
    emit('dataResponse', data, callback='Successfully loaded inbox')

if __name__ == "__main__":
    # APP.run(debug=True)
    SOCKETIO.run(APP, host='localhost', port=5000, debug=True)