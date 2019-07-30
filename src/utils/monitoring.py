"""
Utility file for Monitoring Tables
Contains functions for getting and accesing monitoring-related tables only
"""
import calendar
from flask import request
from datetime import datetime, timedelta, time, date
from connection import DB
from sqlalchemy import and_
from src.models.monitoring import (
    MonitoringEvents, MonitoringReleases, MonitoringEventAlerts,
    MonitoringMoms, MonitoringMomsReleases, MonitoringOnDemand,
    MonitoringTriggersMisc, MomsInstances, MomsFeatures,
    InternalAlertSymbols, PublicAlertSymbols,
    TriggerHierarchies, OperationalTriggerSymbols, MonitoringEventAlertsSchema)
from src.utils.sites import get_sites_data
from src.utils.extra import (
    var_checker, round_to_nearest_release_time, compute_event_validity)
from src.utils.narratives import write_narratives_to_db


def get_tomorrow_noon(ts):
    """
    Used for identifying extended monitoring start ts
    Returns the next 12 noon TS for start of extended monitoring

    Args:
        ts - datetime object
    """
    if ts.hour < 12:
        tom_noon_ts = datetime(ts.year, ts.month, ts.day, 12, 0, 0)
    else:
        tom = ts + timedelta(days=1)
        tom_noon_ts = datetime(tom.year, tom.month, tom.day, 12, 0, 0)

    return tom_noon_ts


def get_ongoing_extended_overdue_events():
    """
    Gets active events and organizes them into the following categories:
        (a) Ongoing
        (b) Extended
        (c) Overdue
    For use in alerts_from_db in Candidate Alerts Generator
    """
    active_event_alerts = get_active_monitoring_events()

    latest = []
    extended = []
    overdue = []
    for event_alert in active_event_alerts:
        validity = event_alert.event.validity
        latest_release = event_alert.releases.order_by(
            DB.desc(MonitoringReleases.data_ts)).first()
        data_ts = latest_release.data_ts
        rounded_data_ts = round_to_nearest_release_time(data_ts)
        release_time = latest_release.release_time

        if data_ts.hour == 23 and release_time.hour < 4:
            # rounded_data_ts = round_to_nearest_release_time(data_ts)
            str_data_ts_ymd = datetime.strftime(rounded_data_ts, "%Y-%m-%d")
            str_release_time = str(release_time)

            release_time = f"{str_data_ts_ymd} {str_release_time}"

        event_alert_data = MonitoringEventAlertsSchema(many=False).dump(event_alert).data
        public_alert_level = event_alert.public_alert_symbol.alert_level
        trigger_list = latest_release.trigger_list
        event_alert_data["internal_alert_level"] = build_internal_alert_level(None, trigger_list, public_alert_level)
        event_alert_data["event"]["validity"] = str(datetime.strptime(event_alert_data["event"]["validity"], "%Y-%m-%d %H:%M:%S"))

        if datetime.now() < validity:
            # On time release
            latest.append(event_alert_data)
        elif validity < datetime.now():
            # Late release
            overdue.append(event_alert_data)
        else:
            # elif validity < rounded_data_ts and rounded_data_ts < (validity + timedelta(days=3)):
            # Extended
            start = get_tomorrow_noon(validity)
            # Day 3 is the 3rd 12-noon from validity
            end = start + timedelta(days=2)
            # current = datetime.now() # Production code is current time
            current = datetime(2020, 1, 3, 8, 0, 0)
            # Count the days distance between current date and day 3 to know which extended day it is
            day = 3 - (end - current).days

            if day <= 0:
                latest.append(event_alert_data)
            elif day > 0 and day < end:
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

    # for key, value in db_alerts.items():
    #     db_alerts[key] = MonitoringEventAlertsSchema(
    #         many=True).dump(value).data

    return db_alerts


def get_routine_sites(timestamp=None):
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
    current_data = date.today()
    if timestamp:
        current_data = timestamp.date()
    get_sites = get_sites_data()
    day = calendar.day_name[current_data.weekday()]
    wet_season = [[1, 2, 6, 7, 8, 9, 10, 11, 12], [5, 6, 7, 8, 9, 10]]
    dry_season = [[3, 4, 5], [1, 2, 3, 4, 11, 12]]
    routine_sites = []

    if (day == "Friday" or day == "Tuesday"):
        # print(day)
        for sites in get_sites:
            season = int(sites.season) - 1
            if sites.season in wet_season[season]:
                routine_sites.append(sites.site_code)
    elif day == "Wednesday":
        # print(day)
        for sites in get_sites:
            season = int(sites.season) - 1
            if sites.season in dry_season[season]:
                routine_sites.append(sites.site_code)
    else:
        routine_sites = []

    # print(routine_sites)
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


def get_monitoring_releases(release_id=None):
    """
    Something
    """

    # NOTE: ADD ASYNC OPTION ON MANY OPTION (TOO HEAVY)
    if release_id is None:
        release = MonitoringReleases.query.order_by(
            DB.desc(MonitoringReleases.release_id)).all()
    else:
        release = MonitoringReleases.query.filter(
            MonitoringReleases.release_id == release_id).first()

    return release


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
        print("Filters!")
        return_data = 10000
    else:
        return_data = MonitoringEvents.query.count()

    return return_data


def get_monitoring_events_table(offset, limit):
    me = MonitoringEvents
    mea = MonitoringEventAlerts
    #### Version 1 Query: Issues - only need latest entry of MEA but returns everything when joined ####
    # DB.session.query(
    #     me, mea.pub_sym_id,
    #     mea.ts_start, mea.ts_end).join(mea).order_by(
    #         DB.desc(me.event_id),
    #         DB.desc(mea.event_alert_id)
    #         ).all()[offset:limit]

    #### Version 1 Query: Issues - only need latest entry of MEA but returns everything when joined ####
    temp = me.query.order_by(DB.desc(me.event_id)).all()[offset:limit]

    event_data = []
    for event in temp:
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


# LOUIE - changed the filter to "not" None and "== 4" instead of is None and != 1
# for testing purposes only
def get_active_monitoring_events():
    """
    Gets Active Events based on MonitoringEventAlerts data.
    """
    me = MonitoringEvents
    mea = MonitoringEventAlerts

    # Ignore the pylinter error on using "== None" vs "is None",
    # since SQLAlchemy interprets "is None" differently.
    active_events = mea.query.order_by(
        DB.desc(mea.ts_start)).filter(mea.ts_end == None, mea.pub_sym_id != 1).all()

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
            reporter_id=od_details["reporter_id"]
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


def search_if_feature_name_exists(feature_name):
    """
    Sample
    """
    mi = MomsInstances
    instance = None
    instance = mi.query.filter(mi.feature_name == feature_name).first()

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
        # Temporary Map for getting alert level per IAS entry via internal_sym_id
        moms_level_map = {14: -1, 13: 2, 7: 3}
        internal_sym_id = moms_details["internal_sym_id"]

        try:
            op_trigger = moms_details["op_trigger"]
        except:
            op_trigger = moms_level_map[internal_sym_id]

        observance_ts = moms_details["observance_ts"]
        narrative = moms_details["report_narrative"]
        moms_instance_id = moms_details["instance_id"]

        moms_narrative_id = write_narratives_to_db(
            site_id, observance_ts, narrative, event_id)

        if moms_instance_id is None:
            # Create new instance of moms
            feature_type = moms_details["feature_type"]
            feature_name = moms_details["feature_name"]

            moms_feature = search_if_feature_exists(feature_type)
            moms_instance = search_if_feature_name_exists(feature_name)

            if moms_feature is None:
                feature_details = {
                    "feature_type": feature_type,
                    "description": None
                }
                feature_id = write_moms_feature_type_to_db(feature_details)
            else:
                feature_id = moms_feature.feature_id

            if moms_instance is None:
                instance_details = {
                    "site_id": site_id,
                    "feature_id": feature_id,
                    "feature_name": moms_details["feature_name"]
                }
                moms_instance_id = write_moms_instances_to_db(instance_details)
            else:
                moms_instance_id = moms_instance.instance_id
        elif moms_instance_id < 0:
            print("INVALID MOMS INSTANCE ID")
            raise

        moms = MonitoringMoms(
            instance_id=moms_instance_id,
            observance_ts=observance_ts,
            reporter_id=moms_details["reporter_id"],
            remarks=moms_details["remarks"],
            narrative_id=moms_narrative_id,
            validator_id=moms_details["validator_id"],
            op_trigger=op_trigger
        )

        DB.session.add(moms)
        DB.session.flush()

        new_moms_id = moms.moms_id
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
        earthquake = MonitoringMoms(
            instance_id=eq_details["instance_id"],
            observance_ts=eq_details["observance_ts"],
            reporter_id=eq_details["reporter_id"],
            remarks=eq_details["remarks"],
            narrative_id=eq_details["narrative_id"],
            validator_id=eq_details["validator_id"],
            op_trigger=eq_details["op_trigger"]
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


def build_internal_alert_level(pub_sym_id, trigger_list=None, public_alert_level=None):
    """
    This function builds the internal alert string using a public alert level
    and the provided trigger_list_str. 

    Args:
        pub_sym_id (ID integer) - Used to check the alert level to be used
                    Can be set as "None" if you will use public_alert_level
                    instead
        trigger_list (String) - Used as the historical log of valid triggers
                    Can be set as "None" for A0
        public_alert_level (Integer) - This will be used instead of 
                    pub_sym_id for building the Internal alert string
                    Can be set as none since this is optional
    """

    if pub_sym_id:
        public_alert_level = get_public_alert_level(pub_sym_id)

    if public_alert_level > 0:
        internal_alert_level = f"A{public_alert_level}-{trigger_list}"
        if public_alert_level == 1 and trigger_list:
            if "-" in trigger_list:
                internal_alert_level = trigger_list
    else:
        internal_alert_level = f"A{public_alert_level}"
        if trigger_list:
            internal_alert_level = trigger_list

    return internal_alert_level


# def build_internal_alert_level(pub_sym_id, trigger_list):
    # """
    # This form of the fuction was used for eos api
    # """
#     alert_level = get_public_alert_level(pub_sym_id)

#     internal_alert_level = f"A{alert_level}-{trigger_list}"

#     return internal_alert_level
