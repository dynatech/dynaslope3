"""
Utility file for Monitoring Tables
Contains functions for getting and accesing Sites table only
"""
from datetime import datetime, timedelta, time
from connection import DB
from src.models.monitoring import (
    OldMonitoringEvents, OldMonitoringReleases, OldMonitoringTriggers)


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


def get_monitoring_events(event_id=None):
    """
    Returns event details with corresponding site details. Receives an event_id from flask request.

    Args: event_id

    Note: From pubrelease.php getEvent
    """

    # NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    if event_id is None:
        event = OldMonitoringEvents.query.all()
    else:
        event = OldMonitoringEvents.query.filter(
            OldMonitoringEvents.event_id == event_id).first()

    return event


def get_monitoring_release(release_id):
    """
    Something
    """
    release = OldMonitoringReleases.query.filter(
        OldMonitoringReleases.release_id == release_id).first()

    return release


# def get_active_monitoring_events():
#     """
#     Translated to Python by: Louie

#     Get active monitoring events. Does not need any parameters, just get everything.
#     """
#     # active_events = OldMonitoringEvents.query.filter(
#     #     OldMonitoringEvents.status.in_(["on-going", "extended"]))
#     active_events = OldMonitoringEvents.query.filter(
#         OldMonitoringEvents.status.in_(["finished"])).first()

#     return active_events


def get_active_monitoring_events():
    """
    Translated to Python by: Louie

    Similar to CI Implem
    """
    # active_events = OldMonitoringEvents.query.order_by(DB.desc(OldMonitoringEvents.event_id)).filter(
    #     OldMonitoringEvents.status.in_(["on-going", "extended"]))
    active_events = OldMonitoringEvents.query.order_by(DB.desc(
        OldMonitoringEvents.event_id)).filter(OldMonitoringEvents.status == "finished")

    for index, event in enumerate(active_events):
        event_id = event.event_id
        releases = OldMonitoringReleases.query.order_by(DB.desc(
            OldMonitoringReleases.release_id)).filter(OldMonitoringReleases.event_id == event_id).first()

        triggers = OldMonitoringTriggers.query.order_by(DB.desc(
            OldMonitoringTriggers.trigger_id)).filter(OldMonitoringTriggers.event_id == event_id).first()

        merged = releases + triggers

        active_events[index] = event + merged

    return active_events
