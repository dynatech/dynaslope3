"""
File Runner of the whole server
Contains the Flask App initialization function
"""

import os
from argparse import ArgumentParser

from gevent import monkey
monkey.patch_all()

from connection import create_app, SOCKETIO

ASSETS_DIR = os.path.dirname(os.path.abspath(__file__))

PARSER = ArgumentParser(description="Run Dynaslope 3.0 Server")
PARSER.add_argument(
    "-sm", "--skip_memcache", help="skip memcache initialization", action="store_true")
PARSER.add_argument(
    "-sw", "--skip_websocket", help="skip running of websocket background task",
    action="store_true")
ARGS = PARSER.parse_args()


CONFIG_NAME = os.getenv("FLASK_CONFIG")
APP = create_app(CONFIG_NAME, skip_memcache=ARGS.skip_memcache,
                 skip_websocket=ARGS.skip_websocket)

if __name__ == "__main__":
    print("Flask server is now running...")
    context = ("/home/dynaslope/ssl/dynaslope.crt",
               "/home/dynaslope/ssl/privatekey.key")
    SOCKETIO.run(APP, host='127.0.0.1', port=5000,
                 debug=True, use_reloader=False, ssl_context=context)
