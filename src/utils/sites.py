"""
Utility file for Sites Table
Contains functions for getting and accesing Sites table only
"""

from connection import DB
from src.models.sites import Sites


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


def get_all_geographical_selection_per_category(category, include_inactive):
    """
    """

    attr = getattr(Sites, category)

    subquery = DB.session.query(DB.func.min(
        Sites.site_id).label("min_id"), attr)

    if not include_inactive:
        subquery = subquery.filter_by(active=1)

    subquery = subquery.group_by(attr).subquery()

    selection = DB.session.query(Sites).join(
        subquery, Sites.site_id == subquery.c.min_id).order_by(attr).all()

    return selection


def build_site_address(site_info):
    """
    site_info (class):      Site class
    """

    address = ""
    purok = site_info.purok
    sitio = site_info.sitio

    if purok:
        address += f"Purok {purok}, "

    if sitio:
        address += f"Sitio {sitio}, "

    address += f"Brgy. {site_info.barangay}, {site_info.municipality}, {site_info.province}"

    return address
