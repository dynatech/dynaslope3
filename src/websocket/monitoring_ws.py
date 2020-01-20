"""
"""

import json
import traceback
from datetime import datetime
from flask import request
from connection import SOCKETIO, DB
from src.experimental_scripts import public_alert_generator, candidate_alerts_generator
from src.api.monitoring import wrap_get_ongoing_extended_overdue_events, insert_ewi
from src.utils.monitoring import update_alert_status
from src.utils.issues_and_reminders import write_issue_reminder_to_db
from src.api.issues_and_reminders import wrap_get_issue_reminder
from src.api.manifestations_of_movement import wrap_write_monitoring_moms_to_db
from src.utils.extra import (
    var_checker, get_system_time, get_process_status_log,
    set_data_to_memcache, retrieve_data_from_memcache
)

set_data_to_memcache(name="CLIENTS", data=[])
set_data_to_memcache(name="GENERATED_ALERTS", data=json.dumps([]))
set_data_to_memcache(name="CANDIDATE_ALERTS", data=json.dumps([]))
set_data_to_memcache(name="ALERTS_FROM_DB", data=json.dumps({
    "latest": [], "extended": [], "overdue": [], "routine": {}
}))
set_data_to_memcache(name="ISSUES_AND_REMINDERS", data=json.dumps([]))


def emit_data(keyword, sid=None):
    data_to_emit = None
    if keyword == "receive_generated_alerts":
        data_to_emit = retrieve_data_from_memcache("GENERATED_ALERTS")
    elif keyword == "receive_candidate_alerts":
        data_to_emit = retrieve_data_from_memcache("CANDIDATE_ALERTS")
    elif keyword == "receive_alerts_from_db":
        data_to_emit = retrieve_data_from_memcache("ALERTS_FROM_DB")
    elif keyword == "receive_issues_and_reminders":
        data_to_emit = retrieve_data_from_memcache("ISSUES_AND_REMINDERS")

    # var_checker("data_list", data_list, True)
    if sid:
        SOCKETIO.emit(keyword, data_to_emit, to=sid, namespace="/monitoring")
    else:
        SOCKETIO.emit(keyword, data_to_emit, namespace="/monitoring")


def monitoring_background_task():
    generated_alerts = []

    while True:
        try:
            if not generated_alerts:
                generated_alerts = generate_alerts()
                set_data_to_memcache(name="GENERATED_ALERTS",
                                     data=generated_alerts)
                alerts_from_db = wrap_get_ongoing_extended_overdue_events()
                set_data_to_memcache(name="ALERTS_FROM_DB",
                                     data=alerts_from_db)
                candidate_alerts = candidate_alerts_generator.main(
                    generated_alerts_list=generated_alerts, db_alerts_dict=alerts_from_db)
                set_data_to_memcache(name="CANDIDATE_ALERTS",
                                     data=candidate_alerts)
                set_data_to_memcache(name="ISSUES_AND_REMINDERS",
                                     data=wrap_get_issue_reminder())

                emit_data("receive_generated_alerts")
                emit_data("receive_alerts_from_db")
                emit_data("receive_candidate_alerts")
                emit_data("receive_issues_and_reminders")

            elif datetime.now().minute % 5 == 1:
                print()
                system_time = datetime.strftime(
                    datetime.now(), "%Y-%m-%d %H:%M:%S")
                print(f"{system_time} | Websocket running...")

                try:
                    generated_alerts = generate_alerts()
                    set_data_to_memcache(
                        name="GENERATED_ALERTS", data=generated_alerts)
                    alerts_from_db = wrap_get_ongoing_extended_overdue_events()
                    set_data_to_memcache(
                        name="ALERTS_FROM_DB", data=alerts_from_db)
                    set_data_to_memcache(name="CANDIDATE_ALERTS",
                                         data=candidate_alerts_generator.main(
                                             generated_alerts_list=generated_alerts,
                                             db_alerts_dict=alerts_from_db)
                                         )
                    print(f"{system_time} | Done processing Candidate Alerts.")
                except Exception as err:
                    print(err)
                    raise

                emit_data("receive_generated_alerts")
                emit_data("receive_candidate_alerts")
                emit_data("receive_alerts_from_db")
        except Exception as err:
            print("")
            print("Monitoring Thread Exception")
            var_checker("Exception Detail", err, True)
            print(traceback.format_exc())
            DB.session.rollback()

        SOCKETIO.sleep(60)  # Every 60 seconds in production stage


@SOCKETIO.on('connect', namespace='/monitoring')
def connect():
    """
    Connection
    """
    sid = request.sid
    # CLIENTS.append(sid)
    clients = retrieve_data_from_memcache("CLIENTS")
    if isinstance(clients, str):
        clients = []
    clients.append(sid)
    set_data_to_memcache(name="CLIENTS", data=clients)
    print("Connected user: " + sid)
    print(f"Current connected clients: {clients}")

    emit_data("receive_generated_alerts", sid=sid)
    emit_data("receive_alerts_from_db", sid=sid)
    emit_data("receive_candidate_alerts", sid=sid)
    emit_data("receive_issues_and_reminders", sid=sid)


@SOCKETIO.on('disconnect', namespace='/monitoring')
def disconnect():
    print("In disconnect")
    # CLIENTS.remove(request.sid)
    clients = retrieve_data_from_memcache("CLIENTS")
    clients.remove(request.sid)
    set_data_to_memcache(name="CLIENTS", data=clients)


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

    # if not site_code:  # to be removed (for testing only)
    # site_code = ["agb", "umi"]
    generated_alerts_json = public_alert_generator.main(site_code=site_code)

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
    print(get_process_status_log("Update Alert Generation", "start"))
    try:
        generated_alerts = retrieve_data_from_memcache("GENERATED_ALERTS")
        site_gen_alert = generate_alerts(site_code)

        if site_code:
            load_site_gen_alert = json.loads(site_gen_alert)
            site_gen_alert = load_site_gen_alert.pop()

        # Find the current entry for the site provided
        json_generated_alerts = json.loads(generated_alerts)
        gen_alert_row = next(
            filter(lambda x: x["site_code"] == site_code, json_generated_alerts), None)

        if gen_alert_row:
            # Replace rather update alertgen entry
            gen_alert_index = json_generated_alerts.index(gen_alert_row)
            json_generated_alerts[gen_alert_index] = site_gen_alert

        set_data_to_memcache(name="GENERATED_ALERTS",
                             data=json.dumps(json_generated_alerts))
        set_data_to_memcache(name="ALERTS_FROM_DB",
                             data=wrap_get_ongoing_extended_overdue_events())
        set_data_to_memcache(name="CANDIDATE_ALERTS",
                             data=candidate_alerts_generator.main())
    except Exception as err:
        print(err)
        raise

    print(get_process_status_log("emitting updated alert gen data", "start"))
    emit_data("receive_generated_alerts")
    emit_data("receive_alerts_from_db")
    emit_data("receive_candidate_alerts")
    print(get_process_status_log("emitting updated alert gen data", "end"))

    print(get_process_status_log("update alert gen", "end"))


#####################################
# - - - API-RELATED FUNCTIONS - - - #
#####################################


def execute_write_monitoring_moms_to_db(moms_details):
    data = moms_details
    ret = wrap_write_monitoring_moms_to_db(data)
    json_ret = json.loads(ret)

    return json_ret


def execute_write_issues_reminders(issues_and_reminders_details):
    data = issues_and_reminders_details
    try:
        try:
            postings = data["postings"]
        except KeyError:
            postings = None

        result = write_issue_reminder_to_db(
            iar_id=data["iar_id"],
            detail=data["detail"],
            user_id=data["user_id"],
            ts_posted=data["ts_posted"],
            ts_expiration=data["ts_expiration"],
            resolved_by=data["resolved_by"],
            resolution=data["resolution"],
            ts_resolved=data["ts_resolved"],
            site_id_list=data["site_id_list"],
            is_event_entry=data["is_event_entry"],
            postings=postings
        )
        if result == "success":
            DB.session.commit()
        else:
            DB.session.rollback()
    except:
        DB.session.rollback()

    # Prepare process status log
    status_log = get_process_status_log("request_to_handle_iar", "end")

    return status_log


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

    # Insert ewi release
    status = insert_ewi(insert_details)

    # Prepare process status log
    status_log = get_process_status_log("insert_ewi", status)

    # Update the complete alert gen data
    # site_code = insert_details["site_code"].lower()
    # update_alert_gen(site_code=site_code)
    set_data_to_memcache(name="ALERTS_FROM_DB",
                         data=wrap_get_ongoing_extended_overdue_events())
    set_data_to_memcache(name="CANDIDATE_ALERTS",
                         data=candidate_alerts_generator.main())

    emit_data("receive_alerts_from_db")
    emit_data("receive_candidate_alerts")

    # return "status_log"
    return status_log


def execute_update_db_alert_ewi_sent_status(alert_db_group, site_id, ewi_group):
    """
    alert_db_group (str):    either "latest", "extended" or "overdue"
    ewi_group (str):        either "sms" or "bulletin"
    """

    alerts_from_db = retrieve_data_from_memcache("ALERTS_FROM_DB")
    json_alerts = json.loads(alerts_from_db)

    # TODO: supposed to be search kung existing sa latest, extended and overdue
    # if wala then don't update
    if alert_db_group:
        group = json_alerts[alert_db_group]
        alert = None
        index = None
        for i, row in enumerate(group):
            if row["event"]["site_id"] == site_id:
                alert = row
                index = i

        alert["sent_statuses"][f"is_{ewi_group}_sent"] = True
        group[index] = alert
        json_alerts[alert_db_group] = group

        set_data_to_memcache("ALERTS_FROM_DB", json.dumps(json_alerts))
        emit_data("receive_alerts_from_db")


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
        status = execute_insert_ewi(data)
        print(status)

    elif key == "validate_trigger":
        print(get_process_status_log("validate_trigger", "request"))
        status = execute_alert_status_validation(data)
        print(status)

    elif key == "write_issues_and_reminders":
        print(get_process_status_log("write_issue_reminder_to_db", "request"))
        var_checker("data", data, True)
        status = execute_write_issues_reminders(data)
        set_data_to_memcache("ISSUES_AND_REMINDERS", wrap_get_issue_reminder())
        emit_data("receive_issues_and_reminders")
        print(status)

    elif key == "write_monitoring_moms_to_db":
        print(get_process_status_log("write_monitoring_moms_to_db", "request"))
        status = execute_write_monitoring_moms_to_db(data)
        print(status)

    elif key == "update_monitoring_tables":
        print(get_process_status_log("update_monitoring_tables", "request"))
        # NOTE: UNFINISHED BUSINESS

    elif key == "run_alert_generation":
        print(get_process_status_log("run_alert_generation", "request"))

        site_code = None
        if data:
            site_code = data["site_code"]
        update_alert_gen(site_code=site_code)

    elif key == "update_db_alert_ewi_sent_status":
        print(get_process_status_log("update_db_alert_ewi_sent_status", "request"))
        execute_update_db_alert_ewi_sent_status(
            data["alert_db_group"],
            data["site_id"],
            data["ewi_group"])
    else:
        print("ERROR: Key provided not found.")
        raise Exception("WEBSOCKET MESSAGE: KEY NOT FOUND")
