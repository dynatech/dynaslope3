"""
Contacts Functions Controller File
"""

from flask import Blueprint, jsonify, request
from src.utils.emails import send_mail


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

        send_mail(
            recipients=recipients,
            subject=subject,
            message=mail_body
        )
        return "Email sent!"
    except KeyError:
        return "Email NOT sent. Problem in input."
    except Exception as err:
        raise err
