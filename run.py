"""
File Runner of the whole server
Contains the Flask App initialization function
"""

import os
from connection import create_app, SOCKETIO

CONFIG_NAME = os.getenv("FLASK_CONFIG")
APP = create_app(CONFIG_NAME)
APP.config['JSON_SORT_KEYS'] = False

if __name__ == "__main__":
    SOCKETIO.run(APP, host="127.0.0.1", port=5000,
                 debug=True, use_reloader=False)
