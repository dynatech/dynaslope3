"""
Utility file for Monitoring Tables
Contains functions for getting and accesing Sites table only
"""
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


def get_monitoring_events(event_id=None):
    """
    Returns event details with corresponding site details. Receives an event_id from flask request.

    Args: event_id

    Note: From pubrelease.php getEvent
    """

    """
    NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    """
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
