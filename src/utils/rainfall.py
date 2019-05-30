"""
    Utility file for Surficial tables.
    Contains functions essential in accessing and saving into surficial table.
"""
from connection import DB
from src.models.analysis import (
    RainfallAlerts as ra, RainfallGauges, RainfallPriorities, RainfallThresholds)


def get_rainfall_alerts(site_id=None, latest_trigger_ts=None):
    """
    Query rainfall alerts
    Not in use except for tech_info_maker (which was not yet imported)
    """

    if site_id and latest_trigger_ts:
        rain_alerts = ra.query.order_by(DB.desc(ra.ts)).filter(
            ra.site_id == site_id, ra.ts == latest_trigger_ts).all()
    else:
        rain_alerts = ra.query.all()

    return rain_alerts


def get_rainfall_gauge_name(rainfall_alert):
    """
    Just check rainfall
    """
    rain_gauge_name = rainfall_alert.rainfall_gauge.gauge_name
    data_source = rainfall_alert.rainfall_gauge.data_source

    if data_source == "noah":
        rain_gauge_name = "NOAH " + str(rain_gauge_name)
    rain_gauge_name = f"RAIN {rain_gauge_name.upper()}"

    return rain_gauge_name
