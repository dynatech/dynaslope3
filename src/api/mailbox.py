"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify, request
from src.utils.emails import send_mail, get_email_subject
from src.utils.bulletin import write_bulletin_sending_narrative
from src.websocket.monitoring_tasks import execute_update_db_alert_ewi_sent_status
from src.utils.extra import var_checker


MAILBOX_BLUEPRINT = Blueprint("mailbox_blueprint", __name__)


@MAILBOX_BLUEPRINT.route("/mailbox/get_email_subject/<mail_type>/<site_code>/<date>", methods=["GET"])
def wrap_get_email_subject(mail_type, site_code, date):
    """
    """
    subject = get_email_subject(
        mail_type, details={"site_code": site_code, "date": date})

    return subject


@MAILBOX_BLUEPRINT.route("/mailbox/send_bulletin_email", methods=["POST"])
def send_bulletin_email():
    """
    Function that sends emails
    """
    json_data = request.get_json()

    try:
        subject = json_data["subject"]
        recipients = json_data["recipients"]
        mail_body = json_data["mail_body"]
        status = True

        release_id = json_data["release_id"]
        file_name = json_data["file_name"]
        site_id = json_data["site_id"]
        alert_db_group = json_data["alert_db_group"]
        sender_id = json_data["sender_id"]
        narrative_details = json_data["narrative_details"]

        send_mail(
            recipients=recipients,
            subject=subject,
            message=mail_body,
            file_name=file_name,
            bulletin_release_id=release_id
        )

        write_bulletin_sending_narrative(
            recipients, sender_id, site_id, narrative_details)

        execute_update_db_alert_ewi_sent_status(
            alert_db_group,
            site_id, "bulletin"
        )

        response_msg = "Bulletin email succesfully sent!"
    except KeyError:
        response_msg = "Key error: Bulletin email sending unsuccessful..."
        status = False
    except Exception as err:
        response_msg = "System/Network issue: Bulletin email sending unsuccessful..."
        status = False
        var_checker("PROBLEM with Sending Bulletin", err, True)

    return jsonify({
        "message": response_msg,
        "status": status
    })


@MAILBOX_BLUEPRINT.route("/mailbox/send_eos_email", methods=["POST"])
def send_eos_email():
    """
    Function that sends emails
    """

    json_data = request.get_json()

    try:
        subject = json_data["subject"]
        recipients = json_data["recipients"]
        mail_body = json_data["mail_body"]
        file_name = json_data["file_name"]
        eos_data = {
            "site_code": json_data["site_code"],
            "user_id": json_data["user_id"],
            "charts": json_data["charts"]
        }

        send_mail(
            recipients=recipients,
            subject=subject,
            message=mail_body,
            eos_data=eos_data,
            file_name=file_name
        )

        return "Success"
    except KeyError as err:
        print(err)
        return "Email NOT sent. Problem in input."
    except Exception as err:
        raise err
