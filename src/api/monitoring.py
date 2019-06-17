"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json, time
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from src.models.monitoring import (
    MonitoringEvents, MonitoringReleases, MonitoringEventAlerts,
    MonitoringReleasePublishers, MonitoringTriggers, MonitoringTriggersMisc,
    InternalAlertSymbols, MonitoringMomsReleases, BulletinTracker)
from src.models.monitoring import (
    MonitoringEventsSchema, MonitoringReleasesSchema, MonitoringEventAlertsSchema)
from src.utils.narratives import (write_narratives_to_db)
from src.utils.monitoring import (
    get_monitoring_events, get_monitoring_releases,
    get_active_monitoring_events, get_current_monitoring_instance_per_site,
    compute_event_validity, round_to_nearest_release_time, get_pub_sym_id,
    write_monitoring_moms_to_db, write_monitoring_on_demand_to_db,
    write_monitoring_earthquake_to_db, get_internal_alert_symbol)
from src.utils.extra import (create_symbols_map, var_checker)


MONITORING_BLUEPRINT = Blueprint("monitoring_blueprint", __name__)


@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events", methods=["GET"])
@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events/<event_id>", methods=["GET"])
def wrap_get_monitoring_events(event_id=None):
    """
    NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    """
    event = get_monitoring_events(event_id)
    event_schema = MonitoringEventsSchema()

    if event_id is None:
        event_schema = MonitoringEventsSchema(many=True)

    event_data = event_schema.dump(event).data

    return jsonify(event_data)


@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_releases", methods=["GET"])
@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_releases/<release_id>", methods=["GET"])
def wrap_get_monitoring_releases(release_id=None):
    """
    Gets a single release with the specificied ID
    """
    release = get_monitoring_releases(release_id)
    release_schema = MonitoringReleasesSchema()

    if release_id is None:
        release_schema = MonitoringReleasesSchema(many=True)

    releases_data = release_schema.dump(release).data

    return jsonify(releases_data)


@MONITORING_BLUEPRINT.route("/monitoring/get_active_monitoring_events", methods=["GET"])
def wrap_get_active_monitoring_events():
    """
        Get active monitoring events. Does not need any parameters, just get everything.
    """
    active_events = get_active_monitoring_events()

    active_events_data = MonitoringEventAlertsSchema(
        many=True).dump(active_events).data

    return jsonify(active_events_data)


@MONITORING_BLUEPRINT.route("/monitoring/get_pub_sym_id/<alert_level>", methods=["GET"])
def wrap_get_pub_sym_id(alert_level):
    """
    This is a utilities file registered in utils/monitoring.
    Returns the pub_sym_id of a specified Alert Level

    Args:
        alert_level - Integer

    Returns integer
    """
    pub_sym = get_pub_sym_id(alert_level)

    return str(pub_sym)


def is_new_monitoring_instance(new_status, current_status):
    """
    Checks is new.
    """
    is_new = False
    if new_status != current_status:
        is_new = True

    return is_new


def end_current_monitoring_event_alert(event_alert_id, ts):
    """
    If new alert is initiated, this will end the previous event_alert before creating a new one.
    """
    try:
        event_alerts = MonitoringEventAlerts
        ea_to_end = event_alerts.query.filter(
            event_alerts.event_alert_id == event_alert_id).first()
        ea_to_end.ts_end = ts
        print("Note: Previous monitoring entry ended.")
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise


def write_monitoring_event_to_db(event_details):
    """
    Writes to DB all event details
    Args:
        event_details (dict)
            site_id (int), event_start (datetime), validity (datetime), status  (int)

    Returns event_id (integer)
    """
    try:
        new_event = MonitoringEvents(
            site_id=event_details["site_id"],
            event_start=event_details["event_start"],
            validity=event_details["validity"],
            status=event_details["status"]
        )
        DB.session.add(new_event)
        DB.session.flush()

        new_event_id = new_event.event_id
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return new_event_id


def write_monitoring_event_alert_to_db(event_alert_details):
    """
    Writes to DB all event alert details
    Args:
        event_alert_details (dict)
            event_id (int), pub_sym_id (int), ts_start (datetime)
        Note: There is no ts_end because it is only filled when the event ends.

    Returns event_id (integer)
    """
    try:
        new_ea = MonitoringEventAlerts(
            event_id=event_alert_details["event_id"],
            pub_sym_id=event_alert_details["pub_sym_id"],
            ts_start=event_alert_details["ts_start"],
            ts_end=None
        )
        DB.session.add(new_ea)
        DB.session.flush()

        new_ea_id = new_ea.event_alert_id
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return new_ea_id


def start_new_monitoring_instance(new_instance_details):
    """
    Initiates a new monitoring instance

    Args:
        new_instance_details (dict) - contains event_details (dict) and event_alert_details (dict)

    Returns event alert ID for use in releases
    """
    try:
        print(new_instance_details)
        event_details = new_instance_details["event_details"]
        event_alert_details = new_instance_details["event_alert_details"]

        event_id = write_monitoring_event_to_db(event_details)

        event_alert_details["event_id"] = event_id
        event_alert_id = write_monitoring_event_alert_to_db(
            event_alert_details)

        return_ids = {
            "event_id": event_id,
            "event_alert_id": event_alert_id
        }

    except Exception as err:
        print(err)
        raise

    return return_ids


def write_monitoring_release_to_db(release_details):
    """
    Returns release_id
    """
    try:
        new_release = MonitoringReleases(
            event_alert_id=release_details["event_alert_id"],
            data_ts=release_details["data_ts"],
            trigger_list=release_details["trigger_list"],
            release_time=release_details["release_time"],
            bulletin_number=release_details["bulletin_number"]
        )
        DB.session.add(new_release)
        DB.session.flush()

        new_release_id = new_release.release_id
        print("--- NEW RELEASE with ID of : " + str(new_release_id))

    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return new_release_id


def get_bulletin_number(site_id):
    """
    Gets the bulletin number of a site specified
    """
    bulletin_number_row = BulletinTracker.query.filter(
        BulletinTracker.site_id == site_id).first()

    return bulletin_number_row["bulletin_number"]


def update_bulletin_number(site_id, custom_bulletin_value=1):
    """
    Returns an updated bulletin number based on specified increments or decrements.

    Args:
        site_id (int) - the site you want to manipulate the bulletin number
        custom_bulletin_number (int) - default is one. You can set other values to either
        increase or decrease the bulletin number. Useful for fixing any mis-releases
    """
    try:
        row_to_update = BulletinTracker.query.filter(
            BulletinTracker.site_id == site_id).first()
        row_to_update.bulletin_number = row_to_update.bulletin_number + custom_bulletin_value
    except Exception as err:
        print(err)
        raise

    return row_to_update.bulletin_number


def write_monitoring_release_publishers_to_db(role, user_id, release_id):
    """
    Writes a release publisher to DB and returns the new ID.
    """
    try:
        new_publisher = MonitoringReleasePublishers(
            user_id=user_id,
            release_id=release_id,
            role=role
        )
        DB.session.add(new_publisher)
        DB.session.flush()

        new_publisher_id = new_publisher.publisher_id
        print("-----NEW PUBLISHER ID of " + str(role)
              + " Personnel: " + str(new_publisher_id))

    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return new_publisher_id


def write_monitoring_release_triggers_to_db(trigger_details, new_release_id):
    """
    Write triggers to the database one by one. Must be looped if needed.

    Args:
        trigger_details (dict)
        new_release_id (int)

    Returns trigger_id (possibly appended to a list to the owner function)
    """
    try:
        datetime_ts = trigger_details["ts"]
        new_trigger = MonitoringTriggers(
            release_id=new_release_id,
            internal_sym_id=trigger_details["internal_sym_id"],
            ts=datetime_ts,
            info=trigger_details["info"]
        )
        DB.session.add(new_trigger)
        DB.session.flush()

        new_trigger_id = new_trigger.trigger_id
        print("-----NEW TRIGGER ID " + str(new_trigger_id))

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return new_trigger_id


def write_monitoring_triggers_misc_to_db(trigger_id, has_moms, od_id=None, eq_id=None):
    """
    """
    try:
        trigger_misc = MonitoringTriggersMisc(
            trigger_id=trigger_id,
            od_id=od_id,
            eq_id=eq_id,
            has_moms=has_moms
        )
        DB.session.add(trigger_misc)
        DB.session.flush()

        new_trig_misc_id = trigger_misc.trig_misc_id
    except Exception as err:
        print(err)
        raise

    return new_trig_misc_id


def write_monitoring_moms_releases_to_db(trig_misc_id, moms_id):
    """
    Writes a record that links trigger_misc and the moms report.

    Args:
        trig_misc_id (Int)
        moms_id (Int)

    Returns nothing for now since there is no use for it's moms_release_id.
    """
    try:
        moms_release = MonitoringMomsReleases(
            trig_misc_id=trig_misc_id,
            moms_id=moms_id
        )
        DB.session.add(moms_release)
        # DB.session.flush()
    except Exception as err:
        print(err)
        raise


def is_rain_surficial_subsurface_trigger(alert_symbol):
    flag = False
    if alert_symbol in ["R", "S", "s", "G", "g"]:
        flag = True

    return flag


# @MONITORING_BLUEPRINT.route("/monitoring/insert_ewi_release", methods=["POST"])
# # def insert_ewi_release(release_details, publisher_details, trigger_details):
def insert_ewi_release(monitoring_instance_details, release_details, publisher_details, trigger_list_arr=None, non_triggering_moms=None):
    """
    Initiates the monitoring_release write to db plus it's corresponding details.
    """
    try:
        new_release = write_monitoring_release_to_db(release_details)
        release_id = new_release
        site_id = monitoring_instance_details["site_id"]
        event_id = monitoring_instance_details["event_id"]

        write_monitoring_release_publishers_to_db(
            "mt", publisher_details["publisher_mt_id"], release_id)

        write_monitoring_release_publishers_to_db(
            "ct", publisher_details["publisher_ct_id"], release_id)

        if trigger_list_arr is not None:
            # The following could should be in a foreach so we can handle list of triggers
            for index, trigger in enumerate(trigger_list_arr):
                internal_sym_id = trigger["internal_sym_id"]
                alert_symbol = get_internal_alert_symbol(internal_sym_id)
                is_rain_surficial_sub_trigger = is_rain_surficial_subsurface_trigger(
                    alert_symbol)

                if is_rain_surficial_sub_trigger is True:
                    internal_sym_id = trigger["internal_sym_id"]
                    info = trigger["info"]
                    timestamp = trigger["ts"]
                else:
                    if alert_symbol in ["M", "m"]:
                        print("---MOMS---")
                        try:
                            moms_id = trigger["moms_id"]
                            info = trigger["consolidated_tech_info"]
                            timestamp = release_details["data_ts"]
                        except:
                            moms_details = trigger["moms_details"]
                            info = trigger["consolidated_tech_info"]
                            timestamp = release_details["data_ts"]

                            # Temporary Map for getting alert level per IAS entry via internal_sym_id
                            moms_level_map = {14: -1, 13: 2, 7: 3}
                            moms_details["op_trigger"] = moms_level_map[internal_sym_id]

                            moms_id = write_monitoring_moms_to_db(moms_details, site_id, event_id)

                        od_id = None
                        eq_id = None
                        has_moms = True

                        print("MOMS-Success")

                    elif alert_symbol == "D":
                        print("---ON_DEMAND---")
                        od_details = trigger["od_details"]
                        request_ts = datetime.strptime(
                            od_details["request_ts"], "%Y-%m-%d %H:%M:%S")
                        narrative = od_details["reason"]
                        info = narrative
                        timestamp = request_ts

                        od_details["narrative_id"] = write_narratives_to_db(
                            site_id, request_ts, narrative, event_id)

                        od_id = write_monitoring_on_demand_to_db(od_details)
                        eq_id = None
                        has_moms = False

                    elif alert_symbol == "E":
                        print("---EARTHQUAKE---")
                        info = ""
                        timestamp = release_details["data_ts"]
                        od_id = None
                        eq_id = write_monitoring_earthquake_to_db(
                            trigger["eq_details"])
                        has_moms = False

                trigger_details = {
                    "release_id": release_id,
                    "info": info,
                    "ts": timestamp,
                    "internal_sym_id": internal_sym_id
                }

                new_trigger_id = write_monitoring_release_triggers_to_db(
                    trigger_details, release_id)
                if is_rain_surficial_sub_trigger is False:
                    trig_misc_id = write_monitoring_triggers_misc_to_db(
                        new_trigger_id, has_moms, od_id, eq_id)
                    if alert_symbol in ["m", "M"]:
                        write_monitoring_moms_releases_to_db(
                            trig_misc_id, moms_id)

        var_checker("NON TRIGERING", non_triggering_moms, True)
        if non_triggering_moms:
            print("PASOK")
            for non_trig_moms in non_triggering_moms:
                try:
                    moms_id = non_trig_moms["moms_id"]
                    print(f"Existing non-triggering MOMS given. ID is: {moms_id}")
                except:
                    moms_details = non_trig_moms["moms_details"]

                    # Temporary Map for getting alert level per IAS entry via internal_sym_id
                    moms_level_map = {14: -1, 13: 2, 7: 3}
                    moms_details["op_trigger"] = moms_level_map[internal_sym_id]

                    moms_id = write_monitoring_moms_to_db(moms_details, site_id, event_id)
                    print(f"New non-triggering MOMS written. ID is: {moms_id}")

        # WHEN NOTHING GOES WRONG, COMMIT!
        DB.session.commit()
    except Exception as err:
        DB.session.rollback()
        print(err)
        raise


def update_event_validity(new_validity, event_id):
    """
    Adjust validity
    """
    try:
        event = MonitoringEvents.query.filter(
            MonitoringEvents.event_id == event_id).first()
        event.validity = new_validity
    except Exception as err:
        print(err)
        raise


@MONITORING_BLUEPRINT.route("/monitoring/insert_ewi", methods=["POST"])
def insert_ewi(internal_json=None):
    """
    Inserts an "event" with specified type to the DB.
    Entry type is either event or routine. If the existing type is the same with the new one,
    it means re-release.
    If it is different, create a new event.
    """
    try:
        ############################
        # Variable Initializations #
        ############################
        if internal_json:
            json_data = internal_json
        else:
            json_data = request.get_json()

        # Entry-related variables from JSON
        site_id = json_data["site_id"]
        site_id_list = json_data["routine_sites_ids"]
        alert_level = json_data["alert_level"]

        entry_type = 1
        site_monitoring_instance = get_current_monitoring_instance_per_site(
            site_id)
        site_status = site_monitoring_instance.status
        if site_status == 1 and alert_level > 0:
            entry_type = 2
        elif site_status == 2:
            entry_type = 2

        # Release-related variables from JSON
        release_details = json_data["release_details"]
        publisher_details = json_data["publisher_details"]
        trigger_list_arr = json_data["trigger_list_arr"]

        datetime_data_ts = datetime.strptime(
            release_details["data_ts"], "%Y-%m-%d %H:%M:%S")

        release_details["data_ts"] = datetime_data_ts

        ##########################
        # ROUTINE or EVENT entry #
        ##########################
        if entry_type == 1:  # stands for routine
            # Mass release for routine sites.
            print("--- It's a routine ---")

            for site_id in site_id_list:
                print("---site_id---")
                print(site_id)
                release_details["event_alert_id"] = site_monitoring_instance.event_alerts[0].event_alert_id
                release_details["bulletin_number"] = update_bulletin_number(
                    site_id, 1)

                instance_details = {
                    "site_id": site_id,
                    "event_id": site_monitoring_instance.event_id
                }

                if site_status == 1:
                    insert_ewi_release(instance_details,
                                       release_details, publisher_details, None)

        elif entry_type == 2:  # stands for event
            print("--- It's an event ---")

            # If using MonitoringEventsSchema, it will return all.
            # Instead, this will return only the latest one
            # event_alerts is an instrumented list. Adding index [0] gets the actual record.
            current_event_alert = site_monitoring_instance.event_alerts[0]
            pub_sym_id = get_pub_sym_id(alert_level)

            if alert_level in [1, 2, 3]:
                validity = compute_event_validity(
                    datetime_data_ts, alert_level)
            else:
                validity = site_monitoring_instance.validity

            # New status is based on entry_type, event, which is 2.
            if is_new_monitoring_instance(2, site_status):
                # If the values are different, means new monitoring instance will be created
                print()
                print("--- NEW MONITORING INSTANCE! ---")

                end_current_monitoring_event_alert(
                    current_event_alert.event_alert_id, datetime_data_ts)

                new_instance_details = {
                    "event_details": {
                        "site_id": site_id,
                        "event_start": datetime_data_ts,
                        "validity": validity,
                        "status": 2
                    },
                    "event_alert_details": {
                        "pub_sym_id": pub_sym_id,
                        "ts_start": datetime_data_ts
                    }
                }
                instance_ids = start_new_monitoring_instance(
                    new_instance_details)
                event_id = instance_ids["event_id"]
                event_alert_id = instance_ids["event_alert_id"]

            else:
                # If the values are same, re-release will happen.
                print()
                print("--- RE-RELEASE! ---")

                event_id = current_event_alert.event_id
                event_alert_details = {
                    "event_id": event_id,
                    "pub_sym_id": pub_sym_id,
                    "ts_start": datetime_data_ts
                }
                current_event_alert_id = current_event_alert.event_alert_id

                event_alert_id = current_event_alert_id

                # Raising.
                if pub_sym_id > current_event_alert.pub_sym_id and pub_sym_id <= 4:
                    # Now that you created a new event
                    print("---RAISING")
                    update_event_validity(validity, event_id)

                    end_current_monitoring_event_alert(
                        current_event_alert_id, datetime_data_ts)
                    event_alert_id = write_monitoring_event_alert_to_db(
                        event_alert_details)

                # Lowering.
                elif pub_sym_id == 1:
                    release_time = round_to_nearest_release_time(
                        datetime_data_ts)

                    if release_time >= validity and release_time < (validity + timedelta(days=1)):
                        print("---EXTENDED")
                        print("---DAY 1")
                        event_alert_id = current_event_alert_id

                    elif release_time >= (validity + timedelta(days=1)) and release_time < (validity + timedelta(days=2)):
                        print("---EXTENDED")
                        print("---DAY 2")
                        event_alert_id = current_event_alert_id

                    elif release_time >= (validity + timedelta(days=2)) and release_time < (validity + timedelta(days=3)):
                        print("---EXTENDED")
                        print("---DAY 3")
                        event_alert_id = current_event_alert_id

                    elif release_time >= (validity + timedelta(days=3)):
                        print("---END OF EXTENDED")
                        print("---LOWER FINALLY")

                        end_current_monitoring_event_alert(
                            current_event_alert_id, datetime_data_ts)
                        new_instance_details = {
                            "event_details": {
                                "site_id": site_id,
                                "event_start": datetime_data_ts,
                                "validity": None,
                                "status": 1
                            },
                            "event_alert_details": {
                                "pub_sym_id": pub_sym_id,
                                "ts_start": datetime_data_ts
                            }
                        }
                        instance_details = start_new_monitoring_instance(
                            new_instance_details)
                        event_alert_id = instance_details["event_alert_id"]
                        print("---event_alert_id---")

            # Append the chosen event_alert_id
            release_details["event_alert_id"] = event_alert_id
            # Update bulletin number
            release_details["bulletin_number"] = update_bulletin_number(
                site_id, 1)

            instance_details = {
                "site_id": site_id,
                "event_id": event_id,
                "alert_level": alert_level
            }

            insert_ewi_release(instance_details,
                               release_details, publisher_details, trigger_list_arr)

        elif entry_type == -1:
            print()
            print("Invalid!")
        else:
            raise Exception(
                "CUSTOM: Entry type specified in form is undefined. Check entry type options in the back-end.")

        # Get site selected and retrieve event status

        # If site is "event", check validity, check ts_end of event_alert, if ts_end is empty, then re - release
        # If site is "routine", then re - release
    except Exception as err:
        print(err)
        raise

    return "EWI Successfully inserted to DB"


###############
# CBEWS-L API #
###############
@MONITORING_BLUEPRINT.route("/monitoring/insert_cbewsl_ewi", methods=["POST"])
def insert_cbewsl_ewi():
    """
    This function formats the json data sent by CBEWS-L app and adds
    the remaining needed data to fit with the requirements of 
    the existing insert_ewi() api.

    Note: This API is required since, currently, there is a data size limit
    of which the CBEWS-L App can send via SMS.
    """
    json_data = request.get_json()
    alert_level = json_data["alert_level"]
    user_id = json_data["user_id"]
    data_ts = str(json_data["data_ts"])
    trigger_list_arr = []

    for trigger in json_data["trig_list"]:
        trigger_type = trigger["int_sym"]

        if trigger_type == "R":
            trigger_entry = {
                "internal_sym_id": 8,
                "ts": data_ts,
                "info": trigger["info"]
            }
            trigger_list_arr.append(trigger_entry)
        elif trigger_type in ["m", "M", "M0"]:
            moms_level_dict = {2: 13, 3: 7} # Always trigger entry from app. Either m or M only.
            remarks = trigger["remarks"]

            trigger_entry = {
                "internal_sym_id": moms_level_dict[alert_level],
                "consolidated_tech_info": remarks,
                "moms_details": {
                    "instance_id": -2,
                    "observance_ts": data_ts,
                    "reporter_id": user_id,
                    "remarks": remarks,
                    "report_narrative": remarks,
                    "validator_id": user_id,
                    "feature_name": trigger["f_name"],
                    "feature_type": trigger["f_type"]                    
                }
            }
            trigger_list_arr.append(trigger_entry)

    internal_json_data = {
        "entry_type": 2,  # 1
        "site_id": 50,
        "site_code": "umi",
        "alert_level": alert_level,
        "routine_sites_ids": [],
        "release_details": {
            "data_ts": data_ts,
            "trigger_list": "m",
            "release_time": str(datetime.now())
        },
        "publisher_details": {
            "publisher_mt_id": user_id,
            "publisher_ct_id": user_id,
        },
        "trigger_list_arr": trigger_list_arr
    }

    status = insert_ewi(internal_json_data)

    # return jsonify(internal_json_data)
    return status
