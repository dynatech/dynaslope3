"""
"""
import time
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from connection import DB, SOCKETIO
from src.models.sensor_maintenance import (
    SensorMaintenance, SensorMaintenanceSchema, HardwareMaintenance, HardwareMaintenanceSchema)

SENSOR_MAINTENANCE_BLUEPRINT = Blueprint(
    "sensor_maintenance_blueprint", __name__)


@SENSOR_MAINTENANCE_BLUEPRINT.route("/sensor_maintenance/get_all_sensor_maintenance", methods=["GET"])
def get_all_sensor_maintenance():
    query = SensorMaintenance.query.order_by(
        SensorMaintenance.sensor_maintenance_id.desc()).all()

    result = SensorMaintenanceSchema(
        many=True).dump(query)
    data = []
    for row in result:
        data.append({
            "sensor_maintenance_id": row["sensor_maintenance_id"],
            "remarks": row["remarks"],
            "working_nodes": row["working_nodes"],
            "anomalous_nodes": row["anomalous_nodes"],
            "rain_gauge_status": row["rain_gauge_status"],
            "timestamp": str(row["timestamp"])
        })
    return jsonify(data)


@SENSOR_MAINTENANCE_BLUEPRINT.route("/sensor_maintenance/get_last_sensor_maintenance", methods=["GET"])
def get_last_sensor_maintenance():
    query = HardwareMaintenance.query.order_by(
        HardwareMaintenance.hardware_maintenance_id.desc()).all()

    result = HardwareMaintenanceSchema(
        many=True).dump(query)
    data = []
    for row in result:
        data.append({
            "hardware_maintenance_id": row["hardware_maintenance_id"],
            "site_id": row["site_id"],
            "hardware_maintained": row["hardware_maintained"],
            "hardware_id": row["hardware_id"],
            "status": row["status"],
            "desc_summary": str(row["desc_summary"])
        })
    return jsonify(data)


@SENSOR_MAINTENANCE_BLUEPRINT.route("/sensor_maintenance/get_report_by_date", methods=["GET", "POST"])
def get_report_by_date():
    data = request.get_json()
    date_selected = data["date_selected"]
    query = text("SELECT * FROM commons_db.sensor_maintenance "
                 "WHERE timestamp BETWEEN '"+date_selected+" 00:00:00' AND '"+date_selected+" 23:59:59'")
    result = DB.engine.execute(query)
    data = []
    for row in result:
        data.append({
            "sensor_maintenance_id": row["sensor_maintenance_id"],
            "remarks": row["remarks"],
            "working_nodes": row["working_nodes"],
            "anomalous_nodes": row["anomalous_nodes"],
            "rain_gauge_status": row["rain_gauge_status"],
            "timestamp": str(row["timestamp"])
        })
    return jsonify(data)


@SENSOR_MAINTENANCE_BLUEPRINT.route("/sensor_maintenance/save_sensor_maintenance_logs", methods=["GET", "POST"])
def save_sensor_maintenance_logs():
    data = request.get_json()
    if data is None:
        data = request.form
    print(data)
    status = None
    message = ""
    try:
        current_time = time.strftime('%H:%M:%S')
        sensor_maintenance_id = int(data["sensor_maintenance_id"])
        # remarks = data["remarks"]
        working_nodes = str(data["working_nodes"])
        anomalous_nodes = str(data["anomalous_nodes"])
        rain_gauge_status = str(data["rain_gauge_status"])
        timestamp = str(data["timestamp"])
        datetime = str(timestamp + " " + current_time)
        print(datetime)
        if sensor_maintenance_id == 0:
            insert_data = SensorMaintenance(
                working_nodes=working_nodes, anomalous_nodes=anomalous_nodes, rain_gauge_status=rain_gauge_status, timestamp=datetime)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
            update_data = SensorMaintenance.query.get(sensor_maintenance_id)
            update_data.working_nodes = working_nodes
            update_data.anomalous_nodes = anomalous_nodes
            update_data.rain_gauge_status = rain_gauge_status
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


@SENSOR_MAINTENANCE_BLUEPRINT.route("/sensor_maintenance/delete_sensor_maintenance", methods=["GET", "POST"])
def delete_sensor_maintenance():
    data = request.get_json()
    status = None
    message = ""
    if data is None:
        data = request.form

    sensor_maintenance_id = int(data["sensor_maintenance_id"])

    try:
        SensorMaintenance.query.filter_by(
            sensor_maintenance_id=sensor_maintenance_id).delete()
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
