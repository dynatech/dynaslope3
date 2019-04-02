"""
Surficial functions API File
"""
from flask import Blueprint, jsonify
from src.models.analysis import (MarkersSchema)
from src.utils.surficial import (get_surficial_markers)


SURFICIAL_BLUEPRINT = Blueprint("surficial_blueprint", __name__)


@SURFICIAL_BLUEPRINT.route("/surficial/get_surficial_markers", methods=["GET"])
@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_markers/<site_code>",
    methods=["GET"])
@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_markers/<site_code>/<filter_in_use>/<get_complete_data>",
    methods=["GET"])
def wrap_get_surficial_markers(site_code=None, filter_in_use=None, get_complete_data=None):
    """
        Returns one or all subsurface columns of a site.

        Args:
            site_code -> Can be None if you want to get all columns regardless of site
    """
    markers_schema = MarkersSchema(many=True)
    markers = get_surficial_markers(
        site_code, filter_in_use, get_complete_data)

    marker_data = markers_schema.dump(markers).data

    return jsonify(marker_data)
