"""
Utility file for Monitoring Tables
Contains functions for getting and accesing monitoring-related tables only
"""
import re
from datetime import datetime, timedelta, time, date
from connection import DB
from src.models.analysis import AlertStatus
from src.models.monitoring import (
    MonitoringEvents, MonitoringReleases, MonitoringEventAlerts,
    MonitoringMomsReleases, MonitoringOnDemand,
    MonitoringEarthquake, MonitoringTriggers, 
    MomsFeatures, InternalAlertSymbols, PublicAlertSymbols,
    TriggerHierarchies, OperationalTriggerSymbols,
    MonitoringEventAlertsSchema, OperationalTriggers,
    MonitoringMoms, MomsInstances, MonitoringTriggersSchema,
    BulletinTracker, MonitoringReleasePublishers, MonitoringTriggersMisc)
from src.models.sites import Seasons, RoutineSchedules, Sites
from src.utils.extra import (
    var_checker, retrieve_data_from_memcache, get_process_status_log)
from src.utils.narratives import write_narratives_to_db


#####################################################
# DYNAMIC Protocol Values starts here. For querying #
#####################################################
# Every how many hours per release
RELEASE_INTERVAL_HOURS = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "RELEASE_INTERVAL_HOURS"}, retrieve_attr="var_value")

EXTENDED_MONITORING_DAYS = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "EXTENDED_MONITORING_DAYS"}, retrieve_attr="var_value")


def get_release_publisher_names(release):
    """
    Return an object of full names for MT and CT
    """
    publishers = release.release_publishers
    publisher_names = {
        "mt": "",
        "ct": ""
    }

    for publisher in publishers:
        user = publisher.user_details
        publisher_names[publisher.role] = f"{user.first_name} {user.last_name}"

    return publisher_names


def get_max_possible_alert_level():
    pas_map = retrieve_data_from_memcache("public_alert_symbols")
    max_row = next(
        iter(sorted(pas_map, key=lambda x: x["alert_level"], reverse=True)))

    return max_row["alert_level"]


def format_candidate_alerts_for_insert(candidate_data):
    """
    Adds the candidate triggers missing data before doing the insert_ewi\
    Most likely be used in CBEWSL
    """
    formatted_candidate_data = candidate_data

    trigger_list_arr = formatted_candidate_data["trigger_list_arr"]
    moms_id_list = []

    formatted_candidate_data["release_details"]["release_time"] = datetime.strftime(
        datetime.now(), "%H:%M:%S")
    formatted_candidate_data["release_details"]["comments"] = "CBEWSL Release"

    formatted_candidate_data = {
        **formatted_candidate_data,
        "publisher_details": {
            "publisher_mt_id": 1,
            "publisher_ct_id": 2
        }
    }

    if trigger_list_arr:
        for trigger in trigger_list_arr:
            if trigger["trigger_type"] == "moms":
                for moms_entry in trigger["moms_list"]:
                    moms_id_list.append(moms_entry["moms_id"])

            if moms_id_list:
                trigger["moms_id_list"] = moms_id_list
                del trigger["moms_list"]

    non_triggering_moms = formatted_candidate_data["non_triggering_moms"]
    non_triggering_moms_id_list = []
    if non_triggering_moms:
        for moms_entry in non_triggering_moms:
            non_triggering_moms_id_list.append(moms_entry["moms_id"])

    if non_triggering_moms_id_list:
        del formatted_candidate_data["non_triggering_moms"]
        formatted_candidate_data = {
            **formatted_candidate_data,
            "non_triggering_moms": {
                "moms_id_list": non_triggering_moms_id_list
            }
        }

    return formatted_candidate_data


def search_if_moms_is_released(moms_id):
    """
    Just checks if a certain MonitoringMoms entry has been
    released already via MonitoringMomsReleases

    Args:
        moms_id (Integer)

    Returns is_released (Boolean)
    """
    moms_release = MonitoringMomsReleases.query.filter(
        MonitoringMomsReleases.moms_id == moms_id).first()

    is_released = False
    if moms_release:
        is_released = True

    return is_released


def compute_event_validity(data_ts, alert_level):
    """
    NOTE: Transfer to mon utils
    Computes for event validity given set of trigger timestamps

    Args:
        data_ts (datetime)
        alert_level (int)

    Returns datetime
    """

    duration = retrieve_data_from_memcache(
        "public_alert_symbols", {"alert_level": alert_level}, retrieve_attr="duration")

    rounded_data_ts = round_to_nearest_release_time(data_ts)

    validity = rounded_data_ts + timedelta(hours=int(duration))

    return validity


def get_site_moms_alerts(site_id, ts_start, ts_end):
    """
    MonitoringMoms found between provided ts_start and ts_end
    Sorted by observance ts

    Returns the ff:
        latest_moms (List of SQLAlchemy classes) - list of moms found
        highest_moms_alert (Int) - highest alert level among moms found
    """
    moms = MonitoringMoms
    mi = MomsInstances
    site_moms_alerts_list = moms.query.order_by(DB.desc(moms.observance_ts)).filter(
        DB.and_(ts_start <= moms.observance_ts, moms.observance_ts <= ts_end)).join(mi).filter(mi.site_id == site_id).all()

    sorted_list = sorted(site_moms_alerts_list,
                         key=lambda x: x.op_trigger, reverse=True)
    highest_moms_alert = 0
    if sorted_list:
        highest_moms_alert = sorted_list[0].op_trigger

    return site_moms_alerts_list, highest_moms_alert


def round_to_nearest_release_time(data_ts, interval=4):
    """
    Round time to nearest 4/8/12 AM/PM (default)
    Or any other interval

    Args:
        data_ts (datetime)
        interval (Integer)

    Returns datetime
    """
    hour = data_ts.hour

    quotient = int(hour / interval)
    hour_of_release = (quotient + 1) * interval

    if hour_of_release < 24:
        date_time = datetime.combine(
            data_ts.date(), time((quotient + 1) * interval, 0))
    else:
        date_time = datetime.combine(data_ts.date() + timedelta(1), time(0, 0))

    return date_time


def round_down_data_ts(date_time):
    """
    Rounds time to HH:00 or HH:30.

    Args:
        date_time (datetime): Timestamp to be rounded off. Rounds to HH:00
        if before HH:30, else rounds to HH:30.

    Returns:
        datetime: Timestamp with time rounded off to HH:00 or HH:30.

    """

    hour = date_time.hour
    minute = date_time.minute
    minute = 0 if minute < 30 else 30
    date_time = datetime.combine(date_time.date(), time(hour, minute))
    return date_time


def get_saved_event_triggers(event_id):
    """
    """

    mt = MonitoringTriggers
    mr = MonitoringReleases
    mea = MonitoringEventAlerts
    me = MonitoringEvents
    event_triggers = DB.session.query(
        mt.internal_sym_id, DB.func.max(mt.ts)).join(mr).join(mea).join(me).filter(me.event_id == event_id).group_by(mt.internal_sym_id).all()

    return event_triggers


def check_if_alert_status_entry_in_db(trigger_id):
    """
    Sample
    """
    alert_status_result = []
    try:
        alert_status_result = AlertStatus.query.filter(
            AlertStatus.trigger_id == trigger_id).first()
    except Exception as err:
        print(err)
        raise

    return alert_status_result


def update_alert_status(as_details):
    """
    Updates alert status entry in DB

    Args:
        as_details (Dictionary): Updates current entry of alert_status
            e.g.
                {
                    "trigger_id": 10,
                    "alert_status": 1, # -1 -> invalid, 0 -> validating, 1 - valid
                    "remarks": "Malakas ang ulan",
                    "user_id", 1
                }
    """
    print(get_process_status_log("update_alert_status", "start"))

    return_data = None
    try:
        trigger_id = as_details["trigger_id"]
        alert_status = as_details["alert_status"]
        remarks = as_details["remarks"]
        user_id = as_details["user_id"]
        ts_ack = datetime.now()

        try:
            ts_last_retrigger = as_details["trigger_ts"]
        except KeyError:
            ts_last_retrigger = datetime.now()
            pass

        alert_status_result = check_if_alert_status_entry_in_db(
            trigger_id)

        val_map = {1: "valid", -1: "invalid", 0: "validating"}

        if alert_status_result:
            try:
                alert_status_result.ts_ack = ts_ack
                alert_status_result.alert_status = alert_status
                alert_status_result.remarks = remarks
                alert_status_result.user_id = user_id

                print(
                    f"Trigger ID [{trigger_id}] alert_status is updated as {alert_status} [{val_map[alert_status]}]. Remarks: \"{remarks}\"")
                return_data = "success"
            except Exception as err:
                DB.session.rollback()
                print("Alert status found but has an error.")
                print(err)
                raise
        else:
            # return_data = f"Alert ID [{trigger_id}] provided DOES NOT EXIST!"
            try:
                alert_stat = AlertStatus(
                    ts_last_retrigger=ts_last_retrigger,
                    trigger_id=trigger_id,
                    ts_set=ts_ack,
                    ts_ack=ts_ack,
                    alert_status=alert_status,
                    remarks=remarks,
                    user_id=user_id
                )
                DB.session.add(alert_stat)
                DB.session.flush()

                stat_id = alert_stat.stat_id
                print(f"New alert status written with ID: {stat_id}." +
                      f"Trigger ID [{trigger_id}] is tagged as {alert_status} [{val_map[alert_status]}]. Remarks: \"{remarks}\"")
                return_data = "success"

            except Exception as err:
                DB.session.rollback()
                print("NO existing alert_status found. An ERROR has occurred.")
                print(err)
                raise

        DB.session.commit()
    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def get_ongoing_extended_overdue_events(run_ts=None):
    """
    Gets active events and organizes them into the following categories:
        (a) Ongoing
        (b) Extended
        (c) Overdue
    For use in alerts_from_db in Candidate Alerts Generator

    Args:
        run_ts (Datetime) - used for testing retroactive generated alerts
    """
    global RELEASE_INTERVAL_HOURS
    global EXTENDED_MONITORING_DAYS
    release_interval_hours = RELEASE_INTERVAL_HOURS
    extended_monitoring_days = EXTENDED_MONITORING_DAYS

    if not run_ts:
        run_ts = datetime.now()

    active_event_alerts = get_active_monitoring_events()

    latest = []
    extended = []
    overdue = []
    for event_alert in active_event_alerts:
        validity = event_alert.event.validity
        event_id = event_alert.event.event_id
        latest_release = event_alert.releases.order_by(
            DB.desc(MonitoringReleases.data_ts)).first()

        # NOTE: LOUIE This formats release time to have date instead of time only
        data_ts = latest_release.data_ts
        rounded_data_ts = round_to_nearest_release_time(
            data_ts, release_interval_hours)
        release_time = latest_release.release_time

        if data_ts.hour == 23 and release_time.hour < release_interval_hours:
        # if data_ts.hour == 23 and release_time.hour < 4:
            # rounded_data_ts = round_to_nearest_release_time(data_ts)
            str_data_ts_ymd = datetime.strftime(rounded_data_ts, "%Y-%m-%d")
            str_release_time = str(release_time)

            release_time = f"{str_data_ts_ymd} {str_release_time}"

        event_alert_data = MonitoringEventAlertsSchema(
            many=False).dump(event_alert).data
        public_alert_level = event_alert.public_alert_symbol.alert_level
        trigger_list = latest_release.trigger_list
        event_alert_data["internal_alert_level"] = build_internal_alert_level(
            public_alert_level, trigger_list)
        event_alert_data["event"]["validity"] = str(datetime.strptime(
            event_alert_data["event"]["validity"], "%Y-%m-%d %H:%M:%S"))
        
        # NOTE: LOUIE SPECIAL intervention to add all triggers of the whole event.
        # Bypassing the use of MonitoringEvent instead
        all_event_triggers = get_monitoring_triggers(event_id=event_id)
        latest_triggers_per_kind = get_unique_triggers(trigger_list=all_event_triggers)
        mtS_m = MonitoringTriggersSchema(many=True)
        event_alert_data["latest_event_triggers"] = mtS_m.dump(latest_triggers_per_kind).data

        if run_ts <= validity:
            # On time release
            latest.append(event_alert_data)
        elif validity < run_ts:
            if event_alert.pub_sym_id > 1:
                # Late release
                overdue.append(event_alert_data)
            else:
                # elif validity < rounded_data_ts and rounded_data_ts < (validity + timedelta(days=3)):
                # EXTENDED

                # Get Next Day 00:00
                next_day = validity + timedelta(days=1)
                start = datetime(next_day.year, next_day.month, next_day.day, 0, 0, 0)
                # Day 3 is the 3rd 12-noon from validity
                end = start + timedelta(days=extended_monitoring_days)
                current = run_ts  # Production code is current time
                # Count the days distance between current date and day 3 to know which extended day it is
                difference = end - current
                day = extended_monitoring_days - difference.days

                if day <= 0:
                    latest.append(event_alert_data)
                elif day > 0 and day < extended_monitoring_days:
                    event_alert_data["day"] = day
                    extended.append(event_alert_data)
                else:
                    # NOTE: Make an API call to end an event when extended is finished? based on old code
                    print("FINISH EVENT")

    db_alerts = {
        "latest": latest,
        "extended": extended,
        "overdue": overdue
    }

    return db_alerts


def get_routine_sites(timestamp=None, include_inactive=False):
    """
    Utils counterpart of identifing the routine site per day.
    Returns "routine_sites" in a list as value.

    E.g.:
    {
        "routine_sites": [
            'bak', 'blc', 'cud', 'imu', 'ina'
        ]
    }
    """
    current_date = date.today()

    if timestamp:
        current_date = timestamp.date()

    weekday = current_date.isoweekday()
    month = current_date.strftime("%B").lower()

    subquery = RoutineSchedules.query.filter_by(
        iso_week_day=weekday).subquery("t1")
    result = Seasons.query.join(subquery, DB.and_(
        getattr(Seasons, month) == subquery.c.season_type)).all()

    routine_sites = []
    for group in result:
        for site in group.sites:
            if site.active:
                routine_sites.append(site.site_code)
            elif include_inactive and not site.active:
                routine_sites.append(site.site_code)

    return routine_sites


def process_trigger_list(trigger_list, include_ND=False):
    """
    Sample docstring
    """
    if "-" in trigger_list:
        nd_alert, trigger_str = trigger_list
    else:
        trigger_str = trigger_list

    if include_ND:
        return nd_alert, trigger_str

    return trigger_str


def get_pub_sym_id(alert_level):
    """
    Returns the pub_sym_id of the specified alert_level

    Args:
        alert_level (String)

    Returns ID (integer)
    """
    public_alert_symbol = PublicAlertSymbols.query.filter(
        PublicAlertSymbols.alert_level == alert_level).first()

    return public_alert_symbol.pub_sym_id


def get_public_alert_level(pub_sym_id):
    """
    Returns the alert_level of the specified pub_sym_id

    Args:
        pub_sym_id (int)

    Returns ID (integer)
    """
    public_alert_symbol = PublicAlertSymbols.query.filter(
        PublicAlertSymbols.pub_sym_id == pub_sym_id).first()

    return public_alert_symbol.alert_level


def get_internal_alert_symbols(internal_sym_id=None):
    """
    """
    try:
        base_query = InternalAlertSymbols
        if internal_sym_id:
            internal_symbol = base_query.query.filter(
                InternalAlertSymbols.internal_sym_id == internal_sym_id).first()
            return_data = internal_symbol.alert_symbol
        else:
            return_data = DB.session.query(InternalAlertSymbols, TriggerHierarchies.trigger_source).join(
                OperationalTriggerSymbols).join(TriggerHierarchies).all()
    except Exception as err:
        print(err)
        raise

    return return_data
#############################################
#   MONITORING_RELEASES RELATED FUNCTIONS   #
#############################################


def get_monitoring_releases(release_id=None, ts_start=None, ts_end=None, event_id=None, user_id=None, exclude_routine=False):
    """
    Returns monitoring_releases based on given parameters.

    Args:
        release_id (Integer) -
        ts_start (Datetime) -
        ts_end (Datetime) -
    """
    me = MonitoringEvents
    mea = MonitoringEventAlerts
    mr = MonitoringReleases
    base = mr.query
    return_data = None
    if release_id:
        return_data = base.filter(
            mr.release_id == release_id).first()
    elif ts_start and ts_end:
        base = base.order_by(DB.desc(mr.data_ts)).order_by(DB.desc(mr.release_time)).join(mea).filter(DB.and_(
            ts_start < mr.data_ts, mr.data_ts < ts_end
        )).filter(me.status == 2)

        if event_id:
            base = base.join(mea).join(me).filter(me.event_id)

        if user_id:
            mrp = MonitoringReleasePublishers
            base = base.join(mrp).filter(mrp.user_id == user_id)

        if exclude_routine:
            base = base.join(me).filter(me.status == 2)
            
        return_data = base.all()
    else:
        return_data = base.order_by(
            DB.desc(mr.release_time)).all()

    return return_data


def get_unique_triggers(trigger_list, reverse=True):
    """
    Returns unique latest unique trigger per internal sym id

    Args:
        trigger_list (list) - This can be list of MonitoringTriggers (SQLAlchemy Object)
        reverse (Boolean) - None for now
    """
    # if not reverse:
    #     ascending_trigger_list = sorted(
    #     trigger_list, key=lambda x: x.trigger_symbol.alert_level, reverse=False)

    print(get_process_status_log("Filter Unique Triggers", "start"))

    new_trigger_list = []
    unique_triggers_set = set({})
    for trigger in trigger_list:
        if isinstance(trigger, object):
            internal_sym_id = trigger.internal_sym_id
        elif isinstance(trigger, dict):
            internal_sym_id = trigger["internal_sym_id"]
        else:
            raise TypeError("Trigger provided is neither a Dictionary nor Object!")

        if not internal_sym_id in unique_triggers_set:
            unique_triggers_set.add(internal_sym_id)
            new_trigger_list.append(trigger)

    print(get_process_status_log("Filter Unique Triggers", "end"))

    return new_trigger_list


def get_monitoring_triggers(event_id=None, event_alert_id=None, release_id=None, ts_start=None, ts_end=None, return_one=False, order_by_desc=True):
    """
    NOTE: To fill
    """
    mt = MonitoringTriggers
    me = MonitoringEvents
    mea = MonitoringEventAlerts
    mr = MonitoringReleases
    base = mt.query

    if ts_start and ts_end:
        base = base.filter(DB.and_(ts_start < mt.ts, mt.ts < ts_end))

    if event_id:
        base = base.join(mr).join(mea).join(me).filter(me.event_id == event_id)
    elif event_alert_id:
        base = base.join(mr).join(mea).filter(mea.event_alert_id == event_alert_id)
    elif release_id:
        base = base.join(mr).filter(mr.release_id == release_id)

    if order_by_desc:
        base = base.order_by(DB.desc(mt.ts))
    else:
        base = base.order_by(DB.asc(mt.ts))

    if return_one:
        return_data = base.first()
    else:
         return_data = base.all()

    return return_data

##########################################
#   MONITORING_EVENT RELATED FUNCTIONS   #
##########################################

def get_public_alert(site_id):
    me = MonitoringEvents
    mea = MonitoringEventAlerts
    result = mea.query.order_by(DB.desc(mea.event_alert_id)).join(
        me).filter(me.site_id == site_id).first()
    if result:
        result = result.public_alert_symbol.alert_symbol

    return result


def get_event_count(filters=None):
    if filters:
        return_data = filters.count()
    else:
        return_data = MonitoringEvents.query.count()

    return return_data


def format_events_table_data(events):
    """
    Organizes data required by the front end table
    """
    mea = MonitoringEventAlerts
    event_data = []
    for event in events:
        if event.status == 2:
            entry_type = "EVENT"
        else:
            entry_type = "ROUTINE"

        latest_event_alert = event.event_alerts.order_by(
            DB.desc(mea.event_alert_id)).first()

        event_dict = {
            "event_id": event.event_id,
            "site_id": event.site.site_id,
            "site_code": event.site.site_code,
            "purok": event.site.purok,
            "sitio": event.site.sitio,
            "barangay": event.site.barangay,
            "municipality": event.site.municipality,
            "province": event.site.province,
            "event_start": event.event_start,
            "validity": event.validity,
            "entry_type": entry_type,
            "public_alert": latest_event_alert.public_alert_symbol.alert_symbol,
            "ts_start": latest_event_alert.ts_start,
            "ts_end": latest_event_alert.ts_end
        }
        event_data.append(event_dict)
    
    return event_data


def get_monitoring_events_table(offset, limit, site_ids, entry_types, include_count, search, status):
    """
        Returns one or more row/s of narratives.

        Args:
            offset (Integer) -
            limit (datetime) -
            site_ids (datetime) -
            include_count
            search
    """
    me = MonitoringEvents
    mea = MonitoringEventAlerts
    
    # base = me.query.order_by(DB.desc(me.event_id))
    base = me.query.join(Sites).join(mea)

    if site_ids:
        base = base.filter(me.site_id.in_(site_ids))

    if entry_types:
        base = base.filter(me.status.in_(entry_types))

    if search != "":
        base = base.filter(DB.or_(mea.ts_start.ilike("%" + search + "%"), mea.ts_end.ilike("%" + search + "%")))

    events = base.order_by(
        DB.desc(me.event_id)).all()[offset:limit]

    formatted_events = format_events_table_data(events)

    if include_count:
        count = get_event_count(base)
        return_data = {
            "events": formatted_events,
            "count":count
        }
    else:
        return_data = formatted_events

    return return_data



# def get_monitoring_events_table(offset, limit):
#     me = MonitoringEvents
#     mea = MonitoringEventAlerts
#     #### Version 1 Query: Issues - only need latest entry of MEA but returns everything when joined ####
#     # DB.session.query(
#     #     me, mea.pub_sym_id,
#     #     mea.ts_start, mea.ts_end).join(mea).order_by(
#     #         DB.desc(me.event_id),
#     #         DB.desc(mea.event_alert_id)
#     #         ).all()[offset:limit]

#     #### Version 1 Query: Issues - only need latest entry of MEA but returns everything when joined ####
#     temp = me.query.order_by(DB.desc(me.event_id)).all()[offset:limit]

#     event_data = []
#     for event in temp:
#         if event.status == 2:
#             entry_type = "EVENT"
#         else:
#             entry_type = "ROUTINE"

#         latest_event_alert = event.event_alerts.order_by(
#             DB.desc(mea.event_alert_id)).first()

#         event_dict = {
#             "event_id": event.event_id,
#             "site_id": event.site.site_id,
#             "site_code": event.site.site_code,
#             "purok": event.site.purok,
#             "sitio": event.site.sitio,
#             "barangay": event.site.barangay,
#             "municipality": event.site.municipality,
#             "province": event.site.province,
#             "event_start": event.event_start,
#             "validity": event.validity,
#             "entry_type": entry_type,
#             "public_alert": latest_event_alert.public_alert_symbol.alert_symbol,
#             "ts_start": latest_event_alert.ts_start,
#             "ts_end": latest_event_alert.ts_end
#         }
#         event_data.append(event_dict)

#     return event_data


def get_monitoring_events(event_id=None):
    """
    Returns event details with corresponding site details. Receives an event_id from flask request.

    Args: event_id

    Note: From pubrelease.php getEvent
    """

    # NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    if event_id is None:
        event = MonitoringEvents.query.all()
    else:
        event = MonitoringEvents.query.filter(
            MonitoringEvents.event_id == event_id).first()

    return event


# NOTE: LOUIE Make this restroactive testing friendly
# TWO Cases to Consider:
# 1. Return empty list if testing onset on retroactive event
# 2. Return row for finished events
def get_active_monitoring_events():
    """
    Gets Active Events based on MonitoringEventAlerts data.
    """
    me = MonitoringEvents
    mea = MonitoringEventAlerts

    # Ignore the pylinter error on using "== None" vs "is None",
    # since SQLAlchemy interprets "is None" differently.
    active_events = mea.query.join(me).order_by(
        DB.desc(mea.ts_start)).filter(DB.and_(me.status == 2, mea.ts_end == None)).all()

    return active_events


def get_current_monitoring_instance_per_site(site_id):
    """
    This functions looks up at monitoring_events table and retrieves the current
    event details (whether it is a routine- or event-type)

    Args:
        site_id - mandatory Integer parameter
    """
    event = MonitoringEvents
    latest_event = event.query.order_by(DB.desc(event.event_id)).filter(
        event.site_id == site_id).first()

    return latest_event

##########################################################
# List of Functions for early input before release times #
##########################################################


def write_monitoring_on_demand_to_db(od_details):
    """
    Simply writes on_demand trigger to DB
    """
    try:
        on_demand = MonitoringOnDemand(
            request_ts=od_details["request_ts"],
            narrative_id=od_details["narrative_id"],
            reporter_id=od_details["reporter_id"],
            tech_info=od_details["tech_info"]
        )
        DB.session.add(on_demand)
        DB.session.flush()

        new_od_id = on_demand.od_id
        return_data = new_od_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def write_moms_feature_type_to_db(feature_details):
    """
    Insertion of new manifestation instance observed in the field.
    Independent of moms_features
    """
    try:
        feature = MomsFeatures(
            feature_type=feature_details["feature_type"],
            description=feature_details["description"]
        )
        DB.session.add(feature)
        DB.session.flush()

        feature_id = feature.feature_id
        return_data = feature_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def write_moms_instances_to_db(instance_details):
    """
    Insertion of new manifestation instance observed in the field.
    Independent of monitoring_moms
    """
    try:
        moms_instance = MomsInstances(
            site_id=instance_details["site_id"],
            feature_id=instance_details["feature_id"],
            feature_name=instance_details["feature_name"]
        )
        DB.session.add(moms_instance)
        DB.session.flush()

        new_moms_instance_id = moms_instance.instance_id
        return_data = new_moms_instance_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def search_if_feature_name_exists(site_id, feature_id, feature_name):
    """
    Sample
    """
    mi = MomsInstances
    instance = None
    instance = mi.query.filter(
        DB.and_(mi.site_id == site_id, mi.feature_name == feature_name, mi.feature_id == feature_id)).first()

    return instance


def search_if_feature_exists(feature_type):
    """
    Search features if feature type exists already
    """
    mf = MomsFeatures
    moms_feat = None
    moms_feat = mf.query.filter(mf.feature_type == feature_type).first()

    return moms_feat


def write_monitoring_moms_to_db(moms_details, site_id, event_id=None):
    """
    Insert a moms report to db regardless of attached to release or prior to release.
    """
    try:
        try:
            op_trigger = moms_details["op_trigger"]
        except:
            # Note: Make sure you always include op_trigger via front end
            print("No op_trigger given.")
            raise

        observance_ts = moms_details["observance_ts"]
        narrative = moms_details["report_narrative"]
        moms_instance_id = moms_details["instance_id"]

        moms_narrative_id = write_narratives_to_db(
            site_id=site_id,
            timestamp=observance_ts,
            narrative=narrative,
            type_id=2, # NOTE: STATIC VALUE SET Event Narrative Type
            event_id=event_id,
            user_id=1 # NOTE: STATIC VALUE SET Event Narrative Type
        )

        if not moms_instance_id:
            # Create new instance of moms
            feature_type = moms_details["feature_type"]
            feature_name = moms_details["feature_name"]

            moms_feature = search_if_feature_exists(feature_type)

            # Mainly used by CBEWS-L; Central doesn't add moms_features
            # on the fly
            if not moms_feature:
                feature_details = {
                    "feature_type": feature_type,
                    "description": None
                }
                feature_id = write_moms_feature_type_to_db(feature_details)
            else:
                feature_id = moms_feature.feature_id

            moms_instance = search_if_feature_name_exists(
                site_id, feature_id, feature_name)

            if not moms_instance:
                instance_details = {
                    "site_id": site_id,
                    "feature_id": feature_id,
                    "feature_name": moms_details["feature_name"]
                }
                moms_instance_id = write_moms_instances_to_db(instance_details)
            else:
                moms_instance_id = moms_instance.instance_id

        elif moms_instance_id < 0:
            raise Exception("INVALID MOMS INSTANCE ID")

        new_moms = MonitoringMoms(
            instance_id=moms_instance_id,
            observance_ts=observance_ts,
            reporter_id=moms_details["reporter_id"],
            remarks=moms_details["remarks"],
            narrative_id=moms_narrative_id,
            validator_id=moms_details["validator_id"],
            op_trigger=op_trigger
        )

        DB.session.add(new_moms)
        DB.session.flush()

        source_id = retrieve_data_from_memcache(
            "trigger_hierarchies", {"trigger_source": "moms"}, retrieve_attr="source_id")
        trigger_sym_id = retrieve_data_from_memcache("operational_trigger_symbols", {
            "alert_level": op_trigger,
            "source_id": source_id
        }, retrieve_attr="trigger_sym_id")

        new_op_trigger = OperationalTriggers(
            ts=observance_ts,
            site_id=site_id,
            trigger_sym_id=trigger_sym_id,
            ts_updated=observance_ts,
        )

        DB.session.add(new_op_trigger)
        DB.session.flush()

        new_moms_id = new_moms.moms_id
        return_data = new_moms_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def write_monitoring_earthquake_to_db(eq_details):
    """
    """
    try:
        earthquake = MonitoringEarthquake(
            magnitude=eq_details["magnitude"],
            latitude=eq_details["latitude"],
            longitude=eq_details["longitude"]
        )

        DB.session.add(earthquake)
        DB.session.flush()

        new_eq_id = earthquake.od_id
        return_data = new_eq_id

    except Exception as err:
        DB.session.rollback()
        print(err)
        raise

    return return_data


def build_internal_alert_level(public_alert_level, trigger_list=None):
    """
    This function builds the internal alert string using a public alert level
    and the provided trigger_list_str. 

    Args:
        trigger_list (String) - Used as the historical log of valid triggers
                    Can be set as "None" for A0
        public_alert_level (Integer) - This will be used instead of 
                    pub_sym_id for building the Internal alert string
                    Can be set as none since this is optional
    """

    p_a_symbol = retrieve_data_from_memcache(
        "public_alert_symbols", {"alert_level": public_alert_level}, retrieve_attr="alert_symbol")
    if public_alert_level > 0:
        internal_alert_level = f"{p_a_symbol}-{trigger_list}"

        if public_alert_level == 1 and trigger_list:
            if "-" in trigger_list:
                internal_alert_level = trigger_list
    else:
        internal_alert_level = f"{p_a_symbol}"
        if trigger_list:
            internal_alert_level = trigger_list

    return internal_alert_level


def fix_internal_alert(alert_entry, internal_source_id):
    """
    Changes the internal alert string of each alert entry.
    """
    event_triggers = alert_entry["event_triggers"]
    internal_alert = alert_entry["internal_alert"]
    valid_alert_levels = []
    invalid_triggers = []
    trigger_list_str = None

    # for trigger in trigger_list_arr:
    #     alert_level = trigger["alert_level"]
    #     alert_symbol = trigger["alert_symbol"]
    #     internal_sym_id = trigger["internal_sym_id"]
    #     trigger_type = trigger["trigger_type"]

    #     try:
    #         if True:
    #             print("Oh yes!")
    #     except Exception as err:
    #         print(err)
    #         raise

    for trigger in event_triggers:
        alert_symbol = trigger["alert"]
        ots_row = retrieve_data_from_memcache("operational_trigger_symbols", {
            "alert_symbol": alert_symbol})
        trigger["internal_sym_id"] = ots_row["internal_alert_symbol"]["internal_sym_id"]

        source_id = trigger["source_id"]
        alert_level = trigger["alert_level"]
        op_trig_row = retrieve_data_from_memcache("operational_trigger_symbols", {
            "alert_level": alert_level, "source_id": source_id})
        internal_alert_symbol = op_trig_row["internal_alert_symbol"]["alert_symbol"]

        try:
            if trigger["invalid"]:
                invalid_triggers.append(trigger)
                internal_alert = re.sub(
                    r"%s(0|x)?" % internal_alert_symbol, "", internal_alert)

        except KeyError:  # If valid, trigger should have no "invalid" key
            valid_a_l = retrieve_data_from_memcache("operational_trigger_symbols", {
                "alert_symbol": alert_symbol}, retrieve_attr="alert_level")
            valid_alert_levels.append(valid_a_l)

    highest_valid_public_alert = 0
    if valid_alert_levels:
        # Get the maximum valid alert level
        highest_valid_public_alert = max(valid_alert_levels)

        validity_status = "valid"
        if invalid_triggers:  # If there are invalid triggers, yet there are valid triggers.
            validity_status = "partially_invalid"
    else:
        validity_status = "invalid"

    public_alert_sym = internal_alert.split("-")[0]
    op_trig_row = retrieve_data_from_memcache("operational_trigger_symbols", {
        "alert_level": -1, "source_id": internal_source_id})
    nd_internal_alert_sym = op_trig_row["internal_alert_symbol"]["alert_symbol"]

    is_nd = public_alert_sym == nd_internal_alert_sym
    if is_nd:
        trigger_list_str = nd_internal_alert_sym
    elif highest_valid_public_alert != 0:
        trigger_list_str = ""

    try:
        if is_nd:
            trigger_list_str += "-"

        trigger_list_str += internal_alert.split("-")[1]
    except:
        pass

    return highest_valid_public_alert, trigger_list_str, validity_status


############
# FROM API #
############


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
            trigger_list=release_details["trigger_list_str"],
            release_time=release_details["release_time"],
            bulletin_number=release_details["bulletin_number"],
            comments=release_details["comments"]
        )
        DB.session.add(new_release)
        DB.session.flush()

        new_release_id = new_release.release_id

    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    return new_release_id


def get_bulletin_number(site_id):
    """
    Gets the bulletin number of a site specified
    """
    bt = BulletinTracker
    bulletin_number_row = bt.query.filter(
        bt.site_id == site_id).first()

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

        for item in moms_list:
            moms_id = write_monitoring_moms_to_db(
                item, site_id, event_id)
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
