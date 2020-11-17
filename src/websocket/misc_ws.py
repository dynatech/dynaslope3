"""
Miscellaneous Web Socket
"""

import json
from datetime import datetime
from flask import request
from connection import SOCKETIO, CELERY

from src.api.monitoring import get_monitoring_shifts
from src.utils.notifications import (
    get_user_notifications, prepare_notification,
    insert_notification
)

from src.utils.extra import set_data_to_memcache, retrieve_data_from_memcache

set_data_to_memcache(name="MONITORING_SHIFTS", data=json.dumps([]))
set_data_to_memcache(name="MISC_CLIENTS", data={})


@SOCKETIO.on("disconnect", namespace="/communications")
def disconnect():
    sid = request.sid
    clients = retrieve_data_from_memcache("MISC_CLIENTS")

    try:
        user_id = next(
            (user_id for user_id, dict_sid in clients.items() if dict_sid == sid), None)
        del clients[user_id]
    except KeyError:
        print("MISC - Cannot find user with sid:", sid)

    set_data_to_memcache(name="MISC_CLIENTS", data=clients)


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


def emit_data(keyword, sid=None, data_to_emit=None):
    if keyword == "receive_monitoring_shifts":
        data_to_emit = retrieve_data_from_memcache("MONITORING_SHIFTS")

    if sid:
        SOCKETIO.emit(keyword, data_to_emit, to=sid, namespace="/misc")
    else:
        SOCKETIO.emit(keyword, data_to_emit, namespace="/misc")


@SOCKETIO.on("get_monitoring_shifts", namespace="/misc")
def wrap_get_monitoring_shifts():
    """
    """

    sid = request.sid
    emit_data("receive_monitoring_shifts", sid=sid)


@CELERY.task(name="monitoring_shift_background_task", ignore_results=True)
def monitoring_shift_background_task():
    """
    Monitoring shifts background task
    """

    print()
    system_time = datetime.strftime(
        datetime.now(), "%Y-%m-%d %H:%M:%S")
    print(f"{system_time} | Monitoring Shift Background Task Running...")

    data = get_monitoring_shifts()
    set_data_to_memcache("MONITORING_SHIFTS", data)
    emit_data("receive_monitoring_shifts")


@SOCKETIO.on("get_user_notifications", namespace="/misc")
def wrap_get_user_notifications(user_id):
    """
    Websocket for getting user notifications
    """

    sid = request.sid

    clients = retrieve_data_from_memcache("MISC_CLIENTS")
    clients[int(user_id)] = sid
    set_data_to_memcache(name="MISC_CLIENTS", data=clients)

    notifs = get_user_notifications(user_id=user_id)
    emit_data(keyword="receive_user_notifications",
              sid=sid, data_to_emit=notifs)


def send_notification(notif_type, data):
    """
    """

    notif_object, notif_receivers = prepare_notification(notif_type, data)
    clients = retrieve_data_from_memcache("MISC_CLIENTS")

    for receiver_id in notif_receivers:
        insert_notification(receiver_id=receiver_id,
                            message=notif_object["message"], link=notif_object["link"])
        try:
            sid = clients[receiver_id]
        except Exception:
            sid = None

        if sid:
            notifs = get_user_notifications(user_id=receiver_id)
            emit_data(keyword="receive_user_notifications",
                      sid=sid, data_to_emit=notifs)
