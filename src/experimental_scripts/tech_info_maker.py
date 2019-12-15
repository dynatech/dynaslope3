"""
Tech Info Maker (Py3) version 0.2
======
For use of Dynaslope Early Warning System
Receives a trigger class and uses its details to
generate technical information for use in the
alert release bulletins.

August 2019
"""

from datetime import datetime, timedelta, time
from connection import DB
# from run import APP
from sqlalchemy import and_
from src.models.analysis import (
    RainfallAlerts as ra, MarkerAlerts as ma, MarkerHistory as mh,
    NodeAlerts as na, TSMSensors as tsma)
from src.models.monitoring import (MonitoringMoms as mm)
from src.utils.rainfall import (get_rainfall_gauge_name)
from src.utils.extra import var_checker, retrieve_data_from_memcache
from src.utils.monitoring import round_to_nearest_release_time


# Every how many hours per release
RELEASE_INTERVAL_HOURS = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")

#####################################
# DATA PROCESSING CODES BEYOND HERE #
#####################################


def get_on_demand_tech_info(on_demand_details):
    """
    """
    # on_demand_details

    return on_demand_details


def get_earthquake_tech_info(earthquake_details):
    """
    """
    # ea_id = earthquake_details["ea_id"]
    magnitude = earthquake_details["magnitude"]
    latitude = earthquake_details["latitude"]
    longitude = earthquake_details["longitude"]
    # distance = earthquake_details["distance"]

    return f"An earthquake with Magnitude {magnitude} " + \
        f"({latitude} N, {longitude} E) recorded."


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

    if m3_triggers_features:
        critical_word = "critical"
        if len(m3_triggers_features) == 1:
            critical_word = critical_word.capitalize()
        moms_parts.append(f"{critical_word} ({critical})")

    if m2_triggers_features:
        significant_word = "significant"
        if len(m2_triggers_features) == 1:
            significant_word = significant_word.capitalize()
        moms_parts.append(f"{significant_word} ({significant})")

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
        timestamp = '{:.2f}'.format(item.time_delta)
        tech_info.append(
            f"Marker {name}: {disp} cm difference in {timestamp} hours")

        surficial_tech_info = '; '.join(tech_info)

    return surficial_tech_info


def get_surficial_alerts(site_id, latest_trigger_ts, alert_level):
    """
    Sample
    Note: Please revise this to accomodate the changes in relationships of MarkerAlerts
    """
    surficial_alerts_list = []
    surficial_alerts = ma.query.filter(
        ma.ts == latest_trigger_ts, ma.alert_level == alert_level)
    for item in surficial_alerts.all():
        if item.marker.site_id == site_id:
            surficial_alerts_list.append(item)

    return surficial_alerts_list


def get_surficial_tech_info(surficial_alert_details):
    """
    g triggers or surficial triggers tech info
    """
    surficial_tech_info = formulate_surficial_tech_info(
        surficial_alert_details)
    return surficial_tech_info


def get_rainfall_alerts(site_id, latest_trigger_ts):
    """
    Query rainfall alerts
    Non-Testable
    """
    rain_alerts = ra.query.filter(
        ra.site_id == site_id, ra.ts == latest_trigger_ts).all()

    return rain_alerts


def get_rainfall_tech_info(rainfall_alert_details):
    """
    Sample
    """
    one_day_data = None
    three_day_data = None

    if not rainfall_alert_details:
        raise Exception("Code flow reaching rainfall tech info WITHOUT any" +
                        "ENTRY on rainfall_alerts table.")

    for item in rainfall_alert_details:
        days = []
        cumulatives = []
        thresholds = []

        rain_gauge_name = get_rainfall_gauge_name(item)

        # Not totally sure if there is always only one entry of a and b per rainfall ts
        # if yes, this can be improved.
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
    rain_tech_info["rain_gauge"] = rain_gauge_name
    rain_tech_info[
        "tech_info_string"] = f"{rain_gauge_name}: {day} cumulative rainfall ({cumulative} mm) exceeded threshold ({threshold} mm)"

    return rain_tech_info


def get_subsurface_node_alerts(site_id, start_ts, latest_trigger_ts, alert_level):
    """
    Update: Returns a list of node alerts
    Returns list of sensors with its corresponding node alerts
    """
    # NOTE: OPTIMIZE: Use TSMSensor instead of NodeAlerts OR use join() query
    try:
        tsm_sensors = tsma.query.filter(tsma.site_id == site_id).all()

        tsm_node_alerts = []
        for sensor in tsm_sensors:
            sensor_node_alerts = sensor.node_alerts.filter(
                DB.or_(na.disp_alert == alert_level, na.vel_alert == 3)) \
                .order_by(DB.desc(na.na_id)).filter(
                start_ts <= na.ts, na.ts <= latest_trigger_ts).all()
            if sensor_node_alerts:  # If there are no node alerts on sensor, skip.
                # If there is, remove duplicate node alerts. We only need the latest.
                unique_list = []
                comparator = []
                for item in sensor_node_alerts:
                    com = item.node_id
                    comparator.append(com)
                    if not (com in comparator and comparator.count(com) > 1):
                        unique_list.append(item)
                sensor_node_alerts = unique_list

                tsm_node_alerts.extend(sensor_node_alerts)
                # Save nodes to its own dictionary per sensor then put it in a list
                # entry_dict = {
                #     "logger_name": sensor.logger.logger_name,
                #     "sensor_node_alerts": sensor_node_alerts
                # }
                # tsm_node_alerts.append(entry_dict)
    except:
        raise

    return tsm_node_alerts


def format_node_details(node_alerts):
    """
    Sample
    """
    node_details = []
    tsm_name_list = []

    # NOTE: OPTIMIZE
    for node_alert in node_alerts:
        tsm_name_list.append(node_alert.tsm_sensor.logger.logger_name)

    for i in tsm_name_list:
        col_list = []
        for node_alert in node_alerts:
            if node_alert.tsm_sensor.logger.logger_name == i:
                col_list.append(node_alert)

    if len(col_list) == 1:
        node_details.append(f"{i.upper()} (node {col_list[0].node_id})")
    else:
        sorted_nodes = sorted(col_list, key=lambda x: x.node_id)
        node_details.append(
            f"{i.upper()} (nodes {', '.join(str(v.node_id) for v in sorted_nodes)})")

    return ", ".join(node_details)


def formulate_subsurface_tech_info(node_alert_group):
    """
    Sample
    """
    both_trigger = []
    dis_trigger = []
    vel_trigger = []

    for node_alert in node_alert_group:
        disp_alert = node_alert.disp_alert
        vel_alert = node_alert.vel_alert
        if disp_alert > 0 and vel_alert > 0:
            both_trigger.append(node_alert)

        if disp_alert > 0 and vel_alert == 0:
            dis_trigger.append(node_alert)

        if disp_alert == 0 and vel_alert > 0:
            vel_trigger.append(node_alert)

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


def get_subsurface_tech_info(subsurface_node_alerts):
    """
    Sample
    """
    ####
    # NEW VERSION OF COMPARATOR AS ALTERNATIVE TO PANDAS DROP DUPLICATES

    # s2_triggers = []
    # s3_triggers = []
    # for node_alert in subsurface_node_alerts:  # Most like two only
    #     if node_alert.disp_alert == 2 or node_alert.vel_alert == 2:
    #         s2_triggers.append(node_alert)
    #     if node_alert.disp_alert == 3 or node_alert.vel_alert == 3:
    #         s3_triggers.append(node_alert)

    subsurface_tech_info = formulate_subsurface_tech_info(
        subsurface_node_alerts)
    # node_alert_group_list = [s2_triggers, s3_triggers]
    # for index, node_alert_group in enumerate(node_alert_group_list):
    #     if node_alert_group:
    #         tech_info = formulate_subsurface_tech_info(node_alert_group)
    #         # Commented the following code because according to Senior SRS, only the string is needed.
    #         # subsurface_tech_info["L" + str(index+2)] = tech_info
    #         subsurface_tech_info = tech_info

    return subsurface_tech_info


def main(trigger, special_details=None):
    """
    Return tech_info
    """
    global RELEASE_INTERVAL_HOURS
    release_interval = RELEASE_INTERVAL_HOURS

    has_special_details = False
    if special_details:
        has_special_details = True

    site_id = trigger.site_id
    latest_trigger_ts = trigger.ts_updated
    trigger_source = trigger.trigger_symbol.trigger_hierarchy.trigger_source
    alert_level = trigger.trigger_symbol.alert_level
    start_ts = round_to_nearest_release_time(
        latest_trigger_ts) - timedelta(hours=release_interval)

    if trigger_source == 'subsurface':
        subsurface_node_alerts = get_subsurface_node_alerts(
            site_id, start_ts, latest_trigger_ts, alert_level)

        technical_info = get_subsurface_tech_info(
            subsurface_node_alerts)

    elif trigger_source == 'rainfall':
        rainfall_alerts = get_rainfall_alerts(site_id, latest_trigger_ts)
        # Something special with rainfall. Attaches data source with the tech_info
        technical_info = get_rainfall_tech_info(
            rainfall_alerts)

    elif trigger_source == 'surficial':
        surficial_alert_details = get_surficial_alerts(
            site_id, latest_trigger_ts, alert_level)
        technical_info = get_surficial_tech_info(
            surficial_alert_details)

    elif trigger_source == 'moms':
        if not has_special_details:
            moms_alert_details = get_moms_alerts(site_id, latest_trigger_ts)
        else:
            moms_alert_details = special_details
        technical_info = get_moms_tech_info(moms_alert_details)

    elif trigger_source == 'earthquake':
        if not has_special_details:
            earthquake_details = "COMING SOON..."
        else:
            earthquake_details = special_details
        technical_info = get_earthquake_tech_info(earthquake_details)

    else:
        raise Exception("Something wrong in tech_info_maker")

    return technical_info
