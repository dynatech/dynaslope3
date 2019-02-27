"""
Utility file for Sites Table
Contains functions for getting and accesing Sites table only
"""

from connection import DB
from src.models.sites import Sites


def get_site_data(site_code):
    """
    Function that gets basic site data by site code
    """
    site = Sites.query.filter_by(site_code=site_code).first()
    return site


def get_site_events(site_code):
    """
    Function that returns site data and all monitoring events
    """
    site = Sites.query.filter_by(site_code=site_code).first()
    events = site.events.all()

    return site, events
