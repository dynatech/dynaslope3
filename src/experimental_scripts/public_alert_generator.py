
import pprint
from run import APP
from connection import DB
from sqlalchemy import and_, or_
from datetime import datetime, timedelta, time
from flask import jsonify

from src.models.monitoring import (
    PublicAlerts, PublicAlertSymbols,
    OperationalTriggers, InternalAlertSymbols,
    TriggerHierarchies)
from src.models.analysis import (TSMSensors, TSMAlerts)
from src.utils.sites import get_sites_data


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
    pa = PublicAlerts

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
    pa = PublicAlerts
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


def get_operational_trigger(operational_triggers, start_monitor, end):
    """Returns an appender base query containing alert level on each operational trigger
    from start of monitoring.

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


def get_internal_alert_symbols(sym_id_list, nd_source_id):
    """
    Returns an appender base query containing all internal alert symbols.
    """
    ias = InternalAlertSymbols

    symbols = ias.query.all()

    symbols_list = []
    for symbol in symbols:
        if symbol.trigger_symbol.trigger_sym_id in sym_id_list or (symbol.trigger_symbol.source_id in nd_source_id and symbol.trigger_symbol.alert_level):
            symbols_list.append(symbol)
            print("pasok")
        else:
            print("di pasok")
    var_checker(" Internal DF Symbol", symbols_list)
    # if trigger_source is None:
    #     symbol = ias.query.all()
    # else:
    #     symbol = ias.query.filter(ias.trigger)

    return symbols_list


def get_monitoring_start_ts(monitoring_type, site_public_alerts, end, site):
    """
    Return monitoring start.
    """
    # Check if the monitoring type is event, otherwise, it is a routine.
    if monitoring_type == "event":
        # Event. Get most recent alert event
        monitoring_start_ts = get_event_start_timestamp(
            site_public_alerts)
        var_checker(
            f"{site.site_code.upper()} - Monitoring Start Timestamp", monitoring_start_ts)
    else:
        # Routine. Get the time of the previous day.
        monitoring_start_ts = end - timedelta(days=1)

    return monitoring_start_ts


def get_highest_public_alert(last_positive_triggers):
    """
    Returns the maximum public alert. Only returns the compared alert levels stored in a list.

    Args:
        last_positive_triggers: List of OperationalTriggers class.
    """
    public_alerts = []
    for last_positive_trigger in last_positive_triggers:
        public_alerts.append(
            last_positive_trigger.trigger_symbol.alert_level)
    highest_public_alert = max(public_alerts + [0])

    return highest_public_alert


def get_tsm_alert(site_tsm_sensors, end):
    """
    Sample
    """
    ta = TSMAlerts
    tsm_alerts_list = []
    for sensor in site_tsm_sensors.all():
        active_alerts = sensor.tsm_alert.filter(
            ta.ts <= end, ta.ts_updated >= end - timedelta(minutes=30))

        # If active_alerts has value
        if active_alerts.all():
            for active_alert in active_alerts.all():
                tsm_alerts_list.append(active_alert)
        else:
            print("FAIL")

    return tsm_alerts_list


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
    var_checker("Highest Positive Triggers",
                highest_positive_triggers_list, True)

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
    var_checker(f" Unique List", highest_positive_triggers_list, True)

    # Get recent triggers that has data
    with_data_ids = []
    for item in release_op_trigger_list:
        if item.trigger_symbol.alert_level != -1:
            with_data_list.append(item)
            with_data_ids.append(item.trigger_symbol.source_id)
    var_checker("With data", with_data_list, True)
    var_checker("With data IDS", with_data_ids, True)

    # Compare historical triggers with recent triggers that have data.
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
    nd_source_id = []
    for item in no_data_list:
        nd_source_id.append(item.trigger_symbol.source_id)
    var_checker(" ND Source ID", nd_source_id, True)

    internal_df = get_internal_alert_symbols(sym_id_list, nd_source_id)
    var_checker(" Internal DF", internal_df, True)

    return "internal_df"


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

    if is_test is True:
        active_sites = [get_sites_data(site_code)]
    else:
        active_sites = get_sites_data()

    ######################################
    # LOOP THROUGH ACTIVE SITES PROVIDED #
    ######################################

    for site in active_sites:
        site_public_alerts = site.public_alerts
        site_operational_triggers = site.operational_triggers
        site_tsm_sensors = site.tsm_sensors

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
            monitoring_type, most_recent_site_public_alert, end, site)

        ##########################
        # GET PUBLIC ALERT LEVEL #
        ##########################
        # Get all operational triggers of the site.
        op_triggers = get_operational_trigger(
            site_operational_triggers, monitoring_start_ts, end)
        # Get the triggers within 4 hours before the release AND use "distinct" to remove duplicates
        # ASK KEVIN on distinct and drop duplicates
        release_op_triggers = op_triggers.filter(
            OperationalTriggers.ts_updated >= round_of_to_release_time(end) - timedelta(hours=4)).distinct()

        # Get the source ID of subsurface
        subsurface_source_id = get_trigger_hierarchy("subsurface").source_id
        # Get the source ID of surficial
        surficial_source_id = get_trigger_hierarchy("surficial").source_id

        # Remove subsurface triggers? (ASK KEVIN)
        release_op_trigger_list = []
        for release_op_trigger in release_op_triggers.all():
            if not (release_op_trigger.trigger_symbol.source_id == subsurface_source_id and release_op_trigger.ts_updated < end):
                release_op_trigger_list.append(release_op_trigger)

        # Get surficial triggers? (ASK KEVIN)
        positive_triggers_list = []
        for op_trigger in op_triggers.all():
            op_trig = op_trigger.trigger_symbol
            if op_trig.alert_level > 0 and not (op_trig.alert_level == 1 and op_trig.source_id == surficial_source_id):
                positive_triggers_list.append(op_trigger)

        # Remove duplicates
        last_positive_triggers = list(dict.fromkeys(positive_triggers_list))

        # Get highest public alert level
        highest_public_alert = get_highest_public_alert(last_positive_triggers)

        # Get surficial
        if highest_public_alert > 0:
            surficial_ts = round_of_to_release_time(end) - timedelta(hours=4)
        else:
            surficial_ts = datetime.strptime(end, "%Y-%m-%d")

        ######################
        # GET TRIGGER ALERTS #
        ######################
        # Get subsurface
        subsurface_alerts_list = get_tsm_alert(site_tsm_sensors, end)

        # Get surficial
        surficial_alerts = []
        for op_trigger in op_triggers.all():
            if op_trigger.trigger_symbol.source_id == surficial_source_id and op_trigger.ts_updated >= surficial_ts:
                surficial_alerts.append(op_trigger)
            else:
                surficial_alerts_list = -1
        if surficial_alerts:
            surficial_alerts_list = surficial_alerts

        # Get Rainfall
        rainfall_source_id = get_trigger_hierarchy("rainfall").source_id
        rainfall_alerts = []
        for op_trigger in op_triggers.all():
            if op_trigger.trigger_symbol.source_id == rainfall_source_id and op_trigger.ts_updated >= surficial_ts - timedelta(minutes=30):
                rainfall_alerts.append(op_trigger)
            else:
                rainfall_alerts_list = -1
        if rainfall_alerts:
            rainfall_alerts_list = rainfall_alerts

        ###################
        # INTERNAL ALERTS #
        ###################
        internal_source_id = get_trigger_hierarchy("internal").source_id

        if highest_public_alert > 0:
            validity = max(positive_triggers_list,
                           key=lambda x: x.ts_updated).ts_updated + timedelta(days=1)
            rounded_validity = round_of_to_release_time(validity)

            if highest_public_alert == 3:
                rounded_validity += timedelta(days=1)

            # internal alert based on positive triggers and data presence
            internal_df = get_internal_alert(
                positive_triggers_list, release_op_trigger_list)

        ######################
        # !!!! PRINTERS !!!! #
        ######################
        var_checker(
            f"{monitoring_type.upper()} - {latest_site_public_alert.public_id} Start of Site: {site.site_code.upper()}", monitoring_start_ts, True)
        var_checker(
            f" release_op_triggers", release_op_triggers.all(), True)
        var_checker(
            f" RENEWED release_op_trig", release_op_trigger_list, True)
        var_checker(
            f" Positive Triggers", positive_triggers_list, True)
        var_checker(
            f" LAST Positive Triggers", last_positive_triggers, True)
        var_checker(
            f" Public Alert", highest_public_alert, True)
        var_checker(f" TSM Sensors", site_tsm_sensors.all(), True)
        var_checker(f" Subsurface Triggers", subsurface_alerts_list, True)
        var_checker(f" Surficial Alert", surficial_alerts_list, True)
        var_checker(f" Rainfall ID", rainfall_source_id, True)
        var_checker(f" Rainfall Alert", rainfall_alerts_list, True)
        var_checker(f" Validity", validity, True)
        var_checker(f" Rounded Up Validity", rounded_validity, True)
        var_checker(f" Internal DF", get_internal_alert(
            positive_triggers_list, release_op_trigger_list), True)

        print()

    script_end = datetime.now()
    print(f"Runtime: {script_end - start_time}")


if __name__ == "__main__":
    # main("2019-01-20 07:30:00", True, "lab")
    # main("2018-11-30 14:30:00", True, "ime")
    main("2018-12-24 07:20:00", True, "lpa")
    # main()
