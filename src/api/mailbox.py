"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify, request
from src.utils.emails import send_mail
from src.utils.narratives import write_narratives_to_db
from src.utils.bulletin import download_monitoring_bulletin
from src.utils.extra import var_checker


MAILBOX_BLUEPRINT = Blueprint("mailbox_blueprint", __name__)


@MAILBOX_BLUEPRINT.route("/emails/send_email", methods=["POST"])
def wrap_send_email():
    """
    Function that sends emails
    """
    json_data = request.get_json()

    try:
        subject = json_data["subject"]
        recipients = json_data["recipients"]
        mail_body = json_data["mail_body"]

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

        return "Success"

    except KeyError:
        return "Email NOT sent. Problem in input."
    except Exception as err:
        raise err


@MAILBOX_BLUEPRINT.route("/emails/download_bulletin/<release_id>", methods=["GET"])
def wrap_download_bulletin(release_id):
    """
    Function that lets users download bulletin by release id
    """

    try:
        ret = download_monitoring_bulletin(release_id=release_id)
        return "Success"
    except KeyError:
        return "Bulletin download FAILED."
    except Exception as err:
        raise err
