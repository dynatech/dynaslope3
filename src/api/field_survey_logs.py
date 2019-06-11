"""
Inbox Functions Controller File
"""
import time
# import pdfkit
import smtplib
import os
from flask import Blueprint, jsonify, request
from werkzeug import secure_filename
from connection import DB, SOCKETIO
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os.path
from src.models.field_survey_logs import (
    FieldSurveyLog, FieldSurveyLogSchema)

FIELD_SURVEY_LOGS_BLUEPRINT = Blueprint(
    "field_survey_logs_blueprint", __name__)


@FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/get_all_field_survey", methods=["GET"])
def get_all_field_survey():
    query = FieldSurveyLog.query.all()

    result = FieldSurveyLogSchema(
        many=True).dump(query).data
    data = []
    for row in result:
        data.append({
            "field_survey_id": row["field_survey_id"],
            "features": row["features"],
            "mat_characterization": row["mat_characterization"],
            "mechanism": row["mechanism"],
            "exposure": row["exposure"],
            "note": row["note"],
            "date": row["date"]
        })

    return jsonify(data)


@FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/get_field_survey_data", methods=["GET"])
def get_field_survey_data():
    data = request.get_json()
    # data = {
    #     "field_survey_id": 1
    # }

    field_survey_id = data["field_survey_id"]
    query = FieldSurveyLog.query.filter(
        FieldSurveyLog.field_survey_id == field_survey_id).first()

    result = FieldSurveyLogSchema().dump(query).data

    return jsonify(result)


@FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/get_latest_field_survey_data", methods=["GET"])
def get_latest_field_survey_data():
    query = FieldSurveyLog.query.order_by(
        FieldSurveyLog.field_survey_id.desc()).first()

    result = FieldSurveyLogSchema().dump(query).data

    feedback = [result]
    return jsonify(feedback)


@FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/save_field_survey", methods=["GET", "POST"])
def save_field_survey():
    data = request.get_json()
    current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
    # data = {
    #     "field_survey_id": 0,
    #     "features": "test",
    #     "features_data": "test",
    #     "mat_characterization": "Update",
    #     "mechanism": "test",
    #     "exposure": "test",
    #     "note": "test",
    #     "date": current_date_time
    # }

    status = None
    message = ""

    try:
        field_survey_id = data["field_survey_id"]
        features = data["features"]
        mat_characterization = data["mat_characterization"]
        mechanism = data["mechanism"]
        exposure = data["exposure"]
        note = data["note"]
        date = current_date_time

        if field_survey_id == 0:
            insert_data = FieldSurveyLog(
                features=features, mat_characterization=mat_characterization, mechanism=mechanism, exposure=exposure, note=note, date=date)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
            update_data = FieldSurveyLog.query.get(field_survey_id)
            update_data.features = features
            update_data.mat_characterization = mat_characterization
            update_data.mechanism = mechanism
            update_data.exposure = exposure
            update_data.mechanism = mechanism

            message = "Successfully updated data!"
        DB.session.commit()
        status = True
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


@FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/delete_field_survey", methods=["GET"])
def delete_field_survey():
    data = request.get_json()
    # data = {
    #     "field_survey_id": 3
    # }
    status = None
    message = ""

    field_survey_id = data["field_survey_id"]

    try:
        FieldSurveyLog.query.filter_by(
            field_survey_id=field_survey_id).delete()
        DB.session.commit()
        message = "Successfully deleted data!"
        status = True
    except Exception as err:
        DB.session.rollback()
        message = "Something went wrong, Please try again"
        status = False
        print(err)

    feedback = {
        "status": status,
        "message": message
    }
    return jsonify(feedback)


def process_pdf_and_email(data):

    field_survey_data_via_email(data)
    return ""


def field_survey_to_pdf():

    return ""


def field_survey_data_via_email(data):

    features = data["features"]
    mat_characterization = data["mat_characterization"]
    mechanism = data["mechanism"]
    exposure = data["exposure"]
    note = data["note"]
    date = data["date"]

    email = "dynaslopeswat@gmail.com"
    password = "dynaslopeswat"
    send_to_email = "david063095@gmail.com"
    subject = "Field Survey : " + str(date)
    message = """
    Features :  Scrap A
                    -6m high from the road
                    -53 m long
                Scrap B
                    -6m high from the road
                    -53 m long
    Material characterization : highly weathered sandstone
    Mechanism : deep-seated rotational or translational landslide
    Exposure : at least 9 households are at risk in the event of slope failure
    Note : Sensor needs maintenance
    """
    file_location = 'pdf/test.pdf'

    msg = MIMEMultipart()
    msg['From'] = email
    msg['To'] = send_to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(message, 'plain'))

    # Setup the attachment
    filename = os.path.basename(file_location)
    attachment = open(file_location, "rb")
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(attachment.read())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition',
                    "attachment; filename= %s" % filename)

    # Attach the attachment to the MIMEMultipart object
    msg.attach(part)

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(email, password)
    text = msg.as_string()
    server.sendmail(email, send_to_email, text)
    server.quit()

    return ""


# @FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/upload", methods=["GET", "POST"])
def file_upload_sample():
    if request.method == "POST":
        file = request.files["file"]
        file_name = secure_filename(file.filename)
        file.save(os.path.join("pdf", file_name))
    print("success upload")
    return "file uploaded successfully"
