from flask import Blueprint, jsonify, request
from sqlalchemy import text
import smtplib
import pdfkit
from connection import DB, SOCKETIO
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from src.models.situation_reports import (
    SituationReport, SituationReportSchema)

SITUATION_REPORT_BLUEPRINT = Blueprint("situation_report_blueprint", __name__)


@SITUATION_REPORT_BLUEPRINT.route("/situation_report/get_all_situation_report", methods=["GET"])
def get_all_situation_report():
    query = SituationReport.query.order_by(
        SituationReport.timestamp.desc()).all()

    result = SituationReportSchema(
        many=True).dump(query).data
    data = []
    for row in result:
        data.append({
            "situation_report_id": row["situation_report_id"],
            "timestamp": str(row["timestamp"]),
            "summary": row["summary"],
            "pdf_path": row["pdf_path"],
            "image_path": row["image_path"]
        })
    return jsonify(data)


@SITUATION_REPORT_BLUEPRINT.route("/situation_report/get_latest_situation_report_data", methods=["GET"])
def get_latest_situation_report_data():
    query = SituationReport.query.order_by(
        SituationReport.timestamp.desc()).first()

    result = SituationReportSchema().dump(query).data

    feedback = [result]
    return jsonify(feedback)


@SITUATION_REPORT_BLUEPRINT.route("/situation_report/get_report_by_date", methods=["GET", "POST"])
def get_report_by_date():
    data = request.get_json()

    if data is None:
        data = request.form
    date_selected = str(data["date_selected"])

    query = text("SELECT * FROM commons_db.situation_report "
                 "WHERE timestamp BETWEEN '" + date_selected + " 00:00:00' AND '" + date_selected + " 23:59:59'")
    result = DB.engine.execute(query)
    data = []
    for row in result:
        data.append({
            "situation_report_id": row["situation_report_id"],
            "timestamp": str(row["timestamp"]),
            "summary": row["summary"],
            "pdf_path": row["pdf_path"],
            "image_path": row["image_path"]
        })
    return jsonify(data)


@SITUATION_REPORT_BLUEPRINT.route("/situation_report/save_situation_report", methods=["GET", "POST"])
def save_situation_report():
    data = request.get_json()
    if data is None:
        data = request.form
    status = None
    message = ""

    try:
        if data["value"] is not None:
            data = data["value"]
    except KeyError:
        print("Value is defined.")
        pass

    try:

        final_timestamp = str(data["timestamp"])+" "+str(data["time_selected"])
        situation_report_id = int(data["situation_report_id"])
        timestamp = str(final_timestamp)
        summary = str(data["summary"])
        pdf_path = str(data["pdf_path"])
        image_path = str(data["image_path"])

        if situation_report_id == 0:
            insert_data = SituationReport(
                timestamp=timestamp, summary=summary, pdf_path=pdf_path, image_path=image_path)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
            update_data = SituationReport.query.get(situation_report_id)
            update_data.timestamp = timestamp
            update_data.summary = summary
            update_data.pdf_path = pdf_path
            update_data.image_path = image_path

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


@SITUATION_REPORT_BLUEPRINT.route("/situation_report/delete_situation_report", methods=["GET", "POST"])
def delete_situation_report():
    data = request.get_json()
    status = None
    message = ""
    if data is None:
        data = request.form

    situation_report_id = int(data["situation_report_id"])

    try:
        SituationReport.query.filter_by(
            situation_report_id=situation_report_id).delete()
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


def latest_situation_report():
    query = SituationReport.query.order_by(
        SituationReport.situation_report_id.desc()).first()

    result = SituationReportSchema().dump(query).data

    return result


@SITUATION_REPORT_BLUEPRINT.route("/situation_report/send_email", methods=["GET", "POST"])
def situation_report_via_email():
    latest_data = latest_situation_report()
    data = request.form
    status = None
    message = ""

    try:
        timestamp = data["date"]
        summary = latest_data["summary"]

        email = "dynaslopeswat@gmail.com"
        password = "dynaslopeswat"
        send_to_email = data["email"]
        subject = "Current Situation Report : " + str(timestamp)

        msg = MIMEMultipart()
        msg['From'] = email
        msg['To'] = send_to_email
        msg['Subject'] = subject

        header = "<img src='http://cbewsl.com/assets/images/letter_header1.png' style='width: 100%'/><img src='http://cbewsl.com/assets/images/banner_new.png' style='width: 100%'/>"
        footer = "<img src='http://cbewsl.com/assets/images/letter_footer1.png' style='width: 100%;  position: fixed; bottom: 0;'/>"
        paddingTop = "<div style='padding-top: 100px;'></div>"
        paddingBottom = "<div style='padding-top: 700px;'></div>"

        message = "<b>Date: <b>"+ str(timestamp)+" <br><br> <b>Summary:</b> <br>" + summary
        render_pdf = header+paddingTop+message+paddingBottom+footer

        pdfkit.from_string(render_pdf,'situation_report.pdf')
        
        with open('situation_report.pdf', 'rb') as f:
            mime = MIMEBase('image', 'png', filename='situation_report.pdf')
            mime.add_header('Content-Disposition', 'attachment', filename='situation_report.pdf')
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

        status = True
        message = "Email sent successfully!"

    except Exception as err:
        print(err)
        DB.session.rollback()
        status = False
        message = "No internet connection."

    feedback = {
        "status": status,
        "message": message
    }
    return jsonify(feedback)
