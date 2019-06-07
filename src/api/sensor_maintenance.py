"""
"""
import time
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from connection import DB, SOCKETIO
from src.models.sensor_maintenance import (
    SensorMaintenance, SensorMaintenanceSchema)

SENSOR_MAINTENANCE_BLUEPRINT = Blueprint(
    "sensor_maintenance_blueprint", __name__)


@SENSOR_MAINTENANCE_BLUEPRINT.route("/sensor_maintenance/get_all_sensor_maintenance", methods=["GET"])
def get_all_sensor_maintenance():
    query = SensorMaintenance.query.all()

    result = SensorMaintenanceSchema(
        many=True).dump(query).data
    data = []
    for row in result:
        data.append({
            "sensor_maintenance_id": row["sensor_maintenance_id"],
            "remarks": row["remarks"],
            "working_nodes": row["working_nodes"],
            "anomalous_nodes": row["anomalous_nodes"],
            "rain_gauge_status": row["rain_gauge_status"],
            "timestamp": str(row["timestamp"]),
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
    print(data)
    status = None
    message = ""
    try:
        current_time = time.strftime('%H:%M:%S')
        sensor_maintenance_id = data["sensor_maintenance_id"]
        # remarks = data["remarks"]
        working_nodes = data["working_nodes"]
        anomalous_nodes = data["anamolous_nodes"]
        rain_gauge_status = data["rain_gauge_status"]
        timestamp = data["timestamp"]
        datetime = str(timestamp + " " + current_time)
        print(datetime)
        if sensor_maintenance_id == 0:
            insert_data = SensorMaintenance(
                working_nodes=working_nodes, anomalous_nodes=anomalous_nodes, rain_gauge_status=rain_gauge_status, timestamp=datetime)
            DB.session.add(insert_data)
            message = "Successfully added new data!"
        else:
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
