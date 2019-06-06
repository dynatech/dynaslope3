import time
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from connection import DB, SOCKETIO


SURFICIAL_DATA_BLUEPRINT = Blueprint(
    "surficial_data_blueprint", __name__)


@SURFICIAL_DATA_BLUEPRINT.route("/surficial_data/get_surficial_data", methods=["GET"])
def get_surficial_data():
    current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
    timestamps = last_timestamps(
        current_date_time=current_date_time)

    query = text("SELECT senslopedb.marker_observations.mo_id AS mo_id,"
                 "senslopedb.marker_observations.ts AS ts,"
                 "UPPER(senslopedb.site_markers.marker_name) AS crack_id,"
                 "senslopedb.marker_data.data_id,"
                 "senslopedb.marker_data.measurement AS measurement,"
                 "senslopedb.marker_data.marker_id AS marker_id,"
                 "senslopedb.site_markers.site_code "
                 "FROM senslopedb.marker_observations JOIN senslopedb.marker_data ON senslopedb.marker_data.mo_id=senslopedb.marker_observations.mo_id "
                 "JOIN senslopedb.site_markers ON senslopedb.site_markers.marker_id=senslopedb.marker_data.marker_id "
                 "WHERE senslopedb.marker_observations.ts IN "+timestamps+" "
                 "AND senslopedb.site_markers.site_code='umi' "
                 "ORDER BY senslopedb.marker_observations.ts, senslopedb.site_markers.marker_name")
    result = DB.engine.execute(query)
    data = {}
    for row in result:
        crack_id = row["crack_id"]
        if crack_id not in data:
            data[crack_id] = []
        data[crack_id].append({"x": str(row["ts"]), "y": row["measurement"]})

    surficial_data = []
    for row in data:
        surficial_data.append({
            "series_name": row,
            "data": data[row]
        })

    return jsonify(surficial_data)


@SURFICIAL_DATA_BLUEPRINT.route("/surficial_data/get_current_measurement", methods=["GET"])
def get_current_measurement():
    current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
    timestamps = last_timestamps(
        current_date_time=current_date_time, limit=1)
    query = text("SELECT senslopedb.marker_observations.mo_id AS mo_id,"
                 "senslopedb.marker_observations.ts AS ts,"
                 "UPPER(senslopedb.site_markers.marker_name) AS crack_id,"
                 "senslopedb.marker_data.data_id,"
                 "senslopedb.marker_data.measurement AS measurement,"
                 "senslopedb.marker_data.marker_id AS marker_id,"
                 "senslopedb.site_markers.site_code "
                 "FROM senslopedb.marker_observations JOIN senslopedb.marker_data ON senslopedb.marker_data.mo_id=senslopedb.marker_observations.mo_id "
                 "JOIN senslopedb.site_markers ON senslopedb.site_markers.marker_id=senslopedb.marker_data.marker_id "
                 "WHERE senslopedb.marker_observations.ts IN "+timestamps+" "
                 "AND senslopedb.site_markers.site_code='umi' "
                 "ORDER BY senslopedb.marker_observations.ts, senslopedb.site_markers.marker_name")
    result = DB.engine.execute(query)
    data = {}
    for row in result:
        crack_id = row["crack_id"]
        id = row["mo_id"]
        if crack_id not in data:
            data[crack_id] = []
        data[crack_id].append(
            {"ts": str(row["ts"]), "measurement": row["measurement"]})

    current_measurement = []
    last_data = "null"
    for row in data:
        current_measurement.append({
            "crack": row,
            "measurement": data[row][0]["measurement"]
        })
        if(last_data == "null"):
            last_data = data[row][0]["ts"]

    data = {
        "cracks": current_measurement,
        "current_measurement_date": last_data
    }

    return jsonify(data)


@SURFICIAL_DATA_BLUEPRINT.route("/surficial_data/get_monitoring_logs", methods=["GET"])
def get_monitoring_logs():
    current_date_time = time.strftime('%Y-%m-%d %H:%M:%S')
    timestamps = last_timestamps(
        current_date_time=current_date_time, limit=999999)
    query = text("SELECT senslopedb.marker_observations.mo_id AS mo_id,"
                 "senslopedb.marker_observations.ts AS ts,"
                 "UPPER(senslopedb.site_markers.marker_name) AS crack_id,"
                 "senslopedb.marker_data.data_id,"
                 "senslopedb.marker_data.measurement AS measurement,"
                 "senslopedb.marker_data.marker_id AS marker_id,"
                 "commons_db.manifestations_of_movements.moms_id,"
                 "commons_db.manifestations_of_movements.type_of_feature,"
                 "commons_db.manifestations_of_movements.description,"
                 "commons_db.manifestations_of_movements.name_of_feature,"
                 "senslopedb.site_markers.site_code "
                 "FROM senslopedb.marker_observations JOIN senslopedb.marker_data ON senslopedb.marker_data.mo_id=senslopedb.marker_observations.mo_id "
                 "JOIN senslopedb.site_markers ON senslopedb.site_markers.marker_id=senslopedb.marker_data.marker_id "
                 "LEFT JOIN commons_db.manifestations_of_movements ON commons_db.manifestations_of_movements.fk_mo_id=senslopedb.marker_observations.mo_id "
                 "WHERE senslopedb.marker_observations.ts IN "+timestamps+" "
                 "AND senslopedb.site_markers.site_code='umi' "
                 "ORDER BY senslopedb.marker_observations.ts, senslopedb.site_markers.marker_name")
    result = DB.engine.execute(query)
    data = {}

    for row in result:
        mo_id = row["mo_id"]
        if mo_id not in data:
            data[mo_id] = []

        moms_data = {}
        moms_id = row["moms_id"]

        if moms_id not in moms_data:
            moms_data[moms_id] = []
            moms_data[moms_id].append({
                "moms_id": row["moms_id"],
                "type_of_feature": row["type_of_feature"],
                "description": row["description"],
                "name_of_feature": row["name_of_feature"]
            })

        data[mo_id].append({
            "crack_name": row["crack_id"],
            "measurement": row["measurement"],
            "data_id": row["data_id"],
            "ts": str(row["ts"]),
            "moms_data": moms_data[moms_id][0]
        })

    monitoring_logs_data = []

    for row in data:
        monitoring_logs_data.append({
            "surficial_data": data[row],
            "date": data[row][0]["ts"]
        })
        # print(row)

    return jsonify(monitoring_logs_data)


def last_timestamps(current_date_time, limit=7):
    query = text("SELECT DISTINCT (senslopedb.marker_observations.ts) AS ts "
                 "FROM senslopedb.marker_observations "
                 "JOIN commons_db.sites ON commons_db.sites.site_id=senslopedb.marker_observations.site_id "
                 "WHERE commons_db.sites.site_code='umi' "
                 "AND senslopedb.marker_observations.ts <= '"+current_date_time+"' "
                 "ORDER BY senslopedb.marker_observations.ts DESC LIMIT "+str(limit)+"")

    result = DB.engine.execute(query)
    data = []
    for row in result:
        data.append(str(row["ts"]))

    timestamps = str(data)
    return timestamps.replace("[", "(").replace("]", ")")
