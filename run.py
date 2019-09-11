"""
File Runner of the whole server
Contains the Flask App initialization function
"""

import os
from argparse import ArgumentParser
from connection import create_app, SOCKETIO

parser = ArgumentParser(description="Run Dynaslope 3.0 Server")
parser.add_argument(
    "--run_memcache", help="populate memcached with fresh data", action="store_true")
args = parser.parse_args()

CONFIG_NAME = os.getenv("FLASK_CONFIG")
APP = create_app(CONFIG_NAME, run_memcache=args.run_memcache)
APP.config['JSON_SORT_KEYS'] = False

if __name__ == "__main__":
    SOCKETIO.run(APP, host="192.168.150.167", port=5000,
                 debug=True, use_reloader=False)
