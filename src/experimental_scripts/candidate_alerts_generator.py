"""
Candidate Alerts Generator (Py3) version 0.2
======
For use of Dynaslope Early Warning System
The main focus of Candidate Alerts Generator is to suggest
Alerts to be released to a release time especially when
it is due.
It works by checking the current status of a site from the DB
and comparing is to generated_alerts.json
1. Check if new_event, raising, lowering, rerelease
2. Fixes internal alert string
3. Extended Release
4. Routine Release

May 2019
"""

# from run import APP
import os
import json
from datetime import datetime, timedelta, time
import re
import requests
from config import APP_CONFIG

from src.models.monitoring import (
    OperationalTriggerSymbols as ots)
from src.utils.monitoring import get_routine_sites, build_internal_alert_level
from src.utils.extra import var_checker, create_symbols_map, get_trigger_hierarchy


##########################
# Utility functions here #
##########################

def generate_ias_x_ots_map():
    """

    """
    cross_map = {}
    trigger_symbols_list = ots.query.all()

    for item in trigger_symbols_list:
        cross_map[item.alert_symbol] = {
            "alert_level": item.alert_level,
            "internal_symbol": item.internal_alert_symbol.alert_symbol,
            "internal_alert_id": item.internal_alert_symbol.internal_sym_id
        }

    return cross_map


def get_generated_alerts_list_from_file(filepath, filename):
    """
    Reads the file generated by PublicAlertGenerator
    Returns a list
    """
    gen_alert_data = []
    full_filepath = filepath + filename
    print(f"Getting data from {full_filepath}")
    print()

    with open(full_filepath) as json_file:
        gen_alert_data = json.load(json_file)

    return gen_alert_data


###################
# Data processors #
###################


def check_if_extended(validity, data_ts, data_time, is_extended_entry):
    is_extended_entry = validity < data_ts and data_ts < (
        validity + timedelta(days=3))
    is_extended_release = datetime.strptime(
        "11:00:00", "%H:%M:%S") < \
        data_time < \
        datetime.strptime("13:00:00", "%H:%M:%S")
    return is_extended_entry, is_extended_release


def format_alerts_for_ewi_insert(alert_entry, general_status):
    """
    Release time will come from user entry form to be added
    to release_details
    Publisher details will come from user entry form
    """
    site_id = alert_entry["site_id"]
    site_code = alert_entry["site_code"]
    alert_level = alert_entry["alert_level"]
    data_ts = alert_entry["ts"]
    trigger_list_str = alert_entry["trigger_list_str"]

    site_details = {
        "site_id": site_id,
        "site_code": site_code
    }

    if general_status == "routine":
        site_details = {"routine_sites_ids": []}

    formatted_alerts_for_ewi = {
        **site_details,
        "internal_alert_level": build_internal_alert_level(None, trigger_list_str, alert_level),
        "public_alert_level": alert_level,
        "public_alert_symbol": PAS_MAP[("alert_symbol", alert_level)],
        "release_details": {
            "data_ts": data_ts,
            "trigger_list_str": trigger_list_str
        },
        "general_status": general_status
    }

    if general_status not in ["routine"]:
        triggers = alert_entry["event_triggers"]
        trigger_list_arr = []

        for trigger in triggers:

            trig_dict = {
                **trigger,
                "trigger_alert_level": trigger["alert"]  # For UI purposes
            }

            trigger_list_arr.append(trig_dict)

        formatted_alerts_for_ewi["trigger_list_arr"] = trigger_list_arr

    return formatted_alerts_for_ewi


def fix_internal_alert(alert_entry, internal_source_id):
    """
    Changes the internal alert string of each alert entry.
    """
    event_triggers = alert_entry["event_triggers"]
    internal_alert = alert_entry["internal_alert"]
    valid_alert_levels = []
    invalid_triggers = []
    trigger_list_str = None

    for trigger in event_triggers:
        alert_symbol = trigger["alert"]
        trigger["internal_sym_id"] = IAS_X_OTS_MAP[alert_symbol]["internal_alert_id"]
        source_id = trigger["source_id"]
        alert_level = trigger["alert_level"]
        internal_alert_symbol = IAS_MAP[(alert_level, source_id)]

        try:
            if trigger["invalid"]:
                invalid_triggers.append(trigger)
                internal_alert_symbol = IAS_MAP[(alert_level, source_id)]
                internal_alert = re.sub(
                    "%s(0/x)?" % internal_alert_symbol, "", internal_alert)

        except KeyError:  # If valid, trigger should have no "invalid" key
            valid_a_l = IAS_X_OTS_MAP[alert_symbol]["alert_level"]
            valid_alert_levels.append(valid_a_l)

    highest_valid_public_alert = 0
    if valid_alert_levels:
        # Get the maximum valid alert level
        highest_valid_public_alert = max(valid_alert_levels)

        validity_status = "valid"
        if invalid_triggers:  # If there are invalid triggers, yet there are valid triggers.
            validity_status = "partially_invalid"
    else:
        validity_status = "invalid"

    public_alert_sym = internal_alert.split("-")[0]
    nd_internal_alert_sym = IAS_MAP[(-1, internal_source_id)]
    if public_alert_sym == nd_internal_alert_sym:
        trigger_list_str = nd_internal_alert_sym
    elif (highest_valid_public_alert != 0):
        trigger_list_str = PAS_MAP[(
            "alert_symbol", highest_valid_public_alert)]

    try:
        trigger_list_str += "-" + internal_alert.split("-")[1]
    except:
        pass

    return highest_valid_public_alert, trigger_list_str, validity_status


def process_candidate_alerts(with_alerts, without_alerts, db_alerts_dict, query_end_ts):
    """
    """
    candidate_alerts_list = []

    latest = db_alerts_dict["latest"]
    extended = db_alerts_dict["extended"]
    overdue = db_alerts_dict["overdue"]

    totally_invalid_sites_list = []
    routine_sites_list = get_routine_sites(query_end_ts)

    # Get all latest and overdue from db alerts
    merged_db_alerts_list = latest + overdue
    internal_source_id = get_trigger_hierarchy("internal")

    for site_w_alert in with_alerts:
        is_for_release = True
        site_code = site_w_alert["site_code"]
        site_db_alert = list(
            filter(lambda x: x["event"]["site"]["site_code"] == site_code, merged_db_alerts_list))
        general_status = "onset"

        # If already existing in database, i.e. is released
        if site_db_alert:
            # Get latest release data_ts
            general_status = "on-going"

            db_latest_release_ts = site_db_alert["releases"][0]["data_ts"]
            # if release is already released
            if db_latest_release_ts == site_w_alert["ts"]:
                is_for_release = False

        if is_for_release:
            highest_valid_public_alert, trigger_list_str, validity_status = fix_internal_alert(
                site_w_alert, internal_source_id)
            site_w_alert["alert_level"] = highest_valid_public_alert
            site_w_alert["trigger_list_str"] = trigger_list_str

            formatted_alert_entry = format_alerts_for_ewi_insert(
                site_w_alert, general_status)

            candidate_alerts_list.append(formatted_alert_entry)

            if validity_status == "invalid":
                totally_invalid_sites_list.append(site_w_alert)

    a0_routine_list = []
    nd_routine_list = []
    nd_internal_alert_sym = IAS_MAP[(-1, internal_source_id)]

    if without_alerts:
        for site_wo_alert in without_alerts:
            general_status = "routine"
            site_id = site_wo_alert["site_id"]
            site_code = site_wo_alert["site_code"]
            internal_alert = site_wo_alert["internal_alert"]

            is_in_raised_alerts = list(filter(lambda x: x["event"]["site"]["site_code"]
                                              == site_code, merged_db_alerts_list))
            is_in_extended_alerts = list(filter(lambda x: x["event"]["site"]["site_code"]
                                                == site_code, extended))

            site_wo_alert["alert_level"] = 0
            if is_in_raised_alerts:
                general_status = "lowering"
            elif is_in_extended_alerts:
                general_status = "extended"

            if is_in_raised_alerts or is_in_extended_alerts:
                if internal_alert == nd_internal_alert_sym:
                    trigger_list_str = nd_internal_alert_sym

                site_wo_alert["trigger_list_str"] = trigger_list_str
                formatted_alert_entry = format_alerts_for_ewi_insert(
                    site_wo_alert, general_status)

                candidate_alerts_list.append(formatted_alert_entry)
            else:
                if site_code in routine_sites_list:
                    if internal_alert == nd_internal_alert_sym:
                        nd_routine_list.append(site_id)
                    else:
                        a0_routine_list.append(site_id)

    if totally_invalid_sites_list:
        # Process all totally invalid sites for routine
        # Put this in a function
        for t_i_site in totally_invalid_sites_list:
            site_code = t_i_site["site_code"]

            if site_code in routine_sites_list:
                if internal_alert == nd_internal_alert_sym:
                    nd_routine_list.append(site_id)
                else:
                    a0_routine_list.append(site_id)

    # Process all totally invalid sites for routine
    # Put this in a function
    for t_i_site in totally_invalid_sites_list:
        site_code = t_i_site["site_code"]

        if site_code in routine_sites_list:
            rel_triggers = t_i_site["release_triggers"]

            has_ground_data = False
            for rel_trigger in rel_triggers:
                if rel_trigger["type"] == "surficial" and rel_trigger["details"]["alert_level"] > -1:
                    has_ground_data = True
                    break
                elif rel_trigger["type"] == "subsurface":
                    sub_details = rel_trigger["details"]
                    if sub_details:
                        for tsm in sub_details:
                            if tsm["alert_level"] > -1:
                                has_ground_data = True
                                break

            if has_ground_data:
                a0_routine_list.append(site_id)
            else:
                nd_routine_list.append(site_id)

    temp = datetime.strptime(without_alerts[0]["ts"], "%Y-%m-%d %H:%M:%S")
    time_ts = time(temp.hour, temp.minute, temp.second)
    to_compare = time(11, 30, 00)
    is_routine_release_time = time_ts >= to_compare
    var_checker("Is routine", is_routine_release_time, True)
    has_routine_data = a0_routine_list != [] and nd_routine_list != []

    if has_routine_data and is_routine_release_time:
        routine_data_ts = without_alerts[0]["ts"]
        routine_candidates = {
            "public_alert_level": 0,
            "public_alert_symbol": PAS_MAP[("alert_symbol", 0)],
            "data_ts": str(routine_data_ts),
            "general_status": "routine",
            "routine_details": [
                {
                    "site_ids": a0_routine_list,
                    "internal_alert_level": build_internal_alert_level(None, None, 0),
                    "trigger_list_str": None
                },
                {
                    "site_ids": nd_routine_list,
                    "internal_alert_level": build_internal_alert_level(None, nd_internal_alert_sym, 0),
                    "trigger_list_str": nd_internal_alert_sym
                }
            ]
        }
        candidate_alerts_list.append(routine_candidates)

    return candidate_alerts_list


def separate_with_alerts_wo_alerts(generated_alerts_list):
    with_alerts = []
    without_alerts = []

    for gen_alert in generated_alerts_list:
        if gen_alert["public_alert"] == "A0":
            without_alerts.append(gen_alert)
        else:
            with_alerts.append(gen_alert)

    return with_alerts, without_alerts


IAS_X_OTS_MAP = generate_ias_x_ots_map()
IAS_MAP = create_symbols_map("internal_alert_symbols")
PAS_MAP = create_symbols_map("public_alert_symbols")


def main(ts=None, is_test=None):
    """
    Just a comment
    """
    start_run_ts = datetime.now()
    # query_end_ts = ts if ts else datetime.now()
    # query_end_ts = datetime.strptime(query_end_ts, "%Y-%m-%d %H:%M:%S")
    query_end_ts = datetime.now()
    is_test_string = "We are in a test run!" if is_test else "Running with DB!"
    print()
    print(
        f"Started at {start_run_ts}. {is_test_string}. QUERY END TS is {query_end_ts} | Generating Candidate Alerts for Release")

    ####################
    # START OF PROCESS #
    ####################
    filepath = "/var/www/dynaslope3/outputs/"
    filename = "generated_alerts.json"
    generated_alerts_list = get_generated_alerts_list_from_file(
        filepath, filename)

    # Get Active DB Alerts
    db_alerts_dict = get_ongoing_extended_overdue_events()

    # Split site with alerts and site with no alerts
    with_alerts, without_alerts = separate_with_alerts_wo_alerts(
        generated_alerts_list)

    candidate_alerts_list = process_candidate_alerts(
        with_alerts, without_alerts, db_alerts_dict, query_end_ts)

    # Convert data to JSON
    json_data = json.dumps(candidate_alerts_list)

    # Write to specified filepath and filename
    directory = APP_CONFIG["generated_alerts_path"]
    if not os.path.exists(directory):
        os.makedirs(directory)

    with open(directory + "candidate_alerts.json", "w") as file_path:
        file_path.write(json_data)

    end_run_ts = datetime.now()
    run_time = end_run_ts - start_run_ts
    print(f"RUNTIME: {run_time} | Done generating Candidate Alerts!")

    return json_data


if __name__ == "__main__":
    main()
