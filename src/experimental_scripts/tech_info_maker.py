import sys
sys.path.append(
    r"D:\Users\swat-dynaslope\Documents\DYNASLOPE-3.0\dynaslope3-final")
import pprint
import itertools
from datetime import datetime, timedelta, time
from connection import DB
from run import APP
from sqlalchemy import and_
from src.models.analysis import (
    RainfallAlerts as ra, MarkerAlerts as ma, MarkerHistory as mh,
    NodeAlerts as na)
from src.models.monitoring import (MonitoringMoms as mm)


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

# NOTE: Delete if not needed


def group_by(pos_trig_list):
    """
    TRY TO USE THIS ON EARLIER GROUPBY USES
    Returns Tuples {Trig_sym_id, value}
    """
    sorted_list = sorted(pos_trig_list, key=lambda x: x.trigger_sym_id)
    group_list = []
    for key, group in itertools.groupby(sorted_list, key=lambda x: x.trigger_sym_id):
        print()
        item = (key, list(group))
        group_list.append(item)

    return group_list


# NOTE: OPTIMIZE (IMPORT IF MUST)
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
        date_time = datetime.combine(
            date_time.date() + timedelta(1), time(0, 0))
    else:
        date_time = datetime.combine(
            date_time.date(), time((quotient + 1) * 4, 0))

    return date_time


#####################################
# DATA PROCESSING CODES BEYOND HERE #
#####################################


def get_moms_tech_info(moms_alert_details):
    """
    Sample
    """
    m2_triggers_features = []
    m3_triggers_features = []
    moms_tech_info = {}
    moms_parts = []

    for item in moms_alert_details:
        feature = item.moms_instance.feature.feature_type
        if item.op_trigger == 2:
            m2_triggers_features.append(feature)
        elif item.op_trigger == 3:
            m3_triggers_features.append(feature)

    significant = ", ".join(m2_triggers_features)
    critical = ", ".join(m3_triggers_features)

    if m2_triggers_features:
        significant_word = "significant"
        if len(m2_triggers_features) == 1:
            significant_word = significant_word.capitalize()
        moms_parts.append(f"{significant_word} ({significant})")

    if m3_triggers_features:
        critical_word = "critical"
        if len(m3_triggers_features) == 1:
            critical_word = critical_word.capitalize()
        moms_parts.append(f"{critical_word} ({critical})")

    multiple = ""
    feature = "feature"
    if len(moms_alert_details) > 1:
        multiple = "Multiple "
        feature = "features"

    day = " and ".join(moms_parts)
    moms_tech_info = f"{multiple}{day} {feature} observed in site."
    return moms_tech_info


def get_moms_alerts(site_id, latest_trigger_ts):
    """
    Get MOMS alerts
    """
    moms_alerts_list = []

    # op_trigger is same concept with alert_level
    moms_alerts = mm.query.filter(
        mm.observance_ts == latest_trigger_ts, mm.op_trigger > 0)

    for item in moms_alerts.all():
        if item.moms_instance.site_id == site_id:
            moms_alerts_list.append(item)

    return moms_alerts_list


def formulate_surficial_tech_info(surficial_alert_detail):
    """
    Sample
    """
    tech_info = []
    surficial_tech_info = ""
    for item in surficial_alert_detail:
        name = item.marker.marker_histories.order_by(
            DB.desc(mh.ts)).first().marker_names[0].marker_name
        disp = item.displacement
        time = '{:.2f}'.format(item.time_delta)
        tech_info.append(
            f"Marker {name}: {disp} cm difference in {time} hours")

        surficial_tech_info = '; '.join(tech_info)

    return surficial_tech_info


def get_surficial_alerts(site_id, latest_trigger_ts):
    """
    Sample
    Note: Please revise this to accomodate the changes in relationships of MarkerAlerts
    """
    surficial_alerts_list = []
    surficial_alerts = ma.query.filter(
        ma.ts == latest_trigger_ts, ma.alert_level > 0)
    for item in surficial_alerts.all():
        if item.marker.site_id == site_id:
            surficial_alerts_list.append(item)

    return surficial_alerts_list


def get_surficial_tech_info(surficial_alert_details):
    """
    Sample
    """
    l2_triggers = []
    l3_triggers = []
    surficial_tech_info = {}

    for item in surficial_alert_details:
        if item.alert_level == 2:
            l2_triggers.append(item)

        if item.alert_level == 3:
            l3_triggers.append(item)

        group_array = [l2_triggers, l3_triggers]
        for index, group in enumerate(group_array):
            if group:
                tech_info = formulate_surficial_tech_info(group)
                # NOTE: ano yung "l" dito? l2/l3? Updae code if kailangan for g2/3 (use maps)
                surficial_tech_info["l" + str(index + 2)] = tech_info

    return surficial_tech_info


def get_rainfall_alerts(site_id, latest_trigger_ts):
    """
    Query rainfall alerts
    Non-Testable
    """
    # NOTE: lipat yung .all() here
    rain_alerts = ra.query.filter(
        ra.site_id == site_id, ra.ts == latest_trigger_ts)

    return rain_alerts


def get_rainfall_tech_info(rainfall_alert_details):
    """
    Sample
    """
    one_day_data = None
    three_day_data = None

    # NOTE: The use of .all() does not affect the iterability of the SQLAlchemy row.
    # for item in rainfall_alert_details:
    # var_checker("RAINFALL DETAILS", rainfall_alert_details.all(), True)

    for item in rainfall_alert_details.all():
        days = []
        cumulatives = []
        thresholds = []

        rain_gauge_name = item.rainfall_gauge.gauge_name
        data_source = item.rainfall_gauge.data_source

        if data_source == "noah":
            rain_gauge_name = "NOAH " + str(rain_gauge_name)
        rain_gauge_name = rain_gauge_name.upper()

        # Not totally sure if there is always only one entry of a and b per rainfall ts
        # if yes, this can be improved.
        # TEST WITH BOTH 1- and 3-day
        if item.rain_alert == "a":
            one_day_data = item

        if item.rain_alert == "b":
            three_day_data = item

        if one_day_data is not None:
            days.append("1-day")
            cumulatives.append('{:.2f}'.format(one_day_data.cumulative))
            thresholds.append('{:.2f}'.format(one_day_data.threshold))

        if three_day_data is not None:
            days.append("3-day")
            cumulatives.append('{:.2f}'.format(three_day_data.cumulative))
            thresholds.append('{:.2f}'.format(three_day_data.threshold))

    day = " and ".join(days)
    cumulative = " and ".join(cumulatives)
    threshold = " and ".join(thresholds)

    rain_tech_info = {}
    rain_tech_info["rain_gauge"] = f"RAIN_{rain_gauge_name}"
    rain_tech_info[
        "tech_info_string"] = f"RAIN {rain_gauge_name}: {day} cumulative rainfall ({cumulative} mm) exceeded threshold ({threshold} mm)"

    return rain_tech_info


def get_subsurface_alerts(site_id, start_ts, latest_trigger_ts):
    """
    Sample
    """
    # NOTE: OPTIMIZE: Use TSMSensor instead of NodeAlerts OR use join() query
    row = na.query.filter(na.ts >= start_ts, na.ts
                          <= latest_trigger_ts).order_by(DB.desc(na.na_id))

    subsurface_alerts = []
    for item in row.all():
        sensor = item.tsm_sensor
        if sensor.site_id == site_id and sensor.site.site_code in sensor.logger.logger_name:
            subsurface_alerts.append(item)

    return subsurface_alerts


def format_node_details(triggers):
    """
    Sample
    """
    node_details = []
    tsm_name_list = []

    # NOTE: OPTIMIZE
    for item in triggers:
        tsm_name_list.append(item.tsm_sensor.logger.logger_name)

    for i in tsm_name_list:
        col_list = []
        for trigger in triggers:
            if trigger.tsm_sensor.logger.logger_name == i:
                col_list.append(trigger)

    if len(col_list) == 1:
        node_details.append(f"{i.upper()} (node {col_list[0].node_id})")
    else:
        sorted_nodes = sorted(col_list, key=lambda x: x.node_id)
        node_details.append(
            f"{i.upper()} (nodes {', '.join(str(v.node_id) for v in sorted_nodes)})")

    return ", ".join(node_details)


def formulate_subsurface_tech_info(subsurface_alerts):
    """
    Sample
    """
    both_trigger = []
    dis_trigger = []
    vel_trigger = []

    for item in subsurface_alerts:
        disp_alert = item.disp_alert
        vel_alert = item.vel_alert
        if disp_alert > 0 and vel_alert > 0:
            both_trigger.append(item)

        if disp_alert > 0 and vel_alert == 0:
            dis_trigger.append(item)

        if disp_alert == 0 and vel_alert > 0:
            vel_trigger.append(item)

    node_details = []

    if both_trigger:
        dispvel_tech = format_node_details(both_trigger)
        node_details += ['%s exceeded displacement and velocity threshold' %
                         (dispvel_tech)]

    if dis_trigger:
        disp_tech = format_node_details(dis_trigger)
        node_details += ['%s exceeded displacement threshold' % (disp_tech)]

    if vel_trigger:
        vel_tech = format_node_details(vel_trigger)
        node_details += ['%s exceeded velocity threshold' % (vel_tech)]

    node_details = '; '.join(node_details)

    return node_details


def get_subsurface_tech_info(subsurface_alerts):
    """
    Sample
    """
    ####
    # NEW VERSION OF COMPARATOR AS ALTERNATIVE TO PANDAS DROP DUPLICATES
    unique_list = []
    comparator = []
    for item in subsurface_alerts:
        com1 = item.tsm_sensor.logger.logger_name
        com2 = item.node_id
        comparator.append((com1, com2))
        if not ((com1, com2) in comparator and comparator.count((com1, com2)) > 1):
            unique_list.append(item)
    subsurface_alerts = unique_list

    l2_triggers = []
    l3_triggers = []
    for item in subsurface_alerts:
        if item.disp_alert == 2 or item.vel_alert == 2:
            l2_triggers.append(item)
        if item.disp_alert == 3 or item.vel_alert == 3:
            l3_triggers.append(item)

    subsurface_tech_info = {}
    group_array = [l2_triggers, l3_triggers]
    for index, group in enumerate(group_array):
        if group:
            tech_info = formulate_subsurface_tech_info(group)
            # Commented the following code because according to Senior SRS, only the string is needed.
            # subsurface_tech_info["L" + str(index+2)] = tech_info
            subsurface_tech_info = tech_info

    return subsurface_tech_info


def main(trigger):
    """
    Return tech_info
    """
    site_id = trigger.site_id
    latest_trigger_ts = trigger.ts_updated
    trigger_source = trigger.trigger_symbol.trigger_hierarchy.trigger_source
    start_ts = round_of_to_release_time(
        latest_trigger_ts) - timedelta(hours=4)

    if trigger_source == 'subsurface':
        subsurface_alerts = get_subsurface_alerts(
            site_id, start_ts, latest_trigger_ts)
        technical_info = get_subsurface_tech_info(
            subsurface_alerts)
    elif trigger_source == 'rainfall':
        rainfall_alerts = get_rainfall_alerts(site_id, latest_trigger_ts)
        # Something special with rainfall. Attaches data source with the tech_info
        technical_info = get_rainfall_tech_info(
            rainfall_alerts)
    elif trigger_source == 'surficial':
        surficial_alert_details = get_surficial_alerts(
            site_id, latest_trigger_ts)
        technical_info = get_surficial_tech_info(
            surficial_alert_details)
    elif trigger_source == 'moms':
        moms_alert_details = get_moms_alerts(site_id, latest_trigger_ts)
        technical_info = get_moms_tech_info(moms_alert_details)
    elif trigger_source == 'on demand':
        technical_info = ""
    elif trigger_source == 'earthquake':
        technical_info = ""
    else:
        raise Exception("Something wrong in tech_info_maker")

    return technical_info
