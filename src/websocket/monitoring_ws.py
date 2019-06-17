import time
import json
from connection import SOCKETIO
from flask import request
from src.utils.extra import var_checker

CLIENTS = []
GENERATED_ALERTS = []


def main():
    global GENERATED_ALERTS
    GENERATED_ALERTS = read_generated_alerts_json()
    print("In if main")
    # print(GENERATED_ALERTS)
    # sleep_time = 10
    # time.sleep(sleep_time)


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
    generated_alerts_list = []
    print(CLIENTS)
    full_filepath = "/var/www/dynaslope3/outputs/generated_alerts.json"
    print(f"Getting data from {full_filepath}")
    print()

    with open(full_filepath) as json_file:
        generated_alerts_list = json.load(json_file)

    return generated_alerts_list

    # sleep_time = 10
    # time.sleep(sleep_time)
