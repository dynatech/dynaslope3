"""
Miscellaneous Web Socket
"""

from datetime import datetime
from connection import SOCKETIO, CELERY


@CELERY.task(name="server_time_background_task", ignore_results=True)
def server_time_background_task():
    """
    server time background task.
    """

    print()
    system_time = datetime.strftime(
        datetime.now(), "%Y-%m-%d %H:%M:%S")
    print(f"{system_time} | Server Time Background Task Running...")

    while True:
        now = datetime.now()
        server_time = now.strftime("%Y-%m-%d %H:%M:%S")
        SOCKETIO.emit("receive_server_time", server_time, namespace="/misc")
        SOCKETIO.sleep(0.5)
