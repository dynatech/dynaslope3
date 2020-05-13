"""
Utility file for Sites Table
Contains functions for getting and accesing Sites table only
"""

from connection import DB
from src.models.sites import Sites, SitesSchema


def get_sites_data(site_code=None, include_inactive=False, raise_load=False):
    """
    Function that gets basic site data by site code
    """

    final_query = Sites.query

    if raise_load:
        final_query = final_query.options(DB.raiseload("*"))

    if site_code is None:
        if not include_inactive:
            final_query = final_query.filter_by(active=True)

        site = final_query.all()
    else:
        if isinstance(site_code, (list,)):
            site = final_query.filter(Sites.site_code.in_(site_code)).all()
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


def get_site_season(site_code=None, site_id=None, return_schema_format=True):
    """
    """

    query = Sites.query.options(
        DB.joinedload("season_months", innerjoin=True)
        .subqueryload("routine_schedules"),
        DB.raiseload("*")
    )

    is_many = True
    if site_code or site_id:
        is_many = False

        if site_code:
            query = query.filter_by(site_code=site_code)

        if site_id:
            query = query.filter_by(site_id=site_id)

        result = query.first()
    else:
        result = query.all()

    if return_schema_format:
        schema = SitesSchema(many=is_many, include=["season_months"])
        result = schema.dump(result).data

    return result

def get_site_per(selector="province"):
    """
    Function that gets site per municipality, province, region
    """
    # query = Sites.query().filter_by(selector)

    return True
