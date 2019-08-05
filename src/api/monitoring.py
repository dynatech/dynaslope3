"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
import time
from datetime import datetime, timedelta, time
from flask import Blueprint, jsonify, request
from connection import DB, SOCKETIO
from sqlalchemy import and_
from src.models.monitoring import (
    MonitoringEvents, MonitoringReleases, MonitoringEventAlerts,
    MonitoringReleasePublishers, MonitoringTriggers, MonitoringTriggersMisc,
    InternalAlertSymbols, MonitoringMomsReleases, BulletinTracker)
from src.models.monitoring import (
    MonitoringEventsSchema, MonitoringReleasesSchema, MonitoringEventAlertsSchema,
    InternalAlertSymbolsSchema)
from src.utils.narratives import (write_narratives_to_db)
from src.utils.monitoring import (
    get_monitoring_events, get_monitoring_releases,
    get_active_monitoring_events, get_current_monitoring_instance_per_site,
    compute_event_validity, round_to_nearest_release_time, get_pub_sym_id,
    write_monitoring_moms_to_db, write_monitoring_on_demand_to_db,
    write_monitoring_earthquake_to_db, get_internal_alert_symbols,
    get_monitoring_events_table, get_event_count, get_public_alert,
    get_ongoing_extended_overdue_events, update_alert_status)
from src.utils.extra import (create_symbols_map, var_checker,
                             retrieve_data_from_memcache)

#####################################################
# DYNAMIC Protocol Values starts here. For querying #
#####################################################
MAX_POSSIBLE_ALERT_LEVEL = 3  # Number of alert levels excluding zero
RELEASE_INTERVAL_HOURS = 4  # Every how many hours per release
ALERT_EXTENSION_LIMIT = 72  # Max hours total of 3 days
NO_DATA_HOURS_EXTENSION = 4 # Number of hours extended if no_data upon validity

MONITORING_BLUEPRINT = Blueprint("monitoring_blueprint", __name__)


@MONITORING_BLUEPRINT.route("/monitoring/retrieve_data_from_memcache", methods=["POST"])
def wrap_retrieve_data_from_memcache():
    json_data = request.get_json()

    table_name = json_data["table_name"]
    filters_dict = json_data["filters_dict"]
    retrieve_one = json_data["retrieve_one"]

    result = retrieve_data_from_memcache(table_name, filters_dict, retrieve_one)

    var_checker("RESULT", result, True)
    return_data = None
    if result:
        return_data = jsonify(result)
        # return_data = "SUCCESS"
    return return_data


@MONITORING_BLUEPRINT.route("/monitoring/update_alert_status", methods=["POST"])
def wrap_update_alert_status():
    json_data = request.get_json()
    
    status = update_alert_status(json_data)

    return status


@MONITORING_BLUEPRINT.route("/monitoring/get_internal_alert_symbols", methods=["GET"])
def wrap_get_internal_alert_symbols():
    """
    Returns  all alert symbols rows.
    """
    ias = get_internal_alert_symbols()

    return_data = []
    for alert_symbol, trigger_source in ias:
        ias_data = InternalAlertSymbolsSchema(
            exclude=("trigger",)).dump(alert_symbol).data
        ias_data["trigger_type"] = trigger_source
        return_data.append(ias_data)

    return jsonify(return_data)


# @MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events", methods=["GET"])
# @MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events/<event_id>", methods=["GET"])
# def wrap_get_monitoring_events(event_id=None):
#     """
#     NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
#     """
#     event = get_monitoring_events(event_id)
#     event_schema = MonitoringEventsSchema()

#     if event_id is None:
#         event_schema = MonitoringEventsSchema(many=True)

#     event_data = event_schema.dump(event).data

#     return jsonify(event_data)

@MONITORING_BLUEPRINT.route("/monitoring/get_site_public_alert", methods=["GET"])
def wrap_get_site_public_alert():
    site_id = request.args.get('site_id', default=1, type=int)
    return_data = get_public_alert(site_id)
    return return_data


@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events", methods=["GET"])
@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_events/<value>", methods=["GET"])
def wrap_get_monitoring_events(value=None):
    """
    NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    """
    filter_type = request.args.get('filter_type', default="event_id", type=str)

    return_data = []
    if filter_type == "event_id":
        event = get_monitoring_events(event_id=value)
        event_schema = MonitoringEventsSchema()

        if value is None:
            event_schema = MonitoringEventsSchema(many=True)

        return_data = event_schema.dump(event).data
    elif filter_type == "complete":
        offset = request.args.get('offset', default=0, type=int)
        limit = request.args.get('limit', default=5, type=int)

        return_data = get_monitoring_events_table(offset=offset, limit=limit)
    elif filter_type == "count":
        return_data = get_event_count()
    else:
        raise Exception(KeyError)

    return jsonify(return_data)


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


@MONITORING_BLUEPRINT.route("/monitoring/get_ongoing_extended_overdue_events", methods=["GET"])
def wrap_get_ongoing_extended_overdue_events():
    """
    Gets active events and organizes them into the following categories:
        (a) Ongoing
        (b) Extended
        (c) Overdue
    For use in alerts_from_db in Candidate Alerts Generator
    """
    ongoing_events = get_ongoing_extended_overdue_events()

    return_data = []
    if ongoing_events:
        return_data = json.dumps(ongoing_events)

    return return_data


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


def write_monitoring_moms_releases_to_db(moms_id, trig_misc_id=None, release_id=None):
    """
    Writes a record that links trigger_misc and the moms report.

    Args:
        trig_misc_id (Int)
        moms_id (Int)

    Returns nothing for now since there is no use for it's moms_release_id.
    """
    try:
        if trig_misc_id:
            moms_release = MonitoringMomsReleases(
                trig_misc_id=trig_misc_id,
                moms_id=moms_id
            )
        elif release_id:
            moms_release = MonitoringMomsReleases(
                release_id=release_id,
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
                alert_symbol = get_internal_alert_symbols(internal_sym_id)
                is_rain_surficial_sub_trigger = is_rain_surficial_subsurface_trigger(
                    alert_symbol)
                moms_id_list = []

                internal_sym_id = trigger["internal_sym_id"]
                info = trigger["info"]
                timestamp = trigger["ts"]

                if alert_symbol in ["M", "m"]:
                    print("---MOMS---")
                    try:
                        # NOTE: If there are pre-inserted moms, get the id and use it here.
                        moms_id_list = trigger["moms_id_list"]
                    except:
                        moms_list = trigger["moms_list"]

                        for moms in moms_list:
                            moms["internal_sym_id"] = internal_sym_id # Will be used for op_trigger of moms
                            moms_id = write_monitoring_moms_to_db(
                                moms, site_id, event_id)
                            moms_id_list.append(moms_id)

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
                        for moms_id in moms_id_list:
                            write_monitoring_moms_releases_to_db(moms_id, trig_misc_id=trig_misc_id)

        if non_triggering_moms:
            for non_trig_moms in non_triggering_moms:
                try:
                    moms_id = non_trig_moms["moms_id"]
                    print(
                        f"Existing non-triggering MOMS given. ID is: {moms_id}")
                except:
                    moms_list = non_trig_moms["moms_list"]

                    for moms in moms_list:
                        moms_details = moms["moms_details"]
                        moms_details["internal_sym_id"] = internal_sym_id
                        write_monitoring_moms_to_db(
                            moms_details, site_id, event_id)
                    print(f"New non-triggering MOMS written. ID is: {moms_id}")
                
                write_monitoring_moms_releases_to_db(moms_id, release_id=release_id)
                

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
        
        global MAX_POSSIBLE_ALERT_LEVEL
        global ALERT_EXTENSION_LIMIT
        global NO_DATA_HOURS_EXTENSION

        max_possible_alert_level = MAX_POSSIBLE_ALERT_LEVEL
        alert_extension_limit = ALERT_EXTENSION_LIMIT
        no_data_hours_extension = NO_DATA_HOURS_EXTENSION

        # Entry-related variables from JSON
        try:
            site_id = json_data["site_id"]
            is_not_routine = True
        except KeyError:
            site_id_list = json_data["routine_sites_ids"]
            entry_type = 1
            is_not_routine = False

        if is_not_routine:
            try:
                alert_level = json_data["alert_level"]
                release_details = json_data["release_details"]
                datetime_data_ts = datetime.strptime(release_details["data_ts"], "%Y-%m-%d %H:%M:%S")

                entry_type = 1  # Automatic, if entry_type 1, Mass ROUTINE Release
                site_monitoring_instance = get_current_monitoring_instance_per_site(
                    site_id)
                
                if site_monitoring_instance:
                    site_status = site_monitoring_instance.status

                    is_site_under_extended = site_status == 2 and site_monitoring_instance.validity < datetime_data_ts

                    if site_status == 1 and alert_level > 0:
                        # ONSET: Current status is routine and inserting an A1+ alert.
                        print("ONSET")
                        entry_type = 2
                    # if current site is under extended and a new higher alert is released (hence new monitoring event)
                    elif is_site_under_extended and alert_level > 0:
                        entry_type = 2
                        site_status = 1 # this is necessary to make new monitoring event
                    else:
                        # A1+ active on site
                        entry_type = 2
            except Exception as err:
                print(err)
                raise

        # Release-related variables from JSON
        release_details = json_data["release_details"]
        publisher_details = json_data["publisher_details"]
        trigger_list_arr = json_data["trigger_list_arr"]
        non_triggering_moms = []
        try:
            non_triggering_moms = json_data["non_triggering_moms"]
        except KeyError:
            pass
        except Exception as err:
            print(err)
            raise

        datetime_data_ts = datetime.strptime(
            release_details["data_ts"], "%Y-%m-%d %H:%M:%S")

        release_details["data_ts"] = datetime_data_ts

        ##########################
        # ROUTINE or EVENT entry #
        ##########################
        if entry_type == 1:  # stands for routine
            # Mass release for routine sites.
            print("--- It's a routine ---")

            for routine_site_id in site_id_list:
                site_monitoring_instance = get_current_monitoring_instance_per_site(
                    routine_site_id)
                site_status = site_monitoring_instance.status

                if site_status == 1:
                    release_details["event_alert_id"] = site_monitoring_instance.event_alerts.order_by(
                        DB.desc(MonitoringEventAlerts.event_alert_id)).first().event_alert_id
                    release_details["bulletin_number"] = update_bulletin_number(
                        routine_site_id, 1)

                    instance_details = {
                        "site_id": routine_site_id,
                        "event_id": site_monitoring_instance.event_id
                    }

                    insert_ewi_release(instance_details,
                                       release_details, publisher_details, non_triggering_moms=non_triggering_moms)
                else:
                    print("Not a routine site")

        elif entry_type == 2:  # stands for event
            print("--- It's an event ---")

            current_event_alert = site_monitoring_instance.event_alerts.order_by(
                DB.desc(MonitoringEventAlerts.event_alert_id)).first()
            pub_sym_id = get_pub_sym_id(alert_level)

            if alert_level > 0 and alert_level < max_possible_alert_level:
            # if alert_level in [1, 2, 3]:
                validity = compute_event_validity(
                    datetime_data_ts, alert_level)
            else:
                validity = site_monitoring_instance.validity

            try:
                validity = json_data["cbewsl_validity"]
            except:
                pass

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
                print("---event_alert_id---")
                print(event_alert_id)

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
                print("---event_alert_id---")
                print(event_alert_id)

                # Raising.
                # NOTE: LOUIE change max alert level here
                if pub_sym_id > current_event_alert.pub_sym_id and pub_sym_id <= (max_possible_alert_level + 1):
                # if pub_sym_id > current_event_alert.pub_sym_id and pub_sym_id <= 4:
                    # Now that you created a new event
                    print("---RAISING")
                    update_event_validity(validity, event_id)

                    end_current_monitoring_event_alert(
                        current_event_alert_id, datetime_data_ts)
                    event_alert_id = write_monitoring_event_alert_to_db(
                        event_alert_details)
                    print("---event_alert_id---")
                    print(event_alert_id)

                elif pub_sym_id == current_event_alert.pub_sym_id:
                    # NOTE: LOUIE, handle no data extension here!
                    # ALSO, need to find a way to identify the no_data extension limit 
                    # and how to know you are reaching the limit
                    new_validity = current_event_alert.event.validity + timedelta(hours=no_data_hours_extension)
                    update_event_validity(new_validity, event_id)

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

                    # NOTE: LOUIE change timedelta to dynamic
                    elif release_time >= (validity + timedelta(hours=alert_extension_limit)):
                    # elif release_time >= (validity + timedelta(days=3)):
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
                        print(event_alert_id)

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
                               release_details, publisher_details, trigger_list_arr, non_triggering_moms=non_triggering_moms)

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
@MONITORING_BLUEPRINT.route("/monitoring/get_latest_cbewls_release/<site_id>", methods=["GET"])
def get_latest_cbewsl_ewi(site_id):
    """
    This function returns minimal details of the
    latest release for the application.

    """
    site_event = get_current_monitoring_instance_per_site(site_id)

    latest_event_alert = site_event.event_alerts.order_by(
        DB.desc(MonitoringEventAlerts.ts_start)).first()
    latest_release = latest_event_alert.releases.order_by(
        DB.desc(MonitoringReleases.data_ts)).first()
    # Only one publisher needed for cbewsl
    release_publishers = latest_release.release_publishers.first()
    triggers = latest_release.triggers.all()

    simple_triggers = []
    try:
        for trigger in triggers:
            trigger_dict = {
                "int_sym": trigger.internal_sym.alert_symbol,
                "info": trigger.info,
                "ts": str(datetime.strftime(trigger.ts, "%Y-%m-%d %H:%M:%S"))
            }

            if trigger.internal_sym.alert_symbol in ["m", "M", "M0"]:
                moms_releases_list = trigger.trigger_misc.moms_releases.all()

                moms_releases_min_list = []
                for release in moms_releases_list:
                    instance = release.moms_details.moms_instance

                    moms_releases_min_list.append({
                        "f_name": instance.feature_name,
                        "f_type": instance.feature.feature_type
                    })

                trigger_dict["moms_list"] = moms_releases_min_list

            simple_triggers.append(trigger_dict)
    except:
        raise

    minimal_data = {
        "alert_level": latest_event_alert.public_alert_symbol.alert_level,
        "alert_validity": str(datetime.strftime(site_event.validity, "%Y-%m-%d %H:%M:%S")),
        "data_ts": str(datetime.strftime(latest_release.data_ts, "%Y-%m-%d %H:%M:%S")),
        "user_id": release_publishers.user_id,
        "trig_list": simple_triggers
    }

    return jsonify(minimal_data)


@MONITORING_BLUEPRINT.route("/monitoring/insert_cbewsl_ewi", methods=["POST"])
def insert_cbewsl_ewi():
    """
    This function formats the json data sent by CBEWS-L app and adds
    the remaining needed data to fit with the requirements of
    the existing insert_ewi() api.

    Note: This API is required since, currently, there is a data size limit
    of which the CBEWS-L App can send via SMS.
    """
    try:
        json_data = request.get_json()
        alert_level = json_data["alert_level"]
        user_id = json_data["user_id"]
        data_ts = str(datetime.strptime(
            json_data["data_ts"], "%Y-%m-%d %H:%M:%S"))
        trigger_list_arr = []

        moms_level_dict = {2: 13, 3: 7}
        moms_trigger = {
            "internal_sym_id": moms_level_dict[alert_level],
            "info": "",
            "moms_list": []
        }

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
                # Always trigger entry from app. Either m or M only.
                c_t_info = moms_trigger["info"]
                feature_name = trigger["f_name"]
                feature_type = trigger["f_type"]
                remarks = trigger["remarks"]
                moms_trigger["info"] = f"[{feature_type}] {feature_name} - {remarks} {c_t_info}"
                moms_obs = {
                    "observance_ts": data_ts,
                    "reporter_id": user_id,
                    "remarks": remarks,
                    "report_narrative": f"[{feature_type}] {feature_name} - {remarks}",
                    "validator_id": user_id,
                    "instance_id": None,
                    "feature_name": trigger["f_name"],
                    "feature_type": trigger["f_type"]
                }
                moms_trigger["moms_list"].append(moms_obs)

        if moms_trigger["moms_list"]:
            trigger_list_arr.append(moms_trigger)

        release_time = datetime.strftime(datetime.now(), "%Y-%m-%d %H:%M:%S")

    except:
        DB.session.rollback()
        raise

    internal_json_data = {
        "entry_type": 2,  # 1
        "site_id": 50,
        "site_code": "umi",
        "alert_level": alert_level,
        "cbewsl_validity": json_data["alert_validity"],
        "release_details": {
            "data_ts": data_ts,
            "trigger_list": "m",
            "release_time": release_time
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
