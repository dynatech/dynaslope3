import json
from connection import SOCKETIO
from datetime import datetime
from flask import request
from config import APP_CONFIG
from src.experimental_scripts import public_alert_generator, candidate_alerts_generator
from src.api.monitoring import wrap_get_ongoing_extended_overdue_events, insert_ewi
from src.utils.monitoring import update_alert_status, get_event_count
from src.utils.extra import var_checker, get_system_time, get_process_status_log


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

    # var_checker("data_list", data_list, True)
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

            try:
                GENERATED_ALERTS = generate_alerts()
                ALERTS_FROM_DB = wrap_get_ongoing_extended_overdue_events()
                CANDIDATE_ALERTS = candidate_alerts_generator.main()

                print(f"{system_time} | Done processing Candidate Alerts.")
            except Exception as err:
                print(err)
                raise

            emit_data("receive_generated_alerts")
            emit_data("receive_alerts_from_db")
            emit_data("receive_candidate_alerts")

        SOCKETIO.sleep(120)  # Every 60 seconds in production stage


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
def generate_alerts(site_code=None):
    """
    Standalone function to update alert gen by anything that 
    requires updating.

    Currently used by the loop that reruns alert gen every 
    60 seconds (production code)

    Args:
        site_code (String) - may be provided if only one
                site is affected by the changes you did.

    Returns the new generated alerts json
    """

    if site_code:
        generated_alerts_json = public_alert_generator.main(
            site_code=site_code)
        generated_alerts_json = json.loads(generated_alerts_json)[0]
    else:
        generated_alerts_json = public_alert_generator.main()

    # generated_alerts_json = public_alert_generator.main(site_code="umi")

    return generated_alerts_json


def update_alert_gen(site_code=None):
    """
    May be used to update all alert_gen related data when
    a change was made either by validating triggers or 
    an insert was made.
    Compared to the function above, this function handles all three 
    important data for the dashboard. Mainly the ff:
        1. generated alerts - current trigger and alert status of sites
        2. candidate alerts - potential releases for sites
        3. alerts from db - current validated/released status of the sites

    Args:
        site_code (String) - may be provided if only one
                site is affected by the changes you did.

    No return. Websocket emit_data handles all returns.
    """
    print(f"{get_system_time()} | Updating complete alert gen data...")

    global GENERATED_ALERTS
    global CANDIDATE_ALERTS
    global ALERTS_FROM_DB

    site_gen_alert = generate_alerts(site_code)

    # Find the current entry for the site provided
    json_generated_alerts = json.loads(GENERATED_ALERTS)
    gen_alert_row = next(
        filter(lambda x: x["site_code"] == site_code, json_generated_alerts), None)

    # Replace rather update alertgen entry
    gen_alert_index = json_generated_alerts.index(gen_alert_row)
    json_generated_alerts[gen_alert_index] = site_gen_alert

    ALERTS_FROM_DB = wrap_get_ongoing_extended_overdue_events()
    CANDIDATE_ALERTS = candidate_alerts_generator.main()
    GENERATED_ALERTS = json.dumps(json_generated_alerts)

    print(f"{get_system_time()} | DONE! Emitting updated alert gen data...")
    emit_data("receive_generated_alerts")
    emit_data("receive_alerts_from_db")
    emit_data("receive_candidate_alerts")

    print(f"{get_system_time()} | DONE! EMITTED updated alert gen data.")


#####################################
# - - - API-RELATED FUNCTIONS - - - #
#####################################

def execute_alert_status_validation(as_details):
    """
    Function used to prepare the whole validation
    process i.e. setting trigger validity, and
    update of alert gen data.
    """
    # Update the trigger validity
    status = update_alert_status(as_details)

    # Prepare process status log
    status_log = get_process_status_log("update_alert_status", status)

    # Update the complete alert gen data
    site_code = as_details["site_code"].lower()
    update_alert_gen(site_code=site_code)

    return status_log


def execute_insert_ewi(insert_details):
    """
    Function used to prepare the whole insert_ewi
    process.
    """
    var_checker("insert_details", insert_details, True)

    # Insert ewi release
    status = insert_ewi(insert_details)

    # Prepare process status log
    status_log = get_process_status_log("insert_ewi", status)

    # Update the complete alert gen data
    site_code = insert_details["site_code"].lower()
    update_alert_gen(site_code=site_code)

    # return "status_log"
    return status_log


@SOCKETIO.on("message", namespace="/monitoring")
def handle_message(payload):
    """
    This handles all messages and connects per message to it's
    corresponding functions.
    """

    key = payload["key"]
    data = payload["data"]

    if key == "insert_ewi":
        print(get_process_status_log("insert_ewi", "request"))
        var_checker("insert data", data, True)
        # status = execute_insert_ewi(data)
        print("status")

    elif key == "validate_trigger":
        print(get_process_status_log("validate_trigger", "request"))
        status = execute_alert_status_validation(data)
        print(status)
    elif key == "update_monitoring_tables":
        print(get_process_status_log("update_monitoring_tables", "request"))
        # NOTE: UNFINISHED BUSINESS
    else:
        print("ERROR: Key provided not found.")
        raise Exception("WEBSOCKET MESSAGE: KEY NOT FOUND")
