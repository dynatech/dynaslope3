"""
    Utility file for Surficial tables.
    Contains functions essential in accessing and saving into surficial table.
"""

from datetime import datetime, timedelta
from connection import DB
from src.models.analysis import (
    SiteMarkers, MarkerData as md,
    MarkerObservations as mo)
from src.models.sites import Sites
from src.utils.extra import (
    var_checker, round_to_nearest_release_time,
    retrieve_data_from_memcache)


def check_if_site_has_active_surficial_markers(site_code=None, site_id=None):
    """
    Returns boolean: True if has active surficial markers, False if none
    """
    # TODO: change querying by accessing SiteMarkers on memcache
    sm = SiteMarkers
    query = DB.session.query(sm.site_id, sm.site_code, DB.func.max(
        sm.in_use).label("has_surficial_markers")).group_by(sm.site_id)

    if site_code:
        query = query.filter_by(site_code=site_code)

    if site_id:
        query = query.filter_by(site_id=site_id)

    result = query.first()
    return bool(result.has_surficial_markers)


def get_surficial_data_presence():
    """
    """

    now = datetime.now()
    release_interval_hours = retrieve_data_from_memcache(
        "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")
    next_release_time = round_to_nearest_release_time(
        now, release_interval_hours)
    prev_release_time = next_release_time - \
        timedelta(hours=release_interval_hours)

    sm = SiteMarkers
    subquery_1 = DB.session.query(sm.site_id, sm.site_code, DB.func.max(
        sm.in_use).label("has_surficial_markers")).group_by(sm.site_id).subquery()
    subquery_2 = DB.session.query(mo.site_id, DB.func.max(
        mo.ts).label("last_ts")).group_by(mo.site_id).subquery()

    result = DB.session.query(subquery_1, subquery_2.c.last_ts) \
        .join(Sites, subquery_1.c.site_id == Sites.site_id).filter(Sites.active == 1) \
        .join(subquery_2, subquery_1.c.site_id == subquery_2.c.site_id).all()

    data_presence = []
    for row in result:
        presence = False
        if prev_release_time <= row.last_ts and row.last_ts <= next_release_time:
            presence = True

        temp = {
            "site_id": row.site_id,
            "site_code": row.site_code,
            "has_surficial_markers": row.has_surficial_markers,
            "last_data": row.last_ts.strftime("%Y-%m-%d %H:%M:%S"),
            "presence": presence
        }

        data_presence.append(temp)

    return data_presence


def get_surficial_data(
    site_code=None, marker_id=None,
    data_id=None, mo_id=None,
    ts_order="asc", end_ts=None,
    start_ts=None, limit=None,
    anchor="marker_data"
):
    """
    Returns surficial data of a site or marker specified.
    You can filter data more using start, end timestamps and a limit.

    anchor (string):    choose whether to return 'marker_observation'
                        or 'marker_data'
    """

    if data_id:
        filtered_query = md.query.filter(md.data_id == data_id)
    elif mo_id:
        filtered_query = mo.query.filter(mo.mo_id == mo_id)
    else:
        if anchor == "marker_observations":
            base_query = mo.query
        else:
            base_query = md.query.join(mo)

        if ts_order == "asc":
            base_query = base_query.order_by(DB.asc(mo.ts))
        elif ts_order == "desc":
            base_query = base_query.order_by(DB.desc(mo.ts))

    if marker_id:
        filtered_query = base_query.filter(md.marker_id == marker_id)

    if site_code:
        filtered_query = base_query.join(Sites).filter(
            Sites.site_code == site_code)

    if end_ts:
        end_ts = datetime.strptime(end_ts, "%Y-%m-%d %H:%M:%S")
        filtered_query = filtered_query.filter(mo.ts <= end_ts)

    if start_ts:
        start_ts = datetime.strptime(start_ts, "%Y-%m-%d %H:%M:%S")
        filtered_query = filtered_query.filter(mo.ts >= start_ts)

    if limit:
        filtered_query = filtered_query.limit(limit)

    if limit == 1:
        filtered_marker_data = filtered_query.first()
    else:
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


def delete_surficial_data(mo_id=None, site_id=None, ts=None, data_id=None):
    """
    """

    if data_id:
        row = md.query.filter_by(data_id=data_id).first()
        obs = row.marker_observation
        obs_data = obs.marker_data
        DB.session.delete(row)

        if (len(obs_data) == 1):
            mo_id = obs.mo_id
            mo.query.filter_by(mo_id=mo_id).delete()
    elif mo_id:
        mo.query.filter_by(mo_id=mo_id).delete()
        md.query.filter_by(mo_id=mo_id).delete()
    elif site_id and ts:
        row = mo.query.filter(
            DB.and_(mo.site_id == site_id, mo.ts == ts)).first()
        mo_id = row.mo_id
        row.delete()
        md.query.filter_by(mo_id=mo_id).delete()

    DB.session.commit()


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
