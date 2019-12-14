"""
Dry Run Test Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from connection import DB
from src.models.monitoring import OperationalTriggers, OperationalTriggerSymbols
from src.models.analysis import RainfallAlerts, MarkerAlerts, TSMAlerts, MarkerObservations, MarkerData
from src.models.sites import Sites
from src.utils.monitoring import update_alert_status
from src.utils.users import get_community_users
from src.utils.extra import test_truncator, var_checker, get_process_status_log


TEST_API_COLLECTION = Blueprint("test_api_collection", __name__)


def add_rainfall_alert(site_id, is_triggering, ts=None, ts_updated=None):
    """
    Function that get one member and outputs as json string
    """

    rain_gauge = 1
    if site_id == 1:
        rain_gauge = 1
    elif site_id == 42:
        rain_gauge = 1205
    elif site_id == 50:
        rain_gauge = 50

    if is_triggering == 1:
        rainfall_alert = RainfallAlerts(
            ts=ts_updated,
            site_id=site_id,
            rain_id=rain_gauge,
            rain_alert="a",
            cumulative="100",
            threshold="60"
        )
        DB.session.add(rainfall_alert)

    if is_triggering == 0:
        trigger_sym_id = 13
    elif is_triggering == 1:
        trigger_sym_id = 14

    op_trigger = OperationalTriggers(
        ts=ts,
        site_id=site_id,
        trigger_sym_id=trigger_sym_id,
        ts_updated=ts_updated
    )
    DB.session.add(op_trigger)
    DB.session.flush()
    trigger_id = op_trigger.trigger_id

    print("RAINFALL_RELEASED")
    return trigger_id


def add_surficial_alert(site_id, ts, alert_level, measurement):
    """
    ASSUMING THE FIRST DATA YOU WILL SET IS
    10
    """
    marker_id = 73
    if site_id == 1:
        marker_id = 73
    elif site_id == 42:
        marker_id = 127

    # INSERT MARKER OBS
    marker_obs = MarkerObservations(
        site_id=site_id,
        ts=ts,
        meas_type="EVENT",
        observer_name="TEST",
        data_source="SMS",
        reliability=1,
        weather="MAARAW"
    )
    DB.session.add(marker_obs)
    DB.session.flush()
    obs_id = marker_obs.mo_id

    # INSERT MARKER DATA
    marker_data1 = MarkerData(
        mo_id=obs_id,
        marker_id=marker_id,
        measurement=measurement
    )
    DB.session.add(marker_data1)

    marker_data2 = MarkerData(
        mo_id=obs_id,
        marker_id=marker_id,
        measurement=measurement
    )
    DB.session.add(marker_data2)

    marker_data3 = MarkerData(
        mo_id=obs_id,
        marker_id=marker_id,
        measurement=measurement
    )
    DB.session.add(marker_data3)


    # INSERT MARKER ALERT summarizing the data
    marker_alert = MarkerAlerts(
        ts=ts,
        marker_id=marker_id,
        displacement=0,
        time_delta=0.38,
        alert_level=alert_level
    )
    DB.session.add(marker_alert)

    marker_alert = MarkerAlerts(
        ts=ts,
        marker_id=marker_id,
        displacement=0,
        time_delta=0.38,
        alert_level=alert_level
    )
    DB.session.add(marker_alert)

    marker_alert = MarkerAlerts(
        ts=ts,
        marker_id=marker_id,
        displacement=0,
        time_delta=0.38,
        alert_level=alert_level
    )
    DB.session.add(marker_alert)


    if alert_level == 2:
        trigger_sym_id = 8
    elif alert_level == 3:
        trigger_sym_id = 9
    elif alert_level == 0:
        trigger_sym_id = 6

    op_trigger = OperationalTriggers(
        ts=ts,
        site_id=site_id,
        trigger_sym_id=trigger_sym_id,
        ts_updated=ts
    )
    DB.session.add(op_trigger)
    DB.session.flush()
    trigger_id = op_trigger.trigger_id

    print("SURFICIAL_RELEASED")
    return trigger_id


def add_subsurface_alert(site_id, ts, alert_level):
    """
    """
    tsm_id = 73
    if site_id == 1:
        tsm_id = 1
    elif site_id == 42:
        tsm_id = 96
    elif site_id == 50:
        tsm_id = 117

    if alert_level != 0:
        marker_alert = TSMAlerts(
            ts=ts,
            tsm_id=tsm_id,
            alert_level=alert_level,
            ts_updated=ts
        )
        DB.session.add(marker_alert)

    if alert_level == 2:
        trigger_sym_id = 3
    elif alert_level == 3:
        trigger_sym_id = 4
    elif alert_level == 0:
        trigger_sym_id = 2

    op_trigger = OperationalTriggers(
        ts=ts,
        site_id=site_id,
        trigger_sym_id=trigger_sym_id,
        ts_updated=ts
    )
    DB.session.add(op_trigger)
    DB.session.flush()
    trigger_id = op_trigger.trigger_id

    print("SUBSURFACE_RELEASED")
    return trigger_id


@TEST_API_COLLECTION.route("/test_api/scenario_1/<part_number>/<ts>/<ts_updated>", methods=["GET"])
def release_scenario_one(part_number, ts=None, ts_updated=None):
    """
    Scenario One: Rainfall alert and operational trigger
    """
    try:
        get_process_status_log(f"release_scenario_one {part_number}", "request")

        input_ts = datetime.now()
        input_ts_u = datetime.now()
        if ts:
            input_ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")

            if ts_updated:
                input_ts_u = datetime.strptime(ts_updated, "%Y-%m-%d %H:%M:%S")

        if part_number == 1:
            print("PART 1")
            trigger_id = add_rainfall_alert(site_id=1, is_triggering=1, ts=input_ts, ts_updated=input_ts_u)

            alert_details = {
                "trigger_id": trigger_id,
                "alert_status": None, # -1 -> invalid, 0 -> validating, 1 - valid, None -> System generated
                "remarks": "",
                "user_id": 1
            }
            update_alert_status(alert_details)

            print("RAINFALL ALERT OK!")

        elif part_number == 2:
            print("PART 2")
            trigger_id = add_surficial_alert(site_id=41, ts=input_ts, alert_level=2, measurement=50)

            alert_details = {
                "trigger_id": trigger_id,
                "alert_status": None, # -1 -> invalid, 0 -> validating, 1 - valid, None -> System generated
                "remarks": "",
                "user_id": 1
            }
            update_alert_status(alert_details)

            print("SURFICIAL ALERT OK!")
        else:
            print("invalid part number")

        # WHEN ALL THINGS ARE OVER
        DB.session.commit()
        get_process_status_log(f"release_scenario_one {part_number}", "done")
        print("UMABOT DITO")
        return "success"
    except Exception as err:
        DB.session.rollback()
        print(err)
        return "scenario insert failed"


@TEST_API_COLLECTION.route("/test_api/pre_scenario_2/<ts>", methods=["GET"])
def pre_release_scenario_two(ts=None):
    """
    Scenario One: Rainfall alert and operational trigger and subsurface
    """
    try:
        input_ts = datetime.now()
        if ts:
            input_ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")

        trigger_id = add_surficial_alert(42, input_ts, 0, 50)
        DB.session.commit()
    except Exception as err:
        print(err)


@TEST_API_COLLECTION.route("/test_api/scenario_2/<part_number>/<ts>/<ts_updated>", methods=["GET"])
def release_scenario_two(part_number, ts=None, ts_updated=None):
    """
    Scenario Two: Rainfall alert and operational trigger and subsurface
    """
    try:
        get_process_status_log("", "request")
        input_ts = datetime.now()
        input_ts_u = datetime.now()
        if ts:
            input_ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")

            if ts_updated:
                input_ts_u = datetime.strptime(ts_updated, "%Y-%m-%d %H:%M:%S")

        if part_number == 1:
            """
            PART 1 -> Insert subsurface alert THEN invalidate sa WEB UI
            """
            trigger_id = add_subsurface_alert(site_id=42, ts=input_ts, alert_level=2)

            alert_details = {
                "trigger_id": trigger_id,
                "alert_status": None, # -1 -> invalid, 0 -> validating, 1 - valid, None -> System generated
                "remarks": "",
                "user_id": 1
            }
            update_alert_status(alert_details)

            print("SUBSURFACE ALERT OK!")

        elif part_number == 2:
            """
            PART 2 -> Once invalidated, after 30mins, may RAINFALL alert. tapos validate sa WEB UI
            """
            trigger_id = add_rainfall_alert(site_id=42, is_triggering=1, ts=input_ts, ts_updated=input_ts_u)

            alert_details = {
                "trigger_id": trigger_id,
                "alert_status": None, # -1 -> invalid, 0 -> validating, 1 - valid, None -> System generated
                "remarks": "",
                "user_id": 1
            }
            update_alert_status(alert_details)

            print("RAINFALL ALERT OK!")

        elif part_number == 3:
            """
            PART 3 -> Once validated, RETRIGGER rainfall alert 1 HOUR before release time
                    PERO HINDI isasama sa release
            """
            trigger_id = add_rainfall_alert(site_id=42, is_triggering=1, ts=input_ts, ts_updated=input_ts_u)
            print("RAINFALL ALERT OK!")

        elif part_number == 4:
            """
            PART 4 -> END OF VALIDITY, lowering dapat PERO NO GROUND DATA so extend release.
            """
            trigger_id = add_rainfall_alert(site_id=42, is_triggering=0, ts=input_ts, ts_updated=input_ts_u)
            print("RAINFALL ALERT OK!")

        elif part_number == 5:
            """
            PART 5 -> END OF VALIDITY, may ground data. Lowering na talaga.
            NOTE: MAKE SURE NA MAY SAME VALUE UNG LAST OBSERVATION
            AT 30mins before ang data
            """
            # Release rainfall
            trigger_id_rain = add_rainfall_alert(site_id=42, is_triggering=0, ts=input_ts, ts_updated=input_ts_u)
            trigger_id_surf = add_surficial_alert(site_id=42, ts=input_ts, alert_level=0, measurement=50)
            print("LOWERING DATA OK!")

        # TODO: check kung okay na ung scenario 2

        DB.session.commit()
        return "success"

    except Exception as err:
        DB.session.rollback()
        print(err)
        return "scenario insert failed"



@TEST_API_COLLECTION.route("/test_api/scenario_3/<part_number>/<ts>/<ts_updated>", methods=["GET"])
def release_scenario_three(part_number, ts=None, ts_updated=None):
    """
    Scenario Three: MOMS
    """
    try:
        input_ts = datetime.now()
        input_ts_u = datetime.now()
        if ts:
            input_ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")

            if ts_updated:
                input_ts_u = datetime.strptime(ts_updated, "%Y-%m-%d %H:%M:%S")

        if part_number == 1:
            """
            PART 1 -> Insert subsurface alert THEN invalidate sa WEB UI
            """
            trigger_id = add_subsurface_alert(site_id=42, ts=input_ts, alert_level=2)

            alert_details = {
                "trigger_id": trigger_id,
                "alert_status": None, # -1 -> invalid, 0 -> validating, 1 - valid, None -> System generated
                "remarks": "",
                "user_id": 1
            }
            update_alert_status(alert_details)

            print("SUBSURFACE ALERT OK!")

        elif part_number == 2:
            """
            PART 2 -> Once invalidated, after 30mins, may RAINFALL alert. tapos validate sa WEB UI
            """
            trigger_id = add_rainfall_alert(site_id=42, is_triggering=1, ts=input_ts, ts_updated=input_ts_u)

            alert_details = {
                "trigger_id": trigger_id,
                "alert_status": None, # -1 -> invalid, 0 -> validating, 1 - valid, None -> System generated
                "remarks": "",
                "user_id": 1
            }
            update_alert_status(alert_details)

            print("RAINFALL ALERT OK!")

        elif part_number == 3:
            """
            PART 3 -> Once validated, RETRIGGER rainfall alert 1 HOUR before release time
                    PERO HINDI isasama sa release
            """
            trigger_id = add_rainfall_alert(site_id=42, is_triggering=1, ts=input_ts, ts_updated=input_ts_u)
            print("RAINFALL ALERT OK!")

        elif part_number == 4:
            """
            PART 4 -> END OF VALIDITY, lowering dapat PERO NO GROUND DATA so extend release.
            """
            trigger_id = add_rainfall_alert(site_id=42, is_triggering=0, ts=input_ts, ts_updated=input_ts_u)
            print("RAINFALL ALERT OK!")

        elif part_number == 5:
            """
            PART 5 -> END OF VALIDITY, may ground data. Lowering na talaga.
            NOTE: MAKE SURE NA MAY SAME VALUE UNG LAST OBSERVATION
            AT 30mins before ang data
            """
            # Release rainfall
            trigger_id_rain = add_rainfall_alert(site_id=42, is_triggering=0, ts=input_ts, ts_updated=input_ts_u)
            trigger_id_surf = add_surficial_alert(site_id=42, ts=input_ts, alert_level=0, measurement=50)
            print("LOWERING DATA OK!")

        # TODO: check kung okay na ung scenario 2

        DB.session.commit()
        return "success"

    except Exception as err:
        DB.session.rollback()
        print(err)
        return "scenario insert failed"


@TEST_API_COLLECTION.route("/test_api/truncator/<date>", methods=["GET"])
@TEST_API_COLLECTION.route("/test_api/truncator/<class_name>", methods=["GET"])
@TEST_API_COLLECTION.route("/test_api/truncator/<class_name>/<date>", methods=["GET"])
def call_the_truncator(class_name=None, date=None):
    """
    """
    try:
        response = test_truncator(class_name, date)
        DB.session.commit()
        return response

    except Exception as err:
        DB.session.rollback()
        print()
        print(err)
        return "Error in truncate"
