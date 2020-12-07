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


@SOCKETIO.on("disconnect", namespace="/communications")
def disconnect():
    sid = request.sid
    clients = retrieve_data_from_memcache("MISC_CLIENTS")

    try:
        user_id = next(
            (user_id for user_id, sids in clients.items() if sid in sids), None)
        clients[user_id].remove(sid)

        if not clients[user_id]:
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
    user_id = int(user_id)

    try:
        clients = retrieve_data_from_memcache("MISC_CLIENTS")
    except Exception:
        clients = {}

    clients.setdefault(user_id, [])
    clients[user_id].append(sid)

    print("")
    print("New misc client:", user_id, sid)
    print("")
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
            sids = clients[receiver_id]
        except Exception:
            sids = None

        if sids:
            notifs = get_user_notifications(user_id=receiver_id)
            for sid in sids:
                emit_data(keyword="receive_user_notifications",
                          sid=sid, data_to_emit=notifs)
