"""
Miscellaneous Web Socket
"""

from datetime import datetime
from connection import SOCKETIO, CELERY
from src.api.monitoring import get_monitoring_shifts
from src.utils.extra import set_data_to_memcache, retrieve_data_from_memcache

set_data_to_memcache(name="MONITORING_SHIFTS", data=get_monitoring_shifts())


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
    
@SOCKETIO.on("connect", namespace="/misc")
def connect():
    """
    on connect func()
    """
    emit_data("receive_monitoring_shifts")
    
    
def emit_data(keyword, sid=None):
    data_to_emit = None
    if keyword == "receive_monitoring_shifts":
        data_to_emit = retrieve_data_from_memcache("MONITORING_SHIFTS")

    if sid:
        SOCKETIO.emit(keyword, data_to_emit, to=sid, namespace="/misc")
    else:
        SOCKETIO.emit(keyword, data_to_emit, namespace="/misc")

def get_shifts_background_task():
    """
    BACKGROUND TASK
    """
    data = []
    while True:
        try:
            if not data:
                data = get_monitoring_shifts()
                set_data_to_memcache("MONITORING_SHIFTS", data)
        
            if data:
                if datetime.now().hour in [8, 20]:
                    data = get_monitoring_shifts()
                    set_data_to_memcache("MONITORING_SHIFTS", data)

        except Exception as err:
            print(err)
        SOCKETIO.sleep(60)
    