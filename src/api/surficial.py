"""
Surficial functions API File
"""
import itertools, json
from operator import itemgetter
from flask import Blueprint, jsonify
from src.models.analysis import (MarkersSchema, MarkerHistory as mh, Markers as m, MarkerNames as mn)
from src.utils.surficial import (get_surficial_markers, get_surficial_data)
from src.utils.extra import (var_checker)


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


@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_data_string/<filter_val>/<ts_order>/<start_ts>/<end_ts>/<limit>",
    methods=["GET"])
@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_data_string/<filter_val>/<ts_order>/<start_ts>/<limit>",
    methods=["GET"])
@SURFICIAL_BLUEPRINT.route(
    "/surficial/get_surficial_data_string/<filter_val>/<ts_order>/<limit>",
    methods=["GET"])
def extract_formatted_surficial_data_string(filter_val, ts_order, start_ts=None, end_ts=None, limit=None):
    """
    This function prepares the surficial data for chart usage
    """
    surficial_data = get_surficial_data(filter_val, ts_order, start_ts, end_ts, limit)

    formatted_list = []
    sorted_data = sorted(surficial_data, key=lambda datum: datum.marker.site_marker.marker_name)

    for key, group in itertools.groupby(sorted_data, key=lambda datum: datum.marker_id):
        data_set = list(group)
        marker_string_dict = {
            "marker_id": key,
            "marker_name": data_set[0].marker.site_marker.marker_name
        }

        new_list = []
        for item in data_set:
            new_list.append([str(item.marker_observation.ts), item.measurement])

        marker_string_dict["data_set"] = new_list
        formatted_list.append(marker_string_dict)

    var_checker("TEST", formatted_list, True)

    return json.dumps(formatted_list)



def extract_formatted_surficial_data_obs(filter_val, ts_order, start_ts=None, end_ts=None, limit=None):
    """
    This function returns SQLAlchemy objects for back-end use.
    """
    surficial_data = get_surficial_data(filter_val, ts_order, start_ts, end_ts, limit)

    formatted_list = []
    sorted_data = sorted(surficial_data, key=lambda datum: datum.marker_observation.ts)

    for key, group in itertools.groupby(sorted_data, key=lambda datum: datum.marker_observation.ts):
        marker_obs_data_dict = {
            "ts": str(key),
            "data_set": list(group)
        }
        formatted_list.append(marker_obs_data_dict)

    var_checker("TEST", formatted_list, True)

    return json.dumps(formatted_list)
