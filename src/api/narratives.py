"""
Narratives functions API File
"""

from connection import DB
from datetime import datetime
from flask import Blueprint, jsonify, request
from src.models.narratives import (NarrativesSchema)
from src.utils.narratives import (get_narratives, write_narratives_to_db,
                                  update_narratives_on_db, find_narrative_event,
                                  delete_narratives_from_db)
from src.utils.extra import var_checker, get_process_status_log


NARRATIVES_BLUEPRINT = Blueprint("narratives_blueprint", __name__)


@NARRATIVES_BLUEPRINT.route(
    "/narratives/delete_narratives_from_db", methods=["POST"])
def wrap_delete_narratives_from_db():
    """
        Deletes specific narrative.
    """
    json_data = request.get_json()
    var_checker("json_data", json_data, True)
    status = delete_narratives_from_db(json_data["narrative_id"])

    return status


@NARRATIVES_BLUEPRINT.route(
    "/narratives/write_narratives_to_db", methods=["POST"])
def wrap_write_narratives_to_db():
    """
        Writes narratives to database.
    """
    try:
        json_data = request.get_json()
        var_checker("json_data", json_data, True)
        site_list = []

        try:
            site_list = json_data["site_list"]
            print(get_process_status_log("Multiple Site Narrative", "start"))
            is_multiple_insert = True
        except KeyError:
            raise

        narrative = str(json_data["narrative"])
        type_id = json_data["type_id"]
        event_id = None
        user_id = json_data["user_id"]

        timestamp = json_data["timestamp"]
        if not isinstance(timestamp, datetime):
            timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")


        try:
            narrative_id = json_data["narrative_id"]
        except KeyError:
            narrative_id = None

        # UPDATING OF NARRATIVE
        if narrative_id:
            for site_id in site_list:
                has_event_id = bool(json_data["event_id"])
                if has_event_id:
                    event_id = json_data["event_id"]            
                else:
                    event = find_narrative_event(timestamp, site_id)
                    if event:
                        event_id = event.event_id
                    else:
                        raise Exception(get_process_status_log("INSERT NARRATIVES", "fail"))

                var_checker("narrative_id", narrative_id, True)
                status = update_narratives_on_db(
                    narrative_id=narrative_id,
                    site_id=site_id,
                    timestamp=timestamp,
                    narrative=narrative,
                    type_id=type_id,
                    user_id=user_id,
                    event_id=event_id
                )
                print(get_process_status_log(f"{status} updated narrative with ID: {narrative_id}", "end"))

        # INSERT OF NARRATIVE
        else:
            for site_id in site_list:
                event = find_narrative_event(timestamp, site_id)
                if event:
                    narrative_id = write_narratives_to_db(
                        site_id=site_id,
                        timestamp=timestamp,
                        narrative=narrative,
                        type_id=type_id,
                        user_id=user_id,
                        event_id=event.event_id
                    )
                    print(get_process_status_log(f"New narrative with ID {narrative_id}", "end"))
                else:
                    print(get_process_status_log(f"No event found in specified timestamp on site {site_id} | {timestamp}", "fail"))
                    raise Exception(get_process_status_log("NO EVENT IN SPECIFIED TIMESTAMP", "fail"))

        # If nothing goes wrong:
        DB.session.commit()

    except Exception as err:
        print("MAIN")
        print(err)
        raise

    return "success"


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
