import json
from connection import SOCKETIO
from datetime import datetime
from flask import request
from src.utils.extra import var_checker
from config import APP_CONFIG

CLIENTS = []
GENERATED_ALERTS = []


def monitoring_background_task():
    global GENERATED_ALERTS
    print("ehe")
    while True:
        print()
        system_time = datetime.strftime(datetime.now(), "%Y-%m-%d %H:%M:%S")
        print(f"{system_time} | Websocket running...")
        if not GENERATED_ALERTS:
            GENERATED_ALERTS = read_generated_alerts_json()
        else:
            new_generated_alerts = read_generated_alerts_json()

            if GENERATED_ALERTS != new_generated_alerts:
                GENERATED_ALERTS = new_generated_alerts
                print(f"{system_time} | NEW JSON data found.")
                SOCKETIO.emit("receive_generated_alerts",
                              new_generated_alerts, namespace="/monitoring")
            else:
                print(f"{system_time} | No changes in JSON data.")

        SOCKETIO.sleep(5)


@SOCKETIO.on('connect', namespace='/monitoring')
def connect():
    sid = request.sid
    CLIENTS.append(sid)
    print("Connected user: " + sid)
    print(f"Current connected clients: {CLIENTS}")

    global GENERATED_ALERTS
    SOCKETIO.emit("receive_generated_alerts",
                  GENERATED_ALERTS, namespace="/monitoring")


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
    # generated_alerts_list = ["YEY"]
    full_filepath = APP_CONFIG["generated_alerts_path"]
    # full_filepath = "/var/www/dynaslope3/outputs/generated_alerts.json"
    print(f"Getting data from {full_filepath}")

    with open(f"{full_filepath}generated_alerts.json") as json_file:
        generated_alerts_list = json.load(json_file)

    return generated_alerts_list
