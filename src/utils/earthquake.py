"""
    Utility file for Earthquake tables.
    Contains functions essential in accessing and saving into Earthquake table.
"""
from src.models.analysis import (EarthquakeAlerts, EarthquakeAlertsSchema,
                                 EarthquakeEvents, EarthquakeEventsSchema)


def get_earthquake_alerts(limit, offset):
    #     """
    #     Returns:
    #     result - {
    #         count - all eq_alerts for all eq_events ? NOTE: Ask Kevin the use of .any()
    #         eq_events - List of EarthquakeEvents SQLAlchemy Class objects
    #     }
    #     """
    #     eq_a = EarthquakeAlerts
    #     eq_e = EarthquakeEvents

    #     eq_events = eq_e.query.order_by(eq_e.eq_id.desc()).filter(
    #         eq_e.eq_alerts.any()).limit(limit).offset(offset).all()

    #     count = eq_e.query.filter(eq_e.eq_alerts.any()).count()

    #     result = {
    #         "count": count,
    #         "eq_events": eq_events
    #     }

    #     return result


def get_earthquake_events():
    """

    Returns:
        eq_events - List of EarthquakeEvents SQLAlchemy Class objects
    """
    eq_e = EarthquakeEvents

    eq_events = eq_e.query.order_by(
        eq_e.eq_id.desc()).limit(filters).all()

    return eq_events


def get_earthquake_alerts(timestamp, site_id):
    """
    """

    eq_a = EarthquakeAlerts
    eq_e = EarthquakeEvents

    eq_filter = and_(eq_e.ts == timestamp, eq_e.site_id == site_id)
    earthquake_alert = eq_a.query.join(eq_e).filter(eq_filter).first()

    return earthquake_alert
