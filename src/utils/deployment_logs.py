"""
Deployment Logs Utility File
"""
from datetime import datetime, timedelta
from connection import DB
from src.models.sites import Sites
from src.models.analysis import (
    get_piezo_table, get_rain_table,
    get_soms_table, get_tilt_table,
    get_temperature_table, LoggerModels,
    TSMSensors, Loggers, LoggersComms,
    DeploymentLogs, Accelerometers,
    LoggerMobile, LoggerMobileComms,
    DeployedNode, LoggersSchema,
    RainfallGauges, RainfallGaugesSchema
)
from src.utils.contacts import get_gsm_id_by_prefix

def save_all_deployment_data(data):
    status = None
    message = ""
    print(data)
    try:
        installed_sensors = data["installed_sensors_state"]
        logger_name = data["logger_name"]
        logger_type = data["logger_type"]

        has_tilt = installed_sensors["tilt"] and 1 or 0
        has_rain = installed_sensors["rain"] and 1 or 0
        has_piezo = installed_sensors["piezo"] and 1 or 0
        has_soms = installed_sensors["soms"] and 1 or 0
        logger_models_data = {
            "has_tilt": has_tilt,
            "has_rain": has_rain,
            "has_piezo": has_piezo,
            "has_soms": has_soms,
            "logger_type": logger_type.lower()
        }
        logger_model_status, model_id = save_logger_models(logger_models_data)
        loggers_data = {
            "site_id": data["site_id"],
            "logger_name": logger_name,
            "date_activated": data["date_activated"],
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "model_id": model_id
        }
        logger_data_status, logger_id = save_loggers_data(loggers_data)
        deployment_logs_data = {
            "logger_id": logger_id,
            "installation_date": data["date_installed"],
            "location_description": data["location_description"],
            "network_type": data["network"],
            "personnel": data["personnels"]
        }

        deployment_logs_status, deployment_logs_id = save_deployment_logs_data(deployment_logs_data)
        tsm_sensors_status = True
        deployed_node_status = True

        if has_tilt is 1:
            tsm_form_inputs = data["tsm_form_inputs"]
            tsm_sensor_data = {
                "site_id": data["site_id"],
                "logger_id": logger_id,
                "tsm_name": tsm_form_inputs["tsm_name"],
                "date_activated": data["date_activated"],
                "segment_length": tsm_form_inputs["segment_length"],
                "number_of_segments": tsm_form_inputs["number_of_segment"],
                "version": tsm_form_inputs["version"]
            }

            tsm_sensors_status, tsm_id = save_tsm_sensors(tsm_sensor_data)
            deployed_node_data = {
                "dep_id": deployment_logs_id,
                "tsm_id": tsm_id,
                "segment_list": tsm_form_inputs["segment_list"],
                "version": tsm_form_inputs["version"],
                "accel_number": [1, 2],
                "voltage_max": 3.47,
                "voltage_min": 3.13
            }
            deployed_node_status = save_deployed_node_and_accelerometers(deployed_node_data)
        
        rain_gauge_status = True
        if has_rain is 1:
            rain_gauge_data = {
                "gauge_name": logger_name,
                "data_source": "senslope",
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "date_activated": data["date_activated"]
            }
            rain_gauge_status = save_rain_gauge_data(rain_gauge_data)

        mobile_number = data["mobile_number"]
        gsm_id = get_gsm_id_by_prefix(mobile_number)
        logger_mobile_data = {
            "logger_id": logger_id,
            "date_activated": data["date_activated"],
            "sim_num": mobile_number,
            "gsm_id": gsm_id
        }
        loggger_mobile_status = save_logger_mobile_data(logger_mobile_data)

        if logger_model_status and logger_data_status and deployment_logs_status and tsm_sensors_status and deployed_node_status and loggger_mobile_status and rain_gauge_status:
            create_table_for_sensors_data(logger_models_data, logger_name)
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

def save_logger_models(logger_models_data):
    logger_model_status = None
    model_id = 0
    has_tilt = logger_models_data["has_tilt"]
    has_rain = logger_models_data["has_rain"]
    has_piezo = logger_models_data["has_piezo"]
    has_soms = logger_models_data["has_soms"]
    logger_type = logger_models_data["logger_type"]

    try:
        query = LoggerModels(has_tilt=has_tilt, has_rain=has_rain,
                             has_piezo=has_piezo, has_soms=has_soms, logger_type=logger_type)

        DB.session.add(query)
        DB.session.flush()
        model_id = query.model_id
        logger_model_status = True
    except Exception as err:
        print("save_logger_models =>", err)
        logger_model_status = False

    return logger_model_status, model_id

def save_loggers_data(loggers_data):
    logger_data_status = None
    logger_id = 0

    site_id = loggers_data["site_id"]
    logger_name = loggers_data["logger_name"]
    date_activated = loggers_data["date_activated"]
    latitude = loggers_data["latitude"]
    longitude = loggers_data["longitude"]
    model_id = loggers_data["model_id"]

    try:
        query_senslope = Loggers(site_id=site_id, logger_name=logger_name,
                                 date_activated=date_activated,
                                 latitude=latitude, longitude=longitude, model_id=model_id)

        query_comms = LoggersComms(site_id=site_id, logger_name=logger_name,
                                   date_activated=date_activated,
                                   latitude=latitude, longitude=longitude, model_id=model_id)

        DB.session.add(query_senslope)
        DB.session.add(query_comms)
        DB.session.flush()
        logger_id = query_senslope.logger_id
        logger_data_status = True
    except Exception as err:
        print("save_loggers_data =>", err)
        logger_data_status = False

    return logger_data_status, logger_id

def save_deployment_logs_data(deployment_logs_data):
    deployment_logs_status = None
    deployment_logs_id = 0
    
    logger_id = deployment_logs_data["logger_id"]
    installation_date = deployment_logs_data["installation_date"]
    location_description = deployment_logs_data["location_description"]
    network_type = deployment_logs_data["network_type"]
    personnel_list = deployment_logs_data["personnel"]
    personnel = ", ".join(personnel_list)
    try:
        query = DeploymentLogs(logger_id=logger_id, installation_date=installation_date,
                               location_description=location_description, network_type=network_type,
                               personnel=personnel)
        DB.session.add(query)       
        DB.session.flush()

        deployment_logs_id = query.dep_id
        deployment_logs_status = True
    except Exception as err:
        print("save_deployment_logs_data =>", err)
        deployment_logs_status = False

    return deployment_logs_status, deployment_logs_id

def save_tsm_sensors(tsm_sensor_data):
    tsm_sensors_status = None
    tsm_id = 0

    site_id = tsm_sensor_data["site_id"]
    logger_id = tsm_sensor_data["logger_id"]
    tsm_name = tsm_sensor_data["tsm_name"]
    date_activated = tsm_sensor_data["date_activated"]
    segment_length = tsm_sensor_data["segment_length"]
    number_of_segments = tsm_sensor_data["number_of_segments"]
    version = tsm_sensor_data["version"]

    try:
        query = TSMSensors(site_id=site_id,
                           logger_id=logger_id, tsm_name=tsm_name,
                           date_activated=date_activated, segment_length=segment_length,
                           number_of_segments=number_of_segments, version=version)
        DB.session.add(query)
        DB.session.flush()

        tsm_id = query.tsm_id
        tsm_sensors_status = True
    except Exception as err:
        print("save_tsm_sensors =>", err)
        tsm_sensors_status = False

    return tsm_sensors_status, tsm_id

def save_deployed_node_and_accelerometers(deployed_node_data):
    deployed_node_status = None
    dep_id = deployed_node_data["dep_id"]
    tsm_id = deployed_node_data["tsm_id"]
    segment_list = deployed_node_data["segment_list"]
    version = deployed_node_data["version"]
    accel_number = deployed_node_data["accel_number"]
    voltage_max = deployed_node_data["voltage_max"]
    voltage_min = deployed_node_data["voltage_min"]


    try:
        for accel in accel_number:
            in_use = accel if accel == 1 else 0
            for row in segment_list:
                node_id = row["node_id"]
                n_id = row["segment_value"]

                if accel is 1:
                    deployed_node_query = DeployedNode(dep_id=dep_id, 
                                                       tsm_id=tsm_id, node_id=node_id,
                                                       n_id=n_id, version=version)
                    DB.session.add(deployed_node_query)

                accelerometers_query = Accelerometers(tsm_id=tsm_id,
                                                      node_id=node_id, accel_number=accel,
                                                      voltage_max=voltage_max,
                                                      voltage_min=voltage_min,
                                                      in_use=in_use)
                DB.session.add(accelerometers_query)


        deployed_node_status = True
    except Exception as err:
        print("save_deployed_node_and_accelerometers =>", err)
        deployed_node_status = False

    return deployed_node_status


def save_logger_mobile_data(logger_mobile_data):
    loggger_mobile_status = None

    logger_id = logger_mobile_data["logger_id"]
    date_activated = logger_mobile_data["date_activated"]
    sim_num = logger_mobile_data["sim_num"]
    gsm_id = logger_mobile_data["gsm_id"]

    try:
        query_senslope = LoggerMobile(logger_id=logger_id, date_activated=date_activated,
                                      sim_num=sim_num, gsm_id=gsm_id)
        query_comms = LoggerMobileComms(logger_id=logger_id, date_activated=date_activated,
                                        sim_num=sim_num, gsm_id=gsm_id) 
        DB.session.add(query_senslope)
        DB.session.add(query_comms)
        loggger_mobile_status = True
    except Exception as err:
        print("save_logger_mobile_data =>", err)
        loggger_mobile_status = False

    return loggger_mobile_status

def save_rain_gauge_data(data):
    rain_gauge_status = None
    gauge_name = data["gauge_name"]
    data_source = data["data_source"]
    latitude = data["latitude"]
    longitude = data["longitude"]
    date_activated = data["date_activated"]

    try:
        rain_gauge_status = True
        query = RainfallGauges(gauge_name=gauge_name, data_source=data_source, latitude=latitude,
                               longitude=longitude, date_activated=date_activated)
        DB.session.add(query)
    except Exception as err:
        print("save_rain_gauge_data =>", err)
        rain_gauge_status = False

    return rain_gauge_status

def create_table_for_sensors_data(data, logger_name):
    """
    create table for loggers
    tilt_xxx
    rain_xxx
    piezo_xxx
    soms_xxx
    """
    # model = get_tilt_table("test_create_table1")
    # model.__table__.create(DB.session.bind, checkfirst=True)
    # model.__table__.drop(DB.engine)
    has_tilt = data["has_tilt"]
    has_rain = data["has_rain"]
    has_piezo = data["has_piezo"]
    has_soms = data["has_soms"]

    if has_tilt is 1:
        tilt_model = get_tilt_table(f"tilt_{logger_name}")
        tilt_model.__table__.create(DB.session.bind, checkfirst=True)

        temperature_model = get_temperature_table(f"temp_{logger_name}")
        temperature_model.__table__.create(DB.session.bind, checkfirst=True)

    if has_rain is 1:
        rain_model = get_rain_table(f"rain_{logger_name}")
        rain_model.__table__.create(DB.session.bind, checkfirst=True)

    if has_piezo is 1:
        piezo_model = get_piezo_table(f"piezo_{logger_name}")
        piezo_model.__table__.create(DB.session.bind, checkfirst=True)

    if has_soms is 1:
        soms_model = get_soms_table(f"soms_{logger_name}")
        soms_model.__table__.create(DB.session.bind, checkfirst=True)

    return ""


def loggers_data():
    loggers_query = Loggers.query.order_by(Loggers.logger_id.desc()).all()
    loggers_result = LoggersSchema(many=True, exclude=["site"]).dump(loggers_query).data
    
    rainfall_gauges_query = RainfallGauges.query.filter_by(data_source="senslope").all()
    rainfall_gauges_result = RainfallGaugesSchema(
        many=True, exclude=["data_presence", "rainfall_alerts",
                            "rainfall_priorities"]).dump(rainfall_gauges_query).data

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

    update_logger_details_data_comms = LoggersComms.query.get(logger_id)
    update_logger_details_data_comms.date_deactivated = date_deactivated
    update_logger_details_data_comms.latitude = latitude
    update_logger_details_data_comms.longitude = longitude
    return ""

def update_logger_mobile(data):
    mobile_id = data["mobile_id"]
    sim_num = data["sim_num"]
    
    update_logger_mobile_data = LoggerMobile.query.get(mobile_id)
    update_logger_mobile_data.sim_num = str(sim_num)

    update_logger_mobile_data_comms = LoggerMobileComms.query.get(mobile_id)
    update_logger_mobile_data_comms.sim_num = str(sim_num)
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

    update_accel = Accelerometers.query.get(accel_id)
    update_accel.ts_updated = ts_updated
    update_accel.in_use = in_use
    update_accel.voltage_max = voltage_max
    update_accel.voltage_min = voltage_min
    return ""

def update_rain_gauge(data):
    rain_id = data["rain_id"]
    date_deactivated = data["date_deactivated"]

    update_rain_gauge_data = RainfallGauges.query.get(rain_id)
    update_rain_gauge_data.date_deactivated = date_deactivated

    return ""