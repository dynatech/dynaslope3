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

August 2019
"""

# from run import APP
import os
import json
from datetime import datetime, timedelta, time, date
import re
import requests
from config import APP_CONFIG
from connection import MEMORY_CLIENT

from src.models.monitoring import (
    OperationalTriggerSymbols as ots)
from src.utils.monitoring import (get_routine_sites, build_internal_alert_level,
                                  get_ongoing_extended_overdue_events, get_saved_event_triggers,
                                  round_down_data_ts, create_symbols_map, compute_event_validity,
                                  search_if_moms_is_released, round_to_nearest_release_time)
from src.utils.extra import var_checker, retrieve_data_from_memcache


release_time = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "ROUTINE_EXTENDED_RELEASE_TIME"}, retrieve_attr="var_value")

# Currently 12; so data timestamp to get should be 30 minutes before
dt = datetime.combine(date.today(), time(
    hour=release_time, minute=0)) - timedelta(minutes=30)
ROUTINE_EXTENDED_RELEASE_TIME = dt.time()

##########################
# Utility functions here
##########################


def remove_for_lowering_sites(candidates, db_alerts_dict):
    """
    Remove sites that are already released.
    """
    latest = db_alerts_dict["latest"]
    overdue = db_alerts_dict["overdue"]
    merged = latest + overdue
    new_candidate_list = []

    for key, candidate in enumerate(candidates):
        p_alert_level = candidate["public_alert_level"]
        gen_status = candidate["general_status"]

        if p_alert_level == 0 and gen_status == "lowering":
            candidate["trigger_list_arr"] = []
            candidate["to_extend_validity"] = False

            site_code = candidate["public_alert_level"]
            datetime_ts = datetime.strptime(
                candidate["ts"], "%Y-%m-%d %H:%M:%S")

            site_alert = next(
                iter(filter(lambda x: x["site_code"] == site_code, merged)), None)
            in_latest = bool(site_alert)

            if in_latest:
                datetime_data_ts = datetime.strptime(
                    site_alert["releases"][0]["data_ts"], "%Y-%m-%d %H:%M:%S")
                is_already_released = datetime_ts == datetime_data_ts

        if not is_already_released:
            new_candidate_list.append(candidate)

    return new_candidate_list


def generate_ias_x_ots_map():
    """
    """
    cross_map = {}
    trigger_symbols_list = ots.query.all()

    for item in trigger_symbols_list:
        ias = item.internal_alert_symbol
        if ias:
            cross_map[("alert_symbol", item.alert_symbol)] = {
                "alert_level": item.alert_level,
                "internal_symbol": ias.alert_symbol,
                "internal_alert_id": ias.internal_sym_id
            }
            cross_map[("trigger_sym_id", item.trigger_sym_id)] = {
                "alert_level": item.alert_level,
                "internal_symbol": ias.alert_symbol,
                "internal_alert_id": ias.internal_sym_id
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
def extract_unreleased_moms(moms_list):
    """
    Searches through provided moms_list and looks for any unreleased 
    moms.

    Args:
        moms_list (List)

    Returns
        All unreleased moms.
    """
    unreleased_moms_list = []
    for moms in moms_list:
        is_released = search_if_moms_is_released(moms["moms_id"])
        if not is_released:
            unreleased_moms_list.append(moms)

    return unreleased_moms_list


def extract_non_triggering_moms(current_trigger_alerts):
    """
    Given the list of moms, look for m0 or op_trigger=0
    """
    non_triggering_moms = []
    try:
        cta_moms = next(iter(
            filter(lambda x: x["type"] == "moms", current_trigger_alerts)), None)
        moms_list = cta_moms["moms_list"]
        non_triggering_moms = list(
            filter(lambda x: x["op_trigger"] == 0, moms_list))
    except KeyError:
        pass
    except TypeError:
        # No moms in this site
        # print("No moms in this site")
        pass
    except Exception as err:
        print(err)
        raise

    return non_triggering_moms


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

    public_alert_symbol = retrieve_data_from_memcache(
        "public_alert_symbols", {"alert_level": int(alert_level)}, retrieve_attr="alert_symbol")

    non_triggering_moms = extract_non_triggering_moms(
        alert_entry["current_trigger_alerts"])

    formatted_alerts_for_ewi = {
        **site_details,
        "internal_alert_level": build_internal_alert_level(alert_level, trigger_list_str),
        "public_alert_level": alert_level,
        "public_alert_symbol": public_alert_symbol,
        "release_details": {
            "data_ts": data_ts,
            "trigger_list_str": trigger_list_str
        },
        "general_status": general_status,
        "non_triggering_moms": non_triggering_moms,
        "unresolved_moms_list": alert_entry["unresolved_moms_list"]
    }

    try:
        formatted_alerts_for_ewi = {
            **formatted_alerts_for_ewi,
            "is_release_time": alert_entry["is_release_time"],
            "release_schedule": alert_entry["release_schedule"]
        }
    except KeyError:
        pass

    if general_status not in ["routine"]:
        triggers = alert_entry["event_triggers"]
        trigger_list_arr = []

        if triggers:
            for trigger in triggers:
                if trigger != {}:
                    try:
                        is_trigger_new = trigger["is_trigger_new"]
                        del trigger["is_trigger_new"]
                    except KeyError:
                        is_trigger_new = True
                        pass

                    if is_trigger_new:
                        # if trigger["is_trigger_new"]:
                        trig_dict = {
                            **trigger,
                            # For UI purposes
                            "trigger_alert_level": trigger["alert"]
                        }

                        if trigger["trigger_type"] == "moms":
                            moms_cta = next(iter(
                                filter(lambda x: x["type"] == "moms", alert_entry["current_trigger_alerts"])))
                            moms_list = moms_cta["details"]["moms_list"]
                            moms_trig_alert_level = trigger["alert_level"]

                            # Get triggering moms from current_trigger_alerts->moms moms_list
                            moms_list = list(
                                filter(lambda x: x["op_trigger"] == moms_trig_alert_level, moms_list))

                            # Remove MOMS that have been released
                            unreleased_moms_list = extract_unreleased_moms(
                                moms_list)

                            trig_dict["moms_list"] = unreleased_moms_list
                            del trig_dict["moms_list_notice"]

                        trigger_list_arr.append(trig_dict)

        # THIS IS THE BACKEND to_extend_validity.
        to_extend_validity = True if alert_entry["ground_alert_level"] == -1 else False

        formatted_alerts_for_ewi = {
            **formatted_alerts_for_ewi,
            "to_extend_validity": to_extend_validity,
            "trigger_list_arr": trigger_list_arr
        }

    return formatted_alerts_for_ewi


IAS_X_OTS_MAP = generate_ias_x_ots_map()


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
        ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                              "alert_symbol": alert_symbol})
        trigger["internal_sym_id"] = ots_row["internal_alert_symbol"]["internal_sym_id"]

        # trigger["internal_sym_id"] = IAS_X_OTS_MAP["alert_symbol",
        #                                            alert_symbol]["internal_alert_id"]
        source_id = trigger["source_id"]
        alert_level = trigger["alert_level"]
        op_trig_row = retrieve_data_from_memcache("operational_trigger_symbols", {
            "alert_level": int(alert_level), "source_id": source_id})
        internal_alert_symbol = op_trig_row["internal_alert_symbol"]["alert_symbol"]

        try:
            if trigger["invalid"]:
                invalid_triggers.append(trigger)
                internal_alert = re.sub(
                    r"%s(0|x)?" % internal_alert_symbol, "", internal_alert)

        except KeyError:  # If valid, trigger should have no "invalid" key
            valid_a_l = retrieve_data_from_memcache("operational_trigger_symbols", {
                "alert_symbol": alert_symbol}, retrieve_attr="alert_level")
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
    op_trig_row = retrieve_data_from_memcache("operational_trigger_symbols", {
        "alert_level": -1, "source_id": internal_source_id})
    nd_internal_alert_sym = op_trig_row["internal_alert_symbol"]["alert_symbol"]

    is_nd = public_alert_sym == nd_internal_alert_sym
    if is_nd:
        trigger_list_str = nd_internal_alert_sym
    elif highest_valid_public_alert != 0:
        trigger_list_str = ""

    try:
        if is_nd:
            trigger_list_str += "-"

        trigger_list_str += internal_alert.split("-")[1]
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

    # NOTE: LOUIE VARIABLES Routine Release Time
    global ROUTINE_EXTENDED_RELEASE_TIME
    routine_extended_release_time = ROUTINE_EXTENDED_RELEASE_TIME

    routine_sites_list = []
    if query_end_ts.hour == routine_extended_release_time.hour:
        routine_sites_list = get_routine_sites(query_end_ts)

    # Get all latest and overdue from db alerts
    merged_db_alerts_list = latest + overdue
    internal_source_id = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "internal"}, retrieve_attr="source_id")

    if with_alerts:
        for site_w_alert in with_alerts:
            is_new_release = True
            is_release_time = False
            site_code = site_w_alert["site_code"]
            site_db_alert = next(
                filter(lambda x: x["event"]["site"]["site_code"] == site_code, merged_db_alerts_list), None)
            general_status = "onset"

            # If already existing in database, i.e. is released
            if site_db_alert:
                # Get latest release data_ts
                general_status = "on-going"
                saved_event_triggers = get_saved_event_triggers(
                    site_db_alert["event"]["event_id"])

                for event_trigger in site_w_alert["event_triggers"]:
                    saved_trigger = next(filter(
                        lambda x: x[0] == event_trigger["internal_sym_id"], saved_event_triggers), None)

                    var_checker("saved_trigger", saved_trigger, True)

                    is_trigger_new = False
                    if saved_trigger:
                        if saved_trigger[1] < datetime.strptime(event_trigger["ts_updated"], "%Y-%m-%d %H:%M:%S"):
                            is_trigger_new = True
                    else:
                        is_trigger_new = True

                    var_checker("is_trigger_new", is_trigger_new, True)
                    event_trigger["is_trigger_new"] = is_trigger_new

                db_latest_release_ts = datetime.strptime(
                    site_db_alert["releases"][0]["data_ts"], "%Y-%m-%d %H:%M:%S")

                # RELEASE TIME HANDLER
                # if can release
                site_alert_ts = datetime.strptime(
                    site_w_alert["ts"], "%Y-%m-%d %H:%M:%S")
                release_start_range = round_to_nearest_release_time(
                    site_alert_ts) - timedelta(minutes=30)
                is_release_schedule_range = site_alert_ts >= release_start_range

                var_checker("release_start_range", release_start_range, True)
                var_checker("ts", ts, True)
                var_checker("db_latest_release_ts", db_latest_release_ts, True)
                var_checker("site_alert_ts", site_alert_ts, True)

                # if incoming data_ts has not yet released:
                is_new_release = db_latest_release_ts < site_alert_ts

                if is_release_schedule_range and is_new_release:
                    is_release_time = True

            if is_new_release:
                highest_valid_public_alert, trigger_list_str, validity_status = fix_internal_alert(
                    site_w_alert, internal_source_id)

                site_w_alert = {
                    **site_w_alert,
                    "alert_level": highest_valid_public_alert,
                    "trigger_list_str": trigger_list_str,
                    "is_release_time": is_release_time,
                    "release_schedule": release_start_range + timedelta(minutes=1)
                }

                formatted_alert_entry = format_alerts_for_ewi_insert(
                    site_w_alert, general_status)

                candidate_alerts_list.append(formatted_alert_entry)

                if validity_status == "invalid":
                    totally_invalid_sites_list.append(site_w_alert)

    a0_routine_list = []
    nd_routine_list = []
    routine_non_triggering_moms = {}

    ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                          "alert_level": -1, "source_id": internal_source_id})
    nd_internal_alert_sym = ots_row["internal_alert_symbol"]["alert_symbol"]

    merged_db_alerts_list_copy = latest + overdue
    no_a0_db_alerts_list = list(filter(lambda x: x["event"]["site"]["site_code"] ==
                                       site_code, merged_db_alerts_list_copy))

    if without_alerts:
        for site_wo_alert in without_alerts:
            general_status = "routine"
            site_id = site_wo_alert["site_id"]
            site_code = site_wo_alert["site_code"]
            internal_alert = site_wo_alert["internal_alert"]

            # is_in_raised_alerts = list(filter(lambda x: x["event"]["site"]["site_code"] ==
            #                                   site_code, merged_db_alerts_list))
            is_in_raised_alerts = list(filter(lambda x: x["event"]["site"]["site_code"] ==
                                              site_code, no_a0_db_alerts_list))
            is_in_extended_alerts = list(filter(lambda x: x["event"]["site"]["site_code"] ==
                                                site_code, extended))

            is_for_release = True
            site_wo_alert["alert_level"] = 0
            if is_in_raised_alerts:
                general_status = "lowering"
                # Empty event_triggers since for lowering
                site_wo_alert["event_triggers"] = []
            elif is_in_extended_alerts:
                general_status = "extended"

                # RELEASE TIME HANDLER TRY 1
                ts = datetime.strptime(
                    site_wo_alert["ts"], "%Y-%m-%d %H:%M:%S")
                if ts.hour != routine_extended_release_time.hour:
                    is_for_release = False

            if is_in_raised_alerts or is_in_extended_alerts:
                if internal_alert == nd_internal_alert_sym:
                    trigger_list_str = nd_internal_alert_sym
                else:
                    trigger_list_str = ""

                site_wo_alert = {
                    **site_wo_alert,
                    "trigger_list_str": trigger_list_str,
                    "is_for_release": is_for_release
                }

                formatted_alert_entry = format_alerts_for_ewi_insert(
                    site_wo_alert, general_status)

                candidate_alerts_list.append(formatted_alert_entry)
            else:
                if site_code in routine_sites_list:
                    ts = datetime.strptime(
                        site_wo_alert["ts"], "%Y-%m-%d %H:%M:%S")

                    # Check if site data entry on generated alerts is already
                    # for release time
                    if ts.time() == routine_extended_release_time:
                        non_triggering_moms = extract_non_triggering_moms(
                            site_wo_alert["current_trigger_alerts"])

                        if internal_alert == nd_internal_alert_sym:
                            nd_routine_list.append(site_id)
                        else:
                            a0_routine_list.append(site_id)

                        if non_triggering_moms:
                            routine_non_triggering_moms[site_id] = non_triggering_moms

    if totally_invalid_sites_list:
        # Process all totally invalid sites for routine
        # Put this in a function
        for t_i_site in totally_invalid_sites_list:
            site_code = t_i_site["site_code"]

            if site_code in routine_sites_list:
                current_trigger_alerts = t_i_site["current_trigger_alerts"]

                has_ground_data = False
                for current_trigger_alert in current_trigger_alerts:
                    # NOTE: For updating DYNAMIC
                    if current_trigger_alert["type"] == "surficial" and current_trigger_alert["details"]["alert_level"] > -1:
                        has_ground_data = True
                        break
                    elif current_trigger_alert["type"] == "subsurface":
                        sub_details = current_trigger_alert["details"]
                        if sub_details:
                            for tsm in sub_details:
                                if tsm["alert_level"] > -1:
                                    has_ground_data = True
                                    break

                if has_ground_data:
                    a0_routine_list.append(site_id)
                else:
                    nd_routine_list.append(site_id)

    if routine_sites_list:
        has_routine_data = a0_routine_list != [] and nd_routine_list != []

        if has_routine_data:
            routine_data_ts = a0_routine_list[0]["ts"]

            public_alert_symbol = retrieve_data_from_memcache(
                "public_alert_symbols", {"alert_level": 0}, retrieve_attr="alert_symbol")

            routine_candidates = {
                "public_alert_level": 0,
                "public_alert_symbol": public_alert_symbol,
                "data_ts": str(routine_data_ts),
                "general_status": "routine",
                "routine_details": [
                    {
                        "site_id_list": a0_routine_list,
                        "internal_alert_level": build_internal_alert_level(0, None),
                        "trigger_list_str": None
                    },
                    {
                        "site_id_list": nd_routine_list,
                        "internal_alert_level": build_internal_alert_level(0, nd_internal_alert_sym),
                        "trigger_list_str": nd_internal_alert_sym
                    }
                ],
                "non_triggering_moms": routine_non_triggering_moms
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


def main(ts=None, generated_alerts_list=None, check_legacy_candidate=False):
    """

    Args:
        ts (Str Datetime)
        generated_alerts_list (List) - provided thru websocket if not reading from
            file
        check_legacy_candidate (Bool) - show generated candidate alert entry for
            released MonitoringReleases entries; Rationale: If data_ts
            already exists in MonitoringReleases, release will not 
            be included in Candidates Alert Generation
    """
    start_run_ts = datetime.now()
    query_end_ts = datetime.now()
    if ts:
        query_end_ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
    # is_test_string = "We are in a test run!" if is_test else "Running with DB!"
    is_test_string = "Running with DB!"
    print()
    query_end_ts = datetime.now()
    print(
        f"Started at {start_run_ts}. {is_test_string}. QUERY END TS is {query_end_ts} | Candidate Alerts being generated for Release")

    ####################
    # START OF PROCESS #
    ####################
    # If no generated alerts sent thru argument, read from
    # file.
    if not generated_alerts_list:
        print("### WALANG GENERATED ALERTS")
        filepath = APP_CONFIG["generated_alerts_path"]
        # filepath = "/var/www/dynaslope3/outputs/"
        filename = "generated_alerts.json"
        generated_alerts_list = get_generated_alerts_list_from_file(
            filepath, filename)

    # Get Active DB Alerts
    if check_legacy_candidate:
        query_end_ts = round_down_data_ts(query_end_ts)
    db_alerts_dict = get_ongoing_extended_overdue_events(query_end_ts)

    # Split site with alerts and site with no alerts
    with_alerts, without_alerts = separate_with_alerts_wo_alerts(
        generated_alerts_list)

    var_checker("with alerts", with_alerts, True)
    var_checker("without alerts", without_alerts, True)

    # PROCESS CANDIDATES
    candidate_alerts_list = process_candidate_alerts(
        with_alerts, without_alerts, db_alerts_dict, query_end_ts)

    # NOTE: TAG LOWERING CANDIDATES
    # candidate_alerts_list = remove_for_lowering_sites(
    #     candidate_alerts_list, db_alerts_dict)

    # Convert data to JSON
    json_data = json.dumps(candidate_alerts_list)

    # Write to specified filepath and filename
    directory = APP_CONFIG["generated_alerts_path"]
    if not os.path.exists(directory):
        os.makedirs(directory)

    # var_checker("directory", directory, True)
    with open(directory + "candidate_alerts.json", "w") as file_path:
        # var_checker("CAN PATH", file_path, True)
        file_path.write(json_data)

    end_run_ts = datetime.now()
    run_time = end_run_ts - start_run_ts
    print(f"RUNTIME: {run_time} | Done generating Candidate Alerts!")

    return json_data


if __name__ == "__main__":
    main()

    # ROUTINE INVALID
    # main(ts="<timestamp>")
