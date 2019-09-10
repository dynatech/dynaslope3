"""
EWI Functions Controller File
"""

from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
import smtplib
import os
import pdfkit
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
    ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
    try:
        email = "dynaslopeswat@gmail.com"
        password = "dynaslopeswat"
        report = data["html"]
        send_to_email = data["email"]
        status = True
        message = "Email sent successfully!"

        msg = MIMEMultipart()
        msg['From'] = email
        msg['To'] = send_to_email
        msg['Subject'] = "Community Based Early Warning for Landslides - Alert Report"
        header = "<img src='http://cbewsl.com/assets/images/letter_header1.png' style='width: 100%'/><img src='http://cbewsl.com/assets/images/banner_new.png' style='width: 100%'/>"
        footer = "<img src='http://cbewsl.com/assets/images/letter_footer1.png' style='width: 100%;  position: fixed; bottom: 0;'/>"
        paddingTop = "<div style='padding-top: 100px;'></div>"
        paddingBottom = "<div style='padding-top: 700px;'></div>"

        render_pdf = header+paddingTop+report+paddingBottom+footer

        pdfkit.from_string(render_pdf,'alert_report.pdf')
        
        with open('alert_report.pdf', 'rb') as f:
            mime = MIMEBase('image', 'png', filename='alert_report.pdf')
            mime.add_header('Content-Disposition', 'attachment', filename='alert_report.pdf')
            mime.add_header('X-Attachment-Id', '0')
            mime.add_header('Content-ID', '<0>')
            mime.set_payload(f.read())
            encoders.encode_base64(mime)
            msg.attach(mime)

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(email, password)
        text = msg.as_string()
        server.sendmail(email, send_to_email, text)
        server.quit()
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
