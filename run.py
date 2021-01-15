"""
File Runner of the whole server
Contains the Flask App initialization function
"""

import os
from argparse import ArgumentParser

from gevent import monkey
monkey.patch_all()

from connection import create_app, SOCKETIO

PARSER = ArgumentParser(description="Run Dynaslope 3.0 Server")
PARSER.add_argument(
    "-sm", "--skip_memcache", help="skip memcache initialization", action="store_true")
PARSER.add_argument(
    "-ew", "--enable_webdriver", help="start running Chrome of webdriver",
    action="store_true")
ARGS = PARSER.parse_args()


CONFIG_NAME = os.getenv("FLASK_CONFIG")
APP = create_app(CONFIG_NAME, skip_memcache=ARGS.skip_memcache,
                 enable_webdriver=ARGS.enable_webdriver)

if __name__ == "__main__":
    print("Flask server is now running...")
    SOCKETIO.run(APP, host='192.168.150.253', port=5000,
                 debug=True, use_reloader=False)
