"""
"""

import traceback
from datetime import datetime
from flask import request
from flask_socketio import join_room, leave_room
from connection import SOCKETIO, DB
from src.utils.extra import (
    set_data_to_memcache, retrieve_data_from_memcache,
    var_checker
)

from src.api.chatterbox import get_quick_inbox
from src.utils.chatterbox import (
    get_sms_user_updates,
    get_latest_messages,
    get_formatted_latest_mobile_id_message,
    get_formatted_unsent_messages,
    get_user_mobile_details,
    delete_sms_user_update,
    get_messages_schema_dict,
    insert_message_on_database,
    get_search_results
)
from src.utils.contacts import (
    get_all_contacts,
    get_recipients_option,
    get_ground_measurement_reminder_recipients,
    get_blocked_numbers
)
from src.utils.ewi import create_ground_measurement_reminder, get_ground_data_noun
from src.utils.general_data_tag import insert_data_tag
from src.utils.narratives import(
    write_narratives_to_db, find_narrative_event_id
)

from src.utils.monitoring import get_ongoing_extended_overdue_events, get_routine_sites
from src.utils.contacts import get_sites_with_ground_meas
from src.utils.manifestations_of_movements import get_moms_report


set_data_to_memcache(name="CLIENTS", data=[])
set_data_to_memcache(name="ROOM_MOBILED_IDS", data={})
set_data_to_memcache(name="CB_MESSAGES", data={
    "inbox": [],
    "unsent": []
})
set_data_to_memcache(name="CONTACTS_USERS", data=[])
set_data_to_memcache(name="CONTACTS_MOBILE", data=[])
set_data_to_memcache(name="BLOCKED_CONTACTS", data=[])


def emit_data(keyword):
    """
    """

    if keyword == "receive_latest_messages":
        data_to_emit = retrieve_data_from_memcache("CB_MESSAGES")

    SOCKETIO.emit(keyword, data_to_emit, namespace="/communications")


def communication_background_task():
    messages = retrieve_data_from_memcache("CB_MESSAGES")
    inbox_messages_arr = messages["inbox"]
    is_first_run = False
    ground_meas_run = False
    run_narrative = False

    while True:
        try:
            process_no_ground_data_narrative(run_narrative)
            is_first_run, ground_meas_run = process_ground_measurement_reminder(
                is_first_run, ground_meas_run)

            updates = get_sms_user_updates()
            updates_len = len(updates)
            update_process_start = datetime.now()

            for row in updates:
                query_start = datetime.now()

                mobile_id = row.mobile_id
                update_source = row.update_source

                is_blocked = check_if_blocked_contact(mobile_id)
                inbox_index = next((index for (index, row_arr) in enumerate(
                    inbox_messages_arr) if row_arr["mobile_details"]["mobile_id"] == mobile_id), -1)

                if update_source == "inbox" and not is_blocked:
                    msgs_schema = get_formatted_latest_mobile_id_message(
                        mobile_id)

                    if inbox_index > -1:
                        message_row = inbox_messages_arr[inbox_index]
                        del inbox_messages_arr[inbox_index]
                    else:
                        message_row = {
                            "mobile_details": get_user_mobile_details(mobile_id)
                        }
                    message_row["messages"] = msgs_schema
                    inbox_messages_arr.insert(0, message_row)

                    messages["inbox"] = inbox_messages_arr
                    set_data_to_memcache(name="CB_MESSAGES", data=messages)
                elif update_source == "outbox":
                    if inbox_index > -1 and not is_blocked:
                        msgs_schema = get_formatted_latest_mobile_id_message(
                            mobile_id)
                        messages["inbox"][inbox_index]["messages"] = msgs_schema

                    unsent_messages = get_formatted_unsent_messages()
                    messages["unsent"] = unsent_messages

                    update_mobile_id_room(mobile_id)

                    set_data_to_memcache(name="CB_MESSAGES", data=messages)
                elif update_source == "blocked_numbers":
                    if inbox_index > -1:
                        del messages["inbox"][inbox_index]
                        set_data_to_memcache(name="CB_MESSAGES", data=messages)

                    blocked_contacts = get_blocked_numbers()
                    set_data_to_memcache(
                        name="BLOCKED_CONTACTS", data=blocked_contacts)
                elif update_source == "inbox_tag" or update_source == "outbox_tag":
                    update_mobile_id_room(mobile_id)

                query_end = datetime.now()

                emit_data("receive_latest_messages")

                print("")
                print("GET MESSAGE ON MEMCACHE (WS)",
                      (query_end - query_start).total_seconds())
                print("")

            if updates:
                delete_sms_user_update(updates)

            update_process_end = datetime.now()

            if updates_len > 0:
                print("")
                print(f"COMMS UPDATE PROCESS LOOP (WS) {updates_len} updates",
                      (update_process_end - update_process_start).total_seconds())
                print("")
        except Exception as err:
            print("")
            print("Communication Thread Exception:",
                  datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            var_checker("Exception Detail", err, True)
            print(traceback.format_exc())
            DB.session.rollback()

        SOCKETIO.sleep(0.5)


def check_if_blocked_contact(mobile_id):
    blocked_contacts = retrieve_data_from_memcache("BLOCKED_CONTACTS")
    is_blocked = next(
        (row for row in blocked_contacts if row["mobile_number"]["mobile_id"] == mobile_id), False)

    return is_blocked


def update_mobile_id_room(mobile_id):
    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    if mobile_id in room_mobile_ids.keys():
        msgs = get_latest_messages(mobile_id)
        msgs_schema = get_messages_schema_dict(msgs)

        room_mobile_ids[mobile_id]["details"]["messages"] = msgs_schema

        SOCKETIO.emit("receive_mobile_id_room_update",
                      room_mobile_ids[mobile_id]["details"],
                      room=mobile_id, namespace="/communications")

        set_data_to_memcache(name="ROOM_MOBILE_IDS", data=room_mobile_ids)


@SOCKETIO.on("connect", namespace="/communications")
def connect():
    sid = request.sid
    clients = retrieve_data_from_memcache("CLIENTS")
    clients.append(sid)
    set_data_to_memcache(name="CONTACTS_USERS", data=clients)

    print("")
    print("Connected:", sid)
    print(f"Comms: {len(clients)}")
    print("")

    messages = retrieve_data_from_memcache("CB_MESSAGES")
    contacts_users = retrieve_data_from_memcache("CONTACTS_USERS")
    contacts_mobile = retrieve_data_from_memcache("CONTACTS_MOBILE")

    SOCKETIO.emit("receive_latest_messages", messages,
                  room=sid, namespace="/communications")
    SOCKETIO.emit("receive_all_contacts", contacts_users,
                  room=sid, namespace="/communications")
    SOCKETIO.emit("receive_all_mobile_numbers", contacts_mobile,
                  room=sid, namespace="/communications")


@SOCKETIO.on("disconnect", namespace="/communications")
def disconnect():
    sid = request.sid
    clients = retrieve_data_from_memcache("CLIENTS")
    clients.remove(sid)
    set_data_to_memcache(name="CONTACTS_USERS", data=clients)

    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    for row in room_mobile_ids.values():
        try:
            row["users"].remove(sid)
        except ValueError:
            pass
    set_data_to_memcache(name="ROOM_MOBILE_IDS", data=room_mobile_ids)

    print("")
    print("Disconencted:", sid)
    print(f"Comms: {len(clients)}")
    print("")


@SOCKETIO.on("get_latest_messages", namespace="/communications")
def wrap_get_latest_messages():
    sid = request.sid
    messages = retrieve_data_from_memcache("CB_MESSAGES")
    SOCKETIO.emit("receive_latest_messages", messages,
                  room=sid, namespace="/communications")


@SOCKETIO.on("join_mobile_id_room", namespace="/communications")
def join_mobile_id_room(mobile_id):
    """
        mobile_id (str):   variable is integer from origin but
                           converted to string on websocket
    """

    mobile_id = int(mobile_id)
    sid = request.sid

    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    room_users = []
    if mobile_id in room_mobile_ids.keys():
        room_users = room_mobile_ids[mobile_id]["users"]
        room_users.append(sid)
    else:
        mobile_details = get_user_mobile_details(mobile_id)

        msgs = get_latest_messages(mobile_id)
        msgs_schema = get_messages_schema_dict(msgs)

        message_row = {
            "mobile_details": mobile_details,
            "messages": msgs_schema
        }

        room_mobile_ids[mobile_id] = {
            "users": [sid],
            "details": message_row
        }

    set_data_to_memcache(name="ROOM_MOBILE_IDS", data=room_mobile_ids)
    join_room(mobile_id)

    SOCKETIO.emit("receive_mobile_id_room_update",
                  room_mobile_ids[mobile_id]["details"], room=sid, namespace="/communications")

    print(f"Entered Room {mobile_id}: {sid}")
    print(f"Open rooms: {room_mobile_ids.keys()}")


@SOCKETIO.on("leave_mobile_id_room", namespace="/communications")
def leave_mobile_id_room(mobile_id):
    """
        mobile_id (str):   variable is integer from origin but
                           converted to string on websocket
    """

    mobile_id = int(mobile_id)
    sid = request.sid

    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    if mobile_id in room_mobile_ids.keys():
        room_mobile_ids[mobile_id]["users"].remove(sid)

        if not room_mobile_ids[mobile_id]["users"]:
            del room_mobile_ids[mobile_id]

    set_data_to_memcache(name="ROOM_MOBILE_IDS", data=room_mobile_ids)
    leave_room(mobile_id)

    print(f"Left Room {mobile_id}: {sid}")
    print(f"Open rooms: {room_mobile_ids.keys()}")


@SOCKETIO.on("get_search_results", namespace="/communications")
def wrap_get_search_results(payload):
    print(f"Message received:", payload)
    sid = request.sid
    result = get_search_results(payload)

    SOCKETIO.emit("receive_search_results", result,
                  room=sid, namespace="/communications")


@SOCKETIO.on("send_message_to_db", namespace="/communications")
def send_message_to_db(payload):
    print(f"Message received:", payload)
    insert_message_on_database(payload)


@SOCKETIO.on("get_all_contacts", namespace="/communications")
def wrap_get_all_contacts():
    sid = request.sid
    contacts_users = retrieve_data_from_memcache("CONTACTS_USERS")
    SOCKETIO.emit("receive_all_contacts", contacts_users,
                  room=sid, namespace="/communications")


@SOCKETIO.on("update_all_contacts", namespace="/communications")
def wrap_update_all_contacts():
    contacts_users = get_contacts(orientation="users")
    set_data_to_memcache(name="CONTACTS_USERS", data="contacts_users")
    SOCKETIO.emit("receive_all_contacts", contacts_users,
                  namespace="/communications")


@SOCKETIO.on("get_all_mobile_numbers", namespace="/communications")
def wrap_get_all_mobile_numbers():
    sid = request.sid
    contacts_mobile = retrieve_data_from_memcache("CONTACTS_MOBILE")
    SOCKETIO.emit("receive_all_mobile_numbers", contacts_mobile,
                  room=sid, namespace="/communications")


def get_inbox():
    return get_quick_inbox(inbox_limit=50, limit_inbox_outbox=True)


def get_contacts(orientation):
    return get_all_contacts(return_schema=True, orientation=orientation)


def process_ground_measurement_reminder(is_first_run, ground_meas_run):
    ts_now = datetime.now()
    if ts_now.hour in [5, 9, 13] and ts_now.minute == 30:
        if not is_first_run:
            is_first_run = True
            ground_meas_run = True
    else:
        ground_meas_run = False
        is_first_run = False

    if ground_meas_run:
        ground_meas_run = False
        recipients_group = get_ground_measurement_reminder_recipients(ts_now)

        for row in recipients_group:
            recipients = row["recipients"]
            monitoring_type = row["type"]
            site_recipients_dict = {}

            if recipients:
                for recipient in recipients:
                    mobile_numbers = recipient["mobile_numbers"]
                    numbers_list = map(
                        lambda x: x["mobile_number"], mobile_numbers)
                    site_id = recipient["organizations"][0]["site"]["site_id"]
                    site_recipients_dict.setdefault(
                        site_id, []).extend(numbers_list)

                for site_id, site_recipients in site_recipients_dict.items():
                    message = create_ground_measurement_reminder(
                        site_id, monitoring_type, ts_now)

                    outbox_id = insert_message_on_database({
                        "sms_msg": message,
                        "recipient_list": site_recipients
                    })

                    ts = datetime.now()
                    default_user_id = 2

                    # Tag message
                    tag_details = {
                        "outbox_id": outbox_id,
                        "user_id": default_user_id,
                        "ts": ts
                    }

                    tag_id = 10  # NOTE: for refactoring, GroundMeasReminder id on sms_tags
                    insert_data_tag("smsoutbox_user_tags", tag_details, tag_id)

                    # Add narratives
                    narrative = f"Sent surficial ground data reminder for {monitoring_type} monitoring"
                    event_id = find_narrative_event_id(ts, site_id)
                    write_narratives_to_db(
                        site_id, ts, narrative, 1, default_user_id, event_id=event_id)

    return is_first_run, ground_meas_run


def process_no_ground_data_narrative(run_narrative):
    ts_now = datetime.now()
    hour = ts_now.hour
    minute = ts_now.minute

    is_routine = False
    routine_sites = []
    if hour in [7, 11, 13] and minute == 59:
        run_narrative = True
        if hour == 11 and minute == 59:
            routine_sites = get_routine_sites(
                timestamp=ts_now, only_site_code=False)
            if routine_sites:
                is_routine = True

    if run_narrative:
        run_narrative = False
        leo = get_ongoing_extended_overdue_events(ts_now)
        latest_events = leo["latest"]
        timestamp = ts_now.replace(minute=59)
        default_user_id = 2

        for row in latest_events:
            event = row["event"]
            site_id = event["site_id"]
            event_id = event["event_id"]
            alert_level = row["public_alert_symbol"]["alert_level"]

            if alert_level != 0:
                narrative, result = check_ground_data_and_prepare_narrative(
                    site_id, timestamp, 3, 59)

                if not result:
                    write_narratives_to_db(
                        site_id, timestamp, narrative, 1, default_user_id, event_id=event_id)

                if is_routine:
                    index = next(index for index, site in enumerate(routine_sites)
                                 if site.site_id == site_id)
                    del routine_sites[index]

        if is_routine:
            is_routine = False
            for site in routine_sites:
                site_id = site.site_id
                narrative, result = check_ground_data_and_prepare_narrative(
                    site_id, timestamp, 6, 59)

                if not result:
                    event_id = find_narrative_event_id(ts_now, site_id)
                    write_narratives_to_db(
                        site_id, timestamp, narrative, 1, default_user_id, event_id=event_id)


def check_ground_data_and_prepare_narrative(site_id, timestamp, hour, minute):
    ground_meas_noun = get_ground_data_noun(site_id=site_id)
    narrative = f"No {ground_meas_noun} received from community"

    if ground_meas_noun == "ground measurement":
        result = get_sites_with_ground_meas(timestamp,
                                            timedelta_hour=hour, minute=minute, site_id=site_id)
    else:
        result = get_moms_report(timestamp,
                                 timedelta_hour=hour, minute=hour, site_id=site_id)

    return narrative, result


def main():
    delete_sms_user_update()

    messages = get_inbox()
    contacts_users = get_contacts(orientation="users")
    contacts_mobile = get_recipients_option()
    blocked_contacts = get_blocked_numbers()

    set_data_to_memcache(name="CB_MESSAGES", data=messages)
    set_data_to_memcache(name="CONTACTS_USERS", data=contacts_users)
    set_data_to_memcache(name="CONTACTS_MOBILE", data=contacts_mobile)
    set_data_to_memcache(name="BLOCKED_CONTACTS", data=blocked_contacts)
