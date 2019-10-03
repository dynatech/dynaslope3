"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
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
    get_ongoing_extended_overdue_events, update_alert_status,
    get_max_possible_alert_level, format_candidate_alerts_for_insert,
    round_down_data_ts)
from src.utils.extra import (create_symbols_map, var_checker,
                             retrieve_data_from_memcache, get_process_status_log,
                             get_system_time)
from src.experimental_scripts import public_alert_generator
from src.experimental_scripts import candidate_alerts_generator


MONITORING_BLUEPRINT = Blueprint("monitoring_blueprint", __name__)

#####################################################
# DYNAMIC Protocol Values starts here. For querying #
#####################################################
# Number of alert levels excluding zero
MAX_POSSIBLE_ALERT_LEVEL = get_max_possible_alert_level()

# Max hours total of 3 days
ALERT_EXTENSION_LIMIT = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "ALERT_EXTENSION_LIMIT"}, retrieve_attr="var_value")
# Number of hours extended if no_data upon validity
NO_DATA_HOURS_EXTENSION = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "NO_DATA_HOURS_EXTENSION"}, retrieve_attr="var_value")


@MONITORING_BLUEPRINT.route("/monitoring/format_candidate_alerts_for_insert", methods=["POST"])
def wrap_format_candidate_alerts_for_insert():
    json_data = request.get_json()

    insert_ewi_data = format_candidate_alerts_for_insert(json_data)

    return jsonify(insert_ewi_data)


@MONITORING_BLUEPRINT.route("/monitoring/retrieve_data_from_memcache", methods=["POST"])
def wrap_retrieve_data_from_memcache():
    json_data = request.get_json()

    table_name = json_data["table_name"]
    filters_dict = json_data["filters_dict"]
    retrieve_one = json_data["retrieve_one"]

    result = retrieve_data_from_memcache(
        table_name, filters_dict, retrieve_one)

    return_data = None
    if result:
        return_data = jsonify(result)
        # return_data = "SUCCESS"
    return return_data


@MONITORING_BLUEPRINT.route("/monitoring/update_alert_status", methods=["POST"])
def wrap_update_alert_status():
    """
    """

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


@MONITORING_BLUEPRINT.route("/monitoring/get_site_public_alert", methods=["GET"])
def wrap_get_site_public_alert():
    site_id = request.args.get('site_id', default=1, type=int)
    return_data = get_public_alert(site_id).alert_symbol
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
        include_count = request.args.get(
            "include_count", default="false", type=str)
        site_ids = request.args.getlist("site_ids", type=int)
        entry_types = request.args.getlist("entry_types", type=int)
        status = request.args.get("status", type=str)
        search = request.args.get("search", default="", type=str)

        include_count = True if include_count.lower() == "true" else False

        # return_data = get_monitoring_events_table(offset, limit)
        return_data = get_monitoring_events_table(offset, limit, site_ids, entry_types, include_count, search, status)
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
    ongoing_events = get_ongoing_extended_overdue_events() # pakibura

    return_data = []
    if ongoing_events:
        return_data = json.dumps(ongoing_events, indent=4)

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
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise


def write_monitoring_event_to_db(event_details):
    """
    Writes to DB all event details
    Args:
        event_details (dict)
            site_id (int), event_start (
                datetime), validity (datetime), status  (int)

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

        # DB.session.commit()

        new_event_id = new_event.event_id
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    # return new_event_id
    return new_event


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
        # DB.session.commit()

        new_ea_id = new_ea.event_alert_id
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    # return new_ea_id
    return new_ea


def start_new_monitoring_instance(new_instance_details):
    """
    Initiates a new monitoring instance

    Args:
        new_instance_details (dict) - contains event_details (dict) and event_alert_details (dict)

    Returns event alert ID for use in releases
    """
    try:
        event_details = new_instance_details["event_details"]
        event_alert_details = new_instance_details["event_alert_details"]

        event = write_monitoring_event_to_db(event_details)

        event_alert_details["event_id"] = event.event_id
        event_alert = write_monitoring_event_alert_to_db(
            event_alert_details)

        returns = {
            "event": event,
            "event_alert": event_alert
        }

    except Exception as err:
        DB.session.rollback()
        print("Problem is start new monitoring")
        print(err)
        raise

    return returns


def write_monitoring_release_to_db(release_details):
    """
    Returns release_id
    """
    try:
        new_release = MonitoringReleases(
            event_alert_id=release_details["event_alert_id"],
            data_ts=release_details["data_ts"],
            trigger_list=release_details["trigger_list_str"],
            release_time=release_details["release_time"],
            bulletin_number=release_details["bulletin_number"],
            comments=release_details["comments"]
        )
        DB.session.add(new_release)
        DB.session.flush()
        # DB.session.commit()

        new_release_id = new_release.release_id

    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    print(f"{datetime.now()} | Monitoring Release written with ID: {new_release_id}")

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
        # DB.session.commit()

        new_publisher_id = new_publisher.publisher_id

    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    print(f"{datetime.now()} | {role.upper()} Release Publisher written with ID: {new_publisher_id}")

    return new_publisher_id


def write_monitoring_release_triggers_to_db(trigger_details, new_release_id):
    """
    Write triggers to the database one by one. Must be looped if needed.

    Args:
        trigger_details (dict)
        new_release_id (int)

    Returns trigger_id (possibly appended to a list to the owner function)
    """
    print(f"{datetime.now()} | Writing Monitoring Release Trigger...")
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
        # DB.session.commit()

        new_trigger_id = new_trigger.trigger_id

        print(f"{datetime.now()} | New Monitoring Release Trigger: {new_trigger_id}")
    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    print(f"{datetime.now()} | Monitoring Trigger written with ID: {new_trigger_id}")

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
        # DB.session.commit()

        new_trig_misc_id = trigger_misc.trig_misc_id
    except Exception as err:
        print(err)
        raise

    print(f"{datetime.now()} | Monitoring Triggers Misc written with ID: {new_trig_misc_id}")

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
        DB.session.flush()
        # DB.session.commit()
    except Exception as err:
        print(err)
        raise

    print(f"{datetime.now()} | Monitoring Moms Releases written")
    var_checker("moms_release", moms_release, True)


def get_moms_id_list(moms_dictionary, site_id, event_id):
    """
    Retrieves the moms ID list from the given list of MonitoringMOMS
    Retrieves IDs from front-end if MonitoringMOMS entry is already
    in the database or writes to the database if not yet in DB.

    Args:
        moms_dictionary (Dictionary) -> Either triggering moms dictionary or
                        non-triggering moms dictionary

    Returns list of moms_ids
    """

    moms_id_list = []
    has_moms_ids = True
    try:
        # NOTE: If there are pre-inserted moms, get the id and use it here.
        moms_id_list = moms_dictionary["moms_id_list"]
    except:
        has_moms_ids = False
        pass

    try:
        moms_list = moms_dictionary["moms_list"]

        for moms in moms_list:
            moms_id = write_monitoring_moms_to_db(
                moms, site_id, event_id)
            moms_id_list.append(moms_id)
    except KeyError as err:
        print(err)
        if not has_moms_ids:
            raise Exception("No MOMS entry")
        pass

    return moms_id_list


def is_rain_surficial_subsurface_trigger(alert_symbol):
    flag = False
    if alert_symbol in ["R", "S", "s", "G", "g"]:
        flag = True

    return flag


def update_event_validity(new_validity, event_id):
    """
    Adjust validity
    """
    try:
        event = MonitoringEvents.query.filter(
            MonitoringEvents.event_id == event_id).first()
        event.validity = new_validity
        # DB.session.commit()
    except Exception as err:
        print(err)
        raise


# @MONITORING_BLUEPRINT.route("/monitoring/insert_ewi_release", methods=["POST"])


# # def insert_ewi_release(release_details, publisher_details, trigger_details):
def insert_ewi_release(monitoring_instance_details, release_details, publisher_details, trigger_list_arr=None, non_triggering_moms=None):
    """
    Initiates the monitoring_release write to db plus it's corresponding details.
    """
    try:
        print("")

        var_checker("trigger_list_arr", trigger_list_arr, True)
        new_release = write_monitoring_release_to_db(release_details)
        release_id = new_release
        site_id = monitoring_instance_details["site_id"]
        event_id = monitoring_instance_details["event_id"]
        public_alert_level = monitoring_instance_details["public_alert_level"]

        write_monitoring_release_publishers_to_db(
            "mt", publisher_details["publisher_mt_id"], release_id)

        write_monitoring_release_publishers_to_db(
            "ct", publisher_details["publisher_ct_id"], release_id)

        if trigger_list_arr:
            # latest_trigger = sorted(trigger_list_arr, key=lambda x: x["ts_updated"], reverse=True)[0]

            latest_trigger_ts_updated = None
            # The following could should be in a foreach so we can handle list of triggers
            for trigger in trigger_list_arr:
                trigger_type = trigger["trigger_type"]
                internal_sym_id = trigger["internal_sym_id"]
                info = trigger["tech_info"]
                timestamp = datetime.strptime(
                    trigger["ts_updated"], "%Y-%m-%d %H:%M:%S")

                if trigger_type == "on demand":
                    od_details = trigger["od_details"]
                    request_ts = datetime.strptime(
                        od_details["request_ts"], "%Y-%m-%d %H:%M:%S")
                    narrative = od_details["narrative"]
                    info = narrative
                    timestamp = request_ts

                    od_details["narrative_id"] = write_narratives_to_db(
                        site_id, request_ts, narrative, event_id)

                    od_id = write_monitoring_on_demand_to_db(od_details)
                    eq_id = None
                    has_moms = False

                elif trigger_type == "earthquake":
                    info = ""
                    timestamp = release_details["data_ts"]
                    od_id = None
                    eq_id = write_monitoring_earthquake_to_db(
                        trigger["eq_details"])
                    has_moms = False

                elif trigger_type == "moms":

                    moms_id_list = get_moms_id_list(trigger, site_id, event_id)

                    od_id = None
                    eq_id = None
                    has_moms = True

                trigger_details = {
                    "release_id": release_id,
                    "info": info,
                    "ts": timestamp,
                    "internal_sym_id": internal_sym_id
                }

                new_trigger_id = write_monitoring_release_triggers_to_db(
                    trigger_details, release_id)

                if trigger_type in ["on demand", "earthquake", "moms"]:
                    trig_misc_id = write_monitoring_triggers_misc_to_db(
                        new_trigger_id, has_moms, od_id, eq_id)

                    if trigger_type == "moms":
                        for moms_id in moms_id_list:
                            write_monitoring_moms_releases_to_db(
                                moms_id, trig_misc_id=trig_misc_id)

                # Get the latest trigger timestamp to be used for
                # computing validity
                try:
                    if latest_trigger_ts_updated < timestamp:
                        latest_trigger_ts_updated = timestamp
                except:
                    latest_trigger_ts_updated = timestamp

            # UPDATE VALIDITY
            # NOTE: For CBEWS-L, a flag should be used here
            # so this will be ignored when CBEWS-L provided it's own validity
            validity = compute_event_validity(
                latest_trigger_ts_updated, public_alert_level)
            print(f"{datetime.now()} | Updating validity. New validity: {validity}")
            update_event_validity(validity, event_id)

        if non_triggering_moms:
            moms_id_list = get_moms_id_list(
                non_triggering_moms, site_id, event_id)

            for moms_id in moms_id_list:
                write_monitoring_moms_releases_to_db(
                    moms_id, release_id=release_id)

        # WHEN NOTHING GOES WRONG, COMMIT!
        DB.session.commit()
    except Exception as err:
        DB.session.rollback()
        print(err)
        raise


def start_alert_on_fresh_db(public_alert_level, site_id, datetime_data_ts):
    """
    Starts the monitoring cycle for the site by writing the starting
    monitoring values to DB.
    """
    print("No existing alert on DB. Starting fresh.")
    pub_sym_id = get_pub_sym_id(public_alert_level)
    # Set validity as None for now.
    new_instance_details = {
        "event_details": {
            "site_id": site_id,
            "event_start": datetime_data_ts,
            "validity": None,
            "status": 2
        },
        "event_alert_details": {
            "pub_sym_id": pub_sym_id,
            "ts_start": datetime_data_ts
        }
    }

    try:
        instance_details = start_new_monitoring_instance(
            new_instance_details)

    except Exception as err:
        print("Problem in onset alert (fresh db)")
        print(err)
        raise

    return instance_details


@MONITORING_BLUEPRINT.route("/monitoring/insert_ewi", methods=["POST"])
def insert_ewi(internal_json=None):
    """
    Inserts an "event" with specified type to the DB.
    Entry type is either event or routine. If the existing type is the same with the new one,
    it means re-release.
    If it is different, create a new event.
    """
    return_data = None

    print(get_process_status_log("insert", "start"))

    try:
        ############################
        # Variable Initializations #
        ############################
        if internal_json:
            json_data = internal_json
        else:
            json_data = request.get_json()

        var_checker("INSERT EWI DATA", json_data, True)

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

        is_overdue = False
        try:
            is_overdue = json_data["is_overdue"]
        except KeyError:
            pass

        # Release-related variables from JSON
        release_details = json_data["release_details"]
        publisher_details = json_data["publisher_details"]
        trigger_list_arr = json_data["trigger_list_arr"]

        non_triggering_moms = json_data["non_triggering_moms"]

        data_ts = release_details["data_ts"]
        # var_checker("data_ts", data_ts, True)
        if isinstance(data_ts, str):
            datetime_data_ts = datetime.strptime(
                release_details["data_ts"], "%Y-%m-%d %H:%M:%S")
        else:
            datetime_data_ts = data_ts

        release_details["data_ts"] = data_ts
        public_alert_level = json_data["public_alert_level"]

        if is_not_routine:
            try:
                entry_type = 1  # Automatic, if entry_type 1, Mass ROUTINE Release
                site_monitoring_instance = get_current_monitoring_instance_per_site(
                    site_id)

                if site_monitoring_instance:
                    site_status = site_monitoring_instance.status

                    is_site_under_extended = site_status == 2 and site_monitoring_instance.validity < datetime_data_ts

                    if site_status == 1 and public_alert_level > 0:
                        # ONSET: Current status is routine and inserting an A1+ alert.
                        entry_type = 2
                    # if current site is under extended and a new higher alert is released (hence new monitoring event)
                    elif is_site_under_extended and public_alert_level > 0:
                        entry_type = 2
                        site_status = 1  # this is necessary to make new monitoring event
                    elif site_status == 1 and public_alert_level == 0:
                        # Is currently routine
                        site_id_list = [site_id]
                        entry_type = 1
                    else:
                        # A1+ active on site
                        entry_type = 2

                    is_fresh_data = False
                else:
                    # No alert on site. ONSET
                    entry_type = 2
                    is_fresh_data = True
                    instance_details = start_alert_on_fresh_db(
                        public_alert_level, site_id, datetime_data_ts)
                    site_monitoring_instance = instance_details["event"]
                    site_status = site_monitoring_instance.status
                    is_site_under_extended = False
            except Exception as err:
                print(err)
                raise

        # SPECIAL CODE FOR CBEWSL OVERDUE
        if is_overdue:
            print()
            print("RELEASING OVERDUE!")
            print()
            site_status = 2

        ##########################
        # ROUTINE or EVENT entry #
        ##########################
        if entry_type == 1:  # stands for routine
            # Mass release for routine sites.

            for routine_site_id in site_id_list:
                # The following lines of code: "site_monitoring_instance..." up
                # to "if site_status == 1:..." is just a fail-safe used
                # for making sure that the site is not on alert.
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
                        "event_id": site_monitoring_instance.event_id,
                        "public_alert_level": public_alert_level
                    }

                    site_non_trig_moms = {}
                    try:
                        site_non_trig_moms = non_triggering_moms[site_id]
                    except KeyError:
                        pass

                    insert_ewi_release(instance_details,
                                       release_details, publisher_details, non_triggering_moms=site_non_trig_moms)
                else:
                    print("Not a routine site")

        elif entry_type == 2:  # stands for event
            if is_fresh_data:
                current_event_alert = instance_details["event_alert"]
            else:
                current_event_alert = site_monitoring_instance.event_alerts.order_by(
                    DB.desc(MonitoringEventAlerts.event_alert_id)).first()
            # pub_sym_id = get_pub_sym_id(public_alert_level)
            pub_sym_id = retrieve_data_from_memcache("public_alert_symbols", {
                                                     "alert_level": public_alert_level}, retrieve_attr="pub_sym_id")

            validity = site_monitoring_instance.validity
            try:
                validity = json_data["cbewsl_validity"]
            except:
                pass

            # Default checks if not event i.e. site_status != 2
            if is_new_monitoring_instance(2, site_status):
                print("NEW INSTANCE")
                # If the values are different, means new monitoring instance will be created
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
                event_id = instance_ids["event"].event_id
                event_alert_id = instance_ids["event_alert"].event_alert_id

            else:
                print("OLD INSTANCE")
                # If the values are same, re-release will happen.
                event_id = current_event_alert.event_id
                event_alert_details = {
                    "event_id": event_id,
                    "pub_sym_id": pub_sym_id,
                    "ts_start": datetime_data_ts
                }
                current_event_alert_id = current_event_alert.event_alert_id

                event_alert_id = current_event_alert_id

                # Raising from lower alert level e.g. A1->A2->A3->etc.
                # NOTE: LOUIE change max alert level here
                if pub_sym_id > current_event_alert.pub_sym_id and pub_sym_id <= (max_possible_alert_level + 1):
                    # if pub_sym_id > current_event_alert.pub_sym_id and pub_sym_id <= 4:
                    # Now that you created a new event
                    print("---RAISING")

                    end_current_monitoring_event_alert(
                        current_event_alert_id, datetime_data_ts)
                    event_alert_id = write_monitoring_event_alert_to_db(
                        event_alert_details).event_alert_id

                elif pub_sym_id == current_event_alert.pub_sym_id and current_event_alert.event.validity == datetime_data_ts + timedelta(minutes=30) or is_overdue:
                    # This extends the validity of the event in cases where
                    # no ground data is available.
                    try:
                        to_extend_validity = json_data["to_extend_validity"]

                        if to_extend_validity:
                            # Just a safety measure in case we attached a False
                            # in Front-End
                            # NOTE: SHOULD BE ATTACHED VIA FRONT-END??
                            print(
                                f"{datetime.now()} | NO GROUND DATA? Updating validity. New validity: {validity}")
                            new_validity = current_event_alert.event.validity + \
                                timedelta(hours=no_data_hours_extension)
                            if is_overdue:
                                new_validity = round_to_nearest_release_time(datetime_data_ts) + \
                                    timedelta(hours=no_data_hours_extension)
                            update_event_validity(new_validity, event_id)

                    except:
                        pass
                    
                # Lowering.
                elif pub_sym_id == 1:
                    print("---LOWERING")
                    release_time = round_to_nearest_release_time(
                        datetime_data_ts)

                    var_checker("release_time", release_time, True)
                    var_checker("validity", validity, True)

                    if release_time == validity:
                        # End of Heightened Alert
                        end_current_monitoring_event_alert(
                            current_event_alert_id, datetime_data_ts)

                        event_alert_details = {
                            "event_id": event_id,
                            "pub_sym_id": pub_sym_id,
                            "ts_start": datetime_data_ts
                        }
                        event_alert_id = write_monitoring_event_alert_to_db(
                            event_alert_details).event_alert_id

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
                        event_alert_id = instance_details["event_alert"].event_alert_id

            # Append the chosen event_alert_id
            release_details["event_alert_id"] = event_alert_id
            # Update bulletin number
            release_details["bulletin_number"] = update_bulletin_number(
                site_id, 1)

            instance_details = {
                "site_id": site_id,
                "event_id": event_id,
                "public_alert_level": public_alert_level
            }

            insert_ewi_release(instance_details,
                               release_details, publisher_details, trigger_list_arr, non_triggering_moms=non_triggering_moms)

        elif entry_type == -1:
            print()
            print("Invalid!")
        else:
            raise Exception(
                "CUSTOM: Entry type specified in form is undefined. Check entry type options in the back-end.")

        print(f"{get_system_time()} | Insert EWI Successful!")
        return_data = "success"
    except Exception as err:
        print(f"{get_system_time()} | Insert EWI FAILED!")
        print(err)
        raise

    return return_data


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


@MONITORING_BLUEPRINT.route("/monitoring/insert_cbewsl_moms_ewi_web2", methods=["POST"])
def insert_cbewsl_moms():
    """
    This function is a revision from the below commented insert_cbewsl_ewi. 
    Since the community will no more send alerts via SMS, and will only use the web.
    """
    try:
        json_data = request.get_json()
        var_checker("JSON DATA FROM INSERT_CBEWSL_MOMS", json_data, True)
        public_alert_level = int(json_data["alert_level"])
        public_alert_symbol = retrieve_data_from_memcache(
            "public_alert_symbols", {"alert_level": public_alert_level}, retrieve_attr="alert_symbol")
        user_id = json_data["user_id"]
        data_ts = json_data["data_ts"]
        observance_ts = json_data["observance_ts"]
        run_status = ""
        non_triggering_moms = {}
        non_trig_moms_list = []
        trigger_list_arr = []

        # NOTE: With the assumption that surficial "RAISE" button always send
        # one and only one trigger
        trigger = json_data["trig_list"][0]
        feature_name = trigger["f_name"]
        feature_type = trigger["f_type"]
        remarks = trigger["remarks"]

        moms_obs = {
            "observance_ts": observance_ts,
            "reporter_id": user_id,
            "remarks": remarks,
            "report_narrative": f"[{feature_type}] {feature_name} - {remarks}",
            "validator_id": user_id,
            "instance_id": None,
            "feature_name": feature_name,
            "feature_type": feature_type,
            "op_trigger": public_alert_level
        }

        current_monitoring_instance = get_current_monitoring_instance_per_site(
            site_id=50)
        event_id = None
        if current_monitoring_instance:
            event_id = current_monitoring_instance.event_id
        try:
            moms_id = write_monitoring_moms_to_db(moms_obs, 50, event_id)
            DB.session.commit()
            print(f"Insert MOMS Success with ID: {moms_id}")
            run_status += "MOMS HAS BEEN INSERTED. "
        except Exception as err:
            print(err)
            raise
        
        if public_alert_level == 0:
            non_trig_moms_list.append(moms_id)
            non_triggering_moms["moms_id_list"] = non_trig_moms_list
        else:
            ##############################
            # PREPARE TRIGGER_LIST_ARRAY
            int_sym = trigger["int_sym"]
            ots_row = retrieve_data_from_memcache(
                "operational_trigger_symbols", {"alert_symbol": int_sym})
            try:
                internal_sym_id = ots_row["internal_alert_symbol"]["internal_sym_id"]
            except TypeError:
                internal_sym_id = None

            trigger_alert_level = ots_row["alert_level"]
            trigger_alert_symbol = ots_row["alert_symbol"]
            source_id = ots_row["source_id"]
            trigger_source = ots_row["trigger_hierarchy"]["trigger_source"]

            trigger_entry = {
                "trigger_type": "moms",
                "source_id": source_id,
                "alert_level": trigger_alert_level,
                "trigger_id": None,
                "alert": trigger_alert_symbol,
                "ts_updated": observance_ts,
                "internal_sym_id": internal_sym_id
            }            

            moms_trigger = {
                **trigger_entry,
                "tech_info": f"[{feature_type}] {feature_name} - {remarks}",
                "moms_id_list": [moms_id]
            }

            trigger_list_arr.append(moms_trigger)
        
        ###############################
        # GET THE CURRENT ALERT LEVEL #
        ###############################
        current_alert = get_public_alert(site_id=50)
        if current_alert:
            raised_alert_level = current_alert.alert_level
        else:
            raised_alert_level = 0

        # RUN ALERT GEN TO GET THE LATEST DATA INSERTED
        # if not op_trigger == 0: # if not is_raised or is_heightened
        if public_alert_level > raised_alert_level:
            try:
                release_time = datetime.now().time()

                internal_json_data = {
                    "site_id": 50,
                    "site_code": "umi",
                    "public_alert_level": public_alert_level,
                    "public_alert_symbol": public_alert_symbol,
                    "cbewsl_validity": json_data["alert_validity"],
                    "release_details": {
                        "data_ts": data_ts,
                        "trigger_list_str": "m",
                        "release_time": release_time,
                        "comments": ""
                    },
                    "non_triggering_moms": non_triggering_moms,
                    "publisher_details": {
                        "publisher_mt_id": user_id,
                        "publisher_ct_id": user_id,
                    },
                    "trigger_list_arr": trigger_list_arr
                }


                var_checker("internal_json_data", internal_json_data, True)                
                run_status = insert_ewi(internal_json_data)                
                # generated_alert = public_alert_generator.main(site_code="umi", is_instantaneous=True)
                # generated_alert = json.loads(generated_alert)
                # var_checker("generated_alert", generated_alert, True)
                # candidate = candidate_alerts_generator.main(generated_alerts_list=generated_alert)
                # var_checker("candidate", candidate, True)
                # candidate = json.loads(candidate)
                # if candidate:
                #     print("#### CANDIDATE GENERATED")
                #     formatted_candidate = format_candidate_alerts_for_insert(candidate[0])
                #     status = insert_ewi(formatted_candidate)
                #     run_status += "Candidate Release also has been inserted. "
                # else:
                #     print("#### NO CANDIDATE GENERATED")
                #     run_status += "NO candidate inserted. "

            except Exception as err:
                # print("PROBLEM IN ALERT GEN IN CBEWS MOMS INSERT")
                print(err)
                raise
        else:
            run_status = "no ewi released"

    except Exception as err:
        var_checker("THERE IS AN ERROR IN CBEWS MOMS", err, True)
        raise

    return run_status


@MONITORING_BLUEPRINT.route("/monitoring/insert_cbewsl_moms_ewi_web", methods=["POST"])
def insert_cbewsl_moms_ewi_web():
    """
    This function formats the json data sent by CBEWS-L app and adds
    the remaining needed data to fit with the requirements of
    the existing insert_ewi() api.

    Note: This API is required since, currently, there is a data size limit
    of which the CBEWS-L App can send via SMS.
    """
    try:
        json_data = request.get_json()
        var_checker("JSON DATA FROM INSERT_CBEWSL", json_data, True)
        public_alert_level = int(json_data["alert_level"])
        public_alert_symbol = retrieve_data_from_memcache(
            "public_alert_symbols", {"alert_level": public_alert_level}, retrieve_attr="alert_symbol")
        user_id = json_data["user_id"]
        data_ts = json_data["data_ts"]
        observance_ts = json_data["observance_ts"]
        trigger_list_arr = []
        moms_trigger = {}
        triggering_moms_id_list = []
        triggering_moms_list = []
        non_triggering_moms = {}
        non_trig_moms_list = []

        current_alert = get_public_alert(site_id=50)
        if current_alert:
            raised_alert_level = current_alert.alert_level
        else:
            raised_alert_level = 0
        
        var_checker("JSON DATA", json_data, True)

        insert_alert_level = 0

        for trigger in json_data["trig_list"]:
            int_sym = trigger["int_sym"]
            ots_row = retrieve_data_from_memcache(
                "operational_trigger_symbols", {"alert_symbol": int_sym})
            try:
                internal_sym_id = ots_row["internal_alert_symbol"]["internal_sym_id"]
            except TypeError:
                internal_sym_id = None

            trigger_alert_level = ots_row["alert_level"]
            trigger_alert_symbol = ots_row["alert_symbol"]
            source_id = ots_row["source_id"]
            trigger_source = ots_row["trigger_hierarchy"]["trigger_source"]

            trigger_entry = {
                "trigger_type": trigger_source,
                "source_id": source_id,
                "alert_level": trigger_alert_level,
                "trigger_id": None,
                "alert": trigger_alert_symbol,
                "ts_updated": data_ts,
                "internal_sym_id": internal_sym_id
            }

            if trigger_source == "rainfall":
                trigger_entry = {
                    **trigger_entry,
                    "tech_info": trigger["info"]
                }
            elif trigger_source == "moms":
                # Always trigger entry from app. Either m or M only.
                feature_name = trigger["f_name"]
                feature_type = trigger["f_type"]
                remarks = trigger["remarks"]

                moms_obs = {
                    "observance_ts": observance_ts,
                    "reporter_id": user_id,
                    "remarks": remarks,
                    "report_narrative": f"[{feature_type}] {feature_name} - {remarks}",
                    "validator_id": user_id,
                    "instance_id": None,
                    "feature_name": feature_name,
                    "feature_type": feature_type,
                    "op_trigger": trigger_alert_level
                }

                if trigger_alert_level == 0:
                    non_trig_moms_list.append(moms_obs)
                    continue
                else:
                    ## NOTE: Changes been made by LOUIE
                    current_monitoring_instance = get_current_monitoring_instance_per_site(
                        site_id=50)
                    event_id = None

                    if current_monitoring_instance:
                        event_id = current_monitoring_instance.event_id
                    else:
                        event_id = 1

                    try:
                        moms_id = write_monitoring_moms_to_db(moms_obs, 50, event_id)
                        DB.session.commit()
                        print(f"Insert MOMS Success with ID: {moms_id}")
                    except Exception as err:
                        print(err)
                        raise

                    triggering_moms_id_list.append(moms_id)
                    triggering_moms_list.append(moms_obs)
                    moms_trigger = {
                        **moms_trigger,
                        **trigger_entry,
                        "tech_info": f"[{feature_type}] {feature_name} - {remarks}",
                        "moms_id_list": triggering_moms_id_list,
                        "moms_list": triggering_moms_list
                    }
                    continue

            trigger_list_arr.append(trigger_entry)

            if non_trig_moms_list:
                non_triggering_moms["moms_list"] = non_trig_moms_list

        # The following fixes the top-level alert level and alert symbol, getting the highest
        if moms_trigger:
            highest_moms = next(iter(sorted(
                moms_trigger["moms_list"], key=lambda x: x["op_trigger"], reverse=True)), None)
            alert_symbol = retrieve_data_from_memcache("operational_trigger_symbols", {
                "alert_level": highest_moms["op_trigger"], "source_id": 6}, retrieve_attr="alert_symbol")

            moms_trigger["alert_level"] = highest_moms["op_trigger"]
            insert_alert_level = highest_moms["op_trigger"]
            moms_trigger["alert"] = alert_symbol
            del moms_trigger["moms_list"]
            trigger_list_arr.append(moms_trigger)
        else:
            insert_alert_level = raised_alert_level

    except:
        DB.session.rollback()
        raise

    if raised_alert_level < insert_alert_level:
        release_time = datetime.now().time()

        internal_json_data = {
            "site_id": 50,
            "site_code": "umi",
            "public_alert_level": public_alert_level,
            "public_alert_symbol": public_alert_symbol,
            "cbewsl_validity": json_data["alert_validity"],
            "release_details": {
                "data_ts": data_ts,
                "trigger_list_str": "m",
                "release_time": release_time,
                "comments": ""
            },
            "non_triggering_moms": non_triggering_moms,
            "publisher_details": {
                "publisher_mt_id": user_id,
                "publisher_ct_id": user_id,
            },
            "trigger_list_arr": trigger_list_arr
        }
        status = insert_ewi(internal_json_data)
    else:
        status = "no ewi released"

    # return jsonify(internal_json_data)
    return status


@MONITORING_BLUEPRINT.route("/monitoring/get_candidate_and_current_alerts", methods=["GET"])
def get_candidate_and_current_alerts():
    print(get_active_monitoring_events())
    ret_val = {
        "leo": json.loads(wrap_get_ongoing_extended_overdue_events()),
        "candidate_alert": candidate_alerts_generator.main() # pakibura
    }

    return jsonify(ret_val)


@MONITORING_BLUEPRINT.route("/monitoring/update_alert_gen", methods=["GET"])
@MONITORING_BLUEPRINT.route("/monitoring/update_alert_gen/<is_instantaneous>", methods=["GET"])
def alert_generator(is_instantaneous=None):
    DB.session.flush()

    if is_instantaneous and isinstance(is_instantaneous, str):
        if is_instantaneous.lower() == "true":
            is_instantaneous = True
        else:
            is_instantaneous = False

    # result = public_alert_generator.main(query_ts_end='2019-09-27 16:30:00', query_ts_start='2019-09-27 16:30:00', is_instantaneous=is_instantaneous)
    result = public_alert_generator.main(is_instantaneous=is_instantaneous)

    return result
