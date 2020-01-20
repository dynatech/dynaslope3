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

import json
# from run import APP
import os
import re
from datetime import date, datetime, time, timedelta

from connection import create_app
from config import APP_CONFIG
from src.utils.extra import (
    retrieve_data_from_memcache, var_checker,
    get_process_status_log)
from src.api.monitoring import get_unreleased_routine_sites
from src.utils.monitoring import (build_internal_alert_level,
                                  get_ongoing_extended_overdue_events,
                                  get_routine_sites, get_saved_event_triggers,
                                  round_to_nearest_release_time)

# Every how many hours per release
RELEASE_INTERVAL_HOURS = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")

ROU_EXT_RELEASE_TIME = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "ROUTINE_EXTENDED_RELEASE_TIME"}, retrieve_attr="var_value")

# Currently 12; so data timestamp to get should be 30 minutes before
DT = datetime.combine(date.today(), time(
    hour=ROU_EXT_RELEASE_TIME, minute=0)) - timedelta(minutes=30)
ROUTINE_EXTENDED_RELEASE_TIME = DT.time()

##########################
# Utility functions here
##########################


def update_routine_extended_release_time_copy():
    global DT
    global ROUTINE_EXTENDED_RELEASE_TIME
    DT = datetime.combine(date.today(), time(hour=ROU_EXT_RELEASE_TIME, minute=0)) - \
        timedelta(minutes=30)
    ROUTINE_EXTENDED_RELEASE_TIME = DT.time()


def remove_for_lowering_sites(candidates, db_alerts_dict):
    """
    Remove sites that are already released.
    """
    latest = db_alerts_dict["latest"]
    overdue = db_alerts_dict["overdue"]
    merged = latest + overdue
    new_candidate_list = []

    for candidate in candidates:
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


def get_generated_alerts_list_from_file(filepath, filename):
    """
    Reads the file generated by PublicAlertGenerator
    Returns a list
    """
    gen_alert_data = []
    full_filepath = f"{filepath}/{filename}"
    print(f"Getting data from {full_filepath}")
    print()

    with open(full_filepath) as json_file:
        gen_alert_data = json_file.read()

    return gen_alert_data


###################
# Data processors #
###################
def process_totally_invalid_sites(totally_invalid_sites_list,
                                  extended, routine_sites_list, nd_internal_alert_sym):
    """
    Process all totally invalid sites for extended or routine
    """

    a0_routine_list = []
    nd_routine_list = []
    extended_list = []

    for generated_alert in totally_invalid_sites_list:
        site_code = generated_alert["site_code"]
        site_id = generated_alert["site_id"]
        ts = datetime.strptime(
            generated_alert["ts"], "%Y-%m-%d %H:%M:%S")
        is_release_time = check_if_routine_extended_release_time(ts)

        is_in_extended_alerts = list(filter(lambda x: x["event"]["site"]["site_code"] ==
                                            site_code, extended))
        if is_in_extended_alerts:
            if is_release_time:
                general_status = "extended"
                has_ground_data = generated_alert["has_ground_data"]

                if has_ground_data:
                    public_alert_symbol = retrieve_data_from_memcache("public_alert_symbols", {
                        "alert_level": 0}, retrieve_attr="alert_symbol")
                    trigger_list_str = ""
                    internal_alert_symbol = public_alert_symbol
                else:
                    trigger_list_str = nd_internal_alert_sym
                    internal_alert_symbol = nd_internal_alert_sym

                site_wo_alert = {
                    **generated_alert,
                    "trigger_list_str": trigger_list_str,
                    "is_release_time": is_release_time,
                    "alert_level": 0,
                    "internal_alert_level": internal_alert_symbol
                }

                formatted_alert_entry = format_alerts_for_ewi_insert(
                    site_wo_alert, general_status)

                extended_list.append(formatted_alert_entry)
        elif site_code in routine_sites_list:
            has_ground_data = generated_alert["has_ground_data"]

            if has_ground_data:
                a0_routine_list.append(site_id)
            else:
                nd_routine_list.append(site_id)

    return extended_list, a0_routine_list, nd_routine_list


def extract_non_triggering_moms(unreleased_moms_list):
    """
    Given the list of moms, look for m0 or op_trigger=0
    """

    non_triggering_moms = []
    try:
        # cta_moms = next(iter(
        #     filter(lambda x: x["type"] == "moms", unreleased_moms_list)), None)
        # moms_list = cta_moms["moms_list"]
        # non_triggering_moms = list(
        #     filter(lambda x: x["op_trigger"] == 0, moms_list))
        non_triggering_moms = list(
            filter(lambda x: x["op_trigger"] == 0, unreleased_moms_list))

    except KeyError as err:
        print(err)
        pass
    except TypeError as err:
        print(err)
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
    unreleased_moms_list = alert_entry["unreleased_moms_list"]
    current_trigger_alerts = alert_entry["current_trigger_alerts"]

    site_details = {
        "site_id": site_id,
        "site_code": site_code
    }

    public_alert_symbol = retrieve_data_from_memcache(
        "public_alert_symbols", {"alert_level": int(alert_level)}, retrieve_attr="alert_symbol")

    non_triggering_moms = extract_non_triggering_moms(unreleased_moms_list)

    current_triggers_status = []
    for row in current_trigger_alerts:
        trigger_type = row["type"]
        details = row["details"]

        if details["alert_level"] < 0:  # accept only nd and rx
            current_triggers_status.append({
                "trigger_source": trigger_type,
                **details
            })

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
        "current_triggers_status": current_triggers_status,
        "non_triggering_moms": non_triggering_moms,
        "unresolved_moms_list": alert_entry["unresolved_moms_list"]
    }

    try:
        formatted_alerts_for_ewi = {
            **formatted_alerts_for_ewi,
            "release_schedule": alert_entry["release_schedule"]
        }
    except KeyError:
        pass

    if general_status not in ["routine"]:
        triggers = alert_entry["event_triggers"]
        trigger_list_arr = []

        for trigger in triggers:
            if trigger != {}:
                try:
                    is_trigger_new = trigger["is_trigger_new"]
                    del trigger["is_trigger_new"]
                except KeyError:
                    is_trigger_new = True

                if is_trigger_new:
                    trig_dict = {
                        **trigger,
                        # For UI purposes
                        "trigger_alert_level": trigger["alert"]
                    }

                    if trigger["trigger_type"] == "moms":
                        moms_trig_alert_level = trigger["alert_level"]

                        # Get moms with same alert level of trigger
                        moms_list = list(
                            filter(lambda x: x["op_trigger"] == moms_trig_alert_level,
                                   unreleased_moms_list))

                        trig_dict["moms_list"] = moms_list
                        del trig_dict["moms_list_notice"]

                    trigger_list_arr.append(trig_dict)

        # THIS IS THE BACKEND to_extend_validity.
        has_unresolved_moms = bool(
            formatted_alerts_for_ewi["unresolved_moms_list"])
        to_extend_validity = True if (
            not alert_entry["has_ground_data"] or has_unresolved_moms) else False

        try:
            saved_event_triggers = alert_entry["saved_event_triggers"]
        except KeyError:
            saved_event_triggers = []

        try:
            has_ground_data = alert_entry["has_ground_data"]
        except KeyError:
            has_ground_data = None

        formatted_alerts_for_ewi = {
            **formatted_alerts_for_ewi,
            "is_release_time": alert_entry["is_release_time"],
            "to_extend_validity": to_extend_validity,
            "trigger_list_arr": trigger_list_arr,
            "has_ground_data": has_ground_data,
            "saved_event_triggers": saved_event_triggers
        }

    return formatted_alerts_for_ewi


def fix_internal_alert(alert_entry, nd_internal_alert_sym):
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
        trigger_list_str = "A1-"  # NOTE: just to signify invalid in dashboard at first glance
        validity_status = "invalid"

    public_alert_sym = internal_alert.split("-")[0]

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


def format_site_wo_alert_entry(site_wo_alert, nd_internal_alert_sym, is_release_time):
    """
    """

    internal_alert = site_wo_alert["internal_alert"]
    if internal_alert == nd_internal_alert_sym:
        trigger_list_str = nd_internal_alert_sym
    else:
        trigger_list_str = ""

    return {
        **site_wo_alert,
        "trigger_list_str": trigger_list_str,
        "is_release_time": is_release_time
    }


def check_if_routine_extended_release_time(ts):
    """
    """
    is_release_time = False
    if ts.hour == ROUTINE_EXTENDED_RELEASE_TIME.hour and \
            ts.minute >= ROUTINE_EXTENDED_RELEASE_TIME.minute:
        is_release_time = True
    return is_release_time


def process_candidate_alerts(with_alerts, without_alerts, db_alerts_dict, query_end_ts):
    """
    """
    candidate_alerts_list = []

    latest = db_alerts_dict["latest"]
    extended = db_alerts_dict["extended"]
    overdue = db_alerts_dict["overdue"]

    totally_invalid_sites_list = []

    update_routine_extended_release_time_copy()

    global ROUTINE_EXTENDED_RELEASE_TIME
    global RELEASE_INTERVAL_HOURS
    routine_extended_release_time = ROUTINE_EXTENDED_RELEASE_TIME
    release_interval_hours = RELEASE_INTERVAL_HOURS

    routine_sites_list = []
    if query_end_ts.hour == routine_extended_release_time.hour and \
            query_end_ts.minute >= routine_extended_release_time.minute:
        ts = round_to_nearest_release_time(
            query_end_ts, release_interval_hours) - timedelta(minutes=30)
        temp_sites = get_unreleased_routine_sites(ts)
        # routine_sites_list = get_routine_sites(query_end_ts)
        routine_sites_list = temp_sites["unreleased_sites"]

    # Get all latest and overdue from db alerts
    merged_db_alerts_list = latest + overdue
    internal_source_id = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "internal"}, retrieve_attr="source_id")

    ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
        "alert_level": -1, "source_id": internal_source_id})
    nd_internal_alert_sym = ots_row["internal_alert_symbol"]["alert_symbol"]

    if with_alerts:
        for site_w_alert in with_alerts:
            is_new_release = True
            is_release_time = False
            release_start_range = None
            site_code = site_w_alert["site_code"]
            generated_alert_level = site_w_alert["alert_level"]
            site_db_alert = next(
                filter(lambda x: x["event"]["site"]["site_code"] == site_code,
                       merged_db_alerts_list), None)
            general_status = "onset"

            saved_event_triggers = []

            # If already existing in database, i.e. is released
            if site_db_alert:
                # Get latest release data_ts
                db_alert_level = site_db_alert["public_alert_symbol"]["alert_level"]

                general_status = "on-going"
                # saved_event_triggers = get_saved_event_triggers(
                #     site_db_alert["event"]["event_id"])
                saved_event_triggers = site_db_alert["latest_event_triggers"]

                for event_trigger in site_w_alert["event_triggers"]:
                    saved_trigger = next(filter(
                        lambda x: x["internal_sym"]["internal_sym_id"]
                        == event_trigger["internal_sym_id"],
                        saved_event_triggers), None)

                    is_trigger_new = False
                    if saved_trigger:
                        if datetime.strptime(saved_trigger["ts"], "%Y-%m-%d %H:%M:%S") \
                            < datetime.strptime(
                                event_trigger["ts_updated"], "%Y-%m-%d %H:%M:%S"):
                            is_trigger_new = True
                    else:
                        is_trigger_new = True

                    event_trigger["is_trigger_new"] = is_trigger_new

                db_latest_release_ts = datetime.strptime(
                    site_db_alert["releases"][0]["data_ts"], "%Y-%m-%d %H:%M:%S")

                # RELEASE TIME HANDLER
                # if can release
                site_alert_ts = datetime.strptime(
                    site_w_alert["ts"], "%Y-%m-%d %H:%M:%S")
                release_start_range = round_to_nearest_release_time(
                    query_end_ts, release_interval_hours) - timedelta(minutes=30)
                is_release_schedule_range = site_alert_ts >= release_start_range

                # if incoming data_ts has not yet released:
                is_new_release = db_latest_release_ts < site_alert_ts
                if is_release_schedule_range and is_new_release:
                    is_release_time = True

                # if is_onset by comparing alert_level on db and on generated
                if generated_alert_level > db_alert_level:
                    is_release_time = True
            else:
                # is onset release
                is_release_time = True

            if is_new_release:
                highest_valid_public_alert, trigger_list_str, validity_status = fix_internal_alert(
                    site_w_alert, nd_internal_alert_sym)

                site_w_alert = {
                    **site_w_alert,
                    "alert_level": highest_valid_public_alert,
                    "trigger_list_str": trigger_list_str,
                    "is_release_time": is_release_time,
                    "release_schedule": str(release_start_range),
                    "saved_event_triggers": saved_event_triggers
                }

                formatted_alert_entry = format_alerts_for_ewi_insert(
                    site_w_alert, general_status)

                candidate_alerts_list.append(formatted_alert_entry)

                if validity_status == "invalid":
                    totally_invalid_sites_list.append(site_w_alert)

    a0_routine_list = []
    nd_routine_list = []
    routine_non_triggering_moms = {}

    merged_db_alerts_list_copy = latest + overdue

    current_routine_data_ts = None
    if without_alerts:
        for site_wo_alert in without_alerts:
            general_status = "routine"
            site_id = site_wo_alert["site_id"]
            site_code = site_wo_alert["site_code"]
            internal_alert = site_wo_alert["internal_alert"]
            not_a0_db_alerts_list = list(filter(
                lambda x: x["public_alert_symbol"]["alert_level"] != 0, merged_db_alerts_list_copy))

            is_in_raised_alerts = list(filter(lambda x: x["event"]["site"]["site_code"] ==
                                              site_code, not_a0_db_alerts_list))
            is_in_extended_alerts = list(filter(lambda x: x["event"]["site"]["site_code"] ==
                                                site_code, extended))

            is_release_time = True
            site_wo_alert["alert_level"] = 0
            if is_in_raised_alerts:
                general_status = "lowering"
                # Empty event_triggers since for lowering
                site_wo_alert["event_triggers"] = []
            elif is_in_extended_alerts:
                general_status = "extended"

                ts = datetime.strptime(
                    site_wo_alert["ts"], "%Y-%m-%d %H:%M:%S")
                is_release_time = check_if_routine_extended_release_time(ts)

            if (is_in_raised_alerts or is_in_extended_alerts) and is_release_time:
                if internal_alert == nd_internal_alert_sym:
                    trigger_list_str = nd_internal_alert_sym
                else:
                    trigger_list_str = ""

                site_wo_alert = {
                    **site_wo_alert,
                    "trigger_list_str": trigger_list_str,
                    "is_release_time": is_release_time
                }

                # Add checker if released

                formatted_alert_entry = format_alerts_for_ewi_insert(
                    site_wo_alert, general_status)
                candidate_alerts_list.append(formatted_alert_entry)
            else:
                if site_code in routine_sites_list:
                    # TODO: Add an api checking if site has been released already or not.
                    # Get sites havent released 11:30 release
                    ts = datetime.strptime(
                        site_wo_alert["ts"], "%Y-%m-%d %H:%M:%S")

                    # add checker if released already

                    # Check if site data entry on generated alerts is already
                    # for release time
                    if ts.time() == routine_extended_release_time:
                        current_routine_data_ts = site_wo_alert["ts"]
                        non_triggering_moms = extract_non_triggering_moms(
                            site_wo_alert["unreleased_moms_list"])

                        if internal_alert == nd_internal_alert_sym:
                            nd_routine_list.append(site_id)
                        else:
                            a0_routine_list.append(site_id)

                        if non_triggering_moms:
                            routine_non_triggering_moms[site_id] = non_triggering_moms

    if totally_invalid_sites_list:
        for invalid_site in totally_invalid_sites_list:
            if invalid_site["site_code"] in routine_sites_list:
                site_code = invalid_site["site_code"]
                site_id = invalid_site["site_id"]
                internal_alert = invalid_site["internal_alert"]
                ts = datetime.strptime(
                    invalid_site["ts"], "%Y-%m-%d %H:%M:%S")

                # Check if site data entry on generated alerts is already
                # for release time
                if ts.time() == routine_extended_release_time:
                    current_routine_data_ts = invalid_site["ts"]
                    non_triggering_moms = extract_non_triggering_moms(
                        invalid_site["unreleased_moms_list"])

                    # Since there is a probabilitiy of site being in the site_w_alert,
                    # check totally invalid sites.
                    invalid = next(
                        filter(lambda x: x["site_code"] == site_code, totally_invalid_sites_list), None)
                    if invalid:
                        non_triggering_moms.extend(
                            extract_non_triggering_moms(
                                invalid["unreleased_moms_list"])
                        )

                    if internal_alert == nd_internal_alert_sym:
                        nd_routine_list.append(site_id)
                    else:
                        a0_routine_list.append(site_id)

                    if non_triggering_moms:
                        routine_non_triggering_moms[site_id] = non_triggering_moms

        extended_list, a0_list, nd_list = process_totally_invalid_sites(
            totally_invalid_sites_list, extended, routine_sites_list, nd_internal_alert_sym)
        candidate_alerts_list.extend(extended_list)
        a0_routine_list.extend(a0_list)
        nd_routine_list.extend(nd_list)

    if routine_sites_list:
        has_routine_data = a0_routine_list or nd_routine_list

        if has_routine_data:
            # try:
            #     routine_data_ts = a0_routine_list[0]["ts"]
            # except IndexError:
            #     routine_data_ts = nd_routine_list[0]["ts"]
            routine_data_ts = current_routine_data_ts

            public_alert_symbol = retrieve_data_from_memcache(
                "public_alert_symbols", {"alert_level": 0}, retrieve_attr="alert_symbol")

            routine_candidates = {
                "public_alert_level": 0,
                "public_alert_symbol": public_alert_symbol,
                "data_ts": routine_data_ts,
                "is_release_time": True,
                "general_status": "routine",
                "routine_details": [
                    {
                        "site_id_list": a0_routine_list,
                        "internal_alert_level": build_internal_alert_level(0, None),
                        "trigger_list_str": None
                    },
                    {
                        "site_id_list": nd_routine_list,
                        "internal_alert_level": build_internal_alert_level(
                            0, nd_internal_alert_sym),
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


def main(ts=None, generated_alerts_list=None, db_alerts_dict=None):
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

    print(get_process_status_log("Candidate Alerts Processing", "start"))

    start_run_ts = datetime.now()
    query_end_ts = datetime.now()
    if ts:
        query_end_ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")

    ####################
    # START OF PROCESS #
    ####################
    # If no generated alerts sent thru argument, read from
    # file.
    if not generated_alerts_list:
        filepath = APP_CONFIG["generated_alerts_path"]
        filename = "generated_alerts.json"
        generated_alerts_list = get_generated_alerts_list_from_file(
            filepath, filename)

    load_generated_alerts = json.loads(generated_alerts_list)

    if db_alerts_dict:
        db_alerts_dict = json.loads(db_alerts_dict)
    else:
        db_alerts_dict = get_ongoing_extended_overdue_events(query_end_ts)

    # Split site with alerts and site with no alerts
    with_alerts, without_alerts = separate_with_alerts_wo_alerts(
        load_generated_alerts)

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

    with open(directory + "/candidate_alerts.json", "w") as file_path:
        file_path.write(json_data)

    end_run_ts = datetime.now()
    run_time = end_run_ts - start_run_ts
    print(f"RUNTIME: {run_time} | Done generating Candidate Alerts!")
    print("")

    return json_data


if __name__ == "__main__":
    config_name = os.getenv("FLASK_CONFIG")
    app = create_app(config_name, skip_memcache=True, skip_websocket=True)

    main()
