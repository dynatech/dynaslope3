"""
Utility Functions Controller File
"""

from flask import Blueprint, jsonify
from src.utils.sites import get_site_data
from src.models.sites import SitesSchema

UTILITIES_BLUEPRINT = Blueprint("utilities_blueprint", __name__)


def wrap_get_site_data():
    """
    Route function that get data of specific site
    """
    site = get_site_data(site_code="agb")
    output = SitesSchema().dump(site).data
    return jsonify(output)


UTILITIES_BLUEPRINT.add_url_rule(
    "/sites/get_site_data", "wrap_get_site_data", wrap_get_site_data)
