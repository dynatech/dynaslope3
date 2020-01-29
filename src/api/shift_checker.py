"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
import time
from datetime import datetime, timedelta, time
from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from sqlalchemy import and_
from src.models.monitoring import (MonitoringReleasesSchema)
from src.utils.monitoring import (
    # GET functions
    get_monitoring_releases, build_internal_alert_level,
    get_release_publisher_names
)
from src.api.end_of_shift import (get_eos_data_analysis)
from src.utils.extra import (
    var_checker, retrieve_data_from_memcache,
    get_process_status_log, get_system_time
)

SHIFT_CHECKER_BLUEPRINT = Blueprint("shift_checker_blueprint", __name__)


def extract_unique_release_events(releases_list):
    """
    Remove duplicates per unique event. Assuming there was
    an order_by data_ts desc in utils, only latest
    releases per event was attached.
    """
    unique_release_events = []
    unique_set = set({})
    for release in releases_list:
        event = release.event_alert.event

        #NOTE: This function rejects all ROUTINE events
        if event.status != 2:
            continue

        event_id = event.event_id

        # if not (tuple_entry in unique_set):
        if not (event_id in unique_set):
            unique_set.add(event_id)
            unique_release_events.append({
                "site_code": event.site.site_code,
                "temp": release
            })

    return unique_release_events


def prepare_data_for_ui(release):
    """
    """
    event_alert = release.event_alert
    event = event_alert.event
    public_alert_level = event_alert.public_alert_symbol.alert_level
    public_alert_symbol = event_alert.public_alert_symbol.alert_symbol
    internal_alert = build_internal_alert_level(public_alert_level, release.trigger_list)

    end_val_data_ts = event.validity - timedelta(minutes=30)
    if end_val_data_ts < release.data_ts:
        general_status = "extended"
    elif end_val_data_ts == release.data_ts and public_alert_level == 0:
        general_status = "lowering"
    else:
        general_status = "on-going"

    return {
        "general_status": general_status,
        "site_code": event.site.site_code,
        "public_alert_level": public_alert_level,
        "public_alert_symbol": public_alert_symbol,
        "internal_alert": internal_alert,
        "event_id": event.event_id,
        "release_id": release.release_id,
        "release_time": f"{release.release_time.hour}:{release.release_time.minute}",
        "data_ts":  datetime.strftime(release.data_ts, "%Y-%m-%d %H:%M:%S"),
        "comments": release.comments
    }


def check_if_ampm(hour):
    """
    WARNING: STATIC VALUES
    """
    is_am_pm = ""
    if 8 <= hour and hour <= 19:
        is_am_pm = "AM"
    elif (20 <= hour and hour <= 23) or (0 <= hour and hour <= 7):
    # else:
        is_am_pm = "PM"

    return is_am_pm


def group_by_date(releases_list):
    """
    REFACTOR
    """
    unique_release_dates = []

    unique_set = {}
    un_ea_list = []
    index = -1
    for release in releases_list:
        ts = release.data_ts
        release_date = f"{ts.year}-{ts.month}-{ts.day}"
        prev_date_entry = f"{ts.year}-{ts.month}-{ts.day + 1}"
        ea_id = release.event_alert_id
        publishers = get_release_publisher_names(release)
        is_am_pm = check_if_ampm(ts.hour)

        data_for_ui = prepare_data_for_ui(release)
        if release_date not in unique_set:
            # Create an index as reference where the release was
            # placed on the array.
            if prev_date_entry not in unique_set and un_ea_list not in un_ea_list:
                index += 1
                unique_set[release_date] = index

                if is_am_pm == "PM":
                    release_date = f"{ts.year}-{ts.month}-{ts.day - 1}"

                unique_release_dates.append({
                    "date": release_date,
                    "ampm": is_am_pm,
                    "data": [data_for_ui],
                    "mt": publishers["mt"],
                    "ct": publishers["ct"]
                })
                un_ea_list.append(ea_id)
        else:
            date_index = unique_set[release_date]

            # The following three lines of code up to the if statement
            # makes the script return only the latest releases with the
            # assumption that the utils already sorted the releases
            # by release_time
            data_list = unique_release_dates[date_index]["data"]
            site_code = data_for_ui["site_code"]
            if not list(filter(lambda data: data["site_code"] == site_code, data_list)):
                data_list.append(data_for_ui)

    return unique_release_dates


def group_by_alert(releases_list):
    """
    REFACTOR
    """
    unique_release_alerts = []
    unique_set = {}
    index = -1
    for release in releases_list:
        event_alert = release.event_alert
        publishers = get_release_publisher_names(release)
        public_alert_level = event_alert.public_alert_symbol.alert_level
        public_alert_symbol = event_alert.public_alert_symbol.alert_symbol
        ts = release.data_ts
        is_am_pm = check_if_ampm(ts.hour)

        data_for_ui = prepare_data_for_ui(release)
        if public_alert_level not in unique_set:
            index += 1
            unique_set[public_alert_level] = index

            unique_release_alerts.append({
                "public_alert_symbol": public_alert_symbol,
                "public_alert_level": public_alert_level,
                "ampm": is_am_pm,
                "data": [data_for_ui],
                "mt": publishers["mt"],
                "ct": publishers["ct"]
            })
        else:
            date_index = unique_set[public_alert_level]

            # The following three lines of code up to the if statement
            # makes the script return only the latest releases with the
            # assumption that the utils already sorted the releases
            # by release_time
            data_list = unique_release_alerts[date_index]["data"]
            site_code = data_for_ui["site_code"]
            if not list(filter(lambda data: data["site_code"] == site_code, data_list)):
                data_list.append(data_for_ui)

    return unique_release_alerts


@SHIFT_CHECKER_BLUEPRINT.route("/shift_checker/get_shift_data", methods=["POST"])
def wrap_get_shift_data():
    """
    Gets a single release with the specificied ID
    """
    json_input = request.get_json()

    if not json_input:
        return
    # Search releases by
    if "ts_start" in json_input and "ts_end" in json_input:
        user_id = None
        try:
            user_id = json_input["user_id"]
        except KeyError:
            pass

        ts_start = json_input["ts_start"]
        ts_end = json_input["ts_end"]

        releases_list = get_monitoring_releases(ts_start=ts_start, ts_end=ts_end, user_id=user_id, exclude_routine=True)
    else:
        var_checker("NO SHIFTS", "no shifts", True)

    if "user_id" in json_input:
        releases_data = group_by_date(releases_list)
    else:
        releases_data = group_by_alert(releases_list)

    return jsonify(releases_data)
