"""
Sites Functions Controller File
"""

from flask import Blueprint, jsonify, request
from src.utils.sites import (
    get_sites_data, get_site_events,
    get_all_geographical_selection_per_category,
    get_site_season
)
from src.models.sites import SitesSchema
from src.models.monitoring import MonitoringEventsSchema
from src.utils.loggers import get_loggers
from src.utils.extra import var_checker


SITES_BLUEPRINT = Blueprint("sites_blueprint", __name__)


@SITES_BLUEPRINT.route("/sites/get_sites_data", methods=["GET"])
@SITES_BLUEPRINT.route("/sites/get_sites_data/<site_code>", methods=["GET"])
def wrap_get_sites_data(site_code=None):
    """
    Route function that get data of specific site
    """
    include_inactive = request.args.get(
        "include_inactive", default="false", type=str)
    include_inactive = True if include_inactive == "true" else False
    site = get_sites_data(site_code=site_code,
                          include_inactive=include_inactive,
                          raise_load=True)

    site_schema = SitesSchema()
    if site_code is None:
        site_schema = SitesSchema(many=True)

    output = site_schema.dump(site).data

    # NOTE: Add the Lat and Long
    if isinstance(output, list):
        for site in output:
            site_logger_sample = get_loggers(
                site_code=site["site_code"], many=False)
            site["latitude"] = site_logger_sample.latitude
            site["longitude"] = site_logger_sample.longitude

    return jsonify(output)


@SITES_BLUEPRINT.route("/sites/get_site_events/<site_code>", methods=["GET"])
def wrap_get_site_events(site_code):
    """
    Route function that gets all events from a site along with all events
    """
    site, events = get_site_events(site_code=site_code)
    events_json = MonitoringEventsSchema(many=True, exclude=(
        "releases", "site")).dump(events).data
    site_json = SitesSchema().dump(site).data
    return jsonify({"site": site_json, "events": events_json})


@SITES_BLUEPRINT.route("/sites/get_all_geographical_selection_per_category/<category>", methods=["GET"])
def wrap_g_a_g_s_p_c(category):
    """
    """
    include_inactive = request.args.get(
        "include_inactive", default="false", type=str)
    include_inactive = True if include_inactive.lower() == "true" else False

    selection = get_all_geographical_selection_per_category(
        category, include_inactive)
    site_json = SitesSchema(many=True).dump(selection).data

    return jsonify(site_json)


@SITES_BLUEPRINT.route("/sites/get_site_season", methods=["GET"])
@SITES_BLUEPRINT.route("/sites/get_site_season/<site_code>", methods=["GET"])
def wrap_get_site_season(site_code=None):
    """
    """

    result = get_site_season(site_code, return_schema_format=True)
    return jsonify(result)
