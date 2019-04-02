"""
    Utility file for Surficial tables.
    Contains functions essential in accessing and saving into surficial table.
"""
from connection import DB
from src.models.analysis import (
    Markers, MarkersSchema, MarkerData, MarkerDataSchema, MarkerNames, MarkerAlertsSchema, MarkerObservations, MarkerObservationsSchema)
from src.models.sites import (
    Sites, SitesSchema)


def get_surficial_data_by_range(identifier=None, start_ts=None, end_ts=None):
    """
        Returns one or more row/s of subsurface_columns.
        Edit: [190320] - no provisions for None site_code parameter.

        Args:
            site_id
    """
    md = MarkerData
    filter_var = md.tsm_name.like("%" + str(identifier) + "%")

    mdumn = md.query.order_by(
        DB.asc(md.tsm_name), DB.desc(md.date_activated)).filter(filter_var).all()

    return mdumn


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
    markers_schema = MarkersSchema(
        many=True)
    filter_var = Sites.site_code == site_code
    # filter_var = ""

    markers = Markers.query.filter(filter_var).all()[0:5]

    for row in markers:
        print()
        print()
        print(row.marker_data)
        print()
        print()

    markers_data = markers_schema.dump(markers).data

    return markers_data


def get_surficial_marker_history(site_column):
    """
        Note: This should be solved by get_surficial_markers
    """
    return "column"


def insert_if_not_exists(table, data):
    """
        Checks if new data to be added to DB for marker_data and marker_obs already exists.
        Specify which table to use and provide an object/list/dict of data to be added.
    """
    if table == "marker_data":
        existing_data = MarkerData.query.filter(
            MarkerData.mo_id == data.mo_id, MarkerData.marker_id == data.marker_id).all()
        if existing_data is None:
            new_data = MarkerData(
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
        existing_obs = MarkerObservations.query.filter(
            MarkerObservations.site_id == data.site_id, MarkerObservations.ts == data.ts)
        if existing_obs is None:
            new_obs = MarkerObservations(
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
            existing_data = MarkerData.query.filter(
                MarkerData.column == key).all()
            existing_data.column = data
            DB.session.commit()
        except:
            print("There is a problem on fnx update.")
    return "Process Done"


def get_marker_ID(site_column):
    """
        Note: This should be solved by get_surficial_markers
    """
    return "column"


def convert_site_codes_from_new_to_old(site_column):
    """
        Is this still needed?
    """
    return "column"
