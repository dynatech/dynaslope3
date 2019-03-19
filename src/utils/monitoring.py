"""
Utility file for Monitoring Tables
Contains functions for getting and accesing monitoring-related tables only
"""
from datetime import datetime, timedelta, time
from connection import DB
from src.models.monitoring import (
    MonitoringEvents, MonitoringReleases, MonitoringEventAlerts)


def get_public_alert_level(internal_alert_level, return_triggers=False, include_ND=False):
    alert = internal_alert_level.split("-")

    try:
        public_alert, trigger_str = alert

        if public_alert == "ND":
            public_alert = "A1"

            if include_ND:
                trigger_str = internal_alert_level
    except ValueError:
        public_alert = "A0"
        trigger_str = None

        if internal_alert_level == "ND":
            trigger_str = "ND"

    if return_triggers:
        return public_alert, trigger_str

    return public_alert


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


def compute_event_validity(data_ts, public_alert):
    """
    Computes for event validity given set of trigger timestamps

    Args:
        data_ts (datetime)
        public_alert (string)

    Returns datetime
    """

    dt = round_to_nearest_release_time(data_ts)
    if public_alert in ["A1", "A2"]:
        add_day = 1
    elif public_alert == "A3":
        add_day = 2
    else:
        raise ValueError("Public alert accepted is A1/2/3 only")

    validity = dt + timedelta(add_day)

    return validity


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


def get_active_monitoring_events():
    """
    Translated to Python by: Louie

    Similar to CI Implem
    """

    active_events = MonitoringEventAlerts.query.order_by(DB.desc(
        MonitoringEventAlerts.ts_start)).filter(
            MonitoringEventAlerts.ts_end is None,
            MonitoringEventAlerts.pub_sym_id != 1).all()

    return active_events
