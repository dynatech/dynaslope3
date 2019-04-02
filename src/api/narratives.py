"""
Narratives functions API File
"""
from flask import Blueprint, jsonify
from src.models.narratives import (NarrativesSchema)
from src.utils.narratives import (get_narratives)


NARRATIVES_BLUEPRINT = Blueprint("narratives_blueprint", __name__)


@NARRATIVES_BLUEPRINT.route("/end_of_shift/get_narratives", methods=["GET"])
@NARRATIVES_BLUEPRINT.route(
    "/end_of_shift/get_narratives/<filter_type>/<filter_id>", methods=["GET"])
@NARRATIVES_BLUEPRINT.route(
    "/end_of_shift/get_narratives/<filter_type>/<filter_id>/<start>/<end>", methods=["GET"])
def wrap_get_narratives(filter_type=None, filter_id=None, start=None, end=None):
    """
        Returns one or more row/s of narratives.
        Don't specify any argument if you want to get all narratives.

        Args:
            filter_type (String) - You can either use narrative_id or event_id.
            filter_id (Alphanumeric) - id or "null" for narratives with no event
    """
    narrative_schema = NarrativesSchema(many=True)
    narrative = get_narratives(filter_type, filter_id, start, end)

    narratives_data = narrative_schema.dump(narrative).data

    return jsonify(narratives_data)
