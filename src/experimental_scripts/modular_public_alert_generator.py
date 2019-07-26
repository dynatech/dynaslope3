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
from src.utils.monitoring import round_down_data_ts
from src.utils.extra import var_checker, round_to_nearest_release_time, retrieve_data_from_memcache


IAS_MAP = MEMORY_CLIENT.get("internal_alert_symbols".upper())
OTS_MAP = MEMORY_CLIENT.get("operational_trigger_symbols".upper())
PAS_MAP = MEMORY_CLIENT.get("public_alert_symbols".upper())
TH_MAP = MEMORY_CLIENT.get("trigger_hierarchies".upper())
# MONITORING_MOMS_SCHEMA = MonitoringMomsSchema(many=True, exclude=(
#     "moms_releases", "validator", "reporter", "narrative"))

MONITORING_MOMS_SCHEMA = MonitoringMomsSchema(many=True, exclude=(
    "moms_releases", "validator", "reporter", "narrative"))


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


def get_current_rain_surficial_and_moms_alerts(op_triggers_list,
                                               surficial_moms_window_ts, query_ts_end,
                                               latest_rainfall_alert, site_moms_alerts, has_positive_moms_trigger):
    """
    Sample
    """""
    rain_th_row = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "rainfall"})
    rainfall_source_id = rain_th_row["source_id"]
    rain_nd_alert_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                                    "alert_level": -1, "source_id": rainfall_source_id})
    surficial_th_row = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "surficial"})
    surficial_source_id = surficial_th_row["source_id"]
    surficial_nd_alert_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                                         "alert_level": -1, "source_id": surficial_source_id})

    current_trigger_alerts = {
        "rainfall": {
            "alert_level": -1,
            "alert_symbol": rain_nd_alert_row["alert_symbol"]
        },
        "surficial": {
            "alert_level": -1,
            "alert_symbol": surficial_nd_alert_row["alert_symbol"]
        },
        # "moms": {
        #     "alert_level": -1,
        #     "alert_symbol": OTS_MAP[("alert_symbol", "moms", -1)]
        # }
    }

    # if not site_moms_alerts_list:
    #     # If no moms trigger, remove moms from release_triggers dictionary
    #     current_trigger_alerts.pop("moms", None)

    moms_th_row = retrieve_data_from_memcache(
        "trigger_hierarchies", {"trigger_source": "moms"})
    moms_source_id = moms_th_row["source_id"]
    moms_nd_alert_row = retrieve_data_from_memcache("operational_trigger_symbols", {
        "alert_level": -1, "source_id": moms_source_id})
    moms_nd_alert_symbol = moms_nd_alert_row["alert_symbol"]

    if has_positive_moms_trigger:
        current_trigger_alerts["moms"] = {
            "alert_level": -1,
            "alert_symbol": moms_nd_alert_symbol
        }

    for op_trigger in op_triggers_list:
        op_t_source_id = op_trigger.trigger_symbol.source_id
        th_row = retrieve_data_from_memcache(
            "trigger_hierarchies", {"source_id": op_t_source_id})
        op_t_trigger_source = th_row["trigger_source"]
        op_t_alert_level = op_trigger.trigger_symbol.alert_level

        if op_t_source_id in [rainfall_source_id, surficial_source_id, moms_source_id]:
            if op_t_source_id in [surficial_source_id, moms_source_id]:
                ts_comparator = surficial_moms_window_ts
            else:
                ts_comparator = query_ts_end - timedelta(minutes=30)

            ts_updated = op_trigger.ts_updated
            if ts_updated >= ts_comparator:
                ot_row = retrieve_data_from_memcache("operational_trigger_symbols", {
                                                     "trigger_source": op_t_trigger_source, "alert_level": op_t_alert_level})
                alert_symbol = ot_row["alert_symbol"]
                current_trigger_alerts[op_t_trigger_source]["alert_symbol"] = alert_symbol
                current_trigger_alerts[op_t_trigger_source]["alert_level"] = op_t_alert_level

                if op_t_source_id == rainfall_source_id:
                    if op_t_alert_level > -1:
                        current_trigger_alerts["rainfall"]["rain_gauge"] = get_rainfall_gauge_name(
                            latest_rainfall_alert)
                else:
                    # latest_moms = get_site_moms(site, ts_updated)
                    if site_moms_alerts[0]:
                        site_moms_alerts_list = site_moms_alerts[0]
                        highest_moms_alert = site_moms_alerts[1]

                    current_moms_list = list(filter(
                        lambda x: x.observance_ts >= surficial_moms_window_ts, site_moms_alerts_list))
                    if current_moms_list:
                        current_moms_list_data = MONITORING_MOMS_SCHEMA.dump(
                            current_moms_list).data
                        # NOTE: The ff code catches non-triggering moms even if there is
                        # no positive moms alert. Good thing na hindi naaattach moms sa release triggers kung
                        # walang positive moms alert dahil yung "taas" (default version) ang
                        # maghahandle noon RE: showing moms data presence every 4 hours.
                        current_trigger_alerts["moms"] = {
                            "alert_level": highest_moms_alert,
                            "alert_symbol": moms_nd_alert_symbol
                        }
                        current_trigger_alerts["moms"]["moms_list"] = current_moms_list_data

        # Break the loop if all triggers has data presense already
        all_trigger_has_data = True
        for key in current_trigger_alerts:
            if current_trigger_alerts[key]["alert_level"] == -1:
                all_trigger_has_data = False
                break

        if all_trigger_has_data:
            break

    return current_trigger_alerts


def get_site_moms_alerts(site_id, ts_start, ts_end):
    """
    NOTE: Will be transferred to monitoring utils
    """
    var_checker("ts_start", ts_start, True)
    var_checker("ts_end", ts_end, True)
    latest_moms = moms.query.order_by(DB.desc(moms.observance_ts)).filter(
        DB.and_(ts_start <= moms.observance_ts, moms.observance_ts <= ts_end)).join(mi).filter(mi.site_id == site_id).all()

    sorted_list = sorted(latest_moms,
                         key=lambda x: x.op_trigger, reverse=True)
    highest_moms_alert = 0
    if sorted_list:
        highest_moms_alert = sorted_list[0].op_trigger

    return latest_moms, highest_moms_alert


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

    # Remove subsurface triggers less than the actual query_ts_end
    # Data presence for subsurface is limited to the current runtime only (not within 4 hours)
    release_op_triggers_list = []
    for release_op_trig in release_op_triggers:
        # DYNAMIC: TH_MAP
        if not (release_op_trig.trigger_symbol.source_id == TH_MAP["subsurface"] and release_op_trig.ts_updated < query_ts_end):
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
    site_public_alerts_list = []
    # Check if not a list, which means run one site only.
    if not isinstance(active_sites, (list,)):
        active_sites = [active_sites]

    for site in active_sites:
        site_id = site.site_id
        site_code = site.site_code
        s_pub_alerts_query = site.public_alerts
        s_op_triggers_query = site.operational_triggers
        site_tsm_sensors = site.tsm_sensors.all()
        latest_rainfall_alert = site.rainfall_alerts.order_by(DB.desc(ra.ts)).filter(
            ra.ts == query_ts_end).first()

        #####################################################
        # DYNAMIC Protocol Values starts here. For querying #
        #####################################################
        max_possible_alert_level = 3  # Number of alert levels excluding zero
        release_interval_hours = 4  # Every how many hours per release

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

        # Get current subsurface alert
        # Special function to Dyna3, no need to modularize
        subsurface_alerts_list = get_tsm_alerts(
            site_tsm_sensors, query_ts_end)

        # Get current moms alerts within ts_onset and query_ts_end
        site_moms_alerts = get_site_moms_alerts(
            site_id, monitoring_start_ts, query_ts_end)
        site_moms_alerts_list = site_moms_alerts[0]
        has_positive_moms_trigger = False

        # Get current surficial and rainfall alert levels
        current_trigger_alerts = get_current_rain_surficial_and_moms_alerts(op_triggers_list,
                                                                            surficial_moms_window_ts, query_ts_end, latest_rainfall_alert, site_moms_alerts, has_positive_moms_trigger)
        current_trigger_alerts["subsurface"] = subsurface_alerts_list

        ###################
        # INTERNAL ALERTS #
        ###################

        # List of alert trigger levels of ground-related triggers
        ground_related_triggers_alert_list = []
        has_rx_symbol = None
        # will contain updated triggers later (if alert > 0)
        processed_triggers_list = []

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

                rain_th_row = retrieve_data_from_memcache(
                    "trigger_hierarchies", {"trigger_source": "rainfall"})
                rainfall_source_id = rain_th_row["source_id"]
                # Get index of rainfall trigger if exists
                if processed_trig_symbol.source_id == rainfall_source_id:
                    rain_trigger_index = index

                if processed_trig_symbol.trigger_hierarchy.trigger_source in ["subsurface", "surficial", "moms"]:
                    ground_related_triggers_alert_list.append(
                        processed_trig_symbol.alert_level)

            # Process rainfall trigger if above 75% threshold
            if current_trigger_alerts["rainfall"]["alert_level"] == 0 and query_ts_end >= (validity - timedelta(minutes=30)):
                processed_triggers_list, has_rx_symbol = replace_rainfall_alert_if_rx(latest_rainfall_alert,
                                                                                      processed_triggers_list, rain_trigger_index)

                if has_rx_symbol:
                    current_trigger_alerts["rainfall"]["alert_level"] = -2

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
            if current_trigger_alerts["surficial"]["alert_level"] == -1 and not tsm_with_data:
                ground_alert = -1
            else:
                ground_alert = 0
        elif -1 in ground_related_triggers_alert_list:
            ground_alert = -1
        else:
            ground_alert = 0

        internal_alert = create_internal_alert(highest_public_alert, ground_alert,
                                               processed_triggers_list, has_rx_symbol)

        ############################
        # moms data presence: moms #
        ############################
        has_unresolved_moms = True
        if site_moms_alerts_list:
            has_unresolved_moms = check_if_has_unresolved_moms_instance(
                site_moms_alerts_list)

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
            elif has_rx_in_triggers or (is_below_3_day_rule and has_no_ground_alert) or is_not_yet_write_time or (site_moms_alerts and has_unresolved_moms):
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
            source_id = retrieve_data_from_memcache(
                "trigger_hierarchies", {"trigger_source": "internal"})
            ots_row = retrieve_data_from_memcache(
                "operational_trigger_symbols", {
                    "alert_level": ground_alert,
                    "source_id": source_id
                })

            internal_alert = ots_row["internal_alert_symbol"]["alert_symbol"]

        ######################
        # START OF AN EVENT! #
        ######################
        if monitoring_type != "event" and positive_triggers_list:
            ts_onset = min(positive_triggers_list,
                           key=lambda x: x.ts).ts

        # most recent retrigger of positive operational triggers
        try:
            event_triggers = get_prepared_recent_retriggers(
                unique_positive_triggers_list, invalids_dict, site_moms_alerts_list)
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

        formatted_release_trig = format_release_trig(current_trigger_alerts)

        public_alert_th_row = retrieve_data_from_memcache(
            "public_alert_symbols", {"alert_level": highest_public_alert})
        public_alert_symbol = public_alert_th_row["alert_symbol"]

        # FORM THE SITE PUBLIC ALERT FOR GENERATED ALERTS
        public_dict = {
            "ts": timestamp,
            "site_id": site_id,
            "site_code": site_code,
            "purok": site.purok,
            "sitio": site.sitio,
            "barangay": site.barangay,
            "public_alert": public_alert_symbol,
            "internal_alert": internal_alert,
            "validity": validity,
            "event_triggers": event_triggers,
            "release_triggers": formatted_release_trig
        }

        # NOTE: Commented to try merging this with the code related to this
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
            print("Checking if new public alert.")
            try:
                current_pa_id = latest_site_pa.public_id

                # Revert any changes made in SQLAlchemy objects. No DB updates necessary
                # up to this point.
                DB.session.rollback()

                public_alert_result = write_to_db_public_alerts(
                    for_db_public_dict, latest_site_pa)
                if not public_alert_result:
                    print()
                    print(
                        f"Active Public alert with ID: {current_pa_id} on Database.")
                else:
                    print(f"Writing to DB with ID: {public_alert_result}")

            except Exception as err:
                print(err)
                DB.session.rollback()
                raise
            # var_checker(" NEW PUBLIC ALERT HAS BEEN WRITTEN", new_public_alert_id, True)
        # else:
        #     print(" NOTHING HAS BEEN WRITTEN")

        ######################
        # !!!! PRINTERS !!!! #
        ######################
        site_public_alert = public_alert_symbol
        # var_checker(f"{site_code.upper()}", f"Public Alert: {site_public_alert}", True)

        site_public_alerts_list.append(public_dict)

    return site_public_alerts_list


def main(query_ts_end=None, query_ts_start=None, is_test=False, site_code=None):
    """
    """

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

    # var_checker("UNSORTED", generated_alerts, True)

    # Sort per alert level
    generated_alerts.sort(key=extract_alert_level, reverse=True)

    # var_checker("SORTED", generated_alerts, True)

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
    print(f"Runtime: {script_end - query_ts_start} | Done generating alerts!")
    print()
    return json_data


if __name__ == "__main__":
    main()
    # L2
    # main("2019-01-22 03:00:00", True, "ime")
    # # main("2018-12-26 11:00:00", True, "lpa")
    # main("2018-11-30 15:51:00", True, "ime")
    # MOMS
    # main("2019-01-22 03:00:00", True, "dad")
    # main("2018-08-20 06:00:00", True, "tue")
    # main("2018-11-15 7:51:00", True)
    # main("2018-11-15 7:51:00", True)
    # main("2018-11-14 7:51:00", True)
    # main("2018-08-14 11:46:00", True, "tue")
