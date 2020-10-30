"""
"""

import traceback
from datetime import datetime, timedelta
from flask import request
from flask_socketio import join_room, leave_room
from connection import SOCKETIO, DB, CELERY
from src.utils.extra import (
    set_data_to_memcache, retrieve_data_from_memcache,
    var_checker, convert_ampm_to_noon_midnight
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
    get_search_results,
    get_ewi_acknowledgements_from_tags
)
from src.utils.contacts import (
    get_all_contacts,
    get_recipients_option,
    get_blocked_numbers,
    get_ground_data_reminder_recipients
)
from src.utils.ewi import create_ground_measurement_reminder
from src.utils.general_data_tag import insert_data_tag
from src.utils.narratives import(
    write_narratives_to_db, find_narrative_event_id,
    get_narratives
)
from src.utils.monitoring import get_ongoing_extended_overdue_events, get_routine_sites, compute_event_validity
from src.utils.analysis import check_ground_data_and_return_noun

set_data_to_memcache(name="COMMS_CLIENTS", data=[])
set_data_to_memcache(name="ROOM_MOBILE_IDS", data={})
set_data_to_memcache(name="CB_MESSAGES", data={
    "inbox": [],
    "unsent": []
})
set_data_to_memcache(name="CONTACTS_USERS", data=[])
set_data_to_memcache(name="CONTACTS_MOBILE", data=[])
set_data_to_memcache(name="BLOCKED_CONTACTS", data=[])


def emit_data(keyword, sid=None):
    """
    """

    if keyword == "receive_latest_messages":
        data_to_emit = retrieve_data_from_memcache("CB_MESSAGES")
    elif keyword == "receive_all_contacts":
        data_to_emit = retrieve_data_from_memcache("CONTACTS_USERS")
    elif keyword == "receive_all_mobile_numbers":
        data_to_emit = retrieve_data_from_memcache("CONTACTS_MOBILE")

    if sid:
        SOCKETIO.emit(keyword, data_to_emit, to=sid,
                      namespace="/communications")
    else:
        SOCKETIO.emit(keyword, data_to_emit, namespace="/communications")


@CELERY.task(name="communication_background_task", ignore_results=True)
def communication_background_task():
    """
    """

    print()
    system_time = datetime.strftime(
        datetime.now(), "%Y-%m-%d %H:%M:%S")
    print(f"{system_time} | Communication Background Task Running...")

    initialize_comms_data()

    messages = retrieve_data_from_memcache("CB_MESSAGES")
    inbox_messages_arr = messages["inbox"]

    while True:
        try:
            updates = get_sms_user_updates()
            updates_len = len(updates)
            update_process_start = datetime.now()
            to_update_unsent = False

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

                    update_mobile_id_room(mobile_id)
                    messages["inbox"] = inbox_messages_arr
                    set_data_to_memcache(name="CB_MESSAGES", data=messages)
                elif update_source == "outbox":
                    if inbox_index > -1 and not is_blocked:
                        msgs_schema = get_formatted_latest_mobile_id_message(
                            mobile_id)
                        messages["inbox"][inbox_index]["messages"] = msgs_schema

                    to_update_unsent = True
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
                elif update_source == "contacts":
                    if inbox_index > -1:
                        mobile_details = get_user_mobile_details(mobile_id)
                        messages["inbox"][inbox_index]["mobile_details"] = mobile_details
                        set_data_to_memcache(name="CB_MESSAGES", data=messages)

                        update_mobile_id_room(
                            mobile_id, update_contact=mobile_details)

                query_end = datetime.now()

                emit_data("receive_latest_messages")

                print("")
                print("GET MESSAGE ON MEMCACHE (WS)",
                      (query_end - query_start).total_seconds())
                print("")

            if updates:
                delete_sms_user_update(updates)

                if to_update_unsent:
                    unsent_messages = get_formatted_unsent_messages()
                    messages["unsent"] = unsent_messages
                    set_data_to_memcache(name="CB_MESSAGES", data=messages)
                    emit_data("receive_latest_messages")

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


def update_mobile_id_room(mobile_id, update_contact=False):
    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    if mobile_id in room_mobile_ids.keys():
        if update_contact:
            room_mobile_ids[mobile_id]["details"]["mobile_details"] = update_contact
        else:
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
    clients = retrieve_data_from_memcache("COMMS_CLIENTS")
    clients.append(sid)
    set_data_to_memcache(name="COMMS_CLIENTS", data=clients)

    ts = datetime.now()

    print("")
    print(str(ts), "Connected:", sid)
    print(f"Comms: {len(clients)}")
    print("")

    emit_data("receive_latest_messages", sid)
    emit_data("receive_all_contacts", sid)
    emit_data("receive_all_mobile_numbers", sid)


@SOCKETIO.on("disconnect", namespace="/communications")
def disconnect():
    sid = request.sid
    clients = retrieve_data_from_memcache("COMMS_CLIENTS")

    try:
        clients.remove(sid)
    except ValueError:
        print("Removed an unknown connection ID:", sid)

    set_data_to_memcache(name="COMMS_CLIENTS", data=clients)

    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    for mobile_id in room_mobile_ids.keys():
        leave_mobile_id_room(mobile_id, sid=sid)

    ts = datetime.now()

    print("")
    print(str(ts), "Disconected:", sid)
    print(f"Comms: {len(clients)}")
    print("")


@SOCKETIO.on("get_latest_messages", namespace="/communications")
def wrap_get_latest_messages():
    sid = request.sid
    emit_data("receive_latest_messages", sid)


@SOCKETIO.on("join_mobile_id_room", namespace="/communications")
def join_mobile_id_room(obj):
    """
        obj (object)

        Attributes:
        mobile_id (str):   variable is integer from origin but
                           converted to string on websocket
        search_filters (obj)
    """

    mobile_id = int(obj["mobile_id"])
    sid = request.sid

    ts_start = None
    ts_end = None
    search_filters = obj["search_filters"]
    if search_filters:
        ts_start = search_filters["ts_start"]
        ts_end = search_filters["ts_end"]

    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    room_users = []
    if mobile_id in room_mobile_ids.keys():
        room_users = room_mobile_ids[mobile_id]["users"]
        room_users.append(sid)
    else:
        mobile_details = get_user_mobile_details(mobile_id)

        msgs = get_latest_messages(
            mobile_id=mobile_id, ts_start=ts_start, ts_end=ts_end)
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
    print(f"Open rooms: {list(room_mobile_ids.keys())}")


@SOCKETIO.on("leave_mobile_id_room", namespace="/communications")
def leave_mobile_id_room(mobile_id, sid=None):
    """
        mobile_id (str):   variable is integer from origin but
                           converted to string on websocket
    """

    mobile_id = int(mobile_id)
    if not sid:
        sid = request.sid

    room_mobile_ids = retrieve_data_from_memcache("ROOM_MOBILE_IDS")
    if mobile_id in room_mobile_ids.keys():
        try:
            room_mobile_ids[mobile_id]["users"].remove(sid)
        except ValueError:
            pass

        if not room_mobile_ids[mobile_id]["users"]:
            del room_mobile_ids[mobile_id]

    set_data_to_memcache(name="ROOM_MOBILE_IDS", data=room_mobile_ids)
    leave_room(mobile_id)

    print(f"Left Room {mobile_id}: {sid}")
    print(f"Open rooms: {list(room_mobile_ids.keys())}")


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
    emit_data("receive_all_contacts", sid)


@SOCKETIO.on("update_all_contacts", namespace="/communications")
def wrap_update_all_contacts():
    contacts_users = get_contacts(orientation="users")
    contacts_mobile = get_recipients_option()
    set_data_to_memcache(name="CONTACTS_USERS", data=contacts_users)
    set_data_to_memcache(name="CONTACTS_MOBILE", data=contacts_mobile)
    emit_data("receive_all_contacts")
    emit_data("receive_all_mobile_numbers")


@SOCKETIO.on("get_all_mobile_numbers", namespace="/communications")
def wrap_get_all_mobile_numbers():
    sid = request.sid
    emit_data("receive_all_mobile_numbers", sid)


def get_inbox():
    return get_quick_inbox(inbox_limit=50, limit_inbox_outbox=True)


def get_contacts(orientation):
    return get_all_contacts(return_schema=True, orientation=orientation)


@CELERY.task(name="ground_data_reminder_bg_task", ignore_results=True)
def ground_data_reminder_bg_task():
    """
    """

    ts = datetime.now()
    process_ground_data(ts, routine_extended_hour=9, event_delta_hour=1,
                        routine_delta_hour=4, process_fn=process_ground_data_reminder_sending)


@CELERY.task(name="no_ground_data_narrative_bg_task", ignore_results=True)
def no_ground_data_narrative_bg_task():
    """
    """

    ts = datetime.now()
    process_ground_data(ts, routine_extended_hour=11, event_delta_hour=3,
                        routine_delta_hour=6, process_fn=process_no_ground_narrative_writing,
                        is_no_ground_fn=True)


def process_ground_data(ts, routine_extended_hour, event_delta_hour, routine_delta_hour, process_fn, is_no_ground_fn=False):
    release_interval_hours = retrieve_data_from_memcache(
        "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")

    events = get_ongoing_extended_overdue_events(ts)
    latest_events = events["latest"]

    is_routine_extended_processing = ts.hour == routine_extended_hour

    routine_sites = None
    if is_routine_extended_processing:
        routine_sites = get_routine_sites(
            timestamp=ts, only_site_code=False)

    for row in latest_events:
        event = row["event"]
        site_id = event["site_id"]
        event_id = event["event_id"]
        alert_level = row["public_alert_symbol"]["alert_level"]
        actual_validity = datetime.strptime(
            event["validity"], "%Y-%m-%d %H:%M:%S")

        last_data_ts = datetime.strptime(
            row["releases"][0]["data_ts"],
            "%Y-%m-%d %H:%M:%S"
        )
        diff = ts - last_data_ts
        hours = diff.seconds / 3600
        is_recent_release = hours < 1  # check if recent release

        is_within_eov_release = False
        if alert_level == 3:
            def check_if_within_end_of_validity_release(val):
                delta = val - ts
                hr_delta = delta.seconds / 3600
                return release_interval_hours > hr_delta

            validity_to_use = actual_validity
            if is_no_ground_fn and is_recent_release:
                    # always in desc order
                latest_trigger = row["latest_event_triggers"][0]
                last_trigger_ts = datetime.strptime(
                    latest_trigger["ts"], "%Y-%m-%d %H:%M:%S")
                computed_validity = compute_event_validity(
                    last_trigger_ts, alert_level)

                if actual_validity > computed_validity:
                    val_to_use = actual_validity
                else:
                    val_to_use = computed_validity

                validity_to_use = val_to_use - \
                    timedelta(hours=release_interval_hours)

            is_within_eov_release = check_if_within_end_of_validity_release(
                validity_to_use)

        if alert_level != 0:
            if alert_level < 3 or (alert_level == 3 and is_within_eov_release):
                process_fn(
                    ts, site_id, event_delta_hour, event_id, "event")
        elif is_no_ground_fn:  # runs only if is_no_ground_fn and alert_level is 0
            if is_recent_release:
                process_fn(
                    ts, site_id, event_delta_hour, event_id, "event")

        if routine_sites:
            index = next(index for index, site in enumerate(routine_sites)
                         if site.site_id == site_id)
            del routine_sites[index]

    processed_sites = []
    if is_routine_extended_processing:
        extended_events = events["extended"]
        merged = extended_events + routine_sites

        for row in merged:
            try:
                site_id = row.site_id
                event_id = None
                monitoring_type = "routine"
            except AttributeError:
                ev = row["event"]
                site_id = ev["site_id"]
                event_id = ev["event_id"]
                monitoring_type = "extended"

            if site_id not in processed_sites:
                process_fn(
                    ts, site_id, routine_delta_hour, event_id, monitoring_type)
                processed_sites.append(site_id)


def process_ground_data_reminder_sending(ts, site_id, timedelta_hour, event_id, monitoring_type):
    """
    """

    # NOTE: UMI special case
    if site_id == 50:
        return

    ground_data_noun, result = check_ground_data_and_return_noun(
        site_id, ts, timedelta_hour, 30)

    if not result:
        if not event_id:
            event_id = find_narrative_event_id(ts, site_id)

        recipients = get_ground_data_reminder_recipients(site_id)
        site_recipients = []
        for recipient in recipients:
            mobile_numbers = recipient["mobile_numbers"]
            numbers_list = map(
                lambda x: x["mobile_number"], mobile_numbers)
            site_recipients.extend(numbers_list)

        message = create_ground_measurement_reminder(
            site_id, monitoring_type, ts, ground_data_noun=ground_data_noun)

        if site_recipients:
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
            write_narratives_to_db(
                site_id, ts, narrative, 1, default_user_id, event_id=event_id)


def process_no_ground_narrative_writing(ts, site_id, timedelta_hour, event_id, monitoring_type=None):
    """
    """

    default_user_id = 2  # Dynaslope User

    ground_data_noun, result = check_ground_data_and_return_noun(
        site_id, ts, timedelta_hour, 59)
    narrative = f"No {ground_data_noun} received from stakeholders"

    if not result:
        if not event_id:
            event_id = find_narrative_event_id(ts, site_id)

        ts = ts.replace(minute=30)
        write_narratives_to_db(
            site_id, ts, narrative, 1, default_user_id, event_id=event_id)


@CELERY.task(name="no_ewi_acknowledgement_bg_task", ignore_results=True)
def no_ewi_acknowledgement_bg_task():
    """
    """

    ts = datetime.now()

    events = get_ongoing_extended_overdue_events(ts)
    latest = events["latest"]
    overdue = events["overdue"]

    active_events = latest + overdue

    is_routine_extended_processing = ts.hour == 23

    routine_sites = None
    if is_routine_extended_processing:
        routine_sites = get_routine_sites(
            timestamp=ts, only_site_code=False)

    ts_start = ts - timedelta(hours=3, minutes=59)
    for row in active_events:
        event = row["event"]
        site_id = event["site_id"]
        event_id = event["event_id"]

        process_no_ewi_acknowledgements(
            site_id, ts_start, ts, event_id, monitoring_type="event", row=row)

        if routine_sites:
            index = next(index for index, site in enumerate(routine_sites)
                         if site.site_id == site_id)
            del routine_sites[index]

    processed_sites = []
    if is_routine_extended_processing:
        extended_events = events["extended"]
        merged = extended_events + routine_sites

        ts_start = ts.replace(hour=12, minute=0, second=0)
        for row in merged:
            try:
                site_id = row.site_id
                event_id = None
                monitoring_type = "routine"
            except AttributeError:
                ev = row["event"]
                site_id = ev["site_id"]
                event_id = ev["event_id"]
                monitoring_type = "extended"

            if site_id not in processed_sites:
                process_no_ewi_acknowledgements(
                    site_id, ts_start, ts, event_id, monitoring_type)

                processed_sites.append(site_id)


def process_no_ewi_acknowledgements(site_id, ts_start, ts, event_id, monitoring_type, row=None):
    """
    """

    default_user_id = 2  # Dynaslope User
    release_hr = ts_start

    # when changing this, mirror change on React
    call_ack_hashtag = "#EWIResponseCall"

    if monitoring_type == "event":
        alert_level = row["public_alert_symbol"]["alert_level"]
        first_data_ts = datetime.strptime(
            row["releases"][-1]["data_ts"],
            "%Y-%m-%d %H:%M:%S"
        )

        # use first release data_ts if onset
        if alert_level != 0 and ts_start < first_data_ts and first_data_ts < ts:
            release_hr = first_data_ts
        # don't continue if it's A0 (lowered today) and
        # past the actual runtime (more than 4 hours from last release)
        elif alert_level == 0 and \
            datetime.strptime(row["prescribed_release_time"],
                              "%Y-%m-%d %H:%M:%S"
                              ) < ts_start.replace(second=0, microsecond=0):
            return

    sms_acks = get_ewi_acknowledgements_from_tags(site_id, ts_start, ts)
    call_acks = get_narratives(start=ts_start, end=ts,
                               site_ids=[site_id],
                               raise_site=True, search=call_ack_hashtag)

    if not sms_acks and not call_acks:
        release_hour = convert_ampm_to_noon_midnight(release_hr)
        narrative = (f"No acknowledgement received from stakeholders "
                     f"for {release_hour} {monitoring_type} EWI")
        ts = ts.replace(minute=30)
        write_narratives_to_db(
            site_id, ts, narrative, 1, default_user_id, event_id=event_id)


@CELERY.task(name="initialize_comms_data", ignore_results=True)
def initialize_comms_data():
    """
    """

    delete_sms_user_update()

    messages = get_inbox()
    contacts_users = get_contacts(orientation="users")
    contacts_mobile = get_recipients_option()
    blocked_contacts = get_blocked_numbers()

    set_data_to_memcache(name="CB_MESSAGES", data=messages)
    set_data_to_memcache(name="CONTACTS_USERS", data=contacts_users)
    set_data_to_memcache(name="CONTACTS_MOBILE", data=contacts_mobile)
    set_data_to_memcache(name="BLOCKED_CONTACTS", data=blocked_contacts)

    emit_data("receive_latest_messages")
    emit_data("receive_all_contacts")
    emit_data("receive_all_mobile_numbers")
