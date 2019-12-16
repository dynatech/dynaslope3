"""
Monitoring Modules Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
from datetime import datetime, timedelta, time
from flask import Blueprint, jsonify, request
from connection import DB
from src.models.monitoring import (
    MonitoringEvents, MonitoringReleases, MonitoringEventAlerts)
from src.models.monitoring import (
    MonitoringEventsSchema, MonitoringReleasesSchema, MonitoringEventAlertsSchema,
    InternalAlertSymbolsSchema, EndOfShiftAnalysisSchema)
from src.models.narratives import (NarrativesSchema)
from src.utils.narratives import (write_narratives_to_db, get_narratives)
from src.utils.monitoring import (
    # GET functions
    get_pub_sym_id, get_event_count,
    get_moms_id_list, get_internal_alert_symbols,
    get_monitoring_events, get_active_monitoring_events,
    get_monitoring_releases, get_monitoring_events_table,
    get_current_monitoring_instance_per_site, get_public_alert,
    get_ongoing_extended_overdue_events, get_max_possible_alert_level,
    get_latest_release_per_site, get_saved_event_triggers,
    get_monitoring_triggers, build_internal_alert_level,
    get_monitoring_releases_by_data_ts,

    # Logic functions
    format_candidate_alerts_for_insert, update_alert_status,
    compute_event_validity, round_to_nearest_release_time,
    build_internal_alert_level,

    # Logic: Insert EWI specific
    is_new_monitoring_instance, start_new_monitoring_instance,
    end_current_monitoring_event_alert, update_bulletin_number,
    check_if_onset_release,

    # Write functions
    write_monitoring_event_alert_to_db, update_monitoring_release_on_db,
    write_monitoring_release_to_db, write_monitoring_release_publishers_to_db,
    write_monitoring_release_triggers_to_db, write_monitoring_triggers_misc_to_db,
    write_monitoring_moms_releases_to_db,
    write_monitoring_on_demand_to_db, write_monitoring_earthquake_to_db
)
from src.api.end_of_shift import (get_eos_data_analysis)
from src.utils.extra import (
    var_checker, retrieve_data_from_memcache,
    get_process_status_log, get_system_time
)
from src.utils.bulletin import create_monitoring_bulletin, render_monitoring_bulletin
from src.utils.sites import build_site_address

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


@MONITORING_BLUEPRINT.route("/monitoring/get_current_monitoring_summary_per_site/<site_id>", methods=["GET"])
def get_current_monitoring_summary_per_site(site_id):
    """
    Function dedicated to returning brief status of site
    """
    current_site_event = get_current_monitoring_instance_per_site(
        site_id=site_id)
    event_start = datetime.strftime(
        current_site_event.event_start, "%Y-%m-%d %H:%M:%S")
    if current_site_event.validity:
        validity = datetime.strftime(
            current_site_event.validity, "%Y-%m-%d %H:%M:%S")
    else:
        validity = "None"
    site_code = current_site_event.site.site_code
    event_type = "event" if current_site_event.status == 2 else "routine"

    current_event_alert = current_site_event.event_alerts[0]
    public_alert_level = current_event_alert.public_alert_symbol.alert_level
    start_of_alert_level = current_event_alert.ts_start
    end_of_alert_level = current_event_alert.ts_end

    return_data = {
        "event_start": event_start,
        "validity": validity,
        "event_type": event_type,
        "site_code": site_code,
        "public_alert_level": public_alert_level,
        "start_of_alert_level": start_of_alert_level,
        "end_of_alert_level": end_of_alert_level,
        "has_release": False
    }

    if current_event_alert.releases:
        current_release = current_event_alert.releases[0]
        data_ts = datetime.strftime(
            current_release.data_ts, "%Y-%m-%d %H:%M:%S")
        release_time = time.strftime(current_release.release_time, "%H:%M:%S")
        internal_alert = build_internal_alert_level(
            public_alert_level=public_alert_level,
            trigger_list=current_release.trigger_list
        )

        mt_publisher = None
        ct_publisher = None
        for publisher in current_release.release_publishers:
            user = publisher.user_details
            var_checker("user_details", user, True)
            temp = {
                "user_id": user.user_id,
                "last_name": user.last_name,
                "first_name": user.first_name,
                "middle_name": user.middle_name
            }
            if publisher.role == "mt":
                mt_publisher = temp
            elif publisher.role == "ct":
                ct_publisher = temp

        return_data = {
            **return_data,
            "has_release": True,
            "data_ts": data_ts,
            "release_time": release_time,
            "internal_alert": internal_alert,
            "mt_publisher": mt_publisher,
            "ct_publisher": ct_publisher,
            "latest_trigger": None
        }

        event_triggers = get_monitoring_triggers(
            event_id=current_site_event.event_id)
        if event_triggers:
            trig_symbol = event_triggers[0].internal_sym.trigger_symbol
            trig_alert_sym = trig_symbol.alert_symbol
            source = trig_symbol.trigger_hierarchy.trigger_source
            latest_trigger = f"{trig_alert_sym} - {event_triggers[0].info}"
            return_data["latest_trigger"] = latest_trigger

    return jsonify(return_data)


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


@MONITORING_BLUEPRINT.route("/monitoring/get_site_alert_details", methods=["GET"])
def wrap_get_site_alert_details():
    site_id = request.args.get('site_id', default=1, type=int)
    public_alert_level = get_public_alert(site_id)

    latest_release = get_latest_release_per_site(site_id)
    trigger_list = latest_release.trigger_list
    event_id = latest_release.event_alert.event.event_id
    event_triggers = get_saved_event_triggers(event_id)
    var_checker("event_triggers: site_details", event_triggers, True)

    trigger_sources = []
    for temp in event_triggers:
        a = retrieve_data_from_memcache("internal_alert_symbols", {
            "internal_sym_id": temp[0]}, retrieve_one=True)
        source = a["trigger_symbol"]["trigger_hierarchy"]["trigger_source"]
        trigger_sources.append({
            "trigger_source": source,
            "alert_level": 0
        })

    internal_alert_level = public_alert_level
    if public_alert_level != "A0":
        internal_alert_level = f"{public_alert_level}-{trigger_list}"

    return jsonify({
        "internal_alert_level": internal_alert_level,
        "public_alert_level": public_alert_level,
        "trigger_list_str": trigger_list,
        "trigger_sources": trigger_sources
    })


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
        include_count = request.args.get(
            "include_count", default="false", type=str)
        site_ids = request.args.getlist("site_ids", type=int)
        entry_types = request.args.getlist("entry_types", type=int)
        status = request.args.get("status", type=str)
        search = request.args.get("search", default="", type=str)

        include_count = True if include_count.lower() == "true" else False

        return_data = get_monitoring_events_table(
            offset, limit, site_ids, entry_types, include_count, search, status)
    elif filter_type == "count":
        return_data = get_event_count()
    else:
        raise Exception(KeyError)

    return jsonify(return_data)


@MONITORING_BLUEPRINT.route("/monitoring/get_monitoring_releases_by_data_ts/<site_code>/<data_ts>", methods=["GET"])
def wrap_get_monitoring_releases_by_data_ts(site_code, data_ts):
    """
    Gets a single release with the specificied site_code and data_ts
    """
    release = get_monitoring_releases_by_data_ts(site_code, data_ts)
    release_schema = MonitoringReleasesSchema()

    releases_data = release_schema.dump(release).data

    return jsonify(releases_data)


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


@MONITORING_BLUEPRINT.route("/monitoring/create_release_details", methods=["POST"])
def create_release_details():
    """
    build internal alert level
    """

    json_data = request.get_json()
    internal_alert_level = ""
    public_alert_level = ""

    # current is string
    current = json_data["current_trigger_list"]
    # latest is array
    latest = json_data["latest_trigger_list"]

    current = list(
        sorted(current, key=lambda x: x["internal_sym"]["trigger_symbol"]["alert_level"], reverse=True))

    counted_triggers_list = []
    trigger_source_list = []

    sorted_latest = list(
        sorted(latest, key=lambda x: x["alert_level"], reverse=True))
    highest_alert_from_latest = sorted_latest[0]["alert_level"]

    highest_alert_from_current = 0
    for row in current:
        internal_sym = row["internal_sym"]
        internal_alert_symbol = internal_sym["alert_symbol"]
        trigger_symbol = internal_sym["trigger_symbol"]
        alert_level = trigger_symbol["alert_level"]
        source_id = trigger_symbol["source_id"]
        trigger_hierarchy = trigger_symbol["trigger_hierarchy"]
        trigger_source = trigger_hierarchy["trigger_source"]
        hierarchy_id = trigger_hierarchy["hierarchy_id"]

        if highest_alert_from_current < alert_level:
            highest_alert_from_current = alert_level

        temp = {
            "alert_level": alert_level,
            "source": trigger_source,
            "symbol": internal_alert_symbol,
            "hierarchy_id": hierarchy_id
        }

        if source_id not in trigger_source_list:
            trigger_source_list.append(source_id)
            counted_triggers_list.append(temp)
        else:
            index = next((index for (index, d) in enumerate(
                counted_triggers_list) if d["source"] == trigger_source))
            if temp["alert_level"] > counted_triggers_list[index]["alert_level"]:
                counted_triggers_list[index]["alert_level"] = temp["alert_level"]
                counted_triggers_list[index]["symbol"] = temp["symbol"]

    public_alert_level = highest_alert_from_latest if \
        highest_alert_from_latest > highest_alert_from_current \
        else highest_alert_from_current

    for trigger_source in sorted_latest:
        alert_level = trigger_source["alert_level"]
        trigger_type = trigger_source["trigger_type"]
        trigger_hierarchy = retrieve_data_from_memcache(
            "trigger_hierarchies", {"trigger_source": trigger_type})
        source_id = trigger_hierarchy["source_id"]
        hierarchy_id = trigger_hierarchy["hierarchy_id"]
        trigger_sym_id = retrieve_data_from_memcache(
            "operational_trigger_symbols", {
                "alert_level": alert_level,
                "source_id": source_id
            },
            retrieve_attr="trigger_sym_id")
        internal_sym = retrieve_data_from_memcache(
            "internal_alert_symbols", {
                "trigger_sym_id": trigger_sym_id
            },
            retrieve_attr="alert_symbol")

        temp = {
            "alert_level": alert_level,
            "source": trigger_type,
            "symbol": internal_sym,
            "hierarchy_id": hierarchy_id
        }

        if source_id not in trigger_source_list:
            # check if rx (no rainfall trigger)
            if temp["source"] == "rainfall" and temp["alert_level"] == -2:
                temp["symbol"] = temp["symbol"].lower()

            trigger_source_list.append(source_id)
            counted_triggers_list.append(temp)
        else:
            index = next((index for (index, d) in enumerate(
                counted_triggers_list) if d["source"] == trigger_type))  # take note of variable name trigger_type sa taas trigger_source
            if temp["alert_level"] > counted_triggers_list[index]["alert_level"]:
                counted_triggers_list[index]["alert_level"] = temp["alert_level"]
                counted_triggers_list[index]["symbol"] = temp["symbol"]
            elif temp["alert_level"] in [-1, -2]:
                saved_alert_level = counted_triggers_list[index]["alert_level"]
                if temp["source"] != "rainfall":
                    if saved_alert_level == 3:
                        temp["symbol"] = temp["symbol"].upper()
                    else:
                        temp["symbol"] = temp["symbol"].lower()

                counted_triggers_list[index]["alert_level"] = temp["alert_level"]
                counted_triggers_list[index]["symbol"] = temp["symbol"]

    sorted_by_hierarchy = list(
        sorted(counted_triggers_list, key=lambda x: x["hierarchy_id"]))

    trigger_list_final = ""
    for unique_trigger in sorted_by_hierarchy:
        trigger_list_final = trigger_list_final + unique_trigger["symbol"]

    internal_alert_level = build_internal_alert_level(
        public_alert_level=public_alert_level,
        trigger_list=trigger_list_final
    )

    public_alert_symbol = retrieve_data_from_memcache("public_alert_symbols", {
        "alert_level": public_alert_level},
        retrieve_attr="alert_symbol")

    return jsonify({
        "internal_alert_level": internal_alert_level,
        "public_alert_level": public_alert_level,
        "public_alert_symbol": public_alert_symbol,
        "trigger_list_str": trigger_list_final
    })


# # def insert_ewi_release(release_details, publisher_details, trigger_details):
def insert_ewi_release(monitoring_instance_details, release_details, publisher_details, trigger_list_arr=None, non_triggering_moms=None):
    """
    Initiates the monitoring_release write to db plus it's corresponding details.
    """
    try:
        site_id = monitoring_instance_details["site_id"]
        event_id = monitoring_instance_details["event_id"]

        # Get the latest release timestamp
        latest_release = get_latest_release_per_site(site_id)
        latest_release_data_ts = latest_release.data_ts

        if ((datetime.now() - latest_release_data_ts).seconds / 3600) <= 2:
            # UPDATE STUFF
            var_checker("Inserting release", release_details, True)
            new_release = update_monitoring_release_on_db(
                latest_release, release_details)
            release_id = new_release
        else:
            new_release = write_monitoring_release_to_db(release_details)
            release_id = new_release

        public_alert_level = monitoring_instance_details["public_alert_level"]

        write_monitoring_release_publishers_to_db(
            "mt", publisher_details["publisher_mt_id"], release_id)

        write_monitoring_release_publishers_to_db(
            "ct", publisher_details["publisher_ct_id"], release_id)

        if trigger_list_arr:
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
                        site_id=site_id, timestamp=request_ts, narrative=narrative,
                        type_id=2, user_id=publisher_details["publisher_ct_id"], event_id=event_id
                    )

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

        # Release-related variables from JSON
        release_details = json_data["release_details"]
        publisher_details = json_data["publisher_details"]
        trigger_list_arr = json_data["trigger_list_arr"]

        non_triggering_moms = json_data["non_triggering_moms"]

        datetime_data_ts = datetime.strptime(
            release_details["data_ts"], "%Y-%m-%d %H:%M:%S")
        release_details["data_ts"] = datetime_data_ts
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
            except Exception as err:
                print(err)
                raise

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
                    release_details["event_alert_id"] = site_monitoring_instance.event_alerts[0].event_alert_id
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
            current_event_alert = site_monitoring_instance.event_alerts[0]
            pub_sym_id = get_pub_sym_id(public_alert_level)

            validity = site_monitoring_instance.validity
            try:
                validity = json_data["cbewsl_validity"]
            except:
                pass

            # Default checks if not event i.e. site_status != 2
            if is_new_monitoring_instance(2, site_status):
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
                event_id = instance_ids["event_id"]
                event_alert_id = instance_ids["event_alert_id"]

            else:
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
                if pub_sym_id > current_event_alert.pub_sym_id \
                        and pub_sym_id <= (max_possible_alert_level + 1):
                    # if pub_sym_id > current_event_alert.pub_sym_id and pub_sym_id <= 4:
                    # Now that you created a new event
                    print("---RAISING")

                    end_current_monitoring_event_alert(
                        current_event_alert_id, datetime_data_ts)
                    event_alert_id = write_monitoring_event_alert_to_db(
                        event_alert_details)

                elif pub_sym_id == current_event_alert.pub_sym_id \
                        and current_event_alert.event.validity == datetime_data_ts + timedelta(minutes=30):
                    try:
                        to_extend_validity = json_data["to_extend_validity"]

                        if to_extend_validity:
                            # Just a safety measure in case we attached a False
                            # in Front-End
                            # NOTE: SHOULD BE ATTACHED VIA FRONT-END
                            new_validity = current_event_alert.event.validity + \
                                timedelta(hours=no_data_hours_extension)
                            update_event_validity(new_validity, event_id)
                    except:
                        pass

                # Lowering.
                elif pub_sym_id == 1:
                    release_time = round_to_nearest_release_time(
                        datetime_data_ts)

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
                            event_alert_details)

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
                               release_details, publisher_details, trigger_list_arr,
                               non_triggering_moms=non_triggering_moms)

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


@MONITORING_BLUEPRINT.route("/monitoring/create_bulletin/<release_id>", methods=["GET"])
def create_bulletin(release_id):
    schema = create_monitoring_bulletin(release_id=release_id)
    return jsonify(schema)


@MONITORING_BLUEPRINT.route("/monitoring/render_bulletin/<release_id>", methods=["GET"])
def render_bulletin(release_id):
    ret_bool = render_monitoring_bulletin(release_id=release_id)
    return ret_bool

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
        public_alert_level = json_data["alert_level"]
        public_alert_symbol = retrieve_data_from_memcache(
            "public_alert_symbols", {"alert_level": public_alert_level}, retrieve_attr="alert_symbol")
        user_id = json_data["user_id"]
        data_ts = str(datetime.strptime(
            json_data["data_ts"], "%Y-%m-%d %H:%M:%S"))
        trigger_list_arr = []
        moms_trigger = {}
        triggering_moms_list = []
        non_triggering_moms = {}
        non_trig_moms_list = []

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
                    "observance_ts": data_ts,
                    "reporter_id": user_id,
                    "remarks": remarks,
                    "report_narrative": f"[{feature_type}] {feature_name} - {remarks}",
                    "validator_id": user_id,
                    "instance_id": None,
                    "feature_name": trigger["f_name"],
                    "feature_type": trigger["f_type"],
                    "op_trigger": trigger_alert_level
                }

                if trigger_alert_level == 0:
                    non_trig_moms_list.append(moms_obs)
                    continue
                else:
                    triggering_moms_list.append(moms_obs)
                    moms_trigger = {
                        **moms_trigger,
                        **trigger_entry,
                        "tech_info": f"[{feature_type}] {feature_name} - {remarks}",
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
            moms_trigger["alert"] = alert_symbol
            trigger_list_arr.append(moms_trigger)

        release_time = datetime.strftime(datetime.now(), "%Y-%m-%d %H:%M:%S")

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

    except:
        DB.session.rollback()
        raise

    status = insert_ewi(internal_json_data)

    # return jsonify(internal_json_data)
    return status


# NOTE: WORK IN PROGRESS FUNCTIONS
@MONITORING_BLUEPRINT.route("/monitoring/get_event_timeline_data/<event_id>", methods=["GET"])
def get_event_timeline_data(event_id):
    """
    This function returns a modified list of event history which
    is used for the event timeline.

    Args:
        event_id (Integer) - variable name speaks for itself.
    """

    event_id = int(event_id)

    timeline_data = {
        "event_details": {},
        "timeline_items": []
    }
    start_ts = datetime.now()
    # me_schema = MonitoringEventsSchema()
    event_collection_data = get_monitoring_events(event_id=event_id)
    end_ts = datetime.now()
    print("RUNTIME: ", end_ts - start_ts)
    # event_collection_data = me_schema.dump(event_collection_obj).data

    # CORE VALUES
    # event_details: this contains the values needed mostly for the UI
    # Include here the other details you might need for the front end.

    if event_collection_data:
        validity = event_collection_data.validity
        site = event_collection_data.site
        public_alert_symbol = event_collection_data.event_alerts[0] \
            .public_alert_symbol

        event_details = {
            "event_start": datetime.strftime(
                event_collection_data.event_start, "%Y-%m-%d %H:%M:%S"),
            "event_id": event_collection_data.event_id,
            "validity": validity,
            "site_id": site.site_id,
            "site_code": site.site_code,
            "site_address": build_site_address(site),

            # EXTRA
            "status": event_collection_data.status,
            "latest_public_alert_symbol": public_alert_symbol.alert_symbol
        }
        timeline_entries = []

        for event_alert in event_collection_data.event_alerts:
            for release in event_alert.releases:
                data_ts = release.data_ts
                timestamp = datetime.strftime(
                    data_ts, "%Y-%m-%d %H:%M:%S")

                release_ts = data_ts + timedelta(minutes=30)
                release_type = "routine"
                if validity:
                    if release_ts < validity:
                        release_type = "latest"
                    elif release_ts == validity:
                        release_type = "end_of_validity"
                    elif validity <= release_ts:
                        if event_alert.public_alert_symbol.alert_level > 0:
                            release_type = "overdue"
                        else:
                            release_type = "extended"
                trig_moms = "triggers.trigger_misc.moms_releases.moms_details"
                rel_moms = "moms_releases.moms_details"
                inst_site = "moms_instance.site"
                nar_site = "narrative.site"
                release_data = MonitoringReleasesSchema(
                    exclude=["event_alert.event", f"{trig_moms}.{inst_site}",
                             f"{trig_moms}.{nar_site}", f"{rel_moms}.{inst_site}",
                             f"{rel_moms}.{nar_site}"]).dump(release).data
                alert_level = event_alert.public_alert_symbol.alert_level
                ial = build_internal_alert_level(
                    alert_level, release.trigger_list)
                release_data.update({
                    "internal_alert_level": ial,
                    "is_onset": check_if_onset_release(event_alert=event_alert,
                                                       release_id=release.release_id,
                                                       data_ts=data_ts)
                })

                timeline_entries.append({
                    "item_timestamp": timestamp,
                    "item_type": "release",
                    "item_data": release_data,
                    "release_type": release_type
                })

        # Narratives
        narratives_list = get_narratives(event_id=event_id)
        narratives_data_list = NarrativesSchema(
            many=True, exclude=["site"]).dump(narratives_list).data
        if narratives_data_list:
            for narrative in narratives_data_list:
                timestamp = narrative["timestamp"]
                timeline_entries.append({
                    "item_timestamp": timestamp,
                    "item_type": "narrative",
                    "item_data": narrative
                })

        # EOS Analysis
        eos_analysis_list = get_eos_data_analysis(
            event_id=event_id, analysis_only=False)
        eos_analysis_data_list = EndOfShiftAnalysisSchema(
            many=True).dump(eos_analysis_list).data

        if eos_analysis_data_list:
            var_checker("eos data", eos_analysis_data_list, True)
            for eos_analysis in eos_analysis_data_list:
                shift_end = datetime.strptime(
                    eos_analysis["shift_start"], "%Y-%m-%d %H:%M:%S") + timedelta(hours=13)
                shift_end_ts = datetime.strftime(
                    shift_end, "%Y-%m-%d %H:%M:%S")

                timeline_entries.append({
                    "item_timestamp": shift_end_ts,
                    "item_type": "eos",
                    "item_data": eos_analysis["analysis"]
                })

        # Sort the timeline entries descending
        sorted_desc_timeline_entries = sorted(
            timeline_entries, key=lambda x: x["item_timestamp"], reverse=True)

        timeline_data = {
            "event_details": event_details,
            "timeline_items": sorted_desc_timeline_entries
        }

    return jsonify(timeline_data)
