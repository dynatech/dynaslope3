"""
Utility Functions Controller File
"""

from flask import Blueprint
from src.api.sites import wrap_get_sites_data, wrap_get_site_events
from src.api.narratives import wrap_get_narratives
from src.api.subsurface import wrap_get_site_subsurface_columns
from src.utils.surficial import get_surficial_markers
from src.api.monitoring import wrap_get_pub_sym_id
from connection import MEMORY_CLIENT, set_memcache

UTILITIES_BLUEPRINT = Blueprint("utilities_blueprint", __name__)

UTILITIES_BLUEPRINT.add_url_rule(
    "/sites/get_sites_data", "wrap_get_sites_data", wrap_get_sites_data)

UTILITIES_BLUEPRINT.add_url_rule(
    "/sites/get_sites_data/<site_code>", "wrap_get_sites_data", wrap_get_sites_data)

UTILITIES_BLUEPRINT.add_url_rule(
    "/sites/get_site_events/<site_code>", "wrap_get_site_events", wrap_get_site_events)

UTILITIES_BLUEPRINT.add_url_rule(
    "/end_of_shift/get_narratives", "wrap_get_narratives", wrap_get_narratives)

UTILITIES_BLUEPRINT.add_url_rule(
    "/end_of_shift/get_narratives/<filter_type>/<filter_id>",
    "wrap_get_narratives", wrap_get_narratives)

UTILITIES_BLUEPRINT.add_url_rule(
    "/end_of_shift/get_narratives/<filter_type>/<filter_id>/<start>/<end>",
    "wrap_get_narratives", wrap_get_narratives)

UTILITIES_BLUEPRINT.add_url_rule(
    "/subsurface/get_site_subsurface_columns/<site_code>",
    "wrap_get_site_subsurface_columns", wrap_get_site_subsurface_columns)

UTILITIES_BLUEPRINT.add_url_rule(
    "/surficial/get_surficial_markers/<site_code>/<filter_in_use>/<get_complete_data>",
    "get_surficial_markers", get_surficial_markers)

UTILITIES_BLUEPRINT.add_url_rule(
    "/monitoring/get_pub_sym_id/<alert_level>",
    "wrap_get_pub_sym_id", wrap_get_pub_sym_id)


@UTILITIES_BLUEPRINT.route(
    "/update_memcache", methods=["GET"])
def update_memcache():
    print("Updating memcache...")
    set_memcache.main(MEMORY_CLIENT)
    print("Successfully updated memcache...")

    return "Successfully updated memcache..."
