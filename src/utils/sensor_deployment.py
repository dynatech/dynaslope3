"""
Deployment Logs Utility File
"""
from datetime import datetime, timedelta
from connection import DB
from src.models.sites import Sites
from src.models.analysis import (
    RainfallGauges, RainfallGaugesSchema
)
from src.models.loggers import (
    get_piezo_table, get_rain_table,
    get_soms_table,
    get_temperature_table, LoggerModels,
    Loggers, DeploymentLogs, LoggerMobile,
    DeployedNode, LoggersSchema
)
from src.models.analysis import (
    TSMSensors, get_tilt_table,
    Accelerometers, AccelerometerStatus
)
from src.utils.contacts import get_gsm_id_by_prefix


def save_all_deployment_data(data):
    status = None
    message = ""
    
    try:
        installed_sensors = data["installed_sensors"]

        logger_model_status, model_id = save_logger_models(data)
        logger_data_status, logger_id = save_loggers_data(data, model_id)
        loggger_mobile_status = save_logger_mobile_data(data, logger_id)
        deployment_logs_status, deployment_logs_id = save_deployment_logs_data(
            data, logger_id)
        tsm_sensors_status = True
        deployed_node_status = True

        if "tilt" in installed_sensors:
            tsm_sensors_status, tsm_id = save_tsm_sensors(data, logger_id)
            deployed_node_status = save_deployed_node_and_accelerometers(
                data, deployment_logs_id, tsm_id)

        rain_gauge_status = True
        if "rain" in installed_sensors:
            rain_gauge_status = save_rain_gauge_data(data)

        if logger_model_status and logger_data_status and deployment_logs_status and tsm_sensors_status and deployed_node_status and loggger_mobile_status and rain_gauge_status:
            create_table_for_sensors_data(data)
            status = True
            message = "Successfully save all deployment data."
            DB.session.commit()
        else:
            status = False
            message = "Something went wrong, please try again."
            DB.session.rollback()
    except Exception as err:
        print("save_all_deployment_data => ", err)
        DB.session.rollback()
        status = False
        message = err
    return status, message


def save_logger_models(data):
    logger_model_status = None
    model_id = 0
    installed_sensors = data["installed_sensors"]
    logger_type = data["logger_type"]
    has_tilt = "tilt" in installed_sensors
    has_rain = "rain" in installed_sensors
    has_piezo = "piezo" in installed_sensors
    has_soms = "soms" in installed_sensors
    try:
        logger_models = LoggerModels
        check_logger_models = logger_models.query.filter(
            logger_models.has_tilt == has_tilt, logger_models.has_rain == has_rain,
            logger_models.has_piezo == has_piezo, logger_models.has_soms == has_soms,
            logger_models.logger_type == logger_type).first()

        if check_logger_models:
            model_id = check_logger_models.model_id
        else:
            query = logger_models(has_tilt=has_tilt, has_rain=has_rain,
                                has_piezo=has_piezo, has_soms=has_soms, logger_type=logger_type)

            DB.session.add(query)
            DB.session.flush()
            model_id = query.model_id
        logger_model_status = True
    except Exception as err:
        print("save_logger_models =>", err)
        logger_model_status = False

    return logger_model_status, model_id


def save_loggers_data(data, model_id):
    logger_data_status = None
    logger_id = 0

    site_id = data["site"]["site_id"]

    try:
        query = Loggers(site_id=site_id, logger_name=data["logger_name"],
                                 date_activated=data["date_installed"],
                                 latitude=data["latitude"], longitude=data["longitude"], model_id=model_id)
        DB.session.add(query)
        DB.session.flush()
        logger_id = query.logger_id
        logger_data_status = True
    except Exception as err:
        print("save_loggers_data =>", err)
        logger_data_status = False

    return logger_data_status, logger_id


def save_deployment_logs_data(data, logger_id):
    deployment_logs_status = None
    deployment_logs_id = 0

    try:
        personnel_list = data["personnel"]
        personnel = ", ".join(personnel_list)
        logger_type = data["logger_type"]
        network_type = data["network"]
        
        if logger_type == "router":
            network_type = None

        query = DeploymentLogs(logger_id=logger_id, installation_date=data["date_installed"],
                               location_description=data["location_description"], network_type=network_type,
                               personnel=personnel)
        DB.session.add(query)
        DB.session.flush()

        deployment_logs_id = query.dep_id
        deployment_logs_status = True
    except Exception as err:
        print("save_deployment_logs_data =>", err)
        deployment_logs_status = False

    return deployment_logs_status, deployment_logs_id


def save_tsm_sensors(data, logger_id):
    tsm_sensors_status = None
    tsm_id = 0

    tilt = data["tilt"]
    site_id = data["site"]["site_id"]
    try:
        query = TSMSensors(site_id=site_id,
                           logger_id=logger_id, tsm_name=data["logger_name"],
                           date_activated=tilt["date_activated"], segment_length=tilt["segment_length"],
                           number_of_segments=tilt["number_of_segment"], version=tilt["version"])
        DB.session.add(query)
        DB.session.flush()

        tsm_id = query.tsm_id
        tsm_sensors_status = True
    except Exception as err:
        print("save_tsm_sensors =>", err)
        tsm_sensors_status = False
    return tsm_sensors_status, tsm_id


def save_deployed_node_and_accelerometers(data, deployment_logs_id, tsm_id):
    deployed_node_status = None
    tilt = data["tilt"]
    segment_list = tilt["segment_list"]
    version = tilt["version"]
    accel_number = [1, 2]
    voltage_max = 3.47
    voltage_min = 3.13

    try:
        for accel in accel_number:
            in_use = accel if accel == 1 else 0
            count = 0
            for row in segment_list:
                count += 1

                if accel is 1:
                    deployed_node_query = DeployedNode(dep_id=deployment_logs_id,
                                                       tsm_id=tsm_id, node_id=count,
                                                       n_id=row, version=version)
                    DB.session.add(deployed_node_query)

                accelerometers_query = Accelerometers(tsm_id=tsm_id,
                                                      node_id=count, accel_number=accel,
                                                      voltage_max=voltage_max,
                                                      voltage_min=voltage_min,
                                                      in_use=in_use)
                DB.session.add(accelerometers_query)

        deployed_node_status = True
    except Exception as err:
        print("save_deployed_node_and_accelerometers =>", err)
        deployed_node_status = False

    return deployed_node_status


def save_logger_mobile_data(data, logger_id):
    loggger_mobile_status = None
    logger_type = data["logger_type"]

    date_activated = data["date_installed"]
    sim_num = data["logger_number"]
    gsm_id = get_gsm_id_by_prefix(sim_num)

    if logger_type == "router":
        sim_num = None
        gsm_id = None

    try:
        query = LoggerMobile(logger_id=logger_id, date_activated=date_activated,
                                      sim_num=sim_num, gsm_id=gsm_id)
        
        DB.session.add(query)
        DB.session.flush()
        loggger_mobile_status = True
    except Exception as err:
        print("save_logger_mobile_data =>", err)
        loggger_mobile_status = False

    return loggger_mobile_status


def save_rain_gauge_data(data):
    rain_gauge_status = None
    rain = data["rain"]

    try:
        rain_gauge_status = True
        query = RainfallGauges(gauge_name=data["logger_name"], data_source="senslope", latitude=data["latitude"],
                               longitude=data["longitude"], date_activated=rain["date_activated"])
        DB.session.add(query)
    except Exception as err:
        print("save_rain_gauge_data =>", err)
        rain_gauge_status = False

    return rain_gauge_status


def create_table_for_sensors_data(data):
    """
    create table for loggers
    tilt_xxx
    rain_xxx
    piezo_xxx
    soms_xxx
    """
    logger_name = data["logger_name"]
    installed_sensors = data["installed_sensors"]

    has_tilt = "tilt" in installed_sensors
    has_rain = "rain" in installed_sensors
    has_piezo = "piezo" in installed_sensors
    has_soms = "soms" in installed_sensors

    if has_tilt:
        tilt_model = get_tilt_table(f"tilt_{logger_name}")
        tilt_model.__table__.create(DB.session.bind, checkfirst=True)

        temperature_model = get_temperature_table(f"temp_{logger_name}")
        temperature_model.__table__.create(DB.session.bind, checkfirst=True)

    if has_rain:
        rain_model = get_rain_table(f"rain_{logger_name}")
        rain_model.__table__.create(DB.session.bind, checkfirst=True)

    if has_piezo:
        piezo_model = get_piezo_table(f"piezo_{logger_name}")
        piezo_model.__table__.create(DB.session.bind, checkfirst=True)

    if has_soms:
        soms_model = get_soms_table(f"soms_{logger_name}")
        soms_model.__table__.create(DB.session.bind, checkfirst=True)

    return ""


def get_loggers_data():
    loggers_query = Loggers.query.order_by(Loggers.logger_name).all()
    loggers_result = LoggersSchema(
        many=True).dump(loggers_query) #NOTE EXCLUDE: site

    rainfall_gauges_query = RainfallGauges.query.filter_by(
        data_source="senslope").all()
    rainfall_gauges_result = RainfallGaugesSchema(
        many=True).dump(rainfall_gauges_query)
    #NOTE EXCLUDE: ["data_presence", "rainfall_alerts","rainfall_priorities"]

    datas = {
        "loggers": loggers_result,
        "rain_gauges": rainfall_gauges_result
    }

    return datas


def update_logger_details(data):
    logger_id = data["logger_id"]
    date_deactivated = data["date_deactivated"]
    latitude = data["latitude"]
    longitude = data["longitude"]
    update_logger_details_data = Loggers.query.get(logger_id)
    update_logger_details_data.date_deactivated = date_deactivated
    update_logger_details_data.latitude = latitude
    update_logger_details_data.longitude = longitude

    update_logger_mobile(data)

    has_rain = data["has_rain"]
    if has_rain == 1:
        rain_data = data["rain"]
        rain_id = rain_data["rain_id"]
        update_rain_gauge_data = RainfallGauges.query.get(rain_id)
        update_rain_gauge_data.latitude = latitude
        update_rain_gauge_data.longitude = longitude
    return ""


def update_logger_mobile(data):
    mobile_id = data["mobile_id"]
    sim_num = data["logger_number"]

    update_logger_mobile_data = LoggerMobile.query.get(mobile_id)
    update_logger_mobile_data.sim_num = str(sim_num)
    return ""


def update_tsm(data):
    tsm_id = data["tsm_id"]
    date_deactivated = data["date_deactivated"]

    update_tsm_data = TSMSensors.query.get(tsm_id)
    update_tsm_data.date_deactivated = date_deactivated
    return ""


def update_accelerometer(data):
    accel_id = data["accel_id"]
    ts_updated = data["ts_updated"]
    in_use = data["in_use"]
    voltage_max = data["voltage_max"]
    voltage_min = data["voltage_min"]
    flagger = data["flagger"]
    first_name = flagger["first_name"]
    last_name = flagger["last_name"]
    flagger_name = f"{first_name} {last_name}"
    status = data["status"]
    remarks = data["remarks"]
    has_new_status = data["has_new_status"]

    update_accel = Accelerometers.query.get(accel_id)
    update_accel.ts_updated = ts_updated
    update_accel.in_use = in_use
    update_accel.voltage_max = voltage_max
    update_accel.voltage_min = voltage_min

    if has_new_status:
        update_latest_status = AccelerometerStatus(accel_id=accel_id, ts_flag=ts_updated,
                                                date_identified=ts_updated, flagger=flagger_name,
                                                status=int(status), remarks=remarks)
        DB.session.add(update_latest_status)                                     
    return ""


def update_rain_gauge(data):
    rain_id = data["rain_id"]
    date_deactivated = data["date_deactivated"]

    update_rain_gauge_data = RainfallGauges.query.get(rain_id)
    update_rain_gauge_data.date_deactivated = date_deactivated

    return ""
