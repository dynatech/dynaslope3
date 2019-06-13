"""
Public Alert Generator (Py3) version 0.2
======
For use of Dynaslope Early Warning System

Implemented in Python 3 and SQLAlchemy by:
    Kevin Dhale Dela Cruz
    John Louie Nepomuceno

May 2019
"""

import pprint
import os
import json
from connection import DB
from config import APP_CONFIG
from sqlalchemy import and_, or_
from datetime import datetime, timedelta, time
from src.experimental_scripts import tech_info_maker
from src.models.monitoring import (
    PublicAlerts as pa, PublicAlertSymbols as pas,
    OperationalTriggers as ot, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies,
    MonitoringMoms as moms, MomsInstances as mi)
from src.models.analysis import (
    TSMAlerts, TSMSensors, RainfallAlerts as ra,
    AlertStatusSchema)
from src.utils.sites import get_sites_data
from src.utils.monitoring import round_to_nearest_release_time
from src.utils.rainfall import get_rainfall_gauge_name
from src.utils.extra import var_checker, create_symbols_map


def round_down_data_ts(date_time):
    """
    Rounds time to HH:00 or HH:30.

    Args:
        date_time (datetime): Timestamp to be rounded off. Rounds to HH:00
        if before HH:30, else rounds to HH:30.

    Returns:
        datetime: Timestamp with time rounded off to HH:00 or HH:30.

    """

    hour = date_time.hour
    minute = date_time.minute
    minute = 0 if minute < 30 else 30
    date_time = datetime.combine(date_time.date(), time(hour, minute))
    return date_time


def check_if_routine_or_event(pub_sym_id):
    """
    Checks if alert instance is routine or event
    """
    if pub_sym_id > 4 or pub_sym_id < 0:
        raise Exception("Invalid Public Alert Entry")
    elif pub_sym_id == 1:
        return "routine"

    return "event"


def get_trigger_hierarchy(trigger_source=None):
    """
    Returns an appender base query containing all internal alert symbols.
    """
    # th = TriggerHierarchies
    # symbol = th.query.filter(th.trigger_source == trigger_source).first()
    mapping = {'subsurface': 1, 'surficial': 2, 'rainfall': 3, 'earthquake': 4, 'on demand': 5, 'moms': 6, 'internal': 7}
    symbol = mapping[trigger_source]
    return symbol


def get_source_max_alert_level(source_id):
    """
    Returns maximum alert level per source. 

    Note: NotUnitTestable
    """

    alert_level = ots.query.filter(ots.source_id == source_id).order_by(
        DB.desc(ots.alert_level)).first().alert_level

    return alert_level


###############################
# PROCESSING CODES with LOGIC #
###############################


def write_to_db_public_alerts(output_dict, latest_site_pa):
    """
    SQLAlchemy DB writer function.

    Args:
        output_dict (dictionary) - the generated public_alert for each site
        latest_site_pa (PublicAlert class) - the previous public_alert before the script run
    """
    try:
        prev_alert_symbol = latest_site_pa.alert_symbol.alert_symbol
        is_new_public_alert = prev_alert_symbol != output_dict["pub_alert_symbol"]

        # Update the previous public alert first
        latest_site_pa.ts_updated = output_dict["ts"]

        # If the alert symbol is different, create a new entry
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

        # If no problems, commit
        DB.session.commit()

    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return new_public_id


def get_prepared_recent_retriggers(not_empty=True, positive_triggers_list=None, invalid_dict=None):
    """
    Prepare the most recent trigger
    Remove unnecessary attributes and convert SQLAlchemy row into a dict.
    Convert ts_updated to str

    Args:
        positive_triggers_list - list containing the most recent positive trigger (SQLAlchemy row)
    """
    recent_triggers_list = []

    if not_empty:
        for item in positive_triggers_list:
            # Include invalids as a dictionary
            final_invalid_dict = {}
            try:
                invalid_entry = invalid_dict[item.trigger_sym_id]
                invalid_details_dict = AlertStatusSchema().dump(invalid_entry).data
 
                final_invalid_dict = {
                    "invalid": True,
                    "invalid_details": invalid_details_dict
                }
            except:
                # If a unique trigger_symbol/alert_level doesnt have invalid
                # entry, it will go here.
                pass

            trigger_type = item.trigger_symbol.trigger_hierarchy.trigger_source
            # Form a dictionary that will hold all trigger details
            trigger_dict = {
                "trigger_type": trigger_type,
                "trigger_id": item.trigger_id,
                "alert": item.trigger_symbol.alert_symbol,
                "ts_updated": str(item.ts_updated)
            }

            # Prepare the tech_info of the trigger
            trigger_tech_info = tech_info_maker.main(item)

            if trigger_type == "rainfall":
                rainfall = {
                    "rain_gauge": trigger_tech_info["rain_gauge"],
                    "tech_info": trigger_tech_info["tech_info_string"]
                }
                trigger_dict.update(rainfall)
            elif trigger_type == "subsurface":
                trigger_dict["tech_info"] = trigger_tech_info

            # Add the invalid details same level to the dictionary attributes
            trigger_dict.update(final_invalid_dict)

            recent_triggers_list.append(trigger_dict)
    else:
        trigger_dict = {}
        recent_triggers_list.append(trigger_dict)

    return recent_triggers_list


def create_internal_alert(
        highest_public_alert, ground_alert, 
        internal_source_id, processed_triggers_list, has_rx_symbol=None):
    """
    """
    internal_alert = ""
    public_alert_symbol = PAS_MAP[("alert_symbol"), highest_public_alert]

    if ground_alert == -1 and highest_public_alert <= 1:
        public_alert_symbol = IAS_MAP[ground_alert, internal_source_id]

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

    if has_rx_symbol:
        internal_alert += has_rx_symbol

    return internal_alert


def replace_rainfall_alert_if_rx(latest_rainfall_alert, processed_triggers_list, rain_trigger_index):
    """
    Replace rainfall trigger in processed_triggers_list with symbol
    for "above 75% of rainfall data threshold"



    returns processed_triggers_list (list): updated processed_triggers_list (rainfall entry)
            has_rx_symbol (None or True/String): returns None if no data above 75% or
                                                it's lowercased symbol for alerts with no
                                                rainfall alert
    """
    has_rx_symbol = None

    # rain_75_id = ots.query.filter(
    #     ots.alert_level == -2).first().trigger_sym_id
    # query_result = ias.query.filter(ias.trigger_sym_id == rain_75_id)
    rain_75_id = OTS_MAP[("trigger_sym_id", "rainfall", -2)]
    query_result = ias.query.filter(ias.trigger_sym_id == rain_75_id)

    if latest_rainfall_alert:
        has_rx_symbol = True

        if rain_trigger_index:
            rain_alert = query_result.alert_symbol
            trigger_sym_id = query_result.trigger_sym_id

            rain_trigger_entry = processed_triggers_list[rain_trigger_index]
            rain_trigger_entry.alert_symbol = rain_alert
            rain_trigger_entry.trigger_sym_id = trigger_sym_id
        else:
            has_rx_symbol = query_result.first().alert_symbol.lower()

    return processed_triggers_list, has_rx_symbol


def get_current_rain_surficial_and_moms_alerts(site, op_triggers_list, surficial_source_id,
                                              rainfall_source_id, moms_source_id,
                                              surficial_moms_window_ts, query_ts_end,
                                              latest_rainfall_alert):
    current_surficial_alert = {
        "alert_level": -1
    }
    current_rainfall_alert = {
        "alert_level": -1
    }
    current_moms_alert = {
        "alert_level": -1
    }

    for op_trigger in op_triggers_list:
        op_t_source_id = op_trigger.trigger_symbol.source_id
        op_t_alert_level = op_trigger.trigger_symbol.alert_level

        if op_t_source_id in [rainfall_source_id, surficial_source_id, moms_source_id]:
            if op_t_source_id in [surficial_source_id, moms_source_id]:
                ts_comparator = surficial_moms_window_ts
            else:
                ts_comparator = query_ts_end - timedelta(minutes=30)

            ts_updated = op_trigger.ts_updated
            if ts_updated >= ts_comparator:
                if op_t_source_id == surficial_source_id:
                    current_surficial_alert["alert_level"] = op_t_alert_level
                elif op_t_source_id == rainfall_source_id:
                    current_rainfall_alert["alert_level"] = op_t_alert_level
                    if op_t_alert_level != "nd":
                        current_rainfall_alert["details"] = {
                            "rain_gauge": get_rainfall_gauge_name(latest_rainfall_alert),
                            "alert_level": op_t_alert_level
                        }
                else:
                    latest_moms = get_site_moms(site, ts_updated)
                    current_moms_alert["alert_level"] = op_t_alert_level
                    if not op_t_alert_level != "nd":
                        current_moms_alert["details"] = {
                            "moms_id": latest_moms.moms_id,
                            "instance_id": latest_moms.instance_id,
                            "observance_ts": str(latest_moms.observance_ts),
                            "reporter_id": latest_moms.reporter_id,
                            "remarks": latest_moms.remarks,
                            "narrative_id": latest_moms.narrative_id,
                            "validator_id": latest_moms.validator_id,
                            "op_trigger": op_t_alert_level
                        }

        if current_rainfall_alert["alert_level"] > -1 and current_surficial_alert["alert_level"] > -1 and \
            current_moms_alert["alert_level"] > -1:
            break

    current_r_s_m_a = [current_rainfall_alert, current_surficial_alert, current_moms_alert]

    return current_r_s_m_a

def update_positive_triggers_with_no_data(highest_unique_positive_triggers_list,
                                          no_surficial_data_presence, no_moms_data_presence, no_data_list):
    """
    Replace alert symbol of entries on positive triggers list
    based on the current no data presence (no_data_list)
    (e.g Entry on positive_triggers_list alert symbol => G will be replaced by G0)

    returns updated highest_unique_positive_triggers_list
    """
    for pos_trig in highest_unique_positive_triggers_list:
        pos_trig_symbol = pos_trig.trigger_symbol
        source_id = pos_trig_symbol.source_id
        has_no_data = False

        if pos_trig_symbol.trigger_hierarchy.trigger_source == "surficial" \
                and no_surficial_data_presence:
            # surficial_nd_symbol = ots.query.filter(
            #     ots.alert_level == -1, ots.source_id == pos_trig_symbol.source_id).first()
            # nd_internal_symbol = surficial_nd_symbol.internal_alert_symbol.alert_symbol
            nd_internal_symbol = IAS[(-1, pos_trig_symbol.source_id)]
            has_no_data = True
        elif pos_trig_symbol.trigger_hierarchy.trigger_source == "moms" \
                and no_moms_data_presence:
            # moms_nd_symbol = ots.query.filter(
            #     ots.alert_level == -1, ots.source_id == pos_trig_symbol.source_id).first()
            # nd_internal_symbol = moms_nd_symbol.internal_alert_symbol.alert_symbol
            nd_internal_symbol = IAS[(-1, pos_trig_symbol.source_id)]
            has_no_data = True
        else:
            for no_data in no_data_list:
                if no_data.trigger_symbol.source_id == source_id:
                    nd_internal_symbol = no_data.trigger_symbol.internal_alert_symbol.alert_symbol
                    has_no_data = True

        # Replace alert_symbol of positive_trigger entry if no data
        if has_no_data:
            # Get the lowercased version of [x]2 triggers (g2, s2)
            # Rationale: ND-symbols on internal alert are in UPPERCASE
            if pos_trig_symbol.alert_level < get_source_max_alert_level(source_id):
                nd_internal_symbol = nd_internal_symbol.lower()

            pos_trig_symbol.internal_alert_symbol.alert_symbol = nd_internal_symbol

    return highest_unique_positive_triggers_list


def extract_no_data_triggers(release_op_trigger_list):
    """
    Check for no data presence for all release triggers

    Note: Surficial and moms triggers do not produce alert 
          level -1 entry on operational_triggers table
          Only rainfall and subsurface triggers are producing 
          -1 (no_data) entry on operational_triggers table

    returns list of op_trigger entries with no data (alert level -1)
    """
    # Get a sorted list of release triggers
    sorted_release_triggers_list = sorted(
        release_op_trigger_list, key=lambda x: x.ts_updated, reverse=True)

    comparator = []
    unique_list = []
    no_surficial_data_presence = True
    no_moms_data_presence = True
    for release_op_trig in sorted_release_triggers_list:
        com = release_op_trig.trigger_symbol.source_id

        if release_op_trig.trigger_symbol.trigger_hierarchy.trigger_source == "surficial":
            no_surficial_data_presence = False
        if release_op_trig.trigger_symbol.trigger_hierarchy.trigger_source == "moms":
            no_moms_data_presence = False
        else:
            to_append = False
            if release_op_trig.trigger_symbol.alert_level == -1:
                if not comparator:
                    to_append = True
                elif not com in comparator:
                    to_append = True

            if to_append:
                comparator.append(com)
                unique_list.append(release_op_trig)

    no_data_list = unique_list
    return no_surficial_data_presence, no_moms_data_presence, no_data_list


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

    comparator = []
    unique_list = []
    for item in sorted_positive_triggers_list:
        com = item.trigger_symbol.source_id

        to_append = False
        if not comparator:
            to_append = True
        elif not com in comparator:
            to_append = True

        if to_append:
            comparator.append(com)
            unique_list.append(item)

    sorted_positive_triggers_list = unique_list
    return sorted_positive_triggers_list


def get_processed_internal_alert_symbols(unique_positive_triggers_list, release_op_trigger_list):
    """
    Returns an updated unique_positive_triggers_list
    (i.e. alert_symbols appropriated to no data)

    List returned will be used mainly in internal alert level generation
    """
    # Declare the essential lists
    no_data_list = []

    # Get a sorted list of historical triggers
    highest_unique_positive_triggers_list = extract_highest_unique_triggers_per_type(
        unique_positive_triggers_list)
    # Get a sorted list of release triggers
    no_surficial_data_presence, no_moms_data_presence, no_data_list = extract_no_data_triggers(
        release_op_trigger_list)

    updated_h_u_p_t_list = update_positive_triggers_with_no_data(
        highest_unique_positive_triggers_list, no_surficial_data_presence, no_moms_data_presence, no_data_list)

    return updated_h_u_p_t_list


def get_tsm_alerts(site_tsm_sensors, query_ts_end):
    """
    Returns subsurface details of sensors (if any) per site

    returns tsm_alerts_list (list)
    """
    ta = TSMAlerts
    tsm_alerts_list = []
    for sensor in site_tsm_sensors:
        tsm_alert_entries = sensor.tsm_alert.filter(
            ta.ts <= query_ts_end, ta.ts_updated >= query_ts_end - timedelta(minutes=30)).all()

        # Note: tsm_alert_entries is expected to
        # return ONLY ONE row (if has data)
        # because of the nature of the query (check filter)
        if tsm_alert_entries:
            entry = tsm_alert_entries[0]
            formatted = {
                "tsm_name": entry.tsm_sensor.logger.logger_name,
                "alert_level": entry.alert_level
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
            query_ts_end) - timedelta(hours=4)
    else:
        window_ts = query_ts_end
    return window_ts


def get_highest_public_alert(positive_triggers_list):
    """
    Returns the maximum public alert. Only returns the compared alert levels stored in a list.

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

    comparator_1 = []
    comparator_2 = []
    unique_list = []
    for item in positive_triggers_list:
        com_1 = item.trigger_symbol.source_id
        comparator_1.append(com_1)
        com_2 = item.trigger_symbol.alert_level
        comparator_2.append(com_2)
        if not ((com_1 in comparator_1 and com_2 in comparator_2) and (comparator_1.count(com_1) > 1 and comparator_2.count(com_2) > 1)):
            unique_list.append(item)

    unique_positive_triggers_list = unique_list
    return unique_positive_triggers_list


def get_invalids(positive_triggers_list):
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
                if invalids_dict[trigger_sym_id].ts_ack < alert_status_entry.ts_ack:
                    invalids_dict[trigger_sym_id] = alert_status_entry
            else:
                invalids_dict[trigger_sym_id] = alert_status_entry

    return invalids_dict


def extract_positive_triggers_list(op_triggers_list, surficial_source_id):
    """
    Get all positive triggers from historical op_triggers_list
    """
    positive_triggers_list = []

    for op_trigger in op_triggers_list:
        op_trig = op_trigger.trigger_symbol

        # Filter for g0t alerts (surficial trending alerts for validation)
        g0t_filter = not (op_trig.alert_level ==
                          1 and op_trig.source_id == surficial_source_id)
        if op_trig.alert_level > 0 and g0t_filter:
            positive_triggers_list.append(op_trigger)

    return positive_triggers_list


def extract_release_op_triggers(op_triggers_query, query_ts_end):
    """
    Get all operational triggers released within the four-hour window before release
    with exception for subsurface triggers
    """
    # Get the triggers within 4 hours before the release AND use "distinct" to remove duplicates
    release_op_triggers = op_triggers_query.filter(
        ot.ts_updated >= round_to_nearest_release_time(query_ts_end) - timedelta(hours=4)).distinct().all()

    # Remove subsurface triggers less than the actual query_ts_end
    # Data presence for subsurface is limited to the current runtime only (not within 4 hours)
    subsurface_source_id = get_trigger_hierarchy("subsurface")
    release_op_triggers_list = []
    for release_op_trig in release_op_triggers:
        if not (release_op_trig.trigger_symbol.source_id == subsurface_source_id and release_op_trig.ts_updated < query_ts_end):
            release_op_triggers_list.append(release_op_trig)

    return release_op_triggers_list


def get_operational_triggers_within_monitoring_period(s_op_triggers_query, monitoring_start_ts, query_ts_end):
    """Returns an appender base query containing alert level on each operational trigger
    from start of monitoring to end.

    Args:
        monitoring_start_ts (datetime): Timestamp of start of monitoring.
        end (datetime): Public alert timestamp.

    Returns:
        dataframe: Contains timestamp range of alert, three-letter site code,
                   operational trigger, alert level, and alert symbol from
                   start of monitoring
    """

    op_trigger_of_site = s_op_triggers_query.order_by(DB.desc(ot.ts)).filter(
        and_(ot.ts_updated >= monitoring_start_ts, ot.ts <= query_ts_end))

    return op_trigger_of_site


def get_event_start_timestamp(latest_site_public_alerts):
    """
    Timestamp of start of event monitoring. Start of event is computed
    by checking if event progresses from non A0 to higher alert.

    Args:
        site_id (int): ID of each site.
        end (datetime): Current public alert timestamp.

    Returns:
        datetime: Timestamp of start of monitoring.
    """

    highest_alert_level = 5  # highest pub_sym_id is 4 which is A3
    ts_start = None
    for latest_pa in latest_site_public_alerts:
        current_alert_level = latest_pa.pub_sym_id

        if current_alert_level == 1:
            break
        elif highest_alert_level > current_alert_level:
            highest_alert_level = current_alert_level
            ts_start = latest_pa.ts

    return ts_start


def get_monitoring_start_ts(monitoring_type, latest_site_public_alerts, query_ts_end):
    """
    Return monitoring start.
    """
    # Check if the monitoring type is event, otherwise, it is a routine.
    if monitoring_type == "event":
        # Event. Get most recent alert event
        monitoring_start_ts = get_event_start_timestamp(
            latest_site_public_alerts)
    else:
        # Routine. Get the time of the previous day.
        monitoring_start_ts = query_ts_end - timedelta(days=1)

    return monitoring_start_ts


def get_latest_public_alerts_per_site(s_pub_alerts_query, query_ts_end):
    """
    Get the most recent public alert type (limit to 3)
    """

    most_recent = s_pub_alerts_query.order_by(DB.desc(pa.ts)).filter(
        or_(pa.ts_updated <= query_ts_end, and_(pa.ts <= query_ts_end, query_ts_end <= pa.ts_updated))).limit(3).all()

    # If return_one is False, return the AppenderBaseQuery to be filtered.
    return most_recent


def get_site_moms(site, query_ts_end):
    """
    """
    site_moms_instances = site.moms_instance.all()
    sorted_moms = []
    if site_moms_instances:
        moms_list = []
        for instance in site_moms_instances:
            latest_moms = instance.moms.order_by(\
                DB.desc(moms.observance_ts)).filter(\
                    moms.observance_ts == query_ts_end).first()
            moms_list.append(latest_moms)

        sorted_moms = sorted(moms_list, key=lambda x: x.observance_ts, reverse=True)

    return sorted_moms[0]


def get_site_public_alerts(active_sites, query_ts_start, query_ts_end, do_not_write_to_db):
    ######################################
    # LOOP THROUGH ACTIVE SITES PROVIDED #
    ######################################
    site_public_alerts_list = []
    if not isinstance(active_sites, (list,)): # Check if not a list, which means run one site only.
        active_sites = [active_sites]

    for site in active_sites:
        site_id = site.site_id
        site_code = site.site_code
        s_pub_alerts_query = site.public_alerts
        s_op_triggers_query = site.operational_triggers
        site_tsm_sensors = site.tsm_sensors
        latest_rainfall_alert = site.rainfall_alerts.order_by(DB.desc(ra.ts)).filter(
            ra.ts == query_ts_end).first()
        
        # var_checker("SITE MOMS", site_moms_alerts, True)

        # Get the single latest recent public_alerts.pub_sym_id for
        # current site then get it's alert type.
        latest_site_public_alerts = get_latest_public_alerts_per_site(
            s_pub_alerts_query, query_ts_end)

        # Check if event or routine
        latest_site_pa = latest_site_public_alerts[0]
        monitoring_type = check_if_routine_or_event(latest_site_pa.pub_sym_id)

        # Get the event start
        monitoring_start_ts = get_monitoring_start_ts(
            monitoring_type, latest_site_public_alerts, query_ts_end)

        ###################################
        # OPERATIONAL TRIGGERS MANIPULATION
        ###################################
        # Get all operational triggers of the site
        op_triggers_query = get_operational_triggers_within_monitoring_period(
            s_op_triggers_query, monitoring_start_ts, query_ts_end)
        op_triggers_list = op_triggers_query.all()

        release_op_triggers_list = extract_release_op_triggers(
            op_triggers_query, query_ts_end)

        surficial_source_id = get_trigger_hierarchy("surficial")
        positive_triggers_list = extract_positive_triggers_list(
            op_triggers_list, surficial_source_id)

        ###############################
        # INVALID TRIGGERS PROCESSING #
        ###############################
        invalids_dict = get_invalids(positive_triggers_list)

        # Get unique positive triggers
        unique_positive_triggers_list = extract_unique_positive_triggers(
            positive_triggers_list)

        ######################
        # GET TRIGGER ALERTS #
        ######################
        # Get current subsurface alert level
        subsurface_alerts_list = get_tsm_alerts(
            site_tsm_sensors, query_ts_end)

        # Get highest public alert level
        highest_public_alert = get_highest_public_alert(
            positive_triggers_list)

        # Get surficial and moms data presence window timestamp query
        surficial_moms_window_ts = get_moms_and_surficial_window_ts(
            highest_public_alert, query_ts_end)

        # Get current surficial and rainfall alert levels
        rainfall_source_id = get_trigger_hierarchy("rainfall")
        moms_source_id = get_trigger_hierarchy("moms")
        current_r_s_m_a = get_current_rain_surficial_and_moms_alerts(site, op_triggers_list, \
                surficial_source_id, rainfall_source_id, moms_source_id, \
                    surficial_moms_window_ts, query_ts_end, latest_rainfall_alert)

        current_rainfall_alert = current_r_s_m_a[0]
        current_surficial_alert = current_r_s_m_a[1]
        current_moms_alert = current_r_s_m_a[2]

        ###################
        # INTERNAL ALERTS #
        ###################
        internal_source_id = get_trigger_hierarchy("internal")

        # List of alert trigger levels of ground-related triggers
        ground_related_triggers_alert_list = []
        has_rx_symbol = None
        processed_triggers_list = [] # will contain updated triggers later (if alert > 0)

        if highest_public_alert > 0:
            validity = max(positive_triggers_list,
                           key=lambda x: x.ts_updated).ts_updated + timedelta(days=1)
            validity = round_to_nearest_release_time(validity)

            if highest_public_alert == 3:
                validity += timedelta(days=1)

            processed_triggers_list = get_processed_internal_alert_symbols(
                unique_positive_triggers_list, release_op_triggers_list)

            rain_trigger_index = None
            for index, proc_trig in enumerate(processed_triggers_list):
                processed_trig_symbol = proc_trig.trigger_symbol

                # Get index of rainfall trigger if exists
                if processed_trig_symbol.source_id == rainfall_source_id:
                    rain_trigger_index = index

                if processed_trig_symbol.trigger_hierarchy.trigger_source in ["subsurface", "surficial", "moms"]:
                    ground_related_triggers_alert_list.append(processed_trig_symbol.alert_level)

            # Process rainfall trigger if above 75% threshold
            if current_rainfall_alert["alert_level"] == 0 and query_ts_end >= (validity - timedelta(minutes=30)):
                processed_triggers_list, has_rx_symbol = replace_rainfall_alert_if_rx(latest_rainfall_alert,
                                    processed_triggers_list, rain_trigger_index)

                if has_rx_symbol:
                    current_rainfall_alert["alert_level"] = -2

        #####################################################
        # ground data presence: subsurface, surficial, moms #
        #####################################################
        if highest_public_alert <= 1:
            tsm_with_data = []
            for subsurface in subsurface_alerts_list:
                if subsurface["alert_level"] != -1:
                    tsm_with_data.append(subsurface)

            # Check if ground (surficial and sub) has data
            # NOTE: To add special handling on sites without alerts and also no sensors and markers
            if current_surficial_alert["alert_level"] == -1 and not tsm_with_data:
                ground_alert = -1
            else:
                ground_alert = 0
        elif -1 in ground_related_triggers_alert_list:
            ground_alert = -1
        else:
            ground_alert = 0

        internal_alert = create_internal_alert(highest_public_alert, ground_alert,
                                    internal_source_id, processed_triggers_list, has_rx_symbol)

        ################
        # PUBLIC ALERT #
        ################
        # Lowering: Check if query_ts_end of validity and not rain75
        for_lowering = False
        if highest_public_alert > 0:
            query_time = query_ts_end.time()
            hours = query_time.hour
            minutes = query_time.minute

            is_release_time_run = hours % 3 and minutes == 30
            is_45_minute_beyond = int(query_ts_start.strftime("%M")) > 45
            is_not_yet_write_time = not (
                is_release_time_run and is_45_minute_beyond)
            has_rx_in_triggers = bool(has_rx_symbol)
            is_below_3_day_rule = validity + \
                timedelta(days=3) > query_ts_end + timedelta(minutes=30)
            has_no_ground_alert = ground_alert == -1

            # check if query_ts_end of validity: lower alert if with data and not rain75
            if validity > (query_ts_end + timedelta(minutes=30)):
                pass
            elif has_rx_in_triggers or (is_below_3_day_rule and has_no_ground_alert) or is_not_yet_write_time:
                validity = round_to_nearest_release_time(query_ts_end)

                if is_release_time_run:
                    if not(is_45_minute_beyond):
                        do_not_write_to_db = True
            else:
                for_lowering = True
        else:
            for_lowering = True

        if for_lowering:
            validity = ""
            highest_public_alert = 0
            internal_alert = IAS_MAP[ground_alert, internal_source_id]

        ######################
        # START OF AN EVENT! #
        ######################
        if monitoring_type != "event" and positive_triggers_list:
            ts_onset = min(positive_triggers_list,
                           key=lambda x: x.ts).ts
            ts_onset = datetime.strptime(ts_onset, "%Y-%m-%d %H:%M:%S")

        # most recent retrigger of positive operational triggers
        try:
            triggers = get_prepared_recent_retriggers(
                True, unique_positive_triggers_list, invalids_dict)
        except:
            raise

        # Get the TIMESTAMP
        # Get the VALIDITY
        try:
            op_trig_with_data_list = []
            for item in op_triggers_list:
                if item.trigger_symbol.alert_level != -1:
                    op_trig_with_data_list.append(item)
            timestamp = max(op_trig_with_data_list,
                            key=lambda x: x.ts_updated).ts_updated
            timestamp = round_down_data_ts(timestamp)
        except:
            timestamp = query_ts_end

        minute = int(query_ts_start.strftime('%M'))
        if timestamp > query_ts_end or (minute >= 45 or minute >= 15
                                        and minute < 30) and timestamp != query_ts_end:
            timestamp = query_ts_end

        timestamp = str(timestamp)
        validity = str(validity)

        for subsurface in subsurface_alerts_list:
            subsurface["alert_level"] = OTS_MAP[(
                "alert_symbol", "subsurface", subsurface["alert_level"])]

        
        # Get alert symbols of triggers
        current_surficial_alert["alert_level"] = OTS_MAP[("alert_symbol", "surficial", current_surficial_alert["alert_level"])]
        current_rainfall_alert["alert_level"] = OTS_MAP[("alert_symbol", "rainfall", current_rainfall_alert["alert_level"])]

        formatted_release_trig = [
            {
                "type": "subsurface",
                "details": subsurface_alerts_list
            },
            {
                "type": "surficial",
                "details": current_surficial_alert
            },
            {
                "type": "rainfall",
                "details": current_rainfall_alert
            }
        ]

        if current_moms_alert["alert_level"] > -1:
            current_moms_alert["details"]["op_trigger"] = OTS_MAP[("alert_symbol", "moms", current_moms_alert["details"]["op_trigger"])]            
            formatted_moms_alert = {
                "type": "moms",
                "details": current_moms_alert["details"]
            }
            formatted_release_trig.append(formatted_moms_alert)


        # FORM THE SITE PUBLIC ALERT FOR GENERATED ALERTS
        public_dict = {
            "ts": timestamp,
            "site_id": site_id,
            "site_code": site_code,
            "public_alert": PAS_MAP[("alert_symbol", highest_public_alert)],
            "internal_alert": internal_alert,
            "validity": validity,
            "event_triggers": triggers,
            "release_triggers": formatted_release_trig
        }

        # USE TS_ONSET
        try:
            ts = round_down_data_ts(ts_onset)
        except:
            ts = query_ts_end

        # writes public alert to database
        pub_sym_id = PAS_MAP[("pub_sym_id", highest_public_alert)]

        site_public_dict = {
            "ts": ts, "site_id": site_id,
            "pub_sym_id": pub_sym_id, "ts_updated": query_ts_end,
            "pub_alert_symbol": PAS_MAP[("alert_symbol", highest_public_alert)]
        }

        ####################################
        # TRY TO WRITE TO DB PUBLIC_ALERTS #
        ####################################
        if not do_not_write_to_db:
            print(" WRITING TO DB!")
            try:
                new_public_alert_id = write_to_db_public_alerts(
                    site_public_dict, latest_site_pa)
            except Exception as err:
                print(err)
                DB.session.rollback()
                raise
            var_checker(" NEW PUBLIC ALERT HAS BEEN WRITTEN", new_public_alert_id, True)
        else:
            print(" NOTHING HAS BEEN WRITTEN")

        ######################
        # !!!! PRINTERS !!!! #
        ######################
        site_public_alert = PAS_MAP[("alert_symbol", highest_public_alert)]
        var_checker(f"{site_code.upper()}", f"Public Alert: {site_public_alert}", True)

        site_public_alerts_list.append(public_dict)

    return site_public_alerts_list


IAS_MAP = create_symbols_map("internal_alert_symbols")
OTS_MAP = create_symbols_map("operational_trigger_symbols")
PAS_MAP = create_symbols_map("public_alert_symbols")


def main(query_ts_end=None, is_test=False, site_code=None):
    """
    """
    query_ts_start = datetime.now()
    print(query_ts_start)
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

    # Convert data to JSON
    json_data = json.dumps(generated_alerts)

    # Write to specified filepath and filename
    directory = APP_CONFIG["generated_alerts_path"]
    if not os.path.exists(directory):
        os.makedirs(directory)

    with open(directory + "generated_alerts.json", "w") as file_path:
        file_path.write(json_data)

    script_end = datetime.now()
    print(f"Runtime: {script_end - query_ts_start}")

if __name__ == "__main__":
    # L2
    # main("2019-01-22 03:00:00", True, "ime")
    # # main("2018-12-26 11:00:00", True, "lpa")
    # main("2018-11-30 15:51:00", True, "ime")
    # MOMS
    # main("2019-01-22 03:00:00", True, "dad")
    # main("2018-08-20 06:00:00", True, "tue")
    main("2018-11-15 7:51:00", True)
    # main("2018-08-14 11:46:00", True, "tue")
