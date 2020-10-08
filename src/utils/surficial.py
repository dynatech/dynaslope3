"""
    Utility file for Surficial tables.
    Contains functions essential in accessing and saving into surficial table.
"""

from datetime import datetime, timedelta
from connection import DB
from src.models.analysis import (
    SiteMarkers, MarkerData as md,
    MarkerObservations as mo, MarkerAlerts as ma,
    Markers, MarkerHistory, MarkerNames,
    MarkerDataTags, MarkerDataTagsSchema)
from src.models.sites import Sites
from src.utils.extra import (
    var_checker, round_to_nearest_release_time,
    retrieve_data_from_memcache)
from src.utils.sites import get_sites_data
from src.utils.monitoring import get_routine_sites, get_ongoing_extended_overdue_events


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


def get_surficial_data_presence_old():
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


def get_sites_with_ground_meas(ts, timedelta_hour=1, minute=30, site_id=None):
    run_down_ts = ts - \
        timedelta(hours=timedelta_hour, minutes=minute)

    query = mo.query.with_entities(mo.site_id) \
        .options(DB.raiseload("*")).filter(
            mo.ts.between(run_down_ts, ts))

    if site_id:
        query = query.filter(mo.site_id == site_id)

    result = query.all()

    return [value for (value,) in result]


def get_surficial_data_presence():
    now = datetime.now()
    release_interval_hours = retrieve_data_from_memcache(
        "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")

    sites_data = get_sites_data()
    leo = get_ongoing_extended_overdue_events(run_ts=now)
    event_data = leo["latest"]
    extended_data = leo["extended"]
    event_site_code, extended_site_code = get_extended_and_event_site_code(
        event_data, extended_data)

    data = []
    for row in sites_data:
        site_id = row.site_id
        site_code = str(row.site_code)
        event_type = "Routine"
        start_ts = now.strftime("%Y-%m-%d 06:00:00")
        end_ts = now.strftime("%Y-%m-%d 12:00:00")

        if site_code in event_site_code:
            event_type = "Event"

            end_ts = round_to_nearest_release_time(
                now, release_interval_hours)
            start_ts = end_ts - \
                timedelta(hours=release_interval_hours)

        if site_code in extended_site_code:
            event_type = "Extended"

        last_ts, has_data_presence = get_site_marker_observation_last_ts(
            start_ts=start_ts,
            end_ts=end_ts, site_id=site_id
        )

        check_marker = check_if_site_has_active_surficial_markers(
            site_id=site_id)
        has_surficial_marker = 1 if check_marker else 0

        temp = {
            "site_id": site_id,
            "site_code": site_code,
            "has_surficial_markers": has_surficial_marker,
            "event_type": event_type,
            "presence": has_data_presence,
            "last_data": last_ts.strftime("%Y-%m-%d %H:%M:%S")
        }
        data.append(temp)

    return data


def get_site_marker_observation_last_ts(start_ts, end_ts, site_id):
    # gawin dito yung nache-check ng last marker observation between 2 dates
    query = mo.query.with_entities(mo.ts).filter(
        mo.ts.between(start_ts, end_ts)) \
        .order_by(mo.ts.desc()) \
        .filter(mo.site_id == site_id).first()
    has_data_presence = False

    if query is None:
        query = mo.query.with_entities(mo.ts).order_by(
            mo.ts.desc()).filter(mo.site_id == site_id).first()
    else:
        has_data_presence = True

    last_ts = query[0]
    return last_ts, has_data_presence


def get_extended_and_event_site_code(event, extended):
    event_site_code = set()
    extended_site_code = set()

    for event_row in event:
        site_code = event_row["event"]["site"]["site_code"]
        event_site_code.add(site_code)

    for extended_row in extended:
        site_code = extended_row["event"]["site"]["site_code"]
        extended_site_code.add(site_code)

    return event_site_code, extended_site_code


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
        if not isinstance(end_ts, datetime):
            end_ts = datetime.strptime(end_ts, "%Y-%m-%d %H:%M:%S")
        filtered_query = filtered_query.filter(mo.ts <= end_ts)

    if start_ts:
        if not isinstance(start_ts, datetime):
            start_ts = datetime.strptime(start_ts, "%Y-%m-%d %H:%M:%S")
        filtered_query = filtered_query.filter(mo.ts >= start_ts)

    if limit:
        filtered_query = filtered_query.limit(limit)

    if limit == 1:
        filtered_marker_data = filtered_query.first()
    else:
        filtered_marker_data = filtered_query.all()

    return filtered_marker_data


def get_marker_alerts(site_id, trigger_ts, alert_level=None):
    """
    """
    surficial_alerts_list = []

    obs = mo.query.filter(
        DB.and_(mo.ts == trigger_ts, mo.site_id == site_id)).first()

    if not obs:
        raise Exception(
            f"No marker observation entry found given site_id {site_id} "
            f"and trigger_ts {trigger_ts}")

    surficial_alerts = ma.query.join(md).filter(md.mo_id == obs.mo_id)

    if alert_level:
        surficial_alerts = surficial_alerts.filter(
            ma.alert_level == alert_level)

    for item in surficial_alerts.all():
        if not item:
            raise Exception("No marker alerts entry found")

        if item.marker_data.marker.site_id == site_id:
            surficial_alerts_list.append(item)

    return surficial_alerts_list


def get_surficial_markers(site_code=None, site_id=None):
    """

    """

    filter_var = SiteMarkers.site_code == site_code
    if site_id:
        filter_var = SiteMarkers.site_id == site_id

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


def create_new_marker(site_code=None):
    if not site_code:
        raise Exception("No site code given")

    site = Sites.query.options(DB.raiseload("*")) \
        .filter_by(site_code=site_code).first()

    if not site:
        raise Exception("Site code not found")

    new = Markers(site_id=site.site_id, in_use=1)

    DB.session.add(new)
    DB.session.flush()

    return new


def insert_marker_event(marker_id, ts, event, remarks):
    history = MarkerHistory(
        marker_id=marker_id,
        ts=ts,
        event=event,
        remarks=remarks
    )

    DB.session.add(history)
    DB.session.flush()

    # NOTE: Delete this in the future because
    # marker status must depend on MarkerHistory
    if event == "decommission":
        row = Markers.query.options(DB.raiseload(
            '*')).filter_by(marker_id=marker_id).first()
        row.in_use = 0

        DB.session.flush()

    return history


def insert_new_marker_name(history_id, marker_name):
    name = MarkerNames(
        history_id=history_id,
        marker_name=marker_name
    )

    DB.session.add(name)


def insert_unreliable_data(data):
    data_id = data["data_id"]
    tagger_id = data["tagger_id"]
    remarks = data["remarks"]

    insert_query = MarkerDataTags(
        data_id=data_id,
        tagger_id=tagger_id,
        remarks=remarks
    )

    DB.session.add(insert_query)
