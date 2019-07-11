"""
    Utility file for Subsurface tables.
    Contains functions essential in accessing and saving into subsurface table.
"""
from connection import DB
from src.models.analysis import TSMSensors


def get_site_subsurface_columns(site_code):
    """
        Returns one or more row/s of subsurface_columns.
        Edit: [190320] - no provisions for None site_code parameter.

        Args:
            site_id
    """
    sub_col = TSMSensors
    filter_var = sub_col.tsm_name.like("%" + str(site_code) + "%")

    sub_column = sub_col.query.order_by(
        DB.asc(sub_col.tsm_name), DB.desc(sub_col.date_activated)).filter(filter_var).all()

    return sub_column


def get_subsurface_column_data_presence(site_column, start_ts, end_ts):
    """
        Roadblock: This function requires a dynamically created Models and Schemas (or all schemas)
    """
    table_name = "tilt_" + str(site_column)
    filter_var = ""
    return "data presence"


def get_subsurface_column_data():
    """
        Roadblock: This function requires a dynamically created Models and Schemas (or all schemas)
    """
    return "column data"


def get_subsurface_column_versions(site_column):
    """
        Basically returns the whole row of data regarding a site_column.
        Version should be filtered through new schema class
    """
    tsms = TSMSensors
    filter_var = tsms.tsm_name == site_column

    column = tsms.query.filter(filter_var).all()

    return column
