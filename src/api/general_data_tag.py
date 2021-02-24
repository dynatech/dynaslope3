"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
from connection import DB
from src.utils.general_data_tag import (
    get_all_tag, insert_data_tag, get_tag_by_type, update_data_tag,
    get_tag_description
)
from src.models.general_data_tag import GeneralDataTagManagerSchema
from src.utils.monitoring import get_latest_monitoring_event_per_site
from src.utils.narratives import write_narratives_to_db, get_narrative_text
from src.utils.sites import get_sites_data
from src.utils.extra import var_checker, get_process_status_log

GENERAL_DATA_TAG_BLUEPRINT = Blueprint("general_data_tag_blueprint", __name__)


@GENERAL_DATA_TAG_BLUEPRINT.route("/general_data_tag/get_all_tags", methods=["GET"])
def get_general_data_tag():
    general_data_tag = get_all_tag(tag_id=None)
    schema = GeneralDataTagManagerSchema(
        many=True).dump(general_data_tag)

    return jsonify(schema)


@GENERAL_DATA_TAG_BLUEPRINT.route("/general_data_tag/handle_update_insert_tags", methods=["POST"])
def handle_update_insert_tags():
    """
    Function that insert tags
    """

    tag_data = request.get_json()
    contact_person = tag_data["contact_person"]
    message = tag_data["message"]
    tag_type = tag_data["tag_type"]
    tag_details = tag_data["tag_details"]
    tag_id_list = tag_details["tag_id_list"]
    site_id_list = tag_details["site_id_list"]
    
    for tag_id in tag_id_list:
        tag_row = get_tag_by_type(tag_type, tag_details, tag_id)
        user_id = tag_details["user_id"]

        if tag_row:
            response = update_data_tag(
                row_to_update=tag_row,
                tag_details=tag_details,
                tag_id=tag_id
            )
        else:
            response = insert_data_tag(
                tag_type=tag_type,
                tag_details=tag_details,
                tag_id=tag_id
            )

        tag_description = get_tag_description(tag_id=tag_id)
        var_checker("tag_description", tag_description, True)
        # TODO: change tags when new tags came or use tag_ids
        if tag_description in [
                "#GroundMeas", "#GroundObs", "#EwiResponse",
                "#RainInfo", "#EwiMessage", "#AlertFYI",
                "#Permission", "#Erratum"]:
            get_process_status_log(key="Writing narratives", status="request")

            try:
                additional_data = contact_person
                if tag_description in ["#GroundObs", "#EwiResponse"]:
                    additional_data += f" - {message}"
                elif tag_description in ["#AlertFYI", "#Permission"]:
                    additional_data = message

                narrative = get_narrative_text(
                    narrative_type="sms_tagging", details={
                        "tag": tag_description,
                        "additional_data": additional_data
                    })
                
                var_checker("narrative", narrative, True)

                get_process_status_log(
                    "inserting narratives with provided site_id_list", "request")

                for site_id in site_id_list:
                    # TODO: Make sure that this would handle routine in the future.
                    event = get_latest_monitoring_event_per_site(
                        site_id, raise_load=True)
                    # var_checker("event", event, True)

                    event_id = event.event_id
                    narrative_id = write_narratives_to_db(
                        site_id=site_id,
                        timestamp=tag_details["ts_message"],
                        narrative=narrative,
                        type_id=1,
                        user_id=user_id,
                        event_id=event_id
                    )

                    print("Narrative insert success", narrative_id)
            except Exception as err:
                var_checker(
                    "error in writing narrative in insert tag api", err, True)
                get_process_status_log(
                    "inserting narratives with provided site_id_list", "fail")
                raise
            get_process_status_log(
                "inserting narratives with provided site_id_list", "success")

        var_checker("response of insert", response, True)

    # Single Commit for all
    DB.session.commit()

    return jsonify({"message": "success", "status": True})


@GENERAL_DATA_TAG_BLUEPRINT.route("/general_data_tag/handle_delete_tags", methods=["POST"])
def handle_delete_tags():
    """
    Function that insert tags
    """
    tag_data = request.get_json()
    tag_type = tag_data["tag_type"]
    tag_details = tag_data["tag_details"]
    tag_id_list = tag_details["delete_tag_id_list"]

    for tag_id in tag_id_list:
        tag_row = get_tag_by_type(tag_type, tag_details, tag_id)

        DB.session.delete(tag_row)

    # Single Commit for all
    DB.session.commit()

    return jsonify({"message": "success", "status": True})


@GENERAL_DATA_TAG_BLUEPRINT.route("/general_data_tag/insert_ewi_sms_tag", methods=["POST"])
def insert_ewi_sms_tag():
    """
    Function that insert tags
    """

    tag_details = request.get_json()

    # TODO: change hard-coded code
    response = insert_data_tag(
        tag_type="smsoutbox_user_tags",
        tag_details=tag_details,
        tag_id=18  # hardcoded for #EwiMessage
    )

    DB.session.commit()

    return jsonify(response)
