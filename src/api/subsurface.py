"""
Subsurface functions API File
"""

from flask import Blueprint, jsonify, request
from src.models.analysis import (TSMSensorsSchema)
from src.utils.subsurface import (
    get_site_subsurface_columns, get_subsurface_column_versions,
    get_subsurface_plot_data, get_subsurface_node_health, get_plot_data_for_node
)


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
    tsm_sensors = get_site_subsurface_columns(
        site_code, include_deactivated=True)

    tsm_sensors_data = tsm_sensors_schema.dump(tsm_sensors)

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
        site_column_version)

    return jsonify(site_column_version_data)


@SUBSURFACE_BLUEPRINT.route("/subsurface/get_subsurface_plot_data/<column_name>/<end_ts>/<start_ts>/<hour_value>", methods=["GET"])
def wrap_get_subsurface_plot_data(column_name, end_ts, start_ts, hour_value):
    """
    """

    i_c_h = request.args.get("include_comms_health", default="false", type=str)
    include_comms_health = i_c_h.lower() == "true"

    data = get_subsurface_plot_data(
        column_name=column_name,
        end_ts=end_ts, start_date=start_ts,
        hour_value=hour_value,
        include_comms_health=include_comms_health)  # magta, 2017-06-09 19:30

    return jsonify(data)


@SUBSURFACE_BLUEPRINT.route("/subsurface/get_subsurface_node_health/<column_name>", methods=["GET"])
def wrap_get_subsurface_node_health_data(column_name):
    """
    """

    data = get_subsurface_node_health(column_name=column_name)
    return jsonify(data)


@SUBSURFACE_BLUEPRINT.route("/subsurface/get_subsurface_node_level/<column_name>/<end_ts>/<start_ts>/<node>", methods=["GET"])
def wrap_get_subsurface_node_level(column_name, end_ts, start_ts, node):
    """
    """

    data = get_plot_data_for_node(column_name, start_ts, end_ts, node)
    return jsonify(data)
