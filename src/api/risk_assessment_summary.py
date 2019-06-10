"""
Inbox Functions Controller File
"""

from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from src.models.risk_assessment_summary import (
    RiskAssessmentSummary, RiskAssessmentSummarySchema)

RISK_ASSESSMENT_BLUEPRINT = Blueprint(
    "risk_assessment_summary_blueprint", __name__)


@RISK_ASSESSMENT_BLUEPRINT.route("/risk_assesment_summary/get_all_risk_assessment_summary", methods=["GET"])
def get_all_risk_assessment_summary():
    query = RiskAssessmentSummary.query.order_by(
        RiskAssessmentSummary.summary_id).all()

    result = RiskAssessmentSummarySchema(
        many=True).dump(query).data
    data = []
    for row in result:
        data.append({
            "summary_id": row["summary_id"],
            "location": row["location"],
            "impact": row["impact"],
            "adaptive_capacity": row["adaptive_capacity"],
            "vulnerability": row["vulnerability"]
        })
    return jsonify(data)


@RISK_ASSESSMENT_BLUEPRINT.route("/risk_assesment_summary/get_risk_assessment_summary_data", methods=["GET"])
def get_risk_assessment_summary_data():
    # data = request.get_json()
    data = {
        "summary_id": 1
    }
    summary_id = data["summary_id"]
    query = RiskAssessmentSummary.query.filter(
        RiskAssessmentSummary.summary_id == summary_id).first()

    result = RiskAssessmentSummarySchema().dump(query).data

    return jsonify(result)


@RISK_ASSESSMENT_BLUEPRINT.route("/risk_assesment_summary/save_risk_assessment_summary", methods=["POST", "GET"])
def save_risk_assessment_summary():
    data = request.get_json()
    # data = {
    #     "summary_id": 0,
    #     "location": "UPDATED",
    #     "impact": "UPDATED",
    #     "adaptive_capacity": "UPDATED",
    #     "vulnerability": "UPDATED"
    # }

    status = None
    message = ""

    print(data)
    try:
        summary_id = data["summary_id"]
        location = data["location"]
        impact = data["impact"]
        adaptive_capacity = data["adaptive_capacity"]
        vulnerability = data["vulnerability"]

        if summary_id == 0:
            insert_data = RiskAssessmentSummary(location=location,
                                                impact=impact, adaptive_capacity=adaptive_capacity, vulnerability=vulnerability)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
            update_data = RiskAssessmentSummary.query.get(summary_id)
            update_data.location = location
            update_data.impact = impact
            update_data.adaptive_capacity = adaptive_capacity
            update_data.vulnerability = vulnerability

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


@RISK_ASSESSMENT_BLUEPRINT.route("/risk_assesment_summary/delete_risk_assessment_summary", methods=["GET", "POST"])
def delete_risk_assessment_summary():
    data = request.get_json()
    # data = {
    #     "summary_id": 3
    # }
    status = None
    message = ""

    summary_id = data["summary_id"]

    try:
        RiskAssessmentSummary.query.filter_by(
            summary_id=summary_id).delete()
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
