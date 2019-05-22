
import pprint
import os
import json
import tech_info_maker
from run import APP
from connection import DB
from sqlalchemy import and_, or_
from datetime import datetime, timedelta, time
from flask import jsonify

from src.models.monitoring import (
    PublicAlerts as pa, PublicAlertSymbols as pas,
    # Get the trigger_sym_id of Rx rainfall alert
    OperationalTriggers as ot, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies)
from src.models.analysis import (
    TSMSensors, TSMAlerts, RainfallAlerts, AlertStatus as a_s, AlertStatusSchema)
from src.utils.sites import get_sites_data


INTERNAL_ALERT_SYMBOLS = ias.query.all()
PUBLIC_ALERT_SYMBOLS = pas.query.all()


def var_checker(var_name, var, have_spaces=False):
    """
    Just a function to test variable value and view from terminal.
    """
    if have_spaces:
        print()
        print(f"===== {var_name} =====")
        pp = pprint.PrettyPrinter(indent=4)
        pp.pprint(var)
        print()
    else:
        print(f"{var_name} =====")
        pp = pprint.PrettyPrinter(indent=4)
        pp.pprint(var)


def round_of_to_release_time(date_time):
    """
    Rounds time to 4/8/12 AM/PM.

    Args:
        date_time (datetime): Timestamp to be rounded off. 04:00 to 07:30 is
        rounded off to 8:00, 08:00 to 11:30 to 12:00, etc.

    Returns:
        datetime: Timestamp with time rounded off to 4/8/12 AM/PM.
    """

    time_hour = int(date_time.strftime('%H'))

    quotient = int(time_hour / 4)

    if quotient == 5:
        date_time = datetime.combine(date_time.date()+timedelta(1), time(0, 0))
    else:
        date_time = datetime.combine(date_time.date(), time((quotient+1)*4, 0))

    return date_time


def round_data_ts(date_time):
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

    if minute < 30:
        minute = 0
    else:
        minute = 30

    date_time = datetime.combine(date_time.date(), time(hour, minute))

    return date_time


def check_if_routine_or_event(pub_sym_id):
    """
    """
    if pub_sym_id > 4 or pub_sym_id < 0:
        raise Exception("Invalid input")
    elif pub_sym_id == 1:
        return "routine"

    return "event"


def drop_duplicates_list_of_dict(input_list, parameter, param_2=None):
    """
    NOTE: Parked because of many complications
    """
    new_list = []
    comparator = []

    print("paramter", parameter)
    for item in input_list:
        if param_2 is None:
            com = item.parameter
        else:
            com = item.parameter.param_2

        comparator.append(com)
        if not (com in comparator and comparator.count(com) > 1):
            new_list.append(item)

    return new_list


def get_latest_public_alerts(public_alerts_row, end, return_one=False):
    """
    Get the most recent public alert type
    """

    most_recent = public_alerts_row.order_by(DB.desc(pa.ts)).filter(
        or_(pa.ts_updated <= end, and_(pa.ts <= end, end <= pa.ts_updated)))

    if return_one is True:
        return most_recent.first()

    # If return_one is False, return the AppenderBaseQuery to be filtered.
    return most_recent


def get_event_start_timestamp(public_alerts_row):
    """
    Timestamp of start of event monitoring. Start of event is computed
    by checking if event progresses from non A0 to higher alert.

    Args:
        site_id (int): ID of each site.
        end (datetime): Current public alert timestamp.

    Returns:
        datetime: Timestamp of start of monitoring.
    """
    start_ts = ""

    # max of three previous positive alert
    recent_p_alerts = public_alerts_row.order_by(
        DB.desc(pa.ts)).filter(pa.pub_sym_id > 1).all()[0:3]

    if len(recent_p_alerts) == 1:
        # 1 previous positive alert
        start_ts = recent_p_alerts[0].ts

    elif len(recent_p_alerts) == 2:
        # 2 previous positive alert
        if recent_p_alerts[0].ts - recent_p_alerts[1].ts <= timedelta(minutes=30):
            start_ts = recent_p_alerts[1].ts
        else:
            start_ts = recent_p_alerts[0].ts

    elif len(recent_p_alerts) == 3:
        # 3 previous positive alert
        if recent_p_alerts[0].ts - recent_p_alerts[1].ts_updated <= timedelta(minutes=30):
            if recent_p_alerts[1].ts - recent_p_alerts[2].ts_updated <= timedelta(minutes=30):
                start_ts = recent_p_alerts[2].ts
            else:
                start_ts = recent_p_alerts[1].ts
        else:
            start_ts = recent_p_alerts[0].ts

    else:
        raise Exception("Invalid length of recent public alerts returned.")

    return start_ts


def get_operational_trigger_within_monitoring_period(operational_triggers, start_monitor, end):
    """Returns an appender base query containing alert level on each operational trigger
    from start of monitoring to end.

    Args:
        site_id (dataframe): ID each site.
        start_monitor (datetime): Timestamp of start of monitoring.
        end (datetime): Public alert timestamp.

    Returns:
        dataframe: Contains timestamp range of alert, three-letter site code,
                   operational trigger, alert level, and alert symbol from
                   start of monitoring
    """

    op_trigger_of_site = operational_triggers.order_by(DB.desc(ot.ts)).filter(
        and_(ot.ts_updated >= start_monitor, ot.ts <= end))

    return op_trigger_of_site


def get_trigger_hierarchy(trigger_source=None):
    """
    Returns an appender base query containing all internal alert symbols.
    """
    th = TriggerHierarchies

    symbol = th.query.filter(th.trigger_source == trigger_source).first()

    return symbol


def get_internal_alert_symbols(sym_id_list, nd_source_id_list):
    """
    Returns an appender base query containing all internal alert symbols.
    """

    symbols = INTERNAL_ALERT_SYMBOLS

    symbols_list = []
    for symbol in symbols:
        if symbol.trigger_symbol.trigger_sym_id in sym_id_list or (symbol.trigger_symbol.source_id in nd_source_id_list and symbol.trigger_symbol.alert_level):
            symbols_list.append(symbol)

    return symbols_list


def get_monitoring_start_ts(monitoring_type, site_public_alerts, end, site_code):
    """
    Return monitoring start.
    """
    # Check if the monitoring type is event, otherwise, it is a routine.
    if monitoring_type == "event":
        # Event. Get most recent alert event
        monitoring_start_ts = get_event_start_timestamp(
            site_public_alerts)
    else:
        # Routine. Get the time of the previous day.
        monitoring_start_ts = end - timedelta(days=1)

    return monitoring_start_ts


def get_highest_public_alert(positive_triggers_list):
    """
    Returns the maximum public alert. Only returns the compared alert levels stored in a list.

    Args:
        positive_triggers_list: List of OperationalTriggers class.
    """
    public_alerts = []
    for item in positive_triggers_list:
        public_alerts.append(
            item.trigger_symbol.alert_level)
    highest_public_alert = max(public_alerts + [0])

    return highest_public_alert


def get_tsm_alert(site_tsm_sensors, end):
    """
    Sample
    """
    ta = TSMAlerts
    t_sensor = TSMSensors
    tsm_alerts_list = []
    for sensor in site_tsm_sensors.all():
        active_alerts = sensor.tsm_alert.filter(
            ta.ts <= end, ta.ts_updated >= end - timedelta(minutes=30))

        # If active_alerts has value
        if active_alerts.all():
            for active_alert in active_alerts.all():
                tsm_alerts_list.append(active_alert)

    return tsm_alerts_list


def get_source_max_alert_level(source_id):
    """
    Returns maximum alert level per source. 

    Note: NotUnitTestable
    """

    trigger_symbols = ots.query.filter(ots.source_id == source_id).order_by(
        DB.desc(ots.alert_level)).first()

    return trigger_symbols


def replace_nd_internal_alert_symbol(no_data):
    """
    Replace internal alert sysmbol for each event triggers that currently has no data
    """

    source_id = no_data.trigger_symbol.source_id
    alert_level = no_data.trigger_symbol.alert_level
    max_alert_level = get_source_max_alert_level(source_id)

    if alert_level < max_alert_level:
        no_data.alert_symbol.lower()

    return no_data


def get_processed_internal_alert_symbols(unique_positive_triggers, release_op_trigger_list):
    """
    Sample
    """
    # Declare the essential lists
    sorted_positive_triggers_list = []
    no_data_list = []

    # Get a sorted list of historical triggers
    sorted_positive_triggers_list = sorted(
        unique_positive_triggers, key=lambda x: x.trigger_symbol.alert_level, reverse=True)
    var_checker("SORTED POS TRIG LIST", sorted_positive_triggers_list, True)

    # Eliminate duplicates
    # Note: Just a comparator. Needs to be refactored to accomodate any needs.
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


    # Get a sorted list of release triggers
    sorted_release_triggers_list = sorted(
        release_op_trigger_list, key=lambda x: x.ts_updated, reverse=True)
    var_checker("SORTED REL TRIG LIST", sorted_release_triggers_list, True)

    comparator = []
    unique_list = []
    no_surficial_data_presence = True
    for release_op_trig in sorted_release_triggers_list:
        com = release_op_trig.trigger_symbol.source_id

        if release_op_trig.trigger_symbol.trigger_hierarchy.trigger_source == "surficial":
            no_surficial_data_presence = False
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

    var_checker("SORTED UNIQUE POS TRIG LIST", sorted_positive_triggers_list, True)
    var_checker("NO DATA LIST", no_data_list, True)

    for pos_trig in sorted_positive_triggers_list:
        source_id = pos_trig.trigger_symbol.source_id
        has_no_data = False

        if pos_trig.trigger_symbol.trigger_hierarchy.trigger_source == "surficial" and no_surficial_data_presence:
            nd_internal_symbol = ots.query.filter(ots.alert_level == -1, \
                    ots.source_id == pos_trig.trigger_symbol.source_id).first().internal_alert_symbol.alert_symbol
            has_no_data = True
        else:
            for no_data in no_data_list:
                var_checker("internal symbol", pos_trig.internal_alert_symbol, True)

                if no_data.trigger_symbol.source_id == source_id:
                    nd_internal_symbol = no_data.trigger_symbol.internal_alert_symbol.alert_symbol
                    has_no_data = True

        if has_no_data:
            if pos_trig.trigger_symbol.alert_level < get_source_max_alert_level(source_id).alert_level:
                nd_internal_symbol = nd_internal_symbol.lower()

            pos_trig.trigger_symbol.internal_alert_symbol.alert_symbol = nd_internal_symbol
                
    var_checker("MANIPULATED POS TRIG", sorted_positive_triggers_list, True)

    return sorted_positive_triggers_list


def replace_rainfall_alert_if_rx(site_rainfall_alerts, internal_df, rainfall_source_id, rain_75_id):
    """
    Sample
    """
    internal_df_source_id_list = []
    is_rx = False
    rx_symbol = None
    query_result = ias.query.filter(ias.trigger_sym_id == rain_75_id)

    if site_rainfall_alerts.all():
        is_rx = True
        has_rainfall = False
        rain_trigger_index = None

        for index, item in enumerate(internal_df):
            internal_df_source_id_list.append(item.trigger_symbol.trigger_sym_id)
            if item.trigger_symbol.source_id == rainfall_source_id:
                has_rainfall = True
                rain_trigger_index = index
                break
    
        if has_rainfall:
            rain_alert = query_result.alert_symbol
            trigger_sym_id = query_result.trigger_sym_id

            internal_df[rain_trigger_index].alert_symbol = rain_alert
            internal_df[rain_trigger_index].trigger_sym_id = trigger_sym_id
        else:
            rx_symbol = query_result.first().alert_symbol.lower()

    return internal_df, is_rx, rx_symbol


def get_pub_alert_symbols(alert_level, return_data="alert_symbol"):
    result = pas.query.filter(
        pas.alert_level == alert_level).first()
    if return_data == "alert_symbol":
        return_value = result.alert_symbol
    elif return_data == "pub_sym_id":
        return_value = result.pub_sym_id

    return return_value


def get_non_rainfall_alert_level_list(internal_df):
    # REFACTOR TO ACCOMODATE OTHER THAN RAINFALL
    non_rainfall_alert_level_list = []
    for item in internal_df:
        if item.trigger_symbol.trigger_hierarchy.trigger_source != "rainfall":
            non_rainfall_alert_level_list.append(
                item.trigger_symbol.alert_level)

    return non_rainfall_alert_level_list


def get_internal_df_attribute(internal_df, attribute_name="alert_symbol", data_type="value"):
    """
    Function to make things easier in accessing values of internal df
    """
    temp_list = []
    for item in internal_df:
        if data_type == "value":
            if attribute_name == "alert_symbol":
                return_var = item.alert_symbol
                break
            elif attribute_name == "trigger_sym_id":
                return_var = item.trigger_sym_id
                break
            elif attribute_name == "alert_desc":
                return_var = item.alert_description
                break
            elif attribute_name == "alert_level":
                return_var = item.trigger_symbol.alert_level
                break
            elif attribute_name == "alert_symbol":
                return_var = item.trigger_symbol.alert_symbol
                break
            elif attribute_name == "source_id":
                return_var = item.trigger_symbol.source_id
                break
            elif attribute_name == "trigger_source":
                return_var = item.trigger_symbol.trigger_hierarchy.trigger_source
                break
        elif data_type == "list":
            if attribute_name == "alert_symbol":
                append_obj = item.alert_symbol
            elif attribute_name == "trigger_sym_id":
                append_obj = item.trigger_sym_id
            elif attribute_name == "alert_desc":
                append_obj = item.alert_description
            elif attribute_name == "alert_level":
                append_obj = item.trigger_symbol.alert_level
            elif attribute_name == "alert_symbol":
                append_obj = item.trigger_symbol.alert_symbol
            elif attribute_name == "source_id":
                append_obj = item.trigger_symbol.source_id
            elif attribute_name == "trigger_source":
                append_obj = item.trigger_symbol.trigger_hierarchy.trigger_source

            temp_list.append(append_obj)

    if temp_list:
        return_var = temp_list

    return return_var


def get_internal_alert_symbol_ground_and_source(ground_alert, internal_source_id):
    """
    Gets the internal alert symbol based on ground_alert and internal_source_id
    """
    for item in INTERNAL_ALERT_SYMBOLS:
        if item.trigger_symbol.alert_level == ground_alert and item.trigger_symbol.source_id == internal_source_id:
            pub_internal = item.alert_symbol
            break

    return pub_internal


def get_prepared_recent_retriggers(not_empty=True, positive_triggers_list=None, invalid_dict=None):
    """
    Prepare the most recent trigger
    Remove unnecessary attributes and convert SQLAlchemy row into a dict.
    Convert ts_updated to str

    Args: 
    positive_triggers_list - list containing the most recent positive trigger (SQLAlchemy row)
    """
    recent_triggers_list = []
    var_checker("positive_triggers_list", positive_triggers_list, True)

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
                # pass
                raise

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


def get_prepared_subsurface_alert_list(subsurface_alerts_list):
    """
    Format into a dict the two required attributes of subsurface alerts
    """
    new_subsurface_alerts_list = []
    for item in subsurface_alerts_list:
        entry = {
            "tsm_name": item.tsm_sensor.tsm_name,
            "alert_level": item.alert_level
        }
        new_subsurface_alerts_list.append(entry)

    return new_subsurface_alerts_list


def write_to_db_public_alerts(output_dict, initial_public_alert_row):
    """
    SQLAlchemy DB writer function.

    Args:
        output_dict (dictionary) - the generated public_alert for each site
        initial_public_alert_row (PublicAlert class) - the previous public_alert before the script run
    """
    try:
        prev_alert_symbol = initial_public_alert_row.alert_symbol.alert_symbol
        is_new_public_alert = prev_alert_symbol != output_dict["pub_alert_symbol"]

        # Update the previous public alert first
        initial_public_alert_row.ts_updated = output_dict["ts"]

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


def create_internal_alert(highest_public_alert, ground_alert, internal_source_id, internal_df):
    """
    """
    internal_alert = ""
    public_alert_symbol = get_pub_alert_symbols(
        highest_public_alert, "alert_symbol")

    if ground_alert == -1 and highest_public_alert <= 1:
        public_alert_symbol = get_internal_alert_symbol_ground_and_source(
            ground_alert, internal_source_id)

    internal_alert = public_alert_symbol
    
    if highest_public_alert > 0:
        internal_alert += "-"

        sorted_internal_df = sorted(internal_df, key=lambda x: x.trigger_symbol.trigger_hierarchy.hierarchy_id, reverse=True)

        var_checker("sorted internal df", sorted_internal_df, True)

        internal_alert_symbols = []
        for item in sorted_internal_df:
            internal_alert_symbols.append(item.trigger_symbol.internal_alert_symbol.alert_symbol)
        
        internal_alert_triggers = "".join(internal_alert_symbols)
        internal_alert += internal_alert_triggers

    var_checker("INTERNAL ALERT STRING FINAL", internal_alert, True)

    return internal_alert


def get_site_public_alerts(active_sites, start_time, end, do_not_write_to_db, pas_map):
    ######################################
    # LOOP THROUGH ACTIVE SITES PROVIDED #
    ######################################
    site_public_alerts_list = []
    for site in active_sites:
        site_id = site.site_id
        site_code = site.site_code
        site_public_alerts = site.public_alerts
        site_operational_triggers = site.operational_triggers
        site_tsm_sensors = site.tsm_sensors
        site_rainfall_alerts = site.rainfall_alerts.filter(
            RainfallAlerts.ts == end)
        ground_alert_levels_list = []

        # Get the single latest recent public_alert pub_sym_id entry for
        # current site then get it's alert type.
        latest_site_public_alert = get_latest_public_alerts(
            site_public_alerts, end, True)

        # Check if event or routine
        monitoring_type = check_if_routine_or_event(
            latest_site_public_alert.pub_sym_id)

        # Get the top 5 most recent public alerts
        most_recent_site_public_alert = get_latest_public_alerts(
            site_public_alerts, end, False)

        # Get the event start
        monitoring_start_ts = get_monitoring_start_ts(
            monitoring_type, most_recent_site_public_alert, end, site_code)

        ##########################
        # GET PUBLIC ALERT LEVEL #
        ##########################
        # Get all operational triggers of the site.
        op_triggers_list = get_operational_trigger_within_monitoring_period(
            site_operational_triggers, monitoring_start_ts, end)

        # Get the triggers within 4 hours before the release AND use "distinct" to remove duplicates
        # ASK KEVIN on distinct and drop duplicates
        release_op_triggers = op_triggers_list.filter(
            ot.ts_updated >= round_of_to_release_time(end) - timedelta(hours=4)).distinct()

        subsurface_source_id = get_trigger_hierarchy("subsurface").source_id
        surficial_source_id = get_trigger_hierarchy("surficial").source_id

        # Remove subsurface triggers
        # Window time to get data presence for subsurface is for actual monitoring runtime (XX:30)
        release_op_trigger_list = []
        for release_op_trigger in release_op_triggers.all():
            if not (release_op_trigger.trigger_symbol.source_id == subsurface_source_id and release_op_trigger.ts_updated < end):
                release_op_trigger_list.append(release_op_trigger)

        # Get surficial triggers
        # Window time for surficial data presence is the 4-hour range from release time
        positive_triggers_list = []
        for op_trigger in op_triggers_list.all():
            op_trig = op_trigger.trigger_symbol
            # Filter for g0t alerts (surficial trending alerts for validation)
            g0t_filter = not (op_trig.alert_level ==
                              1 and op_trig.source_id == surficial_source_id)
            if op_trig.alert_level > 0 and g0t_filter:
                positive_triggers_list.append(op_trigger)

        var_checker("POSITIVE TRIGGERS", positive_triggers_list, True)
        #######################
        # INVALIDS PROCESSING #
        #######################
        invalids_dict = get_invalids(end, positive_triggers_list)
        var_checker("INVALIDS DICT", invalids_dict, True)

        # Remove duplicates per unique trigger_source (e.g. subsurface, surficial)
        # and operational trigger alert level combination.
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
        unique_positive_triggers = unique_list
        # var_checker(" LAST POSITIVE TRIGGERS", unique_positive_triggers, True)

        # Get highest public alert level
        highest_public_alert = get_highest_public_alert(
            positive_triggers_list)

        # Get surficial
        if highest_public_alert > 0:
            surficial_ts = round_of_to_release_time(end) - timedelta(hours=4)
        else:
            surficial_ts = end

        ######################
        # GET TRIGGER ALERTS #
        ######################
        # Get subsurface
        subsurface_alerts_list = get_tsm_alert(site_tsm_sensors, end)
        subsurface_alerts_list = get_prepared_subsurface_alert_list(
            subsurface_alerts_list)

        # Get surficial
        current_surficial_alert = -1
        for op_trigger in op_triggers_list.all():
            if op_trigger.trigger_symbol.source_id == surficial_source_id and op_trigger.ts_updated >= surficial_ts:
                surficial_entry = op_trigger
                current_surficial_alert = surficial_entry.trigger_symbol.alert_level
                break

        # Get Rainfall
        rainfall_source_id = get_trigger_hierarchy("rainfall").source_id
        current_rainfall_alert = -1
        for op_trigger in op_triggers_list.all():
            if op_trigger.trigger_symbol.source_id == rainfall_source_id and op_trigger.ts_updated >= surficial_ts - timedelta(minutes=30):
                rainfall_entry = op_trigger
                current_rainfall_alert = rainfall_entry.trigger_symbol.alert_level
                break

        ###################
        # INTERNAL ALERTS #
        ###################
        internal_source_id = get_trigger_hierarchy("internal").source_id

        if highest_public_alert > 0:
            validity = max(positive_triggers_list,
                           key=lambda x: x.ts_updated).ts_updated + timedelta(days=1)
            validity = round_of_to_release_time(validity)

            if highest_public_alert == 3:
                validity += timedelta(days=1)

            # internal alert based on positive triggers and data presence
            internal_df = get_processed_internal_alert_symbols(
                unique_positive_triggers, release_op_trigger_list)

            var_checker("INTERNAL DF", internal_df, True)

            # Get the trigger_sym_id of Rx rainfall alert
            rain_75_id = ots.query.filter(
                ots.alert_level == -2).first().trigger_sym_id

            if current_rainfall_alert == 0 and end >= (validity - timedelta(minutes=30)):
                internal_df, is_rx, rx_symbol = replace_rainfall_alert_if_rx(
                    site_rainfall_alerts, internal_df, rainfall_source_id, rain_75_id)

                # Is is_rx True
                if is_rx:
                    current_rainfall_alert = -2

            # internal_df = sorted(
            #     internal_df, key=lambda x: x.trigger_symbol.trigger_hierarchy.source_id)
            # internal_alert = "".join(internal_df[0].alert_symbol)
            # var_checker("internal alert", internal_alert, True)

            # if highest_public_alert > 1:
            #     public_alert_symbol = get_pub_alert_symbols(
            #         highest_public_alert, "alert_symbol")
            #     internal_alert = public_alert_symbol + '-' + internal_alert

            ground_alert_levels_list = get_non_rainfall_alert_level_list(
                internal_df)

        #####################################################
        # ground data presence: subsurface, surficial, moms #
        #####################################################

        if highest_public_alert <= 1:
            tsm_with_data = []
            for subsurface in subsurface_alerts_list:
                if subsurface["alert_level"] != -1:
                    tsm_with_data.append(subsurface)

            # Check if ground (surficial and sub) has data
            if current_surficial_alert == -1 and len(tsm_with_data) == 0:
                ground_alert = -1
            else:
                ground_alert = 0
        elif -1 in ground_alert_levels_list:
            ground_alert = -1
        else:
            ground_alert = 0

        internal_alert = create_internal_alert(highest_public_alert, ground_alert, internal_source_id, internal_df)
        var_checker("Internal Alert String", internal_alert, True)

        ################
        # PUBLIC ALERT #
        ################
        # Lowering: Check if end of validity and not rain75
        for_lowering = False
        if highest_public_alert > 0:
            # Refactor time options on release time
            is_release_time_run = end.time() in [time(3, 30), time(7, 30),
                                                 time(11, 30), time(
                                                     15, 30), time(19, 30),
                                                 time(23, 30)]
            is_45_minute_beyond = int(start_time.strftime('%M')) > 45
            is_not_yet_write_time = not (
                is_release_time_run and is_45_minute_beyond)

            trigger_sym_id_list = get_internal_df_attribute(
                internal_df, "trigger_sym_id", "list")

            has_rx_in_triggers = rain_75_id in trigger_sym_id_list
            is_below_3_day_rule = validity + \
                timedelta(days=3) > end + timedelta(minutes=30)
            has_no_ground_alert = ground_alert == -1

            # check if end of validity: lower alert if with data and not rain75
            if validity > (end + timedelta(minutes=30)):
                pass
            elif has_rx_in_triggers or (is_below_3_day_rule and has_no_ground_alert) or is_not_yet_write_time:
                validity = round_of_to_release_time(end)

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
            internal_alert = get_internal_alert_symbol_ground_and_source(
                ground_alert, internal_source_id)

        ######################
        # START OF AN EVENT! #
        ######################
        if monitoring_type != "event" and positive_triggers_list:
            print("ONSET!")
            ts_onset = min(positive_triggers_list,
                           key=lambda x: x.ts).ts
            ts_onset = datetime.strptime(ts_onset, "%Y-%m-%d %H:%M:%S")

        # most recent retrigger of positive operational triggers
        try:
            triggers = get_prepared_recent_retriggers(
                True, unique_positive_triggers, invalids_dict)
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
            timestamp = round_data_ts(timestamp)
            var_checker("ROUNDED TIMESTAMP FROM COMPLIC", timestamp, True)
        except:
            print("timestamp EQUALS end")
            timestamp = end

        if timestamp > end or (int(start_time.strftime('%M')) >= 45
                               or int(start_time.strftime('%M')) >= 15
                               and int(start_time.strftime('%M')) < 30) and timestamp != end:
            timestamp = end

        timestamp = str(timestamp)
        validity = str(validity)

        public_dict = {"ts": timestamp, "site_id": site_id,
                       "site_code": site_code, "public_alert": highest_public_alert,
                       "internal_alert": internal_alert, "validity": validity,
                       "subsurface": subsurface_alerts_list, "surficial": current_surficial_alert,
                       "rainfall": current_rainfall_alert, "triggers": triggers
                       }
        # var_checker(" GENERATED ALERT FOR JSON", public_dict, True)

        # writes public alert to database
        pub_sym_id = get_pub_alert_symbols(highest_public_alert, "pub_sym_id")

        site_public_dict = {
            "ts": end, "site_id": site_id,
            "pub_sym_id": pub_sym_id, "ts_updated": end,
            "pub_alert_symbol": pas_map[("pub_sym_id", pub_sym_id)]
        }
        # var_checker(" site_public_dict", site_public_dict, True)

        # onset trigger
        try:
            site_public_dict["ts"] = round_data_ts(ts_onset)
        except:
            pass

        ####################################
        # TRY TO WRITE TO DB PUBLIC_ALERTS #
        ####################################
        if not do_not_write_to_db:
            print(" WRITING TO DB!")
            # try:
            #     new_public_alert_id = write_to_db_public_alerts(
            #         site_public_dict, latest_site_public_alert)
            #     var_checker("NEW PUBLIC ALERT WRITTEN", f"ID of new public alert is {new_public_alert_id}", True)
            # except Exception as err:
            #     print(err)
            #     DB.session.rollback()
            #     raise
            # var_checker(" NEW PUBLIC ALERT HAS BEEN WRITTEN",
            #             new_public_alert_id, True)
        else:

            print(" NOTHING HAS BEEN WRITTEN")

        ######################
        # !!!! PRINTERS !!!! #
        ######################
        var_checker(f"{monitoring_type.upper()} - {latest_site_public_alert.public_id} Start of Site: {site_code.upper()}",
                    monitoring_start_ts, True)

        site_public_alerts_list.append(public_dict)

    return site_public_alerts_list


def replace_public_symbol(symbol_map, value):
    """
    Sample
    """
    for item in symbol_map:
        if item.alert_level == value:
            return item.alert_symbol


def get_invalids(end, positive_triggers_list):
    """
    Sample
    """
    # This is similar to getting the latest public alert
    # but since we are looking for latest public alerts that are above A0,
    # we needed to modify it a bit
    invalids_dict = {}
    for item in positive_triggers_list:
        if item.alert_status and item.alert_status.alert_status == -1:
            # invalid_alert_status_list.append(item.alert_status)
            trigger_sym_id = item.trigger_sym_id
            if trigger_sym_id in invalids_dict:
                if invalids_dict[trigger_sym_id].ts_ack < item.alert_status.ts_ack:
                    invalids_dict[trigger_sym_id] = item.alert_status
            else:
                invalids_dict[trigger_sym_id] = item.alert_status

    return invalids_dict


def create_pas_map():
    """
    Create a map for public alert symbols that uses alert_level as key.
    """
    custom_map = {}
    public_symbols_list = pas.query.all()
    for item in public_symbols_list:
        custom_map[("alert_level", (item.alert_level))] = item.alert_symbol
        custom_map[("pub_sym_id", (item.pub_sym_id))] = item.pub_sym_id

    return custom_map


def create_ots_map():
    """
    Creates a map for operational trigger symbols that uses tuples as keys.
    """
    custom_map = {}
    ots_symbols_list = ots.query.all()
    for item in ots_symbols_list:
        custom_map[(item.trigger_hierarchy.trigger_source,
                    item.alert_level)] = item.alert_symbol

    return custom_map


def main(end=None, is_test=None, site_code=None):
    ########################
    # INITIALIZE VARIABLES #
    ########################

    start_time = datetime.now()
    print(start_time)
    ots_map = create_ots_map()
    pas_map = create_pas_map()

    if end is None:
        end = datetime.now()
        var_checker("END IS", end, True)
    else:
        end = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

    end = round_data_ts(end)
    var_checker("rounded down end", end, True)

    if is_test is True and site_code is not None:
        active_sites = [get_sites_data(site_code)]
        do_not_write_to_db = True
    elif is_test is True and site_code is None:
        active_sites = get_sites_data()
        do_not_write_to_db = True
    else:
        do_not_write_to_db = False
        active_sites = get_sites_data()

    alerts = get_site_public_alerts(
        active_sites, start_time, end, do_not_write_to_db, pas_map)

    for item in alerts:
        # Replace the public symbol of public_alert
        # E.g. - 1 -> A1, 2 -> A2
        item["public_alert"] = pas_map[("alert_level", item["public_alert"])]

        # Replace trigger symbol based from Alert Level provided per type
        # E.g. Subsurface lvl2 -> L2, Surficial lvl3 -> l3

        item["rainfall"] = ots_map[("rainfall", item["rainfall"])]
        item["surficial"] = ots_map[("surficial", item["surficial"])]

        for subsurface in item["subsurface"]:
            subsurface["alert_level"] = ots_map[(
                "subsurface", subsurface["alert_level"])]

    var_checker("!!! THE ALERTS !!!", alerts, True)
    # SAMPLE WRITE
    json_form = json.dumps(alerts)
    with open('/var/www/dynaslope3/'+'generated_alerts.json', 'w') as w:
        w.write(json_form)

    script_end = datetime.now()
    print(f"Runtime: {script_end - start_time}")


if __name__ == "__main__":
    # REAL THING
    # main()

    # L2
    main("2018-11-30 14:30:00", True, "ime")
    # main("2019-01-20 07:30:00", True, "lab")

    # Invalids
    # main("2019-05-19 23:30:00", True, "lab")
    # main("2019-01-25 07:00:00", True, "loo")

    # main("2018-12-24 07:20:00", True, "lpa")
    # main("2018-09-04 09:30:00", True, "mar")

    # ND-R
    # main("2018-11-30 15:00:00", True, "umi")

    # l2 surficial
    # main("2018-12-26 11:00:00", True, "lpa")

    # DEBUGGING LIST
    # main("2019-05-22 15:05:00", True, "hin")
    # main("2019-05-22 15:05:00", True, "blc")
    # main("2019-05-22 16:09:34", True)
    # main("2019-05-22 16:09:34", True, "lab")
