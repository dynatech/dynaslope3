import json
from connection import SOCKETIO
from flask import request
from src.utils.extra import var_checker

CLIENTS = []
GENERATED_ALERTS = []


def monitoring_background_task():
    global GENERATED_ALERTS

    while True:
        SOCKETIO.emit("receive_generated_alerts",
                      "Yahoo background task", namespace="/monitoring")
        print("I am background", GENERATED_ALERTS)
        SOCKETIO.sleep(10)


@SOCKETIO.on('connect', namespace='/monitoring')
def connect():
    sid = request.sid
    CLIENTS.append(sid)
    print("Connected user: " + sid)
    global GENERATED_ALERTS

    if CLIENTS:
        if not GENERATED_ALERTS:
            GENERATED_ALERTS = read_generated_alerts_json()

        SOCKETIO.emit("receive_generated_alerts", GENERATED_ALERTS,
                      callback="successfully accessed", namespace="/monitoring")


@SOCKETIO.on('disconnect', namespace='/monitoring')
def disconnect():
    print("In disconnect")
    CLIENTS.remove(request.sid)


@SOCKETIO.on("get_generated_alerts", namespace="/monitoring")
def read_generated_alerts_json():
    """
    Sample
    """
    generated_alerts_list = ["YEY"]
    # print(CLIENTS)
    # full_filepath = "/var/www/dynaslope3/outputs/generated_alerts.json"
    # print(f"Getting data from {full_filepath}")
    # print()

    # with open(full_filepath) as json_file:
    #     generated_alerts_list = json.load(json_file)

    return generated_alerts_list
