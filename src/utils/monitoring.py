"""
Utility file for Monitoring Tables
Contains functions for getting and accesing Sites table only
"""
from datetime import datetime, timedelta, time
from src.models.monitoring import MonitoringEvents, MonitoringReleases


def get_public_alert_level(internal_alert_level, return_triggers=False):
    alert = internal_alert_level.split("-")

    try:
        public_alert, trigger_str = alert

        if public_alert == "ND":
            public_alert = "A1"
    except ValueError:
        trigger_str = None
        public_alert = "A0"

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


def get_monitoring_release(release_id):
    """
    Something
    """
    release = MonitoringReleases.query.filter(
        MonitoringReleases.release_id == release_id).first()

    return release
