"""
Surficial functions API File
"""
import itertools
from operator import itemgetter
from flask import Blueprint, jsonify, request
from src.models.analysis import (SiteMarkersSchema)
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
    "/surficial/get_surficial_plot_data/<filter_val>/<start_ts>/<end_ts>",
    methods=["GET"])
def extract_formatted_surficial_data_string(filter_val, start_ts=None, end_ts=None):
    """
    This function prepares the surficial data for chart usage

    filter_val (int or str): site_code or marker_id
    """
    ts_order = request.args.get("order", default="asc", type=str)
    limit = request.args.get("limit", default=None, type=int)

    surficial_data = get_surficial_data(
        filter_val=filter_val, ts_order=ts_order, start_ts=start_ts, end_ts=end_ts, limit=limit)

    markers = get_surficial_markers(site_code=filter_val)

    formatted_list = []
    for marker_row in markers:
        marker_id = marker_row.marker_id
        marker_name = marker_row.marker_name

        data_set = list(filter(lambda x: x.marker_id
                               == marker_id, surficial_data))
        marker_string_dict = {
            "marker_id": marker_id,
            "marker_name": marker_name,
            "name": marker_name
        }

        new_list = []
        for item in data_set:
            ts = item.marker_observation.ts
            final_ts = int(ts.timestamp() * 1000)

            new_list.append({
                "x": final_ts, "y": item.measurement, "data_id": item.data_id})

        marker_string_dict["data"] = new_list
        formatted_list.append(marker_string_dict)

    return jsonify(formatted_list)


def extract_formatted_surficial_data_obs(filter_val, ts_order, start_ts=None, end_ts=None, limit=None):
    """
    This function returns SQLAlchemy objects for back-end use.
    """
    surficial_data = get_surficial_data(
        filter_val, ts_order, start_ts, end_ts, limit)

    formatted_list = []
    sorted_data = sorted(
        surficial_data, key=lambda datum: datum.marker_observation.ts)

    for key, group in itertools.groupby(sorted_data, key=lambda datum: datum.marker_observation.ts):
        marker_obs_data_dict = {
            "ts": str(key),
            "data_set": list(group)
        }
        formatted_list.append(marker_obs_data_dict)

    var_checker("TEST", formatted_list, True)

    return jsonify(formatted_list)
