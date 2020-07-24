"""
Contacts Functions Controller File
"""
import os
from flask import Blueprint, jsonify, request
from src.utils.emails import send_mail, get_email_subject, allowed_file
from src.utils.bulletin import write_bulletin_sending_narrative
from src.utils.monitoring import write_eos_data_analysis_to_db
from src.api.end_of_shift import get_eos_email_details
from src.websocket.monitoring_tasks import execute_update_db_alert_ewi_sent_status
from src.utils.extra import var_checker
from config import APP_CONFIG

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


@MAILBOX_BLUEPRINT.route("/mailbox/upload_temp", methods=["POST"])
def upload_temp_file():
    """
    uploads file to server @ temp<folder>/
    """
    if request.files:
        files = request.files.getlist("files")
        for file in files:
            if file.filename == '':
                print('No selected file')
            if file and allowed_file(file.filename):
                file.save(os.path.join(
                    APP_CONFIG['attachment_path'], file.filename))
    return "Success"


@MAILBOX_BLUEPRINT.route("/mailbox/send_eos_email", methods=["POST"])
def send_eos_email():
    """
    Function that sends emails
    """

    json_data = request.form
    files = request.files.getlist("attached_files")

    try:
        shift_ts = json_data["shift_ts"]
        event_id = json_data["event_id"]
        data_analysis = json_data["data_analysis"]
        file_name_ts = json_data["file_name_ts"]
        mail_body = json_data["mail_body"]

        write_eos_data_analysis_to_db(event_id, shift_ts, data_analysis)

        temp = get_eos_email_details(event_id, file_name_ts, to_json=False)
        recipients = temp["recipients"]
        subject = temp["subject"]
        file_name = temp["file_name"]

        eos_data = {
            "site_code": json_data["site_code"],
            "user_id": json_data["user_id"],
            "charts": json_data.getlist("charts"),
            "attached_files": files
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
