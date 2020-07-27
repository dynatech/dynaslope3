"""
File Runner of the whole server
Contains the Flask App initialization function
"""

import os
from argparse import ArgumentParser
from connection import create_app, SOCKETIO

parser = ArgumentParser(description="Run Dynaslope 3.0 Server")
parser.add_argument(
    "-sm", "--skip_memcache", help="skip memcache initialization", action="store_true")
parser.add_argument(
    "-sw", "--skip_websocket", help="skip running of websocket background task", action="store_true")
args = parser.parse_args()


CONFIG_NAME = os.getenv("FLASK_CONFIG")
APP = create_app(CONFIG_NAME, skip_memcache=args.skip_memcache,
                 skip_websocket=args.skip_websocket)

if __name__ == "__main__":
    SOCKETIO.run(APP, host="192.168.1.10", port=5000,
                 debug=True, use_reloader=False)
