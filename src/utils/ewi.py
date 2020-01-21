"""
"""

import re
import copy
from datetime import timedelta, datetime
from src.utils.monitoring import (
    get_monitoring_releases, check_if_onset_release,
    get_next_ground_data_reporting, get_next_ewi_release_ts,
    process_trigger_list)
from src.utils.sites import build_site_address
from src.utils.surficial import check_if_site_has_active_surficial_markers
from src.utils.extra import retrieve_data_from_memcache, format_timestamp_to_string

BULLETIN_RESPONSES = retrieve_data_from_memcache("bulletin_responses")

RELEASE_INTERVAL_HOURS = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")


def get_greeting(data_ts):
    hour = data_ts.hour
    greeting = ""

    if hour == 0:
        greeting = "gabi"
    elif hour < 11:
        greeting = "umaga"
    elif hour == 12:
        greeting = "tanghali"
    elif hour < 18:
        greeting = "hapon"
    else:
        greeting = "gabi"

    return greeting


def get_highest_trigger(trigger_list_str):
    triggers_arr = re.sub(r"0|x", "", trigger_list_str)

    triggers = []
    for letter in triggers_arr:
        int_symbol = retrieve_data_from_memcache(
            "internal_alert_symbols", {"alert_symbol": letter})

        trigger_symbol = int_symbol["trigger_symbol"]

        sym = {
            "alert_level": trigger_symbol["alert_level"],
            "alert_symbol": int_symbol["alert_symbol"],
            "hierarchy_id": trigger_symbol["trigger_hierarchy"]["hierarchy_id"],
            "internal_sym_id": int_symbol["internal_sym_id"]
        }

        triggers.append(sym)

    sorted_arr = sorted(triggers, key=lambda i: (
        i["hierarchy_id"], -i["alert_level"]))

    return sorted_arr[0]


def create_ewi_message(release_id=None):
    """
    Returns ewi message for event, routine monitoring.

    Arg:
        release_id (Int) - by not providing a release_id, you are basically asking for a template.
        In this case, routine ewi sms template.
    """
    greeting = get_greeting(datetime.now())
    address = "(site_location)"
    ts_str = datetime.strftime(datetime.now(), "%Y-%m-%d")
    alert_level = 0
    data_ts = datetime.now()
    monitoring_status = 2
    is_onset = False

    if release_id:
        release_id = int(release_id)
        release = get_monitoring_releases(
            release_id=release_id, load_options="ewi_sms_bulletin")
        data_ts = release.data_ts

        event_alert = release.event_alert
        pub_sym_id = event_alert.pub_sym_id
        event_alert_id = event_alert.event_alert_id
        alert_level = event_alert.public_alert_symbol.alert_level

        event = event_alert.event
        site = event.site
        validity = event.validity
        monitoring_status = event.status

        is_onset = check_if_onset_release(event_alert_id, release_id, data_ts)
        updated_data_ts = data_ts
        if not is_onset:
            updated_data_ts = data_ts + timedelta(minutes=30)

        greeting = get_greeting(updated_data_ts)
        address = build_site_address(site)
        ts_str = format_timestamp_to_string(updated_data_ts)

    # No ground measurement reminder if A3
    ground_reminder = ""
    if alert_level != 3:
        if release_id:
            has_active_markers = check_if_site_has_active_surficial_markers(
                site_id=site.site_id)
            g_data = "ground data" if has_active_markers else "ground observation"
        else:
            g_data = "ground data/ground observation"
        ground_reminder = f"Inaasahan namin ang pagpapadala ng LEWC ng {g_data} "

        is_alert_0 = alert_level == 0

        reporting_ts, modifier = get_next_ground_data_reporting(
            data_ts, is_onset, is_alert_0=is_alert_0, include_modifier=True)
        reporting_time = format_timestamp_to_string(
            reporting_ts, time_only=True)

        if alert_level in [1, 2]:
            ground_reminder += f"{modifier} bago mag-{reporting_time}. "
        else:
            clause = " para sa "
            reason = " susunod na routine monitoring"

            reporting_str = ""

            if release_id and monitoring_status == 2:  # if monitoring status is event
                reporting_date = format_timestamp_to_string(
                    reporting_ts, date_only=True)
                modifier = f"bukas, {reporting_date},"

                day = (updated_data_ts - validity).days

                if day == 0:
                    extended_day = "unang"
                elif day == 1:
                    extended_day = "ikalawang"
                elif day == 2:
                    extended_day = "huling"

                if day in [0, 1, 2]:
                    reason = f" {extended_day} araw ng 3-day extended monitoring"
                    reporting_str = f"{modifier} bago mag-{reporting_time}"

            ground_reminder += f"{reporting_str}{clause} {reason}."

    desc_and_response = ""
    next_ewi = ""
    if alert_level > 0:
        trigger_list_str = release.trigger_list
        trigger_list_str = process_trigger_list(
            trigger_list_str, include_ND=False)

        highest_trig = get_highest_trigger(trigger_list_str)
        ewi_trig = retrieve_data_from_memcache(
            "bulletin_triggers", {"internal_sym_id": highest_trig["internal_sym_id"]})
        trigger_desc = ewi_trig["sms"]

        res = [
            row for row in BULLETIN_RESPONSES if row["pub_sym_id"] == pub_sym_id].pop()
        ewi_response = copy.deepcopy(res)
        response = ewi_response["recommended"].upper()
        desc_and_response = f" {trigger_desc}. Ang recommended response ay {response}"

        next_ewi_release_ts = get_next_ewi_release_ts(data_ts, is_onset)
        next_ts = format_timestamp_to_string(
            next_ewi_release_ts, time_only=True)

        next_ewi += f"Ang susunod na early warning information ay mamayang {next_ts}."

    third_line = ""
    if ground_reminder != "" or next_ewi != "":
        third_line += f"{ground_reminder}{next_ewi}\n\n"

    ewi_message = (f"Magandang {greeting} po.\n\n"
                   f"Alert {alert_level} ang alert level sa {address} ngayong {ts_str}."
                   f"{desc_and_response}\n\n"
                   f"{third_line}Salamat.")

    return ewi_message


def create_ground_measurement_reminder(monitoring_type, ts):
    greeting = "umaga"
    hour = ts.hour

    if hour == 5:
        time = "07:30 AM"
    elif hour == 9:
        time = "11:30 AM"
    else:
        greeting = "hapon"
        time = "03:30 PM"

    message = f"Magandang {greeting}. Inaasahan ang pagpapadala ng LEWC ng ground data " + \
        f"bago mag-{time} para sa {monitoring_type} monitoring. Agad ipaalam kung may " + \
        "makikitang manipestasyon ng paggalaw ng lupa o iba pang pagbabago sa site. Salamat."

    return message
