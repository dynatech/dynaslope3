"""
"""

import traceback
from datetime import datetime
from flask import request
from flask_socketio import join_room, leave_room
from connection import SOCKETIO, DB
from src.utils.extra import var_checker
from config import APP_CONFIG

from src.api.chatterbox import get_quick_inbox
from src.utils.chatterbox import (
    get_sms_user_updates,
    get_latest_messages,
    get_unsent_messages,
    get_user_mobile_details,
    delete_sms_user_update,
    get_messages_schema_dict,
    format_unsent_messages,
    insert_message_on_database,
    get_search_results
)
from src.utils.contacts import (
    get_all_contacts,
    get_recipients_option,
    get_ground_measurement_reminder_recipients
)
from src.utils.ewi import create_ground_measurement_reminder
from src.utils.general_data_tag import insert_data_tag
from src.utils.narratives import write_narratives_to_db, find_narrative_event_id

CLIENTS = []
MESSAGES = {
    "inbox": [],
    "unsent": []
}
ROOM_MOBILE_IDS = {}
CONTACTS_USERS = []
CONTACTS_MOBILE = []


def emit_data(keyword):
    global MESSAGES

    data_list = {
        "receive_latest_messages": MESSAGES
    }

    SOCKETIO.emit(keyword, data_list[keyword], namespace="/communications")


def communication_background_task():
    global MESSAGES
    global ROOM_MOBILE_IDS
    inbox_messages_arr = MESSAGES["inbox"]
    is_first_run = False
    ground_meas_run = False

    while True:
        try:
            is_first_run, ground_meas_run = process_ground_measurement_reminder(
                is_first_run, ground_meas_run)

            updates = get_sms_user_updates()
            update_process_start = datetime.now()

            for row in updates:
                query_start = datetime.now()

                mobile_id = row.mobile_id
                update_source = row.update_source

                inbox_index = next((index for (index, row_arr) in enumerate(
                    inbox_messages_arr) if row_arr["mobile_details"]["mobile_id"] == mobile_id), -1)

                if update_source == "inbox":
                    msgs = get_latest_messages(mobile_id)
                    msgs_schema = get_messages_schema_dict(msgs)

                    if inbox_index > -1:
                        message_row = inbox_messages_arr[inbox_index]
                        del inbox_messages_arr[inbox_index]
                    else:
                        message_row = {
                            "mobile_details": get_user_mobile_details(mobile_id)
                        }
                    message_row["messages"] = msgs_schema
                    inbox_messages_arr.insert(0, message_row)

                    MESSAGES["inbox"] = inbox_messages_arr
                elif update_source == "outbox":
                    if inbox_index > -1:
                        msgs = get_latest_messages(mobile_id)
                        msgs_schema = get_messages_schema_dict(msgs)

                        MESSAGES["inbox"][inbox_index]["messages"] = msgs_schema

                    unsent_messages_arr = get_unsent_messages(duration=1)
                    unsent_messages = format_unsent_messages(
                        unsent_messages_arr)

                    MESSAGES["unsent"] = unsent_messages

                    # CHECK FOR UPDATES IN MOBILE ID ROOM
                    if mobile_id in ROOM_MOBILE_IDS.keys():
                        if inbox_index > -1:
                            msgs_schema = MESSAGES["inbox"][inbox_index]["messages"]
                        else:
                            msgs = get_latest_messages(mobile_id)
                            msgs_schema = get_messages_schema_dict(msgs)

                        ROOM_MOBILE_IDS[mobile_id]["details"]["messages"] = msgs_schema

                        SOCKETIO.emit("receive_mobile_id_room_update",
                                      ROOM_MOBILE_IDS[mobile_id]["details"],
                                      room=mobile_id, namespace="/communications")
                elif update_source == "blocked_numbers":
                    if inbox_index > -1:
                        del MESSAGES["inbox"][inbox_index]
                elif update_source == "inbox_tag":
                    if inbox_index > -1:
                        msgs = get_latest_messages(mobile_id)
                        msgs_schema = get_messages_schema_dict(msgs)
                        inbox_messages_arr[inbox_index]["messages"] = msgs_schema

                query_end = datetime.now()

                delete_sms_user_update(row)

                emit_data("receive_latest_messages")

                print("")
                print("GET MESSAGE ON MEMCACHE (WS)",
                      (query_end - query_start).total_seconds())
                print("")

            update_process_end = datetime.now()

            if updates:
                print("")
                print(f"COMMS UPDATE PROCESS LOOP (WS) {len(updates)} updates",
                      (update_process_end - update_process_start).total_seconds())
                print("")
        except Exception as err:
            print("")
            print("Communication Thread Exception")
            var_checker("Exception Detail", err, True)
            print(traceback.format_exc())
            DB.session.rollback()
            pass

        SOCKETIO.sleep(0.5)


@SOCKETIO.on("connect", namespace="/communications")
def connect():
    sid = request.sid
    CLIENTS.append(sid)
    print("Connected user: " + sid)
    print(f"Current connected clients: {CLIENTS}")

    SOCKETIO.emit("receive_latest_messages", MESSAGES,
                  room=sid, namespace="/communications")
    SOCKETIO.emit("receive_all_contacts", CONTACTS_USERS,
                  room=sid, namespace="/communications")
    SOCKETIO.emit("receive_all_mobile_numbers", CONTACTS_MOBILE,
                  room=sid, namespace="/communications")


@SOCKETIO.on("disconnect", namespace="/communications")
def disconnect():
    sid = request.sid
    print("In disconnect")
    CLIENTS.remove(sid)

    global ROOM_MOBILE_IDS
    for row in ROOM_MOBILE_IDS.values():
        try:
            row["users"].remove(sid)
        except ValueError:
            pass


@SOCKETIO.on("get_latest_messages", namespace="/communications")
def wrap_get_latest_messages():
    sid = request.sid
    SOCKETIO.emit("receive_latest_messages", MESSAGES,
                  room=sid, namespace="/communications")


@SOCKETIO.on("join_mobile_id_room", namespace="/communications")
def join_mobile_id_room(mobile_id):
    """
        mobile_id (str):   variable is integer from origin but
                           converted to string on websocket
    """

    mobile_id = int(mobile_id)
    sid = request.sid

    global ROOM_MOBILE_IDS
    room_mobile_ids = ROOM_MOBILE_IDS
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

    ROOM_MOBILE_IDS = room_mobile_ids

    join_room(mobile_id)

    SOCKETIO.emit("receive_mobile_id_room_update",
                  room_mobile_ids[mobile_id]["details"], room=sid, namespace="/communications")

    print(f"=====> {sid} JOINED ROOM", mobile_id)
    print(f"=====> Available rooms", room_mobile_ids.keys())


@SOCKETIO.on("leave_mobile_id_room", namespace="/communications")
def leave_mobile_id_room(mobile_id):
    """
        mobile_id (str):   variable is integer from origin but
                           converted to string on websocket
    """

    mobile_id = int(mobile_id)
    sid = request.sid

    global ROOM_MOBILE_IDS
    room_mobile_ids = ROOM_MOBILE_IDS
    room_mobile_ids[mobile_id]["users"].remove(sid)

    if len(room_mobile_ids[mobile_id]["users"]) == 0:
        del room_mobile_ids[mobile_id]

    ROOM_MOBILE_IDS = room_mobile_ids

    leave_room(mobile_id)

    print(f"=====> {sid} LEFT ROOM", mobile_id)
    print(f"=====> Available rooms", room_mobile_ids.keys())


@SOCKETIO.on("get_search_results", namespace="/communications")
def wrap_get_search_results(payload):
    print(f"====> Message received", payload)
    sid = request.sid
    result = get_search_results(payload)

    SOCKETIO.emit("receive_search_results", result,
                  room=sid, namespace="/communications")


@SOCKETIO.on("send_message_to_db", namespace="/communications")
def send_message_to_db(payload):
    print(f"====> Message received", payload)
    insert_message_on_database(payload)


@SOCKETIO.on("get_all_contacts", namespace="/communications")
def wrap_get_all_contacts():
    sid = request.sid
    SOCKETIO.emit("receive_all_contacts", CONTACTS_USERS,
                  room=sid, namespace="/communications")


@SOCKETIO.on("update_all_contacts", namespace="/communications")
def wrap_update_all_contacts():
    sid = request.sid
    global CONTACTS_USERS
    CONTACTS_USERS = get_contacts(orientation="users")
    SOCKETIO.emit("receive_all_contacts", CONTACTS_USERS,
                  room=sid, namespace="/communications")


@SOCKETIO.on("get_all_mobile_numbers", namespace="/communications")
def wrap_get_all_mobile_numbers():
    sid = request.sid
    SOCKETIO.emit("receive_all_mobile_numbers", CONTACTS_MOBILE,
                  room=sid, namespace="/communications")


def get_inbox():
    return get_quick_inbox(inbox_limit=50, messages_per_convo=20)


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
            site_ids = row["site_ids"]

            if recipients:
                message = create_ground_measurement_reminder(monitoring_type, ts_now)
                recipient_list = []
                for recipient in recipients:
                    mobile_numbers = recipient["mobile_numbers"]
                    recipient_list = recipient_list + mobile_numbers

                outbox_id = insert_message_on_database({
                    "sms_msg": message,
                    "recipient_list": recipient_list
                })

                ts = datetime.now()
                default_user_id = 2

                # Tag message
                tag_details = {
                    "outbox_id": outbox_id,
                    "user_id": default_user_id,
                    "ts": ts
                }

                tag_id = 125 # NOTE: for refactoring, GroundMeasReminder number on sms_user_tags
                insert_data_tag("smsoutbox_user_tags", tag_details, tag_id)

                # Add narratives
                narrative = f"Sent surficial ground data reminder for {monitoring_type} monitoring"
                for site_id in site_ids:
                    event_id = find_narrative_event_id(ts, site_id)
                    write_narratives_to_db(
                        site_id, ts, narrative, 1, default_user_id, event_id=event_id)

    return is_first_run, ground_meas_run


def main():
    global MESSAGES
    global CONTACTS_USERS
    global CONTACTS_MOBILE
    MESSAGES = get_inbox()
    CONTACTS_USERS = get_contacts(orientation="users")
    CONTACTS_MOBILE = get_recipients_option()
