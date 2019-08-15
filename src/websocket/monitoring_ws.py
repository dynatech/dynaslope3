import json
from connection import SOCKETIO
from datetime import datetime
from flask import request
from src.utils.extra import var_checker
from config import APP_CONFIG
from src.experimental_scripts import public_alert_generator, candidate_alerts_generator
from src.api.monitoring import wrap_get_ongoing_extended_overdue_events
from src.utils.monitoring import update_alert_status

CLIENTS = []
GENERATED_ALERTS = []
CANDIDATE_ALERTS = []
ALERTS_FROM_DB = []


def emit_data(keyword):
    global GENERATED_ALERTS
    global CANDIDATE_ALERTS
    global ALERTS_FROM_DB

    data_list = {
        "receive_generated_alerts": GENERATED_ALERTS,
        "receive_candidate_alerts": CANDIDATE_ALERTS,
        "receive_alerts_from_db": ALERTS_FROM_DB
    }

    SOCKETIO.emit(keyword, data_list[keyword], namespace="/monitoring")


def monitoring_background_task():
    global GENERATED_ALERTS
    global CANDIDATE_ALERTS
    global ALERTS_FROM_DB
    while True:
        if not GENERATED_ALERTS:
            GENERATED_ALERTS = generate_alerts()
            ALERTS_FROM_DB = wrap_get_ongoing_extended_overdue_events()
            CANDIDATE_ALERTS = candidate_alerts_generator.main()

            emit_data("receive_generated_alerts")
            emit_data("receive_alerts_from_db")
            emit_data("receive_candidate_alerts")

        elif datetime.now().minute % 5 == 1:
            print()
            system_time = datetime.strftime(
                datetime.now(), "%Y-%m-%d %H:%M:%S")
            print(f"{system_time} | Websocket running...")

            GENERATED_ALERTS = generate_alerts()
            ALERTS_FROM_DB = wrap_get_ongoing_extended_overdue_events()
            CANDIDATE_ALERTS = candidate_alerts_generator.main()

            print(f"{system_time} | Done processing Candidate Alerts.")

            emit_data("receive_generated_alerts")
            emit_data("receive_alerts_from_db")
            emit_data("receive_candidate_alerts")

        SOCKETIO.sleep(60)  # Every 60 seconds in production stage


@SOCKETIO.on('connect', namespace='/monitoring')
def connect():
    sid = request.sid
    CLIENTS.append(sid)
    print("Connected user: " + sid)
    print(f"Current connected clients: {CLIENTS}")

    emit_data("receive_generated_alerts")
    emit_data("receive_alerts_from_db")
    emit_data("receive_candidate_alerts")


@SOCKETIO.on('disconnect', namespace='/monitoring')
def disconnect():
    print("In disconnect")
    CLIENTS.remove(request.sid)


@SOCKETIO.on('validate', namespace='/monitoring')
def validate(site_code, as_details):
    global GENERATED_ALERTS
    global CANDIDATE_ALERTS
    global ALERTS_FROM_DB
    system_time = datetime.strftime(
        datetime.now(), "%Y-%m-%d %H:%M:%S")
    print(f"{system_time} | validating trigger...")

    # Update the trigger validity
    status = update_alert_status(as_details)
    print(status)

    site_gen_alert = generate_alerts(site_code)
    # Find the current entry for the site provided
    gen_alert_row = next(
        filter(lambda x: x["site_code"] == site_code, GENERATED_ALERTS), None)
    gen_alert_index = GENERATED_ALERTS.index(gen_alert_row)
    # Replace rather update alertgen entry
    GENERATED_ALERTS[gen_alert_index] = site_gen_alert

    ALERTS_FROM_DB = wrap_get_ongoing_extended_overdue_events()
    CANDIDATE_ALERTS = candidate_alerts_generator.main()

    emit_data("receive_generated_alerts")
    emit_data("receive_alerts_from_db")
    emit_data("receive_candidate_alerts")

# @SOCKETIO.on("get_generated_alerts", namespace="/monitoring")
# def read_generated_alerts_json():
#     """
#     Sample
#     """
#     generated_alerts_list = []
#     # generated_alerts_list = ["YEY"]
#     # full_filepath = APP_CONFIG["generated_alerts_path"]
#     full_filepath = "/var/www/dynaslope3/outputs/"
#     print(f"Getting data from {full_filepath}")

#     with open(f"{full_filepath}generated_alerts.json") as json_file:
#         generated_alerts_list = json.load(json_file)

#     return generated_alerts_list


@SOCKETIO.on("get_generated_alerts", namespace="/monitoring")
def generate_alerts(site_code=None):
    """
    Sample
    """
    if site_code:
        generated_alerts_json = public_alert_generator.main(
            site_code=site_code)
        generated_alerts_json = generated_alerts_json[0]
    else:
        generated_alerts_json = public_alert_generator.main()
    # generated_alerts_json = public_alert_generator.main()
    # generated_alerts_json = public_alert_generator.main(site_code="umi")

        # query_ts_end="2019-07-22 19:56:00", query_ts_start="2019-07-22 19:56:00", site_code="umi")
        # generated_alerts_json = public_alert_generator.main("2018-11-14 07:51:00", True, "nur")
        # generated_alerts_json = public_alert_generator.main(
        #     "2019-01-22 03:00:00", True)
        # generated_alerts_json = public_alert_generator.main(
        # "2018-11-14 07:51:00", True)

    return generated_alerts_json
