"""
EWI Functions Controller File
"""

from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from src.models.ewi_templates import (
    EwiTemplates, EwiTemplatesSchema)

EWI_TEMPLATE_BLUEPRINT = Blueprint("ewi_template_blueprint", __name__)


@EWI_TEMPLATE_BLUEPRINT.route("/ewi_templates/get_all_template", methods=["GET"])
def get_all_template():
    query = EwiTemplates.query.limit(500).all()

    result = EwiTemplatesSchema(
        many=True).dump(query).data

    return jsonify(result)


@EWI_TEMPLATE_BLUEPRINT.route("/ewi_templates/get_template_data", methods=["GET"])
def get_template_data():
    template_id = 1
    query = EwiTemplates.query.filter(
        EwiTemplates.template_id == template_id).first()

    result = EwiTemplatesSchema().dump(query).data

    return jsonify(result)


@EWI_TEMPLATE_BLUEPRINT.route("/ewi/send_ewi_via_email", methods=["GET", "POST"])
def send_ewi_via_email():
    data = request.form
    status = None
    message = ""
    try:
        email = "dynaslopeswat@gmail.com"
        password = "dynaslopeswat"
        send_to_email = data["email"]
        status = True
        message = "Email sent successfully!"
    except Exception as err:
        print(err)
        DB.session.rollback()
        status = False
        message = "Something went wrong, Please try again"

    feedback = {
        "status": status,
        "message": message
    }
    return jsonify(feedback)
