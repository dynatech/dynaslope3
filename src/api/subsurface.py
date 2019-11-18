"""
Subsurface functions API File
"""
from flask import Blueprint, jsonify
from src.models.analysis import (TSMSensorsSchema)
from src.utils.subsurface import (
    get_site_subsurface_columns, get_subsurface_column_versions,
    get_subsurface_plot_data)


SUBSURFACE_BLUEPRINT = Blueprint("subsurface_blueprint", __name__)


@SUBSURFACE_BLUEPRINT.route("/subsurface/get_site_subsurface_columns", methods=["GET"])
@SUBSURFACE_BLUEPRINT.route("/subsurface/get_site_subsurface_columns/<site_code>", methods=["GET"])
def wrap_get_site_subsurface_columns(site_code=None):
    """
        Returns one or all subsurface columns of a site.

        Args:
            site_code -> Can be None if you want to get all columns regardless of site
    """
    tsm_sensors_schema = TSMSensorsSchema(many=True)
    tsm_sensors = get_site_subsurface_columns(site_code)

    tsm_sensors_data = tsm_sensors_schema.dump(tsm_sensors).data

    return jsonify(tsm_sensors_data)


@SUBSURFACE_BLUEPRINT.route("/subsurface/get_subsurface_column_versions", methods=["GET"])
@SUBSURFACE_BLUEPRINT.route("/subsurface/get_subsurface_column_versions/<site_column>", methods=["GET"])
def wrap_get_subsurface_column_versions(site_column=None):
    """
        Returns one or all subsurface column versions of a site_column.
        Note: This api function returns the whole row instead of just the version.
        Handle the filtering with the schema.

        Args:
            site_column -> specify a column name as filter to get it's function.
    """
    tsm_sensors_schema = TSMSensorsSchema(many=True, only="version")
    site_column_version = get_subsurface_column_versions(site_column)

    site_column_version_data = tsm_sensors_schema.dump(
        site_column_version).data

    return jsonify(site_column_version_data)


@SUBSURFACE_BLUEPRINT.route("/subsurface/get_subsurface_plot_data", methods=["GET"])
def wrap_get_subsurface_plot_data():
    """

    """

    data = get_subsurface_plot_data()

    return jsonify(data)
