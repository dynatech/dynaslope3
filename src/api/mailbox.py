"""
Contacts Functions Controller File
"""
import os
from flask import Blueprint, jsonify, request
from src.utils.emails import send_mail, get_email_subject, allowed_file
from src.utils.narratives import write_narratives_to_db
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


@MAILBOX_BLUEPRINT.route("/mailbox/send_email", methods=["POST"])
def wrap_send_email():
    """
    Function that sends emails
    """
    json_data = request.get_json()

    try:
        subject = json_data["subject"]
        recipients = json_data["recipients"]
        mail_body = json_data["mail_body"]
        status = True

        release_id = None
        file_name = None
        try:
            release_id = json_data["release_id"]
            file_name = json_data["file_name"]
        except KeyError:
            pass

        send_mail(
            recipients=recipients,
            subject=subject,
            message=mail_body,
            file_name=file_name,
            bulletin_release_id=release_id
        )

        response_msg = "Email sent!"
        if release_id:
            response_msg = "Bulletin email sent!"

    except KeyError:
        response_msg = "Bulletin email NOT sent... problem with keys."
        status = False
    except Exception as err:
        response_msg = "Bulletin email NOT sent... system/network issues."
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
                file.save(os.path.join(APP_CONFIG['attachment_path'], file.filename))
    return "Success"


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
            "charts": json_data["charts"],
            "attached_files":json_data["attach_file"]
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
