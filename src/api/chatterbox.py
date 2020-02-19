"""
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from connection import DB
from src.models.inbox_outbox import SmsTagsSchema
from src.utils.chatterbox import (
    get_quick_inbox, get_message_tag_options,
    insert_message_on_database, get_latest_messages,
    get_messages_schema_dict
)
from src.utils.ewi import create_ewi_message
from src.utils.general_data_tag import insert_data_tag
from src.utils.surficial import check_if_site_has_active_surficial_markers
from src.utils.monitoring import get_monitoring_releases
from src.utils.narratives import write_narratives_to_db
from src.utils.extra import round_to_nearest_release_time, var_checker
from src.utils.contacts import get_contacts_per_site, get_org_ids

CHATTERBOX_BLUEPRINT = Blueprint("chatterbox_blueprint", __name__)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/get_routine_ewi_template", methods=["GET"])
def get_routine_ewi_template():
    """
    """
    template = create_ewi_message(release_id=None)
    var_checker("template", template, True)

    return template


@CHATTERBOX_BLUEPRINT.route("/chatterbox/send_routine_ewi_sms", methods=["POST"])
def wrap_send_routine_ewi_sms():
    """
    Big function handling the preparation of EWI SMS for Routine
    Step 1. loop provided site list
    Step 2. generate message per site
    Step 3. get the recipients
    Step 4. Prep narrative
    Step 5. Tag
    """
    json_data = request.get_json()
    site_list = json_data["site_list"]
    user_id = json_data["user_id"]

    var_checker("site_list", site_list, True)

    try:
        for site in site_list:
            site_code = site["site_code"]
            # site_id = site["site_id"]
            release_id = site["release_id"]
            event_id = site["event_id"]

            #######################
            # PREPARE EWI MESSAGE #
            #######################
            ewi_message = create_ewi_message(release_id=release_id)
            # var_checker("ewi_message", ewi_message, True)

            ################################
            # PREPARE RECIPIENT MOBILE IDS #
            ################################
            org_id_list = get_org_ids(
                scopes=[0, 1, 2])
            routine_recipients = get_contacts_per_site(
                site_codes=[site_code], org_ids=org_id_list)

            mobile_id_list = []
            for recip in routine_recipients:
                mobile_numbers = recip["mobile_numbers"]
                for item in mobile_numbers:
                    mobile_number = item["mobile_number"]
                    mobile_id_list.append(mobile_number)
            # var_checker("mobile_id_list", mobile_id_list, True)

            #############################
            # STORE MESSAGE TO DATABASE #
            #############################
            outbox_id = insert_message_on_database({
                "sms_msg": ewi_message,
                "recipient_list": mobile_id_list
            })

            #######################
            # TAG THE NEW MESSAGE #
            #######################
            tag_details = {
                "outbox_id": outbox_id,
                "user_id": user_id,
                "ts": datetime.now()
            }
            tag_id = 18  # TODO: FOR REFACTORING, for #EwiMessage
            insert_data_tag("sms_outbox_user_tags", tag_details, tag_id)

            #############################
            # PREPARE ROUTINE NARRATIVE #
            #############################
            # NOTE: Hardcoded narrative muna
            narrative = f"Sent 12NN routine EWI SMS to LEWC, BLGU, MLGU"
            write_narratives_to_db(
                site["site_id"], datetime.now(), narrative,
                1, user_id, event_id
            )
            DB.session.commit()

            response = {
                "message": "success",
                "status": True
            }
    except Exception as e:
        print(e)
        DB.session.rollback()
        response = {
            "message": "failed",
            "status": False
        }

    return jsonify(response)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/quick_inbox", methods=["GET"])
def wrap_get_quick_inbox():
    """
    """

    messages = get_quick_inbox()
    return jsonify(messages)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/get_message_tag_options/<source>", methods=["GET"])
def wrap_get_message_tag_options(source):
    """
    """

    tags = get_message_tag_options(source)
    sms_tags = SmsTagsSchema(many=True).dump(tags).data

    return jsonify(sms_tags)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/get_ewi_message/<release_id>", methods=["GET"])
def wrap_get_ewi_message(release_id):
    """
    """

    ewi_msg = create_ewi_message(release_id)
    return ewi_msg


@CHATTERBOX_BLUEPRINT.route("/chatterbox/get_ewi_sms_narrative/<release_id>", methods=["GET"])
def get_ewi_sms_narrative(release_id):
    """
    """

    release = get_monitoring_releases(
        release_id=release_id, load_options="ewi_narrative")
    data_ts = release.data_ts
    event_alert = release.event_alert
    public_alert_level = event_alert.public_alert_symbol.alert_level

    event = event_alert.event
    event_id = event.event_id
    site_id = event.site_id
    first_release = list(
        sorted(event_alert.releases, key=lambda x: x.data_ts))[0]

    # Get data needed to see if onset
    first_data_ts = first_release.data_ts
    is_onset = first_data_ts == data_ts and public_alert_level > 0

    ewi_sms_detail = " onset"
    if not is_onset:
        release_hour = round_to_nearest_release_time(
            data_ts, interval=4).strftime("%I%p")
        ewi_sms_detail = f" {release_hour}"

    narrative = f"Sent{ewi_sms_detail} EWI SMS to "

    return jsonify({
        "narrative": narrative,
        "event_id": event_id,
        "site_list": [site_id],
        "type_id": 1
    })


@CHATTERBOX_BLUEPRINT.route("/chatterbox/send_message", methods=["POST"])
def wrap_insert_message_on_database():
    """
    """

    data = request.get_json()
    ret_obj = {
        "status": True,
        "message": "success"
    }

    try:
        outbox_id = insert_message_on_database(data)
        ret_obj["outbox_id"] = outbox_id
    except Exception as err:
        print(err)

        if hasattr(err, "message"):
            error_msg = err.message
        else:
            error_msg = err
        ret_obj = {
            "status": False,
            "message": f"Error: {error_msg}"
        }

    return jsonify(ret_obj)


@CHATTERBOX_BLUEPRINT.route("/chatterbox/load_more_messages/<mobile_id>/<batch>", methods=["GET"])
def load_more_messages(mobile_id, batch):
    """
    """
    mobile_id = int(mobile_id)
    batch = int(batch)

    messages = get_latest_messages(mobile_id, batch=batch)
    schema_msgs = get_messages_schema_dict(messages)

    return jsonify(schema_msgs)
