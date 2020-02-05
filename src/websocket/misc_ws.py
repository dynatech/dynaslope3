"""
Miscellaneous Web Socket
"""
from datetime import datetime
from connection import SOCKETIO

@SOCKETIO.on("get_server_time", namespace="/misc")
def server_time_background_task():
    """
    server time background task.
    """
    while True:
        now = datetime.now()
        server_time = now.strftime("%Y-%m-%d %H:%M:%S")
        SOCKETIO.emit("receive_server_time", server_time, namespace="/misc")
        SOCKETIO.sleep(0.5)
