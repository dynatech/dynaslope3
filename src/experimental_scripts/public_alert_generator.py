
import pprint
from run import APP
from connection import DB
from sqlalchemy import and_, or_
from datetime import datetime, timedelta, time
from flask import jsonify

from src.models.monitoring import (
    PublicAlerts as pa, PublicAlertSymbols as pas,
    # Get the trigger_sym_id of Rx rainfall alert
    OperationalTriggers, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies)
from src.models.analysis import (TSMSensors, TSMAlerts, RainfallAlerts)
from src.utils.sites import get_sites_data

INTERNAL_ALERT_SYMBOLS = ias.query.all()
PUBLIC_ALERT_SYMBOLS = pas.query.all()
OPERATIONAL_TRIGGER_SYMBOLS = ots.query.all()


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
        or_(pa.ts_updated <= end, and_(pa.ts_updated >= end, pa.ts <= end)))

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
    ot = OperationalTriggers

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
        var_checker(
            f"{site_code.upper()} - Monitoring Start Timestamp", monitoring_start_ts)
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
        else:
            dummy_sensor = t_sensor()
            empty = ta(
                ta_id=None,
                ts=None,
                tsm_id=None,
                alert_level=None,
                ts_updated=None,
                tsm_sensor=dummy_sensor
            )
            tsm_alerts_list.append(empty)

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

    var_checker(" no data ", no_data, True)
    var_checker(" no data alert symbol", no_data.alert_symbol, True)

    return no_data


def get_internal_alert(positive_triggers_list, release_op_trigger_list):
    """
    Sample
    """
    # Declare the essential lists
    highest_positive_triggers_list = []
    with_data_list = []
    final_data_list = []
    no_data_list = []

    # Get a sorted list of historical triggers
    highest_positive_triggers_list = sorted(
        positive_triggers_list, key=lambda x: x.trigger_symbol.alert_level)

    # Eliminate duplicates
    # Note: Just a comparator. Needs to be refactored to accomodate any needs.
    comparator = []
    unique_list = []
    for item in highest_positive_triggers_list:
        com = item.trigger_symbol.source_id
        comparator.append(com)
        if not (com in comparator and comparator.count(com) > 1):
            unique_list.append(item)
    highest_positive_triggers_list = unique_list

    # Get recent triggers that has data
    with_data_ids = []
    for item in release_op_trigger_list:
        if item.trigger_symbol.alert_level != -1:
            with_data_list.append(item)
            with_data_ids.append(item.trigger_symbol.source_id)
    var_checker("With data", with_data_list, True)
    var_checker("With data IDS", with_data_ids, True)

    # Compare historical triggers with recent triggers that have data and have
    # no data.
    comparator = []
    for item in highest_positive_triggers_list:
        com = item.trigger_symbol.source_id
        if com in with_data_ids:
            final_data_list.append(item)
        else:
            no_data_list.append(item)

    var_checker(" Historical triggers that has data", final_data_list, True)
    var_checker(" Historical triggers that has no data", no_data_list, True)

    # On Demand
    # Check if general list of triggers has on demand
    # Note: final_data_list append is my interpretation of DF.append. PLease confirm with Kevin
    on_demand_id = get_trigger_hierarchy(
        "on demand").trigger_symbol[0].internal_alert_symbol[0].trigger_sym_id
    on_demand_list = []
    for item in final_data_list:
        if item.trigger_sym_id == on_demand_id:
            on_demand_list.append(item)
            final_data_list.append(item)
    var_checker(" On Demand List", on_demand_list, True)

    # Earthquake
    earthquake_id = get_trigger_hierarchy(
        "earthquake").trigger_symbol[0].internal_alert_symbol[0].trigger_sym_id
    var_checker(" Earthquake ID", earthquake_id, True)

    # Check if general list of triggers has on demand
    # Note: final_data_list append is my interpretation of DF.append. PLease confirm with Kevin
    earthquake_list = []
    for item in final_data_list:
        if item.trigger_sym_id == earthquake_id:
            earthquake_list.append(item)
            final_data_list.append(item)
    var_checker(" Earthquake List", earthquake_list, True)

    # Get trigger_sym_ids of final data list
    sym_id_list = []
    for item in final_data_list:
        sym_id_list.append(item.trigger_sym_id)
    var_checker(" Sym ID List", sym_id_list, True)

    # Get source ids of NDs
    nd_source_id_list = []
    unique_no_data_list = []
    comparator = []
    for item in no_data_list:
        nd_source_id_list.append(item.trigger_symbol.source_id)

        # Get unique nd_list
        com = item.trigger_symbol.source_id
        comparator.append(com)
        if not (com in comparator and comparator.count(com) > 1):
            unique_no_data_list.append(item)

    var_checker(" ND Source ID", nd_source_id_list, True)
    var_checker(" Unique No Data List", unique_no_data_list, True)

    internal_df = get_internal_alert_symbols(sym_id_list, nd_source_id_list)

    # Check if no_data_list has data
    no_data_list = False
    if no_data_list:
        print("!!!!!!!!!!!!!!!!!")
        print("NO DATA")
        print("!!!!!!!!!!!!!!!!!")
        # Eliminate duplicates
        # Note: Just a comparator. Needs to be refactored to accomodate any needs.
        nd_internal_df = []
        for no_data_op_trigger in unique_no_data_list:
            no_data_op_trigger = replace_nd_internal_alert_symbol(
                no_data_op_trigger)
            nd_internal_df.append(no_data_op_trigger)
        internal_df = nd_internal_df

    # Check if there are duplicates in internal_df
    comparator = []
    unique_list = []
    for item in internal_df:
        comparator.append(item)
        if not (com in comparator and comparator.count(com) > 1):
            unique_list.append(item)
    internal_df = unique_list

    return internal_df


def replace_rainfall_alert_if_rx(site_rainfall_alerts, internal_df, end, rainfall_source_id, rain_75_id):
    """
    Sample
    """
    internal_df_source_id_list = []
    is_rx = False
    if site_rainfall_alerts.all():
        is_rx = True
        for item in internal_df:
            internal_df_source_id_list.append(item.trigger_symbol.source_id)
        var_checker(" internal_df_source_id_list",
                    internal_df_source_id_list, True)

        if rain_75_id in internal_df_source_id_list:
            rain_alert = ias.query.filter(
                ias.trigger_sym_id == rain_75_id).alert_symbol
            trigger_sym_id = ias.query.filter(
                ias.trigger_sym_id == rain_75_id).trigger_sym_id

            for item in internal_df:
                if item.trigger_symbol.source_id == rainfall_source_id:
                    item.alert_symbol = rain_alert
                    item.trigger_sym_id = trigger_sym_id
        else:
            print("Do that")
            rain_df = ias.query.filter(
                ias.trigger_sym_id == rain_75_id).first()
            rain_df.alert_symbol = rain_df.alert_symbol.lower()
            var_checker(" RAIN DF", rain_df, True)
            internal_df.append(rain_df)

    return internal_df, is_rx


def get_pub_alert_symbols(alert_level, return_data="alert_symbol"):
    result = pas.query.filter(
        pas.alert_level == alert_level).first()
    if return_data == "alert_symbol":
        return_value = result.alert_symbol
    elif return_data == "pub_sym_id":
        return_value = result.pub_sym_id

    return return_value


def get_non_rainfall_alert_level_list(internal_df):
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


def get_prepared_recent_retriggers(not_empty=True, last_positive_triggers=None):
    """
    Prepare the most recent trigger
    Remove unnecessary attributes and convert SQLAlchemy row into a dict.
    Convert ts_updated to str

    Args: 
    last_positive_triggers - list containing the most recent positive trigger (SQLAlchemy row)
    """
    recent_triggers_list = []
    if not_empty:
        for item in last_positive_triggers:
            trigger_dict = {
                "trigger_id": item.trigger_id,
                "alert": item.trigger_symbol.alert_level,
                "ts_updated": str(item.ts_updated)
            }
            recent_triggers_list.append(trigger_dict)
            print(recent_triggers_list)
    else:
        trigger_dict = {
            "trigger_id": "",
            "alert": "",
            "ts_updated": ""
        }
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


def write_to_db_public_alerts(site_public_dict):
    """
    SQLAlchemy DB writer function.
    """
    try:
        new_pub_alert = PublicAlerts(
            ts=site_public_dict["ts"],
            site_id=site_public_dict["site_id"],
            pub_sym_id=site_public_dict["pub_sym_id"],
            ts_updated=site_public_dict["ts_updated"]
        )
        DB.session.add(new_pub_alert)
        DB.session.flush()
        new_public_id = new_pub_alert.public_id
    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return new_public_id


def get_site_public_alerts(active_sites, start_time, end, do_not_write_to_db):
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
            OperationalTriggers.ts_updated >= round_of_to_release_time(end) - timedelta(hours=4)).distinct()

        subsurface_source_id = get_trigger_hierarchy("subsurface").source_id
        surficial_source_id = get_trigger_hierarchy("surficial").source_id

        # Remove subsurface triggers? (ASK KEVIN)
        release_op_trigger_list = []
        for release_op_trigger in release_op_triggers.all():
            if not (release_op_trigger.trigger_symbol.source_id == subsurface_source_id and release_op_trigger.ts_updated < end):
                release_op_trigger_list.append(release_op_trigger)

        # Get surficial triggers? (ASK KEVIN)
        positive_triggers_list = []
        for op_trigger in op_triggers_list.all():
            op_trig = op_trigger.trigger_symbol
            if op_trig.alert_level > 0 and not (op_trig.alert_level == 1 and op_trig.source_id == surficial_source_id):
                positive_triggers_list.append(op_trigger)

        # Remove duplicates and get the last positive trigger
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
        last_positive_triggers = unique_list

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
        var_checker(" PREPARED SUBSURFACE ALERTS LIST",
                    subsurface_alerts_list, True)

        # Get surficial
        surficial_alerts = []
        for op_trigger in op_triggers_list.all():
            if op_trigger.trigger_symbol.source_id == surficial_source_id and op_trigger.ts_updated >= surficial_ts:
                surficial_alerts.append(op_trigger)
            else:
                surficial_alerts_list = -1
        if surficial_alerts:
            surficial_alerts_list = surficial_alerts[0].trigger_symbol.alert_level

        # Get Rainfall
        rainfall_source_id = get_trigger_hierarchy("rainfall").source_id
        rainfall_alerts = []
        for op_trigger in op_triggers_list.all():
            if op_trigger.trigger_symbol.source_id == rainfall_source_id and op_trigger.ts_updated >= surficial_ts - timedelta(minutes=30):
                print("MERON RAINFALL")
                rainfall_alerts.append(op_trigger)
        if rainfall_alerts:
            rainfall_alerts_list = rainfall_alerts[0].trigger_symbol.alert_level
        else:
            rainfall_alerts_list = -1

        ###################
        # INTERNAL ALERTS #
        ###################
        internal_source_id = get_trigger_hierarchy("internal").source_id

        if highest_public_alert > 0:
            print("== OVER ZERO!")
            validity = max(positive_triggers_list,
                           key=lambda x: x.ts_updated).ts_updated + timedelta(days=1)
            validity = round_of_to_release_time(validity)

            if highest_public_alert == 3:
                validity += timedelta(days=1)

            # internal alert based on positive triggers and data presence
            internal_df = get_internal_alert(
                positive_triggers_list, release_op_trigger_list)

            # Get the trigger_sym_id of Rx rainfall alert
            rain_75_id = ots.query.filter(
                ots.alert_level == -2).first().trigger_sym_id

            if rainfall_alerts_list == 0 and end >= (validity - timedelta(minutes=30)):
                internal_df, is_rx = replace_rainfall_alert_if_rx(
                    site_rainfall_alerts, internal_df, end, rainfall_source_id, rain_75_id)

                # Is is_rx True
                if is_rx:
                    rainfall_alerts_list = -2

            internal_df = sorted(
                internal_df, key=lambda x: x.trigger_symbol.trigger_hierarchy.source_id)
            internal_alert = "".join(internal_df[0].alert_symbol)

            if highest_public_alert > 1:
                public_alert_symbol = get_pub_alert_symbols(
                    highest_public_alert, "alert_symbol")
                internal_alert = public_alert_symbol + '-' + internal_alert

            ground_alert_levels_list = get_non_rainfall_alert_level_list(
                internal_df)

        #####################################################
        # ground data presence: subsurface, surficial, moms #
        #####################################################

        if highest_public_alert <= 1:
            print(" PUBLIC ALERT LESS THAN EQUAL 1!")
            print()
            tsm_with_data = []
            for subsurface in subsurface_alerts_list:
                if subsurface["alert_level"] != -1:
                    tsm_with_data.append(subsurface)

            # Check if ground (surficial and sub) has data
            if surficial_alerts_list == -1 and len(tsm_with_data) == 0:
                ground_alert = -1
            else:
                ground_alert = 0

            # Get the pub_internal
            pub_internal = ""
            if highest_public_alert == 0 or ground_alert == -1:
                # Just a loop to find the appropriate alert symbol
                pub_internal = get_internal_alert_symbol_ground_and_source(
                    ground_alert, internal_source_id)
                if highest_public_alert == 0:
                    internal_alert = ""
                    hyphen = ""
                else:
                    hyphen = "-"
            else:
                pub_internal = get_pub_alert_symbols(
                    highest_public_alert, "alert_symbol")
                hyphen = "-"
                var_checker(" pub_internal", pub_internal)

            internal_alert = pub_internal + hyphen + internal_alert

        elif -1 in ground_alert_levels_list:
            print(" GROUND ALERT NO DATA!")
            print()
            ground_alert = -1
        else:
            print(" GROUND ALERT ZERO!")
            print()
            ground_alert = -1
            ground_alert = 0

        ################
        # PUBLIC ALERT #
        ################
        # Lowering: Check if end of validity and not rain75
        if highest_public_alert > 0:
            is_release_time_run = end.time() in [time(3, 30), time(7, 30),
                                                 time(11, 30), time(
                                                     15, 30), time(19, 30),
                                                 time(23, 30)]
            is_45_minute_beyond = int(start_time.strftime('%M')) > 45
            is_not_yet_write_time = not (
                is_release_time_run and is_45_minute_beyond)

            trigger_sym_id_list = get_internal_df_attribute(
                internal_df, "trigger_sym_id", "list")

            # check if end of validity: lower alert if with data and not rain75
            if validity > (end + timedelta(minutes=30)):
                pass
            elif (rain_75_id in trigger_sym_id_list) or (validity + timedelta(days=3) > end + timedelta(minutes=30)) and (ground_alert == -1) or is_not_yet_write_time:
                validity = round_of_to_release_time(end)
                var_checker(" validity in 75", validity, True)

                if is_release_time_run:
                    if not(is_45_minute_beyond):
                        do_not_write_to_db = True
            else:
                validity = ""
                highest_public_alert = 0
                internal_alert = get_internal_alert_symbol_ground_and_source(
                    ground_alert, internal_source_id)

        else:
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
                True, last_positive_triggers)
            var_checker(" _TRIGGER", triggers, True)
        except:
            triggers = get_prepared_recent_retriggers(False)

        # technical info for bulletin release
        # SKIPPED DUE TO THE NEED TO CREATE ANOTHER MODULE FOR TECHINFOMAKER
        try:
            print("Do this")
        except:
            print("Oh no! Do this instead")

        try:
            op_trig_with_data_list = []
            for item in op_triggers_list:
                if item.trigger_symbol.alert_level != -1:
                    op_trig_with_data_list.append(item)
            timestamp = max(op_trig_with_data_list,
                            key=lambda x: x.ts_updated).ts_updated
            timestamp = round_data_ts(timestamp)
        except:
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
                       "subsurface": subsurface_alerts_list, "surficial": surficial_alerts_list,
                       "rainfall": rainfall_alerts_list, "triggers": triggers,
                       "tech_info": "tech_info"
                       }
        var_checker(" public_dict", public_dict, True)

        # writes public alert to database
        pub_sym_id = get_pub_alert_symbols(highest_public_alert, "pub_sym_id")
        var_checker(" pub_sym_id", pub_sym_id, True)
        site_public_dict = {
            "ts": end, "site_id": site_id,
            "pub_sym_id": pub_sym_id, "ts_updated": end
        }
        var_checker(" site_public_dict", site_public_dict, True)

        # onset trigger
        try:
            site_public_dict["ts"] = round_data_ts(ts_onset)
        except:
            pass

        ####################################
        # TRY TO WRITE TO DB PUBLIC_ALERTS #
        ####################################
        if not do_not_write_to_db:
            new_public_alert_id = write_to_db_public_alerts(site_public_dict)
            var_checker(" NEW PUBLIC ALERT HAS BEEN WRITTEN",
                        new_public_alert_id, True)
            # Commit only when there are no problems
            DB.session.commit()
        else:
            print()
            print(" NOTHING HAS BEEN WRITTEN")
            print()


        
        ######################
        # !!!! PRINTERS !!!! #
        ######################
        var_checker(f"{monitoring_type.upper()} - {latest_site_public_alert.public_id} Start of Site: {site_code.upper()}",
                    monitoring_start_ts, True)
        # # var_checker(
        # #     f" release_op_triggers", release_op_triggers.all(), True)
        # var_checker(
        #     " RENEWED release_op_trig", release_op_trigger_list, True)
        # var_checker(
        #     " Positive Triggers", positive_triggers_list, True)
        # var_checker(
        #     " LAST Positive Triggers", last_positive_triggers, True)
        # var_checker(
        #     " Public Alert", highest_public_alert, True)
        # var_checker(" TSM Sensors", site_tsm_sensors.all(), True)
        var_checker(" Subsurface Triggers", subsurface_alerts_list, True)
        # var_checker(" Surficial Alert", surficial_alerts_list, True)
        # var_checker(" Rainfall ID", rainfall_source_id, True)
        # var_checker(" Rainfall Alert", rainfall_alerts_list, True)
        # var_checker(" Validity", validity, True)
        # # var_checker(" Internal DF", internal_df, True)
        # var_checker(" Internal DF", get_internal_alert(
        #     positive_triggers_list, release_op_trigger_list), True)
        # var_checker(" Internal Alert String", internal_alert, True)
        # var_checker(" Ground Alert Levels List",
        #             ground_alert_levels_list, True)

        site_public_alerts_list.append(public_dict)

    return site_public_alerts_list


def replace_public_symbol(symbol_map, value):
    """
    """
    
    for item in symbol_map:
        if item.alert_level == value:
            return item.alert_symbol         


def get_current_events(end):
    """
    PENDING: GET MOST RECENT ALERT HISTORY
    """
    res = pa.query.filter(pa.ts_updated >= end).order_by(DB.desc(pa.ts_updated)).all()
    current_events_list = []
    comparator = []
    for item in res:
        com = item.site_id
        comparator.append(com)
        if not (com in comparator and comparator.count(com) > 1):
            if item.alert_symbol.alert_level > 0:
                current_events_list.append(item)
    return current_events_list


def main(end=None, is_test=None, site_code=None):
    ########################
    # INITIALIZE VARIABLES #
    ########################
    start_time = datetime.now()
    print(start_time)

    if end is None:
        end = datetime.now()
    else:
        end = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

    end = round_data_ts(end)

    if is_test is True and site_code is not None:
        active_sites = [get_sites_data(site_code)]
        do_not_write_to_db = True
    elif is_test is True and site_code is None:
        active_sites = get_sites_data()
        do_not_write_to_db = True
    else:
        active_sites = get_sites_data()

    alerts = get_site_public_alerts(active_sites, start_time, end, do_not_write_to_db)
    var_checker(" PRODUCT OF FUCKING SHIT", alerts, True)

    # Replace the public symbol of public_alert
    # E.g. - 1 -> A1, 2 -> A2
    for item in alerts:
        item["public_alert"] = replace_public_symbol(PUBLIC_ALERT_SYMBOLS, item["public_alert"])

    # Replace trigger symbol based from Alert Level provided per type
    # E.g. Subsurface lvl2 -> L2, Surficial lvl3 -> l3
    for item in alerts:
        for sub_item in OPERATIONAL_TRIGGER_SYMBOLS:
            if sub_item.trigger_hierarchy.trigger_source == "rainfall" and sub_item.alert_level == item["rainfall"]:
                new_rain_symbol = sub_item.alert_symbol
            elif sub_item.trigger_hierarchy.trigger_source == "surficial" and sub_item.alert_level == item["surficial"]:
                new_surficial_symbol = sub_item.alert_symbol
            elif sub_item.trigger_hierarchy.trigger_source == "subsurface":
                if item["subsurface"][0]["alert_level"] is None:
                    new_subsurface_symbol = "Empty"
                elif sub_item.alert_level == item["subsurface"][0]["alert_level"]:
                    new_subsurface_symbol = sub_item.alert_symbol
                    
        item["rainfall"] = new_rain_symbol
        item["surficial"] = new_surficial_symbol
        item["subsurface"] = new_subsurface_symbol

    var_checker(" NEW ALERTS", alerts, True)

    current_events = get_current_events(end)
    var_checker(" current_events", current_events, True)
    var_checker(" len current_events", len(current_events), True)

    script_end = datetime.now()
    print(f"Runtime: {script_end - start_time}")


if __name__ == "__main__":
    # main("2019-01-20 07:30:00", True, "lab")
    # main("2018-11-30 14:30:00", True, "ime")
    # main("2018-12-24 07:20:00", True, "lpa")
    # main("2018-09-04 09:30:00", True, "mar")
    # main("2018-11-30 15:00:00", True, "umi")
    main("2018-11-30 14:30:00", True)
