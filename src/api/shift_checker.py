"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from src.utils.monitoring import (
    # GET functions
    get_monitoring_releases, build_internal_alert_level,
    get_release_publisher_names
)
from src.utils.extra import var_checker, round_to_nearest_release_time


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

        # NOTE: This function rejects all ROUTINE events
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
    pa_symbol = event_alert.public_alert_symbol
    public_alert_level = pa_symbol.alert_level
    public_alert_symbol = pa_symbol.alert_symbol
    internal_alert = build_internal_alert_level(
        public_alert_level, release.trigger_list)

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
        "data_ts": datetime.strftime(release.data_ts, "%Y-%m-%d %H:%M:%S"),
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


def group_by_shift(releases_list):
    """
    Function thats group events per shift.
    """
    final_data = []
    events_per_shift = {}
    for release in releases_list:
        ts = release.data_ts
        release_date = ts.strftime("%Y-%m-%d")
        publishers = get_release_publisher_names(release)
        is_am_pm = check_if_ampm(ts.hour)

        if is_am_pm == "PM":
            rounded_ts = round_to_nearest_release_time(ts)
            release_date = (rounded_ts - timedelta(days=1)
                            ).strftime("%Y-%m-%d")
        data_for_ui = prepare_data_for_ui(release)
        site_code = data_for_ui["site_code"]
        shift = f"{release_date}_{is_am_pm}"

        if shift not in events_per_shift:
            events_per_shift[shift] = [{
                "date": release_date,
                "ampm": is_am_pm,
                "data": [data_for_ui],
                "mt": publishers["mt"],
                "ct": publishers["ct"]
            }]
        else:
            data_list = events_per_shift[shift][0]["data"]

            if not list(filter(lambda data: data["site_code"] == site_code, data_list)):
                data_list.append(data_for_ui)

    for row in events_per_shift:
        final_data.append(events_per_shift[row][0])

    return final_data


@SHIFT_CHECKER_BLUEPRINT.route("/shift_checker/get_shift_data", methods=["POST"])
def wrap_get_shift_data():
    """
    Gets a single release with the specificied ID
    """
    json_input = request.get_json()
    print("JSON", json_input)

    if not json_input:
        return

    if "ts_start" in json_input and "ts_end" in json_input:
        user_id = None
        try:
            user_id = json_input["user_id"]
        except KeyError:
            pass

        ts_start = json_input["ts_start"]
        ts_end = json_input["ts_end"]

        releases_list = get_monitoring_releases(
            ts_start=ts_start, ts_end=ts_end,
            user_id=user_id, exclude_routine=True)
    else:
        var_checker("NO SHIFTS", "no shifts", True)
    
    releases_data = group_by_shift(releases_list)
    return jsonify(releases_data)
