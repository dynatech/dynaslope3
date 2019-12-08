"""
"""

from flask import Blueprint, jsonify
from src.models.inbox_outbox import SmsTagsSchema
from src.utils.chatterbox import get_quick_inbox, get_message_tag_options
from src.utils.ewi import create_ewi_message
from src.utils.surficial import check_if_site_has_active_surficial_markers
from src.utils.monitoring import get_monitoring_releases
from src.utils.extra import round_to_nearest_release_time

CHATTERBOX_BLUEPRINT = Blueprint("chatterbox_blueprint", __name__)


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

    release = get_monitoring_releases(release_id=release_id, load_options="ewi_narrative")
    data_ts = release.data_ts
    event_alert = release.event_alerts
    public_alert_level = event_alert.public_alert_symbol.alert_level

    event = event_alert.event
    event_id = event.event_id
    site_id = event.site_id
    first_release = list(sorted(event_alert.releases, key=lambda x: x.data_ts))[0]

    # Get data needed to see if onset
    first_data_ts = first_release.data_ts
    is_onset = first_data_ts == data_ts and public_alert_level > 0

    ewi_sms_detail = " onset"
    if not is_onset:
        release_hour = round_to_nearest_release_time(data_ts, interval=4).strftime("%I%p")
        ewi_sms_detail = f" {release_hour}"

    narrative = f"Sent{ewi_sms_detail} EWI SMS to "

    return jsonify({
        "narrative": narrative,
        "event_id": event_id,
        "site_list": [site_id],
        "type_id": 1
    })
