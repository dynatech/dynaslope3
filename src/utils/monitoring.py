"""
Utility file for Monitoring Tables
Contains functions for getting and accesing monitoring-related tables only
"""
from flask import request
from datetime import datetime, timedelta, time
from connection import DB
from src.models.monitoring import (
    MonitoringEvents, MonitoringReleases, MonitoringEventAlerts,
    MonitoringMoms, MonitoringMomsReleases, MonitoringOnDemand,
    MonitoringTriggersMisc, MomsInstances, PublicAlertSymbols)


def process_trigger_list(trigger_list, include_ND=False):
    """
    Sample docstring
    """
    if "-" in trigger_list:
        nd_alert, trigger_str = trigger_list
    else:
        trigger_str = trigger_list

    if include_ND:
        return nd_alert, trigger_str

    return trigger_str


def round_to_nearest_release_time(data_ts):
    """
    Round time to nearest 4/8/12 AM/PM

    Args:
        data_ts (datetime)

    Returns datetime
    """
    hour = data_ts.hour

    quotient = int(hour / 4)

    if quotient == 5:
        date_time = datetime.combine(data_ts.date() + timedelta(1), time(0, 0))
    else:
        date_time = datetime.combine(
            data_ts.date(), time((quotient + 1) * 4, 0))

    return date_time


def compute_event_validity(data_ts, alert_level):
    """
    Computes for event validity given set of trigger timestamps

    Args:
        data_ts (datetime)
        alert_level (int)

    Returns datetime
    """

    rounded_data_ts = round_to_nearest_release_time(data_ts)
    if alert_level in [1, 2]:
        add_day = 1
    elif alert_level == 3:
        add_day = 2
    else:
        raise ValueError("Alert level accepted is 1/2/3 only")

    validity = rounded_data_ts + timedelta(add_day)

    return validity


def get_pub_sym_id(alert_level):
    """
    Returns the pub_sym_id of the specified alert_level

    Args:
        alert_level (int)

    Returns ID (integer)
    """
    public_alert_symbol = PublicAlertSymbols.query.filter(
        PublicAlertSymbols.alert_level == alert_level).first()

    return public_alert_symbol.pub_sym_id

#############################################
#   MONITORING_RELEASES RELATED FUNCTIONS   #
#############################################


def get_monitoring_releases(release_id=None):
    """
    Something
    """

    # NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    if release_id is None:
        release = MonitoringReleases.query.order_by(
            DB.desc(MonitoringReleases.release_id)).all()
    else:
        release = MonitoringReleases.query.filter(
            MonitoringReleases.release_id == release_id).first()

    return release


##########################################
#   MONITORING_EVENT RELATED FUNCTIONS   #
##########################################

def get_monitoring_events(event_id=None):
    """
    Returns event details with corresponding site details. Receives an event_id from flask request.

    Args: event_id

    Note: From pubrelease.php getEvent
    """

    # NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    if event_id is None:
        event = MonitoringEvents.query.all()
    else:
        event = MonitoringEvents.query.filter(
            MonitoringEvents.event_id == event_id).first()

    return event


# LOUIE - changed the filter to "not" None and "== 4" instead of is None and != 1
# for testing purposes only
def get_active_monitoring_events():
    """
    Gets Active Events based on MonitoringEventAlerts data.
    """

    active_events = MonitoringEventAlerts.query.order_by(DB.desc(
        MonitoringEventAlerts.ts_start)).filter(
            MonitoringEventAlerts.ts_end is not None,
            MonitoringEventAlerts.pub_sym_id == 4).all()

    return active_events


def get_current_monitoring_instance_per_site(site_id):
    """
    This functions looks up at monitoring_events table and retrieves the current
    event details (whether it is a routine- or event-type)

    Args:
        site_id - mandatory Integer parameter
    """
    event = MonitoringEvents
    latest_event = event.query.order_by(DB.desc(event.event_id)).filter(
        event.site_id == site_id).first()

    return latest_event

##########################################################
# List of Functions for early input before release times #
##########################################################


def write_monitoring_on_demand_to_db(od_details):
    """
    Simply writes on_demand trigger to DB
    """
    try:
        on_demand = MonitoringOnDemand(
            request_ts=od_details["request_ts"],
            narrative_id=od_details["narrative_id"],
            reporter_id=od_details["reporter_id"]
        )
        DB.session.add(on_demand)
        DB.session.flush()

        new_od_id = on_demand.od_id
        return_data = new_od_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def write_moms_instances_to_db(instance_details):
    """
    Insertion of new manifestation instance observed in the field.
    Independent of monitoring_moms
    """
    try:
        moms_instance = MomsInstances(
            site_id=instance_details["site_id"],
            feature_id=instance_details["feature_id"],
            feature_name=instance_details["feature_name"],
            site=instance_details["site"],
            feature=instance_details["feature"]
        )
        DB.session.add(moms_instance)
        DB.session.flush()

        new_moms_instance_id = moms_instance.instance_id
        return_data = new_moms_instance_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def write_monitoring_moms_to_db(moms_details):
    """
    Insert a moms report to db regardless of attached to release or prior to release.
    """
    try:
        moms = MonitoringMoms(
            instance_id=moms_details["instance_id"],
            observance_ts=moms_details["observance_ts"],
            reporter_id=moms_details["reporter_id"],
            remarks=moms_details["remarks"],
            narrative_id=moms_details["narrative_id"],
            validator_id=moms_details["validator_id"],
            op_trigger=moms_details["op_trigger"]
        )

        DB.session.add(moms)
        DB.session.flush()

        new_moms_id = moms.od_id
        return_data = new_moms_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def write_monitoring_earthquake_to_db(eq_details):
    """
    """
    try:
        earthquake = MonitoringMoms(
            instance_id=eq_details["instance_id"],
            observance_ts=eq_details["observance_ts"],
            reporter_id=eq_details["reporter_id"],
            remarks=eq_details["remarks"],
            narrative_id=eq_details["narrative_id"],
            validator_id=eq_details["validator_id"],
            op_trigger=eq_details["op_trigger"]
        )

        DB.session.add(earthquake)
        DB.session.flush()

        new_eq_id = earthquake.od_id
        return_data = new_eq_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data
