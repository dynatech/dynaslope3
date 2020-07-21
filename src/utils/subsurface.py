"""
    Utility file for Subsurface tables.
    Contains functions essential in accessing and saving into subsurface table.
"""

import json
import time
import math
from datetime import datetime
from connection import DB
from src.models.analysis import (
    TSMSensors, TSMSensorsSchema,
    AccelerometerStatus, AccelerometerStatusSchema,
    Accelerometers, AccelerometersSchema,
    Loggers, get_tilt_table)
from analysis_scripts.analysis.subsurface.vcdgen import vcdgen
from src.utils.extra import get_unix_ts_value


def get_site_subsurface_columns(site_code, include_deactivated=False):
    """
        Returns one or more row/s of subsurface_columns.
        Edit: [190320] - no provisions for None site_code parameter.

        Args:
            site_id
    """
    sub_col = TSMSensors
    filter_var = Loggers.logger_name.like(str(site_code) + "%")

    query = sub_col.query.join(Loggers).options(
        DB.joinedload("logger").joinedload("logger_model").raiseload("*"),
        DB.joinedload("logger").joinedload(
            "site", innerjoin=True).raiseload("*")
    ).order_by(
        DB.asc(Loggers.logger_name), DB.desc(sub_col.date_activated)).filter(filter_var)

    if not include_deactivated:
        query = query.filter(sub_col.date_deactivated.is_(None))

    sub_column = query.all()

    return sub_column


def get_subsurface_column_data_presence(site_column, start_ts, end_ts):
    """
        Roadblock: This function requires a dynamically created Models and Schemas (or all schemas)
    """
    table_name = "tilt_" + str(site_column)
    filter_var = ""
    return "data presence"


def get_subsurface_column_data():
    """
        Roadblock: This function requires a dynamically created Models and Schemas (or all schemas)
    """
    return "column data"


def get_subsurface_column_versions(site_column):
    """
        Basically returns the whole row of data regarding a site_column.
        Version should be filtered through new schema class
    """
    tsms = TSMSensors
    filter_var = tsms.tsm_name == site_column

    column = tsms.query.filter(filter_var).all()

    return column


def process_column_position_data(column_data):
    """
    """

    column_position = [
        {
            "orientation": "downslope",
            "data": []
        },
        {
            "orientation": "across_slope",
            "data": []
        }
    ]
    ts_list = []
    min_position = 0
    max_position = 0

    for data in column_data:
        ts = data["ts"]
        depth = data["depth"]

        try:
            index = ts_list.index(ts)
        except ValueError:
            ts_list.append(ts)
            index = len(ts_list) - 1

        positions = []

        for main_index, orientation in enumerate(["downslope", "across_slope"]):
            data_or = "latslope" if orientation == "across_slope" else orientation
            this_position = data[data_or]
            arr = {"x": this_position, "y": depth}

            positions.append(this_position)

            col_pos_data = column_position[main_index]["data"]
            try:
                ts_col_data = col_pos_data[index]
            except IndexError:
                temp = {"name": ts, "data": []}
                col_pos_data.append(temp)
                ts_col_data = col_pos_data[index]

            ts_col_data["data"].append(arr)

        positions.sort()

        if positions[0] < min_position:
            min_position = positions[0]

        if positions[1] > max_position:
            max_position = positions[1]

    return_data = {
        "max_position": max_position,
        "min_position": min_position,
        "data": column_position
    }

    return return_data


def process_displacement_data(disp_group):
    disp = disp_group["disp"]
    cumulative = disp_group["cumulative"]
    cml_base = disp_group["cml_base"]
    annotation = disp_group["annotation"]

    annotations = [{}, {}]
    for anno in annotation:
        down_anno = anno["downslope_annotation"]
        lat_anno = anno["latslope_annotation"]
        node_id = int(anno["node_id"])

        for index, pos_anno in enumerate([down_anno, lat_anno]):
            temp = {"label": {"text": pos_anno}}
            annotations[index].setdefault(node_id, temp)

    displacement_data = [{}, {}]
    all_ts = set()
    for index, position in enumerate(disp):
        node_id = int(position["node_id"])
        ts = position["ts"]
        int_ts = get_unix_ts_value(ts)
        downslope = position["downslope"]
        latslope = position["latslope"]

        for key, point in enumerate([downslope, latslope]):
            y_val = get_point_cml_base(point, cml_base)
            temp = {"id": node_id, "x": int_ts, "y": y_val}

            if node_id not in displacement_data[key]:
                annotations[key][node_id]["value"] = y_val - (cml_base * 2)

            displacement_data[key].setdefault(node_id, []).append(temp)

        all_ts.add(int_ts)

    cumulative_displacement_data = [[], []]
    for index, position in enumerate(cumulative):
        ts = position["ts"]
        int_ts = get_unix_ts_value(ts)
        downslope = position["downslope"]
        latslope = position["latslope"]

        for key, point in enumerate([downslope, latslope]):
            y_val = get_point_cml_base(point, cml_base)
            temp = {"x": int_ts, "y": y_val}
            cumulative_displacement_data[key].append(temp)

    sorted_all_ts = sorted(all_ts)
    last_7_ts = sorted_all_ts[-7:]

    array_list = [[cumulative_displacement_data[i],
                   displacement_data[i]] for i in range(2)]
    series = []
    ts_per_node = {}
    for arr in array_list:
        temp = []
        temp.append({"name": "Cumulative", "data": arr[0]})

        converted = list(arr[1].items())
        converted.sort()

        for index, data in converted:
            temp.append({"name": index, "data": data})

            if index not in ts_per_node:
                temp_2 = []
                for o_ts in last_7_ts:
                    temp_2.append([o_ts, index])

                temp_3 = {"name": index, "data": temp_2}
                ts_per_node.setdefault(index, temp_3)

        series.append(temp)

    displacement = []
    for index, orientation in enumerate(["downslope", "across_slope"]):
        temp = {
            "orientation": orientation,
            "data": series[index],
            "annotations": list(annotations[index].values())
        }

        displacement.append(temp)

    return displacement, list(ts_per_node.values())


def get_point_cml_base(point, cml_base):
    return (point - cml_base) * 1000


def process_velocity_alerts_data(vel_alerts, ts_per_node):
    """
    """

    velocity_alerts = [
        {"L2": [], "L3": []},
        {"L2": [], "L3": []}
    ]

    downslope = vel_alerts["downslope"][0]  # return value pag dict
    latslope = vel_alerts["latslope"][0]  # return value pag dict

    ret_dict = {"velocity_alerts": [], "timestamps_per_node": ts_per_node}

    for index, alerts in enumerate([downslope, latslope]):
        for trigger in ["L2", "L3"]:
            alert = alerts[trigger]

            if alert:
                for arr in alert:
                    int_ts = get_unix_ts_value(arr["ts"])
                    array = [int_ts, arr["node_id"]]
                    velocity_alerts[index][trigger].append(array)

        orientation = "downslope" if index == 0 else "across_slope"
        temp = {"orientation": orientation, "data": velocity_alerts[index]}
        ret_dict["velocity_alerts"].append(temp)

    return ret_dict

# def getSiteColumnNodeCount (subsurface_column):
#     $result = $this->subsurface_node_model->getSiteColumnNodeCount($subsurface_column);
#     return json_encode($result);


def computeForYValues (node_count, base):
    quotient = math.floor(node_count / base)
    modulo = node_count % base
    y_iterator = []
    i = 0
    while i < quotient:
        y_iterator.append(base)
        i += 1

    if modulo != 0:
        y_iterator.append(modulo)

    return y_iterator


def get_node_status(tsm_id):
    """
    get node status per logger
    """
    query = Accelerometers.query.options(
        DB.joinedload("status", innerjoin=True).raiseload("*")) \
            .filter_by(tsm_id=tsm_id).all()

    result = AccelerometersSchema(many=True, only=["status", "node_id"]).dump(query).data
    return result

def process_node_health_data(logger_name):
    """
    """
    query = TSMSensors.query.join(Loggers).options(
        DB.joinedload("logger", innerjoin=True).raiseload("*")
    ).filter_by(logger_name=logger_name)

    result = TSMSensorsSchema(many=True, exclude=["logger.logger_model"]).\
        dump(query).data

    node_count = result[0]["number_of_segments"]
    node_status = get_node_status(result[0]["tsm_id"])
    y_iterators = computeForYValues(node_count, 25)
    node_summary = []
    count = 0

    for y_index in y_iterators:
        i = 1
        while i <= y_index:
            temp = {
                "x" : i,
                "y" : y_index,
                "id" : count,
                "value" : 0,
            }
            node_summary.append(count)
            node_summary[count] = temp
            i += 1
            count += 1

    for status in node_status:
        node_id = status["node_id"]
        temp = node_summary[node_id]
        temp["value"] = status["status"][0]["status"]
        temp["flagger"] = status["status"][0]["flagger"]
        temp["id_date"] = status["status"][0]["ts_flag"]
        temp["id"] = node_id
        temp["comment"] = status["status"][0]["remarks"]
        temp["status"] = status["status"][0]["status"]
        node_summary[node_id] = temp

    return node_summary


def get_subsurface_plot_data(column_name, end_ts, start_date=None, hour_value=4):
    """
    """

    json_data = vcdgen(column_name, endTS=end_ts, startTS=start_date, hour_interval=int(hour_value))
    # json_data = vcdgen(column_name, endTS="2019-01-15 13:07:14")
    data = json.loads(json_data)[0]  # return value pag dict

    column_position = process_column_position_data(data["c"])
    displacement, ts_per_node = process_displacement_data(
        data["d"][0])  # return value pag dict
    velocity_alerts = process_velocity_alerts_data(
        data["v"][0], ts_per_node)  # return value pag dict
    node_health = process_node_health_data(column_name)  # return value pag dict
    return [
        {"type": "column_position", "data": column_position},
        {"type": "displacement", "data": displacement},
        {"type": "velocity_alerts", "data": velocity_alerts},
        {"type": "node_health", "data": {"status":node_health}}
    ]


def check_if_subsurface_columns_has_data(site_code, start_ts, end_ts):
    tsm_sensors = get_site_subsurface_columns(site_code)
    subsurface_columns = TSMSensorsSchema(many=True).dump(tsm_sensors).data

    for tsm in subsurface_columns:
        name = tsm["logger"]["logger_name"]
        tilt = f"tilt_{name}"

        Table = get_tilt_table(tilt)
        result = Table.query.filter(start_ts <= Table.ts).filter(
            Table.ts <= end_ts).all()

        tsm["has_data"] = False
        if result:
            tsm["has_data"] = True

    return subsurface_columns
