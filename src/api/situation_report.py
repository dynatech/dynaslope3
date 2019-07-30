from flask import Blueprint, jsonify, request
from sqlalchemy import text
from connection import DB, SOCKETIO
from src.models.situation_reports import (
    SituationReport, SituationReportSchema)

SITUATION_REPORT_BLUEPRINT = Blueprint("situation_report_blueprint", __name__)


@SITUATION_REPORT_BLUEPRINT.route("/situation_report/get_all_situation_report", methods=["GET"])
def get_all_situation_report():
    query = SituationReport.query.order_by(
        SituationReport.situation_report_id.desc()).all()

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
        SituationReport.situation_report_id.desc()).first()

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
                 "WHERE timestamp BETWEEN '"+date_selected+" 00:00:00' AND '"+date_selected+" 23:59:59'")
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
        situation_report_id = int(data["situation_report_id"])
        timestamp = str(data["timestamp"])
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
