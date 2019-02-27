"""
Sites Functions Controller File
"""

from flask import Blueprint, jsonify
from src.utils.sites import get_site_data, get_site_events
from src.models.sites import SitesSchema
from src.models.monitoring import MonitoringEventsSchema

SITES_BLUEPRINT = Blueprint("sites_blueprint", __name__)


@SITES_BLUEPRINT.route("/sites/get_site_data/<site_code>", methods=["GET"])
def wrap_get_site_data(site_code):
    """
    Route function that get data of specific site
    """
    site = get_site_data(site_code=site_code)
    output = SitesSchema().dump(site).data
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
