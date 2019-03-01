"""
Utility file for Monitoring Tables
Contains functions for getting and accesing Sites table only
"""

from connection import DB
from src.models.monitoring import MonitoringEvents, MonitoringReleases
# from sqlalchemy.orm import aliased


def get_ongoing_and_extended_events():
    """
    Function that gets all site data by site code
    """
    ongoing_extended_events = DB.session.query(MonitoringEvents, MonitoringReleases).select_from(
        MonitoringEvents
        ).join(
            MonitoringReleases, MonitoringEvents.event_id == MonitoringReleases.event_id
            ).all()[0:2]

    final_data = []
    for event, release in ongoing_extended_events:
        e_dict = row2dict(event)
        r_dict = row2dict(release)
        merged = {**e_dict, **r_dict}
        final_data.append(merged)

    # final_data -> for testing only
    return final_data
    # return ongoing_extended_events


def row2dict(row):
    """
    This converts rows into dictionary.
    Source: https://stackoverflow.com/questions/1958219/convert-sqlalchemy-row-object-to-python-dict
    """
    dictionary = {}
    for column in row.__table__.columns:
        dictionary[column.name] = str(getattr(row, column.name))

    return dictionary
