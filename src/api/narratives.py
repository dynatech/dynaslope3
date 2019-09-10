"""
Narratives functions API File
"""
from flask import Blueprint, jsonify, request
from datetime import datetime
from src.models.narratives import (NarrativesSchema)
from src.utils.narratives import (get_narratives)


NARRATIVES_BLUEPRINT = Blueprint("narratives_blueprint", __name__)


@NARRATIVES_BLUEPRINT.route("/narratives/get_narratives", methods=["GET"])
@NARRATIVES_BLUEPRINT.route(
    "/narratives/get_narratives/<start>/<end>", methods=["GET"])
def wrap_get_narratives(start=None, end=None):
    """
        Returns one or more row/s of narratives.
        Don't specify any argument if you want to get all narratives.

        Args:
            filter_type (String) - You can either use narrative_id or event_id.
            filter_id (Alphanumeric) - id or "null" for narratives with no event
    """
    offset = request.args.get("offset", default=0, type=int)
    limit = request.args.get("limit", default=10, type=int)
    include_count = request.args.get(
        "include_count", default="false", type=str)
    site_ids = request.args.getlist("site_ids", type=int)
    search = request.args.get("search", default="", type=str)

    include_count = True if include_count.lower() == "true" else False

    narrative_schema = NarrativesSchema(many=True)

    if start:
        start = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

    return_val = get_narratives(
        offset, limit, start, end,
        site_ids, include_count, search)

    if include_count:
        narratives = return_val[0]
        count = return_val[1]
    else:
        narratives = return_val

    narratives_data = narrative_schema.dump(narratives).data

    if include_count:
        narratives_data = {
            "narratives": narratives_data,
            "count": count
        }

    return jsonify(narratives_data)
