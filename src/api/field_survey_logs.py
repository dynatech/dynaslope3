"""
Inbox Functions Controller File
"""
import time
from fpdf import FPDF
import smtplib
from flask import Blueprint, jsonify
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

    return jsonify(result)


@FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/get_field_survey_data", methods=["GET"])
def get_field_survey_data():
    # data = request.get_json()
    data = {
        "field_survey_id": 1
    }

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


@FIELD_SURVEY_LOGS_BLUEPRINT.route("/field_survey/save_field_survey", methods=["GET"])
def save_field_survey():
    # data = request.get_json()
    current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
    data = {
        "field_survey_id": 0,
        "features": "test",
        "features_data": "test",
        "mat_characterization": "Update",
        "mechanism": "test",
        "exposure": "test",
        "note": "test",
        "date": current_date_time
    }

    status = None
    message = ""

    try:
        field_survey_id = data["field_survey_id"]
        features = data["features"]
        features_data = data["features_data"]
        mat_characterization = data["mat_characterization"]
        mechanism = data["mechanism"]
        exposure = data["exposure"]
        note = data["note"]
        date = data["date"]

        if field_survey_id == 0:  # add
            insert_data = FieldSurveyLog(
                features=features, features_data=features_data, mat_characterization=mat_characterization, mechanism=mechanism, exposure=exposure, note=note, date=date)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:  # update
            update_data = FieldSurveyLog.query.get(field_survey_id)
            update_data.features = features
            update_data.mat_characterization = mat_characterization
            update_data.mechanism = mechanism
            update_data.exposure = exposure
            update_data.mechanism = mechanism
            update_data.date = date

            print("update")
            message = "Successfully updated data!"
        # sample = pdf_and_email(data)
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
    # data = request.get_json()
    data = {
        "field_survey_id": 3
    }
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


def pdf_and_email(data):
    features = data["features"]
    features_data = data["features_data"]
    mat_characterization = data["mat_characterization"]
    mechanism = data["mechanism"]
    exposure = data["exposure"]
    note = data["note"]
    date = data["date"]

    date_of_survey = "Date of Survey : " + date
    # pdf = FPDF()
    # pdf.add_page()
    # pdf.set_xy(0, 0)
    # pdf.set_font('arial', 'B', 12)
    # pdf.cell(60)
    # pdf.cell(75, 10, date_of_survey, 0, 2, 'C')
    # pdf.cell(90, 10, " ", 0, 2, 'C')
    # pdf.set_font('arial', 12)
    # pdf.cell(75, 10, 'Question', 0, 0, 'C')
    # pdf.cell(75, 10, 'Charles', 0, 0, 'C')
    # pdf.cell(75, 10, 'Mike', 0, 2, 'C')
    # pdf.cell(-90)
    # pdf.set_font('arial', '', 12)
    # pdf.output('pdf/test.pdf', 'F')
    # text = "A Tabular and Graphical Report of Professor\n\n Criss's Ratings by Users Charles and Mike"
    pdf = FPDF()
    pdf.add_page()
    pdf.set_xy(0, 0)
    pdf.set_font('arial', 'B', 12)
    pdf.cell(20)
    pdf.cell(55, 10, date_of_survey, 0, 2, 'C')
    # pdf.cell(90, 10, " ", 0, 2, 'C')
    pdf.set_font('arial')
    pdf.multi_cell(
        150, 8, "Features: Qweqweqweqweqweqweqweqweqwesadaxcfsdfwerqweqweqwewqeqwewqeqweqweqwewqeqweqweqwedasdas", 0, 0, 'R')
    pdf.multi_cell(
        150, 8, "Materials characterization: Qweqweqweqweqweqweqweqweqwesadaxcfsdfwerqweqweqwewqeqwewqeqweqweqwewqeqweqweqwedasdas", 0, 0, 'R')
    pdf.multi_cell(
        150, 8, "Mechanism: Qweqweqweqweqweqweqweqweqwesadaxcfsdfwerqweqweqwewqeqwewqeqweqweqwewqeqweqweqwedasdas", 0, 0, 'R')
    pdf.multi_cell(
        150, 8, "Exposure: Qweqweqweqweqweqweqweqweqwesadaxcfsdfwerqweqweqwewqeqwewqeqweqweqwewqeqweqweqwedasdas", 0, 0, 'R')
    pdf.output('pdf/test.pdf', 'F')

    return ""


def field_survey_data_via_email():

    email = 'dynaslopeswat@gmail.com'
    password = 'dynaslopeswat'
    send_to_email = 'david063095@gmail.com'
    subject = 'This is the subject SAMPLE'
    message = """
    Sample : 2312312312323
    Sample : 213123213123123213213
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
