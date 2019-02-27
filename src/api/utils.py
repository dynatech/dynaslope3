"""
Utility Functions Controller File
"""

from flask import Blueprint
from src.api.sites import wrap_get_site_data, wrap_get_site_events

UTILITIES_BLUEPRINT = Blueprint("utilities_blueprint", __name__)

UTILITIES_BLUEPRINT.add_url_rule(
    "/sites/get_site_data/<site_code>", "wrap_get_site_data", wrap_get_site_data)

UTILITIES_BLUEPRINT.add_url_rule(
    "/sites/get_site_events/<site_code>", "wrap_get_site_events", wrap_get_site_events)
