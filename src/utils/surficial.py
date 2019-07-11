"""
    Utility file for Surficial tables.
    Contains functions essential in accessing and saving into surficial table.
"""
import pprint
from connection import DB
from datetime import datetime
from src.models.analysis import (
    SiteMarkers, MarkerData as md,
    MarkerObservations as mo)
from src.models.sites import (
    Sites, SitesSchema)

from src.utils.extra import var_checker


def get_surficial_data(filter_val="agb", ts_order="asc", end_ts=datetime.now(), start_ts=None, limit=None):
    """
    Returns surficial data of a site or marker specified.
    You can filter data more using start, end timestamps and a limit.
    """
    base_query = md.query.join(mo)

    if ts_order == "asc":
        base_query = base_query.order_by(DB.asc(mo.ts))
    elif ts_order == "desc":
        base_query = base_query.order_by(DB.desc(mo.ts))

    if isinstance(filter_val, int):  # If digit, meaning, marker_id is what the user is looking for
        filtered_query = base_query.filter(md.marker_id == filter_val)
    else:
        filtered_query = base_query.join(Sites).filter(
            Sites.site_code == filter_val)

    if end_ts:
        end_ts = datetime.strptime(end_ts, "%Y-%m-%d %H:%M:%S")
        filtered_query = filtered_query.filter(mo.ts <= end_ts)

    if start_ts:
        start_ts = datetime.strptime(start_ts, "%Y-%m-%d %H:%M:%S")
        filtered_query = filtered_query.filter(mo.ts >= start_ts)

    if limit:
        filtered_query = filtered_query.limit(limit)

    filtered_marker_data = filtered_query.all()

    return filtered_marker_data


def get_surficial_data_last_ten_timestamps(site_code, end_date):
    """
        Note: This should be solved by get_surficial_markers
    """
    return "data presence"


def get_surficial_data_last_ten_points(site_code, latest_ts_arr):
    """
        Note: This should be solved by get_surficial_markers
    """
    return "column data"


def get_surficial_markers(site_code=None, filter_in_use=None, get_complete_data=None):
    """

    """
    filter_var = SiteMarkers.site_code == site_code
    markers = SiteMarkers.query.filter(
        filter_var).order_by(SiteMarkers.marker_name).all()

    return markers


def insert_if_not_exists(table, data):
    """
        Checks if new data to be added to DB for marker_data and marker_obs already exists.
        Specify which table to use and provide an object/list/dict of data to be added.
    """
    if table == "marker_data":
        existing_data = md.query.filter(
            md.mo_id == data.mo_id, md.marker_id == data.marker_id).all()
        if existing_data is None:
            new_data = md(
                mo_id=data.mo_id,
                marker_id=data.marker_id,
                measurement=data.measurement
            )
            DB.session.add(new_data)
            DB.session.flush()

            new_data_id = new_data.data_id
            return_id = new_data_id
        else:
            print("Data exists!")
    elif table == "marker_observations":
        existing_obs = mo.query.filter(
            mo.site_id == data.site_id, mo.ts == data.ts)
        if existing_obs is None:
            new_obs = mo(
                site_id=data.site_id,
                ts=data.ts,
                meas_type=data.meas_type,
                observer_name=data.observer_name,
                data_source=data.data_source,
                reliability=data.reliability,
                weather=data.weather
            )
            DB.session.add(new_obs)
            DB.session.flush()

            new_obs_id = new_obs.mo_did
            return_id = new_obs_id
    return return_id


def update(column, key, table, data):
    """
    This is experimental code which does not work. Haven't found out yet on 
    how I can dynamically specify a column name to use as a filter.
    """
    if table == "marker_data":
        try:
            existing_data = md.query.filter(
                md.column == key).all()
            existing_data.column = data
            DB.session.commit()
        except:
            print("There is a problem on fnx update.")
    return "Process Done"
