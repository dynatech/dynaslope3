"""
Public Alert Generator (Py3) Beta
======
For use of Dynaslope Early Warning System

August 2019
"""

# from run import APP
import pprint
import os
import json
from connection import DB, MEMORY_CLIENT
from config import APP_CONFIG
from sqlalchemy import and_, or_
from datetime import datetime, timedelta, time
from src.experimental_scripts import tech_info_maker
from src.models.monitoring import (
    PublicAlerts as pa, PublicAlertSymbols as pas,
    OperationalTriggers as ot, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies,
    MonitoringMoms as moms, MomsInstances as mi,
    MonitoringMomsSchema)
from src.models.analysis import (
    TSMAlerts, TSMSensors, RainfallAlerts as ra,
    AlertStatusSchema)
from src.utils.sites import get_sites_data
from src.utils.rainfall import get_rainfall_gauge_name
from src.utils.monitoring import round_down_data_ts, get_site_moms_alerts, round_to_nearest_release_time
from src.utils.extra import var_checker, retrieve_data_from_memcache


MONITORING_MOMS_SCHEMA = MonitoringMomsSchema(many=True, exclude=(
    "moms_releases", "validator", "reporter", "narrative"))

#####################################################
# DYNAMIC Protocol Values starts here. For querying #
#####################################################
MAX_POSSIBLE_ALERT_LEVEL = 3  # Number of alert levels excluding zero
RELEASE_INTERVAL_HOURS = 4  # Every how many hours per release
ALERT_EXTENSION_LIMIT = 72  # Max hours total of 3 days
NO_DATA_HOURS_EXTENSION = 4  # Number of hours extended if no_data upon validity


def check_if_routine_or_event(pub_sym_id):
    """
    Checks if alert instance is routine or event
    """
    if pub_sym_id > 4 or pub_sym_id < 0:
        raise Exception("Invalid Public Alert Entry")
    elif pub_sym_id == 1:
        return "routine"

    return "event"


def get_source_max_alert_level(source_id):
    """
    Returns maximum alert level per source.

    Note: NotUnitTestable
    """

    alert_level = ots.query.filter(ots.source_id == source_id).order_by(
        DB.desc(ots.alert_level)).first().alert_level

    return alert_level


def extract_alert_level(json):
    """
    Helps in getting the alert level from public alert, to sort
    the generated alerts by alert level.
    """
    try:
        return int(json['public_alert'][1])
    except KeyError:
        return 0


###################
# LOGIC FUNCTIONS #
###################

def write_to_db_public_alerts(output_dict, previous_latest_site_pa):
    """
    SQLAlchemy DB writer function.

    Args:
        output_dict (dictionary) - the generated public_alert for each site
        previous_latest_site_pa (PublicAlert class) - the previous public_alert before the script run
    """
    return_data = None
    try:
        # latest_site_pa_id = previous_latest_site_pa.public_id

        prev_pub_sym_id = previous_latest_site_pa.pub_sym_id
        new_pub_sym_id = output_dict["pub_sym_id"]

        pas_row = retrieve_data_from_memcache(
            "public_alert_symbols", {"pub_sym_id": new_pub_sym_id})
        new_alert_level = pas_row["alert_level"]
        is_new_public_alert = prev_pub_sym_id != new_pub_sym_id
        prev_l_s_pa_ts_updated = previous_latest_site_pa.ts_updated
        new_l_s_pa_ts_updated = output_dict["ts_updated"]
        is_retroactive_run = prev_l_s_pa_ts_updated >= new_l_s_pa_ts_updated
        no_alerts_wtn_30_mins = new_l_s_pa_ts_updated - \
            timedelta(minutes=30) > prev_l_s_pa_ts_updated

        # If the alert symbol is different, create a new entry
        if not is_retroactive_run:
            if no_alerts_wtn_30_mins and new_alert_level == 0:
                is_new_public_alert = True
            else:
                if not is_new_public_alert:
                    # Update the previous public alert first
                    previous_latest_site_pa.ts_updated = output_dict["ts"]

            if is_new_public_alert:
                new_pub_alert = pa(
                    ts=output_dict["ts"],
                    site_id=output_dict["site_id"],
                    pub_sym_id=output_dict["pub_sym_id"],
                    ts_updated=output_dict["ts_updated"]
                )
                DB.session.add(new_pub_alert)
                DB.session.flush()
                new_public_id = new_pub_alert.public_id
                return_data = new_public_id

                # If no problems, commit
            elif not is_new_public_alert:
                return_data = "exists"

            DB.session.commit()

    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return return_data


def format_current_trigger_alerts(current_trigger_alerts):
    """
    Reforms current_trigger_alerts to adapt to what is
    needed for candidate alerts generator

    Args:
        current_trigger_alerts (Dictionary) - collection of all
            trigger_types statuses
    """

    formatted_release_trig = []
    for key in current_trigger_alerts:
        th_row = current_trigger_alerts[key]["th_row"]
        source_id = th_row["source_id"]

        del current_trigger_alerts[key]["th_row"]

        formatted_alert = {
            "type": key,
            "source_id": source_id,
            "details": current_trigger_alerts[key]
        }

        formatted_release_trig.append(formatted_alert)

    return formatted_release_trig


def format_recent_retriggers(unique_positive_triggers_list, invalid_dicts, site_moms_alerts_list):
    """
    Prepare the most recent trigger
    Remove unnecessary attributes and convert SQLAlchemy row into a dict.
    Convert ts_updated to str

    Args:
        unique_positive_triggers_list - list containing the most recent positive trigger (SQLAlchemy row)
    """
    recent_triggers_list = []

    if unique_positive_triggers_list:
        for item in unique_positive_triggers_list:
            # Include invalids as a dictionary
            final_invalids_dict = {}
            try:
                invalid_entry = invalid_dicts[item.trigger_sym_id]
                invalid_details_dict = AlertStatusSchema().dump(invalid_entry).data
 
                final_invalids_dict = {
                    "invalid": True,
                    "invalid_details": invalid_details_dict
                }
            except:
                # If a unique trigger_symbol/alert_level doesnt have invalid
                # entry, it will go here.
                pass

            trig_sym = item.trigger_symbol

            trigger_source = trig_sym.trigger_hierarchy.trigger_source
            source_id = trig_sym.source_id
            alert_level = trig_sym.alert_level
            ots_row = retrieve_data_from_memcache("operational_trigger_symbols", \
                            {"alert_level": alert_level, "source_id": source_id})
            alert_symbol = ots_row["alert_symbol"]
            internal_sym_id = ots_row["internal_alert_symbol"]["internal_sym_id"]

            # Form a dictionary that will hold all trigger details
            trigger_dict = {
                "trigger_type": trigger_source,
                "source_id": source_id,
                "alert_level": alert_level,
                "trigger_id": item.trigger_id,
                "alert": alert_symbol,
                "ts_updated": str(item.ts_updated),
                "internal_sym_id": internal_sym_id
            }

            # Prepare the tech_info of the trigger
            # NOTE: MOMS list to be used should be moms_special_details (all moms within interval hours)
            # REFACTOR tech_info_maker processes if possible.
            trigger_tech_info = tech_info_maker.main(item)

            if trigger_source == "rainfall":
                rainfall = {
                    "rain_gauge": trigger_tech_info["rain_gauge"],
                    "tech_info": trigger_tech_info["tech_info_string"]
                }
                trigger_dict.update(rainfall)
            elif trigger_source == "moms":
                if site_moms_alerts_list:
                    recent_moms_details = list(filter(lambda x: x.observance_ts == item.ts_updated, site_moms_alerts_list))
                    # Get the highest triggering moms
                    sorted_moms_details = sorted(recent_moms_details, key=lambda x: x.op_trigger, reverse=True)

                    moms_list = []
                    if sorted_moms_details:
                        sorted_moms_details_data = MONITORING_MOMS_SCHEMA.dump(sorted_moms_details).data
                        moms_list = sorted_moms_details_data
                    
                    moms_special_details = {
                        "tech_info": trigger_tech_info,
                        "moms_list": moms_list,
                        "moms_list_notice": "Don't use this as data for " + \
                            "MonitoringMomsReleases. This might be incomplete. " + \
                            "Use moms from current_trigger_alerts instead."
                    }
                    trigger_dict.update(moms_special_details)
            else:
                trigger_dict["tech_info"] = trigger_tech_info

            # # Add the invalid details same level to the dictionary attributes
            trigger_dict.update(final_invalids_dict)

            recent_triggers_list.append(trigger_dict)
    
    # else:
    #     trigger_dict = {}
    #     recent_triggers_list.append(trigger_dict)

    return recent_triggers_list


def check_if_has_unresolved_moms_instance(site_moms_alerts_list):
    """
    This function returns unresolved_moms_list which is a collection
    of MonitoringMoms which has op_trigger above 0 A.K.A. unclosed
    moms event. All moms_instance should end to 0.

    Args:
        unresolved_moms_list (List)
    """

    unresolved_moms_list = []
    unique_moms_instance_set = set({})
    for site_moms in site_moms_alerts_list:
        instance_id = site_moms.instance_id

        if not (instance_id in unique_moms_instance_set):
            if site_moms.op_trigger > 0:
                moms_data = MonitoringMomsSchema(exclude=(
                    "moms_releases", "validator", "reporter", "narrative")).dump(site_moms).data
                unresolved_moms_list.append(moms_data)

            unique_moms_instance_set.add(instance_id)
        
    return unresolved_moms_list


def create_internal_alert(highest_public_alert, processed_triggers_list, current_trigger_alerts, ground_alert_level):
    """
    Creates the internal alert.

    NOTE: LOUIE Add args 
    
    Returns:
        internal_alert (String)
    """
    internal_alert = ""
    pas_row = retrieve_data_from_memcache("public_alert_symbols", {
                                            "alert_level": highest_public_alert})
    public_alert_symbol = pas_row["alert_symbol"]
    th_row = retrieve_data_from_memcache("trigger_hierarchies", {"trigger_source": "internal"})
    internal_source_id = th_row["source_id"]

    if ground_alert_level == -1 and highest_public_alert <= 1:
        ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                            "alert_level": ground_alert_level, 
                                            "source_id": internal_source_id})
        public_alert_symbol = ots_row["internal_alert_symbol"]["alert_symbol"]

    internal_alert = public_alert_symbol
    
    if highest_public_alert > 0:
        internal_alert += "-"

        sorted_processed_triggers_list = sorted(processed_triggers_list,
                                key=lambda x: x.trigger_symbol.trigger_hierarchy.hierarchy_id)
        
        internal_alert_symbols = []
        for item in sorted_processed_triggers_list:
            internal_alert_symbols.append(item.trigger_symbol.internal_alert_symbol.alert_symbol)
        internal_alert_triggers = "".join(internal_alert_symbols)
        internal_alert += internal_alert_triggers

    # Check if rainfall is active (included in current_trigger_alerts)
    try:
        rainfall_cta = current_trigger_alerts["rainfall"]
        if rainfall_cta["alert_level"] == -2:
            internal_alert += rainfall_cta["alert_symbol"]
    except KeyError:
        pass
    except Exception as err:
        print(err)
        raise

    return internal_alert


def get_ground_alert_level(highest_public_alert, current_trigger_alerts, processed_triggers_list):
    """
    Identifies the summarized ground alert level for all
    ground triggers.
    """
    if highest_public_alert <= 1:
        ground_alert_level = -1
        for trigger_source in current_trigger_alerts:
            trigger_alert = current_trigger_alerts[trigger_source]
            if trigger_alert["th_row"]["is_ground"]:
                # NOTE: This will break protocol RE: moms data presence should be the
                #  last option as basis for ground data
                if trigger_alert["alert_level"] != -1:
                    ground_alert_level = 0
                    break
    else:
        ground_alert_level = 0
        for op_triggers in processed_triggers_list:
            op_trigger_th = op_triggers.trigger_symbol.trigger_hierarchy
            trigger_source = op_trigger_th.trigger_source
            is_ground_trigger = op_trigger_th.is_ground
            if is_ground_trigger:
                cta_alert_level = current_trigger_alerts[trigger_source]["alert_level"]
                if cta_alert_level == -1:
                    ground_alert_level = -1

    return ground_alert_level


def check_subsurface_data_presence(subsurface_alerts_list):
    """
    """

    has_data = False
    for subsurface in subsurface_alerts_list:
        if subsurface["alert_level"] != -1:
            has_data = True
            break

    return has_data


def update_positive_triggers_with_no_data(highest_unique_positive_triggers_list, no_data_list, query_ts_end):
    """
    Replace alert symbol of entries on positive triggers list
    based on the current no data presence (no_data_list)
    (e.g Entry on positive_triggers_list alert symbol => G will be replaced by G0)

    returns updated highest_unique_positive_triggers_list
    """

    global RELEASE_INTERVAL_HOURS
    interval = RELEASE_INTERVAL_HOURS

    for pos_trig in highest_unique_positive_triggers_list:
        ts_updated = pos_trig.ts_updated
        ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
            "trigger_sym_id": pos_trig.trigger_sym_id})

        source_id = ots_row["source_id"]
        trigger_source = ots_row["trigger_hierarchy"]["trigger_source"]
        if any(trig_source == trigger_source for trig_source in no_data_list):
            # If positive trigger is not within release time interval,
            # replace symbol to its respective ND symbol.
            if not (ts_updated >= round_to_nearest_release_time(query_ts_end, interval)
                - timedelta(hours=interval)):
                nd_row = retrieve_data_from_memcache(
                    "operational_trigger_symbols", {
                        "alert_level": -1,
                        "source_id": source_id
                    })
                nd_internal_symbol = nd_row["internal_alert_symbol"]["alert_symbol"]

                ots_source_row = retrieve_data_from_memcache(
                    "operational_trigger_symbols", {
                        "source_id": source_id
                    }, retrieve_one=False)

                # max_alert_row = list(
                #     sorted(ots_source_row, key=lambda x: x["alert_level"], reverse=True))[0]
                max_alert_row = next(iter(sorted(ots_source_row, key=lambda x: x["alert_level"], reverse=True)))

                # Get the lowercased version of [x]2 triggers (g2, s2)
                # Rationale: ND-symbols on internal alert are in UPPERCASE
                if ots_row["alert_level"] < max_alert_row["alert_level"]:
                    nd_internal_symbol = nd_internal_symbol.lower()

                # This, in theory overwrites data from the database because it
                # manipulates data from SQLAlchemy Models tho we are rolling back
                # database changes before saving updates on public alerts
                pos_trig_sym = pos_trig.trigger_symbol
                pos_trig_sym.internal_alert_symbol.alert_symbol = nd_internal_symbol
                # pos_trig_sym.alert_level = -1

    return highest_unique_positive_triggers_list


def extract_no_data_triggers(release_op_triggers_list):
    """
    Check for no data presence for all release triggers

    Note: All triggers do not produce alert
          level -1 entry on operational_triggers table

    returns list of op_trigger entries with no data (alert level -1)
    """
    # Get a sorted list of release triggers
    sorted_release_triggers_list = sorted(
        release_op_triggers_list, key=lambda x: x.ts_updated, reverse=True)

    # Get trigger hierarchies map and loop to check data_presence type
    th_map = retrieve_data_from_memcache(
        "trigger_hierarchies", retrieve_one=False)

    no_data_list = []
    for th in th_map:
        if th["data_presence"] != 0:
            if not any(release_op_trig.trigger_symbol.source_id == th["source_id"] for release_op_trig in sorted_release_triggers_list):
                no_data_list.append(th)

    return no_data_list


def extract_highest_unique_triggers_per_type(unique_positive_triggers_list):
    """
    Get the highest trigger level per trigger type/source
    (i.e. "surficial", "rainfall")

    Example: ["surficial", "l2"] and ["surficial", "l3"]
    are not unique and the second instance will be returned
    """
    # Get a sorted list of historical triggers
    sorted_positive_triggers_list = sorted(
        unique_positive_triggers_list, key=lambda x: x.trigger_symbol.alert_level, reverse=True)

    temp = []
    unique_pos_trig_set = set({})
    for item in sorted_positive_triggers_list:
        source_id = item.trigger_symbol.source_id

        if not (source_id in unique_pos_trig_set):
            unique_pos_trig_set.add(source_id)
            temp.append(item)

    sorted_positive_triggers_list = temp
    return sorted_positive_triggers_list


def get_processed_internal_alert_symbols(unique_positive_triggers_list, current_trigger_alerts, query_ts_end, is_end_of_validity, latest_rainfall_alert):
    """
    Returns an updated unique_positive_triggers_list
    (i.e. alert_symbols appropriated to no data)

    List returned will be used mainly in internal alert level generation

    returns list of OperationalTriggers class
    """
    # Declare the essential lists
    no_data_list = []

    # Get a sorted list of historical triggers
    highest_unique_positive_triggers_list = extract_highest_unique_triggers_per_type(
        unique_positive_triggers_list)

    # Extract all trigger sources with no data
    # no_data_list = extract_no_data_triggers(release_op_triggers_list)
    no_data_list = []
    for trig_source in current_trigger_alerts:
        if trig_source == "subsurface":
            has_data = check_subsurface_data_presence(
                current_trigger_alerts[trig_source]["trigger_details"])

            if not has_data:
                no_data_list.append(trig_source)
        elif current_trigger_alerts[trig_source]["alert_level"] == -1:
            no_data_list.append(trig_source)

    updated_h_u_p_t_list = update_positive_triggers_with_no_data(
        highest_unique_positive_triggers_list, no_data_list, query_ts_end)

    # Check first if rainfall trigger is active.
    rainfall_th_row = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "rainfall"})
    if rainfall_th_row["is_active"]:
        # Process rainfall trigger if above 75% threshold
        if current_trigger_alerts["rainfall"]["alert_level"] == 0 and latest_rainfall_alert and is_end_of_validity:
            rain_trigger_index = next((index for (index, trig) in enumerate(updated_h_u_p_t_list) \
                if trig.trigger_symbol.internal_alert_symbol.trigger_source == "rainfall"), None)
            
            rainfall_rx_symbol = get_rainfall_rx_symbol(rain_trigger_index)
            updated_h_u_p_t_list[rain_trigger_index].trigger_symbol.internal_alert_symbol.alert_symbol = rainfall_rx_symbol
            
            current_trigger_alerts["rainfall"]["alert_level"] = -2
            current_trigger_alerts["rainfall"]["alert_symbol"] = rainfall_rx_symbol

    return updated_h_u_p_t_list, current_trigger_alerts


def get_validity_variables(positive_triggers_list, highest_public_alert, query_ts_end):
    """
    Assuming you have positive_triggers, hence highest_alert_level > 0,

    Return the validity and is_end_of_validity status
        validity (Datetime)
        is_end_of_validity (Boolean)
    """
    max_trigger_ts_updated = max(
        positive_triggers_list, key=lambda x: x.ts_updated).ts_updated

    high_pas_row = retrieve_data_from_memcache(
        "public_alert_symbols", {"alert_level": highest_public_alert})
    high_pas_duration = high_pas_row["duration"]

    validity = max_trigger_ts_updated + \
        timedelta(hours=high_pas_duration)
    validity = round_to_nearest_release_time(validity)

    is_end_of_validity = (validity - timedelta(minutes=30)) <= query_ts_end

    return validity, is_end_of_validity


def add_special_case_details(trigger_source, accessory_detail):
    """
    NOTE: LOUIE add description
    """

    trigger_details = {}

    if trigger_source == "rainfall":
        latest_rainfall_alert = accessory_detail
        trigger_details["rain_gauge"] = get_rainfall_gauge_name(
            latest_rainfall_alert)
    elif trigger_source == "moms":
        site_moms_alerts_list = accessory_detail["site_moms_alerts_list"]
        surficial_moms_window_ts = accessory_detail["surficial_moms_window_ts"]

        current_moms_list = list(filter(
            lambda x: x.observance_ts >= surficial_moms_window_ts, site_moms_alerts_list))

        if current_moms_list:
            current_moms_list_data = MONITORING_MOMS_SCHEMA.dump(
                current_moms_list).data
            highest_row = next(iter(sorted(current_moms_list, key=lambda x: x.op_trigger, reverse=True)))
            highest_moms_alert_for_release_period = highest_row.op_trigger
            moms_th_row = retrieve_data_from_memcache("trigger_hierarchies", {"trigger_source": "moms"})
            ot_row = retrieve_data_from_memcache("operational_trigger_symbols", { \
                "alert_level": highest_moms_alert_for_release_period,
                "source_id": moms_th_row["source_id"]})

            ###
            # Overwrite initial alert level and alert symbol set on parent function
            # because the first moms op_trigger MIGHT NOT BE the highest moms alert
            # (i.e. if multiple moms op_trigger exist within a release period)
            ###
            trigger_details = {
                "alert_level": highest_moms_alert_for_release_period,
                "alert_symbol": ot_row["alert_symbol"],
                "moms_list": current_moms_list_data
            }
    elif trigger_source == "surficial":
        op_trigger = accessory_detail
        trigger_details = {
            "last_data_ts": str(op_trigger.ts_updated)
        }
    else:
        raise Exception("Trigger source specified not found.")

    return trigger_details


def get_rainfall_rx_symbol(rain_trigger_index):
    """
    Get the appropriate Rx/rx symbol for trigger

    Returns:
        rainfall_rx_symbol (String): Rx if there is rainfall trigger; rx if no rainfall trigger
    """
    rain_th_row = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "rainfall"})
    ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                          "alert_level": -2, "source_id": rain_th_row["source_id"]})
    rain_75_id = ots_row["trigger_sym_id"]
    ias_row = retrieve_data_from_memcache("internal_alert_symbols", {"trigger_sym_id": rain_75_id})
    rainfall_rx_symbol = ias_row["alert_symbol"]

    if not rain_trigger_index:
        rainfall_rx_symbol = rainfall_rx_symbol.lower()

    return rainfall_rx_symbol


def get_current_trigger_alert_conditions(release_op_triggers_list, surficial_moms_window_ts, latest_rainfall_alert, subsurface_alerts_list, moms_trigger_condition):
    """
    This function adds the special details to each triggers.

    Returns a dictionary of each rainfall, surficial, moms (optional) with the following properties:
        1. alert_level
        2. alert_symbol
        3. details of trigger
    """

    current_trigger_alerts = {}

    th_map = retrieve_data_from_memcache("trigger_hierarchies", {"is_active": 1}, retrieve_one=False)
    no_data_list = []
    for th in th_map:
        # Only entertain trigger sources who needs checking of data presence
        if th["data_presence"] != 0:

            # NOTE: LOUIE Handle data presence of routine (moms, surficial) (1 day)
            # If current TH is not found on rel triggers, trigger source is ND.
            source_id = th["source_id"]
            rel_trigger_entry = next(filter(lambda x: x.trigger_symbol.source_id == source_id, release_op_triggers_list), None)
            trigger_source = th["trigger_source"]

            # If the trigger_type/_source does not exist in release trigger list,
            # It is ND. Add default ND values.
            if not rel_trigger_entry:
                no_data_list.append(th)
                nd_alert_symbol_row = retrieve_data_from_memcache("operational_trigger_symbols", {"alert_level": -1, "source_id": source_id})
                nd_alert_symbol = nd_alert_symbol_row["alert_symbol"]

                current_trigger_alerts[trigger_source] = {
                    "alert_level": -1,
                    "alert_symbol": nd_alert_symbol,
                    "th_row": th
                }
            else:
                trigger_sym_id = rel_trigger_entry.trigger_sym_id
                ot_row = retrieve_data_from_memcache("operational_trigger_symbols", {"trigger_sym_id": trigger_sym_id})

                current_trigger_alerts[trigger_source] = {
                    "alert_level": ot_row["alert_level"],
                    "alert_symbol": ot_row["alert_symbol"],
                    "th_row": th
                }

                # Add necessary special details to Rainfall, Moms
                if trigger_source in ["rainfall", "surficial", "moms"]:
                    if trigger_source == "rainfall":
                        accessory_detail = latest_rainfall_alert
                    elif trigger_source == "moms":
                        accessory_detail = {
                            "site_moms_alerts_list": moms_trigger_condition["site_moms_alerts_list"],
                            "surficial_moms_window_ts": surficial_moms_window_ts
                        }
                    elif trigger_source == "surficial":
                        accessory_detail = rel_trigger_entry
                    
                    trigger_details = add_special_case_details(trigger_source, accessory_detail)
                    current_trigger_alerts[trigger_source] = { **current_trigger_alerts[trigger_source], **trigger_details }

    if any(filter(lambda x: x["trigger_source"] == "moms", th_map)):
        # remove moms from current_trigger_alerts since moms data is optional
        # when moms is not on heightened trigger
        if not moms_trigger_condition["has_positive_moms_trigger"] and \
            current_trigger_alerts["moms"]["alert_level"] == -1:
                del current_trigger_alerts["moms"]

    # If none, subsurface is not active
    if subsurface_alerts_list is not None:
        current_trigger_alerts["subsurface"]["trigger_details"] = subsurface_alerts_list

    return current_trigger_alerts


def get_tsm_alerts(site_tsm_sensors, query_ts_end):
    """
    Returns subsurface details of sensors (if any) per site

    returns tsm_alerts_list (list)
    """
    ta = TSMAlerts

    subsurface_th_row = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "subsurface"})
    subsurface_source_id = subsurface_th_row["source_id"]

    tsm_alerts_list = []
    for sensor in site_tsm_sensors:
        tsm_alert_entries = sensor.tsm_alert.filter(DB.and_(
            ta.ts <= query_ts_end, ta.ts_updated >= query_ts_end - timedelta(minutes=30))).all()

        # Note: tsm_alert_entries is expected to
        # return ONLY ONE row (if has data)
        # because of the nature of the query (check filter)

        if tsm_alert_entries:
            entry = tsm_alert_entries[0]
            subsurface_ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                                             "alert_level": entry.alert_level, "source_id": subsurface_source_id})
            alert_symbol = subsurface_ots_row["alert_symbol"]

            formatted = {
                "tsm_name": entry.tsm_sensor.logger.logger_name,
                "alert_level": entry.alert_level,
                "alert_symbol": alert_symbol
            }
            tsm_alerts_list.append(formatted)

    return tsm_alerts_list


def get_moms_and_surficial_window_ts(highest_public_alert, query_ts_end):
    """
    Returns the timestamp to be used in querying surficial and moms data
    that will be used in checking surficial and moms alerts
    AND surficial and moms data presence
    """

    if highest_public_alert > 0:
        window_ts = round_to_nearest_release_time(
            # query_ts_end) - timedelta(hours=4)
            query_ts_end) - timedelta(hours=4)
    else:
        window_ts = datetime.combine(query_ts_end.date(), time(0, 0))
    return window_ts


def get_highest_public_alert(positive_triggers_list):
    """
    Returns the maximum public alert.

    Args:
        positive_triggers_list: List of OperationalTriggers class.
    """

    sorted_list = sorted(positive_triggers_list,
                         key=lambda x: x.trigger_symbol.alert_level, reverse=True)

    highest_public_alert = 0
    if sorted_list:
        highest_public_alert = sorted_list[0].trigger_symbol.alert_level

    return highest_public_alert


def extract_unique_positive_triggers(positive_triggers_list):
    """
    Remove duplicates per unique trigger_source (i.e. subsurface, surficial)
    and operational trigger alert level combination

    (e.g Entries for ("surficial", g2) & ("surficial", g3) are unique)
    """

    unique_positive_triggers_list = []
    unique_pos_trig_set = set({})
    for item in positive_triggers_list:
        trig_symbol = item.trigger_symbol
        tuple_entry = (
            trig_symbol.source_id,
            trig_symbol.alert_level
        )

        if not (tuple_entry in unique_pos_trig_set):
            unique_pos_trig_set.add(tuple_entry)
            unique_positive_triggers_list.append(item)

    return unique_positive_triggers_list


def get_invalid_triggers(positive_triggers_list):
    """
    Get invalid alerts by using the created relationship
        'operational_triggers_table.alert_status'

    returns invalid_dict (dictionary): dictionary of key::value pair \
                                        (trigger_sym_id::invalid_alert_status_details)
    """

    invalids_dict = {}
    for item in positive_triggers_list:
        alert_status_entry = item.alert_status

        if alert_status_entry and alert_status_entry.alert_status == -1:
            trigger_sym_id = item.trigger_sym_id
            if trigger_sym_id in invalids_dict:
                # Check for latest invalidation entries
                if invalids_dict[trigger_sym_id].ts_ack < alert_status_entry.ts_ack:
                    invalids_dict[trigger_sym_id] = alert_status_entry
            else:
                invalids_dict[trigger_sym_id] = alert_status_entry

    return invalids_dict


def extract_positive_triggers_list(op_triggers_list):
    """
    Get all positive triggers from historical op_triggers_list
    """

    positive_triggers_list = []

    surficial_th_row = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "surficial"})
    surficial_source_id = surficial_th_row["source_id"]

    for op_trigger in op_triggers_list:
        op_trig = op_trigger.trigger_symbol

        # Filter for g0t alerts (surficial trending alerts for validation)
        # DYNAMIC: TH_MAP
        g0t_filter = not (op_trig.alert_level ==
                          1 and op_trig.source_id == surficial_source_id)
        if op_trig.alert_level > 0 and g0t_filter:
            positive_triggers_list.append(op_trigger)

    return positive_triggers_list


def extract_release_op_triggers(op_triggers_query, query_ts_end, release_interval_hours):
    """
    Get all operational triggers released within the four-hour window before release
    with exception for subsurface triggers
    """

    # Get the triggers within 4 hours before the release AND use "distinct" to remove duplicates
    interval = release_interval_hours

    release_op_triggers = op_triggers_query.filter(
        ot.ts_updated >= round_to_nearest_release_time(query_ts_end, interval) - timedelta(hours=interval)).distinct().all()


    # DYNAMIC: TH_MAP
    on_run_triggers_list = retrieve_data_from_memcache(
        "trigger_hierarchies", {"data_presence": 1}, retrieve_one=False)
    on_run_triggers_s_id_list = []
    for item in on_run_triggers_list:
        on_run_triggers_s_id_list.append(item["source_id"])

    # Remove subsurface triggers less than the actual query_ts_end
    # Data presence for subsurface is limited to the current runtime only (not within 4 hours)
    release_op_triggers_list = []
    for release_op_trig in release_op_triggers:
        if not (release_op_trig.trigger_symbol.source_id in on_run_triggers_s_id_list and release_op_trig.ts_updated < query_ts_end):
            release_op_triggers_list.append(release_op_trig)

    return release_op_triggers_list


def get_operational_triggers_within_monitoring_period(s_op_triggers_query, monitoring_start_ts, query_ts_end):
    """
    Returns an appender base query containing alert level on each operational
    trigger from start of monitoring to end

    IMPORTANT: operational_triggers that has no data (alert_level = -1) is
    not returned to standardize data presence identification (i.e. If no 
    table entry for a specific time interval, trigger is considered as
    no data.)

    Args:
        monitoring_start_ts (datetime): Timestamp of start of monitoring.
        end (datetime): Public alert timestamp.

    Returns:
        dataframe: Contains timestamp range of alert, three-letter site code,
                   operational trigger, alert level, and alert symbol from
                   start of monitoring
    """

    op_trigger_of_site = s_op_triggers_query.order_by(DB.desc(ot.ts)).filter(
        and_(ot.ts_updated >= monitoring_start_ts, ot.ts <= query_ts_end)).join(ots).filter(ots.alert_level != -1)

    return op_trigger_of_site


def get_event_start_timestamp(latest_site_public_alerts, max_possible_alert_level):
    """
    Timestamp of start of event monitoring. Start of event is identified
    by checking series of events until it reaches the entry prior an
    Alert 0 entry (i.e. onset of event)

    Args:
        latest_site_public_alerts (SQLAlchemy Class): all PublicAlert 
                                entries of an event sorted by TS desc
        max_possible_alert_level (Int): Number of alert levels excluding zero

    Returns:
        datetime: Timestamp of start of monitoring.
    """

    highest_alert_level = max_possible_alert_level + 1
    ts_start = None
    for latest_pa in latest_site_public_alerts:
        current_alert_level = latest_pa.alert_symbol.alert_level

        if current_alert_level == 0:
            break
        elif highest_alert_level > current_alert_level:
            highest_alert_level = current_alert_level
            ts_start = latest_pa.ts

    return ts_start


def get_monitoring_start_ts(monitoring_type, latest_site_public_alerts, query_ts_end, max_possible_alert_level):
    """
    Return monitoring start.
    """

    # Check if the monitoring type is event, otherwise, it is a routine.
    if monitoring_type == "event":
        # Event. Get most recent alert event
        monitoring_start_ts = get_event_start_timestamp(
            latest_site_public_alerts, max_possible_alert_level)
    else:
        # Routine. Get the time of the previous day.
        monitoring_start_ts = query_ts_end - timedelta(days=1)

    return monitoring_start_ts


def get_latest_public_alerts_per_site(s_pub_alerts_query, query_ts_end, max_possible_alert_level):
    """
    Get the most recent public alert type. 
    Limit based on the number of alert levels
    excluding alert zero.
    """

    limit = max_possible_alert_level
    most_recent = s_pub_alerts_query.order_by(DB.desc(pa.ts)).filter(
        or_(pa.ts_updated <= query_ts_end, and_(pa.ts <= query_ts_end, query_ts_end <= pa.ts_updated))).limit(limit).all()

    # If return_one is False, return the AppenderBaseQuery to be filtered.
    return most_recent


def get_site_public_alerts(active_sites, query_ts_start, query_ts_end, do_not_write_to_db):
    ######################################
    # LOOP THROUGH ACTIVE SITES PROVIDED #
    ######################################

    # GLOBALS DECLARATION
    global MAX_POSSIBLE_ALERT_LEVEL
    global RELEASE_INTERVAL_HOURS

    max_possible_alert_level = MAX_POSSIBLE_ALERT_LEVEL
    release_interval_hours = RELEASE_INTERVAL_HOURS


    site_public_alerts_list = []
    # Check if not a list, which means run one site only.
    if not isinstance(active_sites, (list,)):
        active_sites = [active_sites]

    for site in active_sites:
        site_id = site.site_id
        site_code = site.site_code
        s_pub_alerts_query = site.public_alerts
        s_op_triggers_query = site.operational_triggers

        # Get the single latest recent public_alerts.pub_sym_id for
        # current site then get it's alert type.
        latest_site_public_alerts = get_latest_public_alerts_per_site(
            s_pub_alerts_query, query_ts_end, max_possible_alert_level)

        # Check if event or routine
        latest_site_pa = latest_site_public_alerts[0]
        monitoring_type = check_if_routine_or_event(latest_site_pa.pub_sym_id)

        # Get the event start
        monitoring_start_ts = get_monitoring_start_ts(
            monitoring_type, latest_site_public_alerts, query_ts_end, max_possible_alert_level)

        ###################################
        # OPERATIONAL TRIGGERS MANIPULATION
        ###################################
        # Get all operational triggers of the site
        op_triggers_query = get_operational_triggers_within_monitoring_period(
            s_op_triggers_query, monitoring_start_ts, query_ts_end)
        op_triggers_list = op_triggers_query.all()

        release_op_triggers_list = extract_release_op_triggers(
            op_triggers_query, query_ts_end, release_interval_hours)

        positive_triggers_list = extract_positive_triggers_list(
            op_triggers_list)

        ###############################
        # INVALID TRIGGERS PROCESSING #
        ###############################
        invalids_dict = get_invalid_triggers(positive_triggers_list)

        # Get unique positive triggers
        unique_positive_triggers_list = extract_unique_positive_triggers(
            positive_triggers_list)

        ######################
        # GET TRIGGER ALERTS #
        ######################

        # Get highest public alert level
        highest_public_alert = get_highest_public_alert(
            positive_triggers_list)

        # Get surficial and moms data presence window timestamp query
        # DYNAMIC: Adapt window_ts values based on DB
        surficial_moms_window_ts = get_moms_and_surficial_window_ts(
            highest_public_alert, query_ts_end)

        # Get current moms alerts within ts_onset and query_ts_end
        # A.K.A. all moms within an event
        site_moms_alerts_list, highest_moms_alert = get_site_moms_alerts(
            site_id, monitoring_start_ts, query_ts_end)
        has_positive_moms_trigger = False
        if highest_moms_alert > 0:
            has_positive_moms_trigger = True

        unresolved_moms_list = []
        if site_moms_alerts_list and has_positive_moms_trigger:
            unresolved_moms_list = check_if_has_unresolved_moms_instance(site_moms_alerts_list)

        moms_trigger_condition = {
            "site_moms_alerts_list": site_moms_alerts_list, 
            "highest_moms_alert": highest_moms_alert, 
            "has_positive_moms_trigger": has_positive_moms_trigger
        }

        current_trigger_alerts = {}

        # Get subsurface TH map
        subsurface_th_row = retrieve_data_from_memcache(
            "trigger_hierarchies", {"trigger_source": "subsurface"})
        # Get current subsurface alert
        # Special function to Dyna3, no need to modularize
        subsurface_alerts_list = None
        if subsurface_th_row["is_active"]:
            site_tsm_sensors = site.tsm_sensors.all()
            subsurface_alerts_list = get_tsm_alerts(
                site_tsm_sensors, query_ts_end)

        latest_rainfall_alert = None
        rainfall_th_row = retrieve_data_from_memcache(
            "trigger_hierarchies", {"trigger_source": "rainfall"})
        if rainfall_th_row["is_active"]:
            latest_rainfall_alert = site.rainfall_alerts.order_by(DB.desc(ra.ts)).filter(
                ra.ts == query_ts_end).first()

        current_trigger_alerts = get_current_trigger_alert_conditions(release_op_triggers_list, surficial_moms_window_ts, latest_rainfall_alert, subsurface_alerts_list, moms_trigger_condition)            

        ###################
        # INTERNAL ALERTS #
        ###################
        # will contain updated triggers later (if alert > 0)
        processed_triggers_list = []
        if highest_public_alert > 0:
            validity, is_end_of_validity = get_validity_variables(positive_triggers_list, highest_public_alert, query_ts_end)

            processed_triggers_list, current_trigger_alerts = get_processed_internal_alert_symbols(
                unique_positive_triggers_list, current_trigger_alerts, query_ts_end, is_end_of_validity, latest_rainfall_alert)

        # Identify the summarized ground alert level for all ground triggers [-1, 0]
        ground_alert_level = get_ground_alert_level(highest_public_alert, current_trigger_alerts, processed_triggers_list)

        internal_alert = create_internal_alert(highest_public_alert,
                                               processed_triggers_list, current_trigger_alerts, ground_alert_level)

        ################
        # PUBLIC ALERT #
        ################
        global ALERT_EXTENSION_LIMIT
        global NO_DATA_HOURS_EXTENSION

        alert_extension_limit = ALERT_EXTENSION_LIMIT
        no_data_hours_extension = NO_DATA_HOURS_EXTENSION

        is_alert_for_lowering = False
        if highest_public_alert > 0:
            release_time = round_to_nearest_release_time(query_ts_end, release_interval_hours)

            #############
            # LOWERING CONDITIONS STARTS HERE
            #############
            is_release_time_run = query_ts_end == release_time - timedelta(minutes=30)
            is_45_minute_beyond = int(query_ts_start.strftime("%M")) > 45
            is_not_yet_write_time = not (
                is_release_time_run and is_45_minute_beyond)

            # Check first if rainfall trigger is active, if key does not 
            # exist, is_rainfall_rx is automatically False
            # -2 is currently the alert level for Rx/rx
            try:
                is_rainfall_rx = current_trigger_alerts["rainfall"]["alert_level"] == -2
            except KeyError:
                is_rainfall_rx = False
                pass
            except Exception as err:
                print(err)
                raise

            is_within_alert_extension_limit = validity + \
                timedelta(hours=alert_extension_limit) > query_ts_end + timedelta(minutes=30)
            has_no_ground_alert = ground_alert_level == -1
            # If has data, True, else, False
            has_unresolved_moms = bool(unresolved_moms_list)

            if is_end_of_validity:
                # Checks all lowering conditions before lowering
                if is_rainfall_rx or (is_within_alert_extension_limit and has_no_ground_alert) \
                    or is_not_yet_write_time or (has_unresolved_moms and is_within_alert_extension_limit):
                    validity = round_to_nearest_release_time(data_ts=query_ts_end + timedelta(minutes=30), interval=no_data_hours_extension)

                    if is_release_time_run:
                        if not(is_45_minute_beyond):
                            do_not_write_to_db = True
                else:
                    is_alert_for_lowering = True

        if highest_public_alert == 0 or is_alert_for_lowering:
            validity = ""
            highest_public_alert = 0
            source_id = retrieve_data_from_memcache(
                "trigger_hierarchies", {"trigger_source": "internal"})["source_id"]
            ots_row = retrieve_data_from_memcache(
                "operational_trigger_symbols", {
                    "alert_level": ground_alert_level,
                    "source_id": source_id
                })

            internal_alert = ots_row["internal_alert_symbol"]["alert_symbol"]

        ######################
        # START OF AN EVENT! #
        ######################
        if monitoring_type != "event" and positive_triggers_list:
            ts_onset = min(positive_triggers_list,
                           key=lambda x: x.ts).ts

        ####################################
        # PREPARE DATA FOR JSON GENERATION #
        ####################################

        # EVENT TRIGGERS: most recent retrigger of positive operational triggers
        event_triggers = format_recent_retriggers(
            unique_positive_triggers_list, invalids_dict, site_moms_alerts_list)
        
        # RELEASE TRIGGERS: current status prior to release time
        formatted_current_trigger_alerts = format_current_trigger_alerts(current_trigger_alerts)

        # Identify last data_ts on operational_triggers, else use query_ts_end
        try:
            op_trig_with_data_list = []
            for item in op_triggers_list:
                if item.trigger_symbol.alert_level != -1:
                    op_trig_with_data_list.append(item)
            data_ts = max(op_trig_with_data_list,
                            key=lambda x: x.ts_updated).ts_updated
            data_ts = round_down_data_ts(data_ts)
        except:
            data_ts = query_ts_end

        # Force data_ts to be query_ts_end especially if there
        # is no latest data
        minute = int(query_ts_start.strftime('%M'))
        if data_ts > query_ts_end or \
            ((minute >= 45 or 15 <= minute and minute < 30) and \
                data_ts != query_ts_end):
            data_ts = query_ts_end

        data_ts = str(data_ts)
        validity = str(validity)

        public_alert_th_row = retrieve_data_from_memcache(
            "public_alert_symbols", {"alert_level": highest_public_alert})
        public_alert_symbol = public_alert_th_row["alert_symbol"]

        # FORM THE SITE PUBLIC ALERT FOR GENERATED ALERTS
        public_dict = {
            "ts": data_ts,
            "site_id": site_id,
            "site_code": site_code,
            "purok": site.purok,
            "sitio": site.sitio,
            "barangay": site.barangay,
            "public_alert": public_alert_symbol,
            "internal_alert": internal_alert,
            "validity": validity,
            "event_triggers": event_triggers,
            "current_trigger_alerts": formatted_current_trigger_alerts,
            "unresolved_moms_list": unresolved_moms_list
        }

        try:
            public_alert_ts = round_down_data_ts(ts_onset)
        except:
            public_alert_ts = query_ts_end

        # writes public alert to database
        pub_sym_id = public_alert_th_row["pub_sym_id"]

        for_db_public_dict = {
            "ts": public_alert_ts,
            "site_id": site_id,
            "pub_sym_id": pub_sym_id, "ts_updated": query_ts_end,
            "pub_alert_symbol": public_alert_symbol
        }

        ####################################
        # TRY TO WRITE TO DB PUBLIC_ALERTS #
        ####################################
        if not do_not_write_to_db:
            try:
                current_pa_id = latest_site_pa.public_id

                # Revert any changes made in SQLAlchemy objects. No DB updates necessary
                # up to this point.
                DB.session.rollback()

                public_alert_result = write_to_db_public_alerts(
                    for_db_public_dict, latest_site_pa)
                if public_alert_result == "exists":
                    print()
                    print(
                        f"Active Public alert with ID: {current_pa_id} on Database.")
                else:
                    print()
                    print(f"NEW PUBLIC ALERT WRITTEN with ID: {public_alert_result}")

            except Exception as err:
                print(err)
                DB.session.rollback()
                raise

        ######################
        # !!!! PRINTERS !!!! #
        ######################
        site_public_alert = public_alert_symbol
        var_checker(f"{site_code.upper()}", f"Public Alert: {site_public_alert}", True)

        site_public_alerts_list.append(public_dict)

    return site_public_alerts_list


def main(query_ts_end=None, query_ts_start=None, is_test=False, site_code=None):
    """
    """
    script_start = datetime.now()

    try:
        query_ts_start = datetime.strptime(query_ts_start, "%Y-%m-%d %H:%M:%S")
    except:
        query_ts_start = datetime.now()

    print(f"{query_ts_start} | Generating Alerts...")
    do_not_write_to_db = is_test

    if query_ts_end is None:
        query_ts_end = datetime.now()
    else:
        query_ts_end = datetime.strptime(query_ts_end, "%Y-%m-%d %H:%M:%S")

    # query_ts_end will be rounded off at this point
    query_ts_end = round_down_data_ts(query_ts_end)
    active_sites = get_sites_data(site_code)  # site_code is default to None

    generated_alerts = get_site_public_alerts(
        active_sites, query_ts_start, query_ts_end, do_not_write_to_db)

    # Sort per alert level
    generated_alerts.sort(key=extract_alert_level, reverse=True)

    # Convert data to JSON
    json_data = json.dumps(generated_alerts)

    # Write to specified filepath and filename
    directory = APP_CONFIG["generated_alerts_path"]
    directory = os.path.abspath(directory)
    if not os.path.exists(directory):
        os.makedirs(directory)

    with open(directory + "/generated_alerts.json", "w") as file_path:
        file_path.write(json_data)

    script_end = datetime.now()
    print(f"Runtime: {script_end - script_start} | Done generating alerts!")
    print()
    return json_data


if __name__ == "__main__":
    main()

    # TEST MAIN
    # main(query_ts_end="<timestamp>", query_ts_start="<timestamp>", is_test=True, site_code="umi")
