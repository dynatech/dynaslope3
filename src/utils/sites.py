"""
Utility file for Sites Table
Contains functions for getting and accesing Sites table only
"""

from connection import DB
from src.models.sites import Sites
from src.models.analysis import TSMSensors


def get_sites_data(site_code=None, include_inactive=False):
    """
    Function that gets basic site data by site code
    """
    final_query = Sites.query

    if site_code is None:
        if not include_inactive:
            final_query = final_query.filter_by(active=True)

        site = final_query.all()
    else:
        site = final_query.filter_by(site_code=site_code).first()

    return site


def get_site_events(site_code):
    """
    Function that returns site data and all monitoring events
    """
    site = Sites.query.filter_by(site_code=site_code).first()
    events = site.events.all()

    return site, events
