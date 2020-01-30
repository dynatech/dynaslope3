import os
import sys
sys.path.append(
    r"D:\Users\swat-dynaslope\Documents\DYNASLOPE-3.0\dynaslope3-final")
from connection import create_app
from pprint import pprint
from connection import DB
from src.models.sites import Sites
from src.models.monitoring_old import (
    OldMonitoringEvents, OldMonitoringManifestation,
    OldMonitoringManifestationFeatures, OldUsers, OldMonitoringReleases,
    OldNarratives
)
from src.models.monitoring import *
from src.models.narratives import Narratives

from datetime import datetime


def get_public_alert_level(internal_alert_level, return_triggers=False, include_ND=False):
    alert = internal_alert_level.split("-")

    try:
        public_alert, trigger_str = alert

        if public_alert == "ND":
            public_alert = "A1"

            if include_ND:
                trigger_str = internal_alert_level
    except ValueError:
        public_alert = "A0"
        trigger_str = None

        if internal_alert_level == "ND":
            trigger_str = "ND"

    if return_triggers:
        return public_alert, trigger_str

    return public_alert


EVENT_STATUS = {
    "on-going": 2,
    "extended": 2,
    "finished": 2,
    "routine": 1,
    "invalid": -1
}


def get_events():
    return OldMonitoringEvents.query.options(
        DB.raiseload("site")
    ).order_by(
        OldMonitoringEvents.event_start).all()
    # next .filter(DB.and_(OldMonitoringEvents.event_id > 1050, OldMonitoringEvents.event_id <= ? ))
    # return OldMonitoringEvents.query.filter(OldMonitoringEvents.site_id == 12).order_by(OldMonitoringEvents.event_start).all()
    # return OldMonitoringEvents.query.filter(OldMonitoringEvents.event_id == 51).all()


def get_last_site_event(site_id):
    return MonitoringEvents.query.options(DB.raiseload("*")) \
        .filter(MonitoringEvents.site_id == site_id).order_by(
        DB.desc(MonitoringEvents.event_start)).first()


def get_last_event_alert(event_id):
    return MonitoringEventAlerts.query.options(DB.raiseload("*")).filter(
        MonitoringEventAlerts.event_id == event_id).order_by(
            DB.desc(MonitoringEventAlerts.ts_start)).first()


def insert_event_alert(release, ts_start_for_next_event):
    event_id = release.event_id

    data_timestamp = release.data_timestamp
    if ts_start_for_next_event is not None:
        data_timestamp = ts_start_for_next_event

    internal_alert = release.internal_alert_level
    public_alert, trigger_list = get_public_alert_level(
        internal_alert, return_triggers=True, include_ND=True)

    sym = PublicAlertSymbols.query.options(DB.raiseload("*")).filter(
        PublicAlertSymbols.alert_symbol == public_alert).first()
    new_pub_sym_id = sym.pub_sym_id

    last_event_alert = get_last_event_alert(event_id)

    try:
        old_pub_sym_id = last_event_alert.pub_sym_id
        event_alert_id = last_event_alert.event_alert_id
    except:
        old_pub_sym_id = 10

    if old_pub_sym_id != new_pub_sym_id:
        new_ea = MonitoringEventAlerts(
            event_id=event_id,
            pub_sym_id=new_pub_sym_id,
            ts_start=data_timestamp
        )

        DB.session.add(new_ea)
        DB.session.flush()

        event_alert_id = new_ea.event_alert_id

        try:
            last_event_alert.ts_end = data_timestamp
        except AttributeError:
            pass

    return event_alert_id, trigger_list


def get_internal_symbol(trigger):
    internal_symbol = InternalAlertSymbols.query \
        .filter_by(alert_symbol=DB.func.binary(trigger.trigger_type)).first()
    return internal_symbol


def insert_to_narratives_table(narrative, ts, site_id, event_id=None):
    narrative = Narratives(
        site_id=site_id,
        event_id=event_id,
        timestamp=ts,
        narrative=narrative,
        type_id=1,
        user_id=2
    )

    DB.session.add(narrative)
    DB.session.flush()

    narrative_id = narrative.id

    return narrative_id


def insert_to_on_demand_table(trigger, site_id):
    od_details = trigger.on_demand_details

    narrative_id = insert_to_narratives_table(
        od_details.reason, od_details.ts, site_id, trigger.event_id)

    on_demand = MonitoringOnDemand(
        od_id=od_details.id,
        request_ts=od_details.ts,
        reporter_id=2,
        narrative_id=narrative_id
    )
    DB.session.add(on_demand)

    return on_demand.od_id


def insert_to_eq_table(trigger):
    eq_details = trigger.eq_details

    eq = MonitoringEarthquake(
        eq_id=eq_details.id,
        magnitude=eq_details.magnitude,
        latitude=eq_details.latitude,
        longitude=eq_details.longitude
    )

    DB.session.add(eq)

    return eq.eq_id


def get_feature_id(feature_type):
    feature = MomsFeatures.query.options(DB.raiseload("*")).filter(
        MomsFeatures.feature_type == feature_type).first()

    if feature is None:
        if feature_type == "slide" or feature_type == "fall":
            feature_id = 7  # Slope Failure
        elif feature_type == "depression":
            feature_id = 8
        elif feature_type == "pond":
            feature_id = 4
        else:
            feature_id = -1
    else:
        feature_id = feature.feature_id

    return feature_id


def insert_to_moms_instances_table(feature):
    feature_id = get_feature_id(feature.feature_type)

    result = MomsInstances.query.options(DB.raiseload("*")).filter(
        DB.and_(MomsInstances.site_id == feature.site_id,
                MomsInstances.feature_id == feature_id,
                MomsInstances.feature_name == feature.feature_name)).first()

    if result is None:
        # If not exists, insert new instance
        moms_instance = MomsInstances(
            site_id=feature.site_id,
            feature_id=feature_id,
            feature_name=feature.feature_name
        )

        DB.session.add(moms_instance)
        DB.session.flush()

        moms_instance_id = moms_instance.instance_id
    else:
        # If exists, return existing ID
        moms_instance_id = result.instance_id

    return moms_instance_id


def get_moms_feature_details(feature_id):
    feature = OldMonitoringManifestationFeatures.query.filter(
        OldMonitoringManifestationFeatures.feature_id == feature_id).first()
    return feature


def insert_to_moms_table(release):
    moms_details = release.manifestation_details
    id_list = []

    for mom in moms_details:
        feature = get_moms_feature_details(mom.feature_id)
        instance_id = insert_to_moms_instances_table(feature)

        narrative_id = insert_to_narratives_table(
            mom.narrative, mom.ts_observance, feature.site_id, release.event_id)

        moms_entry = MonitoringMoms(
            moms_id=mom.manifestation_id,
            instance_id=instance_id,
            observance_ts=mom.ts_observance,
            reporter_id=2,
            remarks=mom.remarks,
            narrative_id=narrative_id,
            validator_id=mom.validator,
            op_trigger=mom.op_trigger
        )

        DB.session.add(moms_entry)

        id_list.append(moms_entry.moms_id)

    return id_list


def insert_non_triggering_to_moms_table():
    """
    Included na dito yung mga nilower to A0 kasi wala silang alert trigger (m/M)
    SUGGESTION add release_id column sa monitoring_moms_releases
    """
    non_trig_moms = OldMonitoringManifestation.query.filter(
        OldMonitoringManifestation.op_trigger == 0).all()

    for mom in non_trig_moms:
        feature = get_moms_feature_details(mom.feature_id)
        instance_id = insert_to_moms_instances_table(feature)
        event_id = None

        if mom.release is not None:
            event_id = mom.release.event_id

        narrative_id = insert_to_narratives_table(
            mom.narrative, mom.ts_observance, feature.site_id, event_id)

        moms_entry = MonitoringMoms(
            moms_id=mom.manifestation_id,
            instance_id=instance_id,
            observance_ts=mom.ts_observance,
            reporter_id=2,
            remarks=mom.remarks,
            narrative_id=narrative_id,
            validator_id=mom.validator,
            op_trigger=mom.op_trigger
        )

        DB.session.add(moms_entry)


def main():
    events = get_events()

    for event in events:
        site_id = event.site_id
        to_add_new_event = False
        last_event_alert = None  # Variable of last event alert of the current
                                 # on-going routine event (if any)
        add_ts_end_on_last_event = False
        set_ts_start_on_next_alert_event = False
        ts_start_for_next_event = None
        event_start = event.event_start

        last_event = get_last_site_event(site_id)
        try:  # added this to catch if no events yet for site
            last_event_status = last_event.status

            if event.status == "routine":
                if last_event_status != 1:
                    to_add_new_event = True
                    add_ts_end_on_last_event = True
                    set_ts_start_on_next_alert_event = True
                else:
                    last_event_alert = get_last_event_alert(
                        last_event.event_id)
            else:
                to_add_new_event = True
                add_ts_end_on_last_event = True

            if add_ts_end_on_last_event:
                event_alert_of_last_event = get_last_event_alert(last_event.event_id)

                # first_release = event.releases.first()
                # event_alert_of_last_event.ts_end = first_release.data_timestamp

                if last_event_status == -1:
                    ts_end = event_alert_of_last_event.ts_start
                else:
                    first_release = event.releases.first()
                    ts_end = first_release.data_timestamp

                event_alert_of_last_event.ts_end = ts_end

            ts_start_for_next_event = None
            if set_ts_start_on_next_alert_event:
                event_start = last_event.validity
                ts_start_for_next_event = ts_end
        except:
            to_add_new_event = True

        if to_add_new_event:
            new_event = MonitoringEvents(
                event_id=event.event_id,
                site_id=site_id,
                event_start=event_start,
                validity=event.validity,
                status=EVENT_STATUS[event.status]
            )

            DB.session.add(new_event)

        old_narratives = OldNarratives.query.options(DB.raiseload("*")).filter_by(event_id=event.event_id).all()
        if old_narratives:
            for row in old_narratives:
                insert_to_narratives_table(row.narrative, row.timestamp, row.site_id, row.event_id)

        releases = event.releases.all()
        process_event_releases(releases, site_id, last_event_alert, ts_start_for_next_event)

    # For testing - Inserts moms without release_id
    insert_non_triggering_to_moms_table()

    DB.session.commit()

# def main():
#     rr = OldMonitoringReleases
#     ts = datetime.strptime("2019-12-20 11:30:00", "%Y-%m-%d %H:%M:%S")
#     a = rr.query.filter(rr.data_timestamp == ts).all()

#     for row in a:
#         old_event_id = row.event_id
#         _, trigger_list = get_public_alert_level(
#             row.internal_alert_level, return_triggers=True, include_ND=True)

#         c = MonitoringEvents.query.filter_by(event_id=old_event_id).first()
#         if c:
#             last_event_alert = get_last_event_alert(old_event_id)

#             new_release = MonitoringReleases(
#                 release_id=row.release_id,
#                 event_alert_id=last_event_alert.event_alert_id,
#                 data_ts=row.data_timestamp,
#                 trigger_list=trigger_list,
#                 release_time=row.release_time,
#                 bulletin_number=row.bulletin_number
#             )

#             publisher_ct, publisher_mt = prepare_release_publishers(
#                 row.release_id, row)

#             DB.session.bulk_save_objects(
#                 [new_release, publisher_ct, publisher_mt])

#             print("not routine", row.data_timestamp)
#         else:
#             # old_event = OldMonitoringEvents.query.filter_by(
#             #     event_id=old_event_id).first()
#             # new_event = get_last_site_event(old_event.site_id)
#             # event_alert = get_last_event_alert(new_event.event_id)

#             # new_release = MonitoringReleases(
#             #     release_id=row.release_id,
#             #     event_alert_id=event_alert.event_alert_id,
#             #     data_ts=row.data_timestamp,
#             #     trigger_list=trigger_list,
#             #     release_time=row.release_time,
#             #     bulletin_number=row.bulletin_number
#             # )

#             # publisher_ct, publisher_mt = prepare_release_publishers(
#             #     row.release_id, row)

#             # DB.session.bulk_save_objects(
#             #     [new_release, publisher_ct, publisher_mt])

#             print("routine find last routine and event_alert", row.data_timestamp)

#     DB.session.commit()


def process_event_releases(releases, site_id, last_event_alert, ts_start_for_next_event):
    for release in releases:
        _, trigger_list = get_public_alert_level(
            release.internal_alert_level, return_triggers=True, include_ND=True)

        if last_event_alert is None or ts_start_for_next_event is not None:
            event_alert_id, trigger_list = insert_event_alert(
                release, ts_start_for_next_event)
        else:  # created so that routine releases with no event alerts in between
            # will belong to same event_alert_ids
            event_alert_id = last_event_alert.event_alert_id

        release_id = release.release_id

        new_release = MonitoringReleases(
            release_id=release_id,
            event_alert_id=event_alert_id,
            data_ts=release.data_timestamp,
            trigger_list=trigger_list,
            release_time=release.release_time,
            bulletin_number=release.bulletin_number
        )

        publisher_ct, publisher_mt = prepare_release_publishers(
            release_id, release)

        DB.session.bulk_save_objects(
            [new_release, publisher_ct, publisher_mt])

        triggers = release.triggers

        process_event_triggers(triggers, release, site_id)


def process_event_triggers(triggers, release, site_id):
    for trigger in triggers:
        trigger_id = trigger.trigger_id

        internal_symbol = get_internal_symbol(trigger)
        internal_sym_id = internal_symbol.internal_sym_id

        new_trigger = MonitoringTriggers(
            trigger_id=trigger_id,
            release_id=release.release_id,
            internal_sym_id=internal_sym_id,
            ts=trigger.timestamp,
            info=trigger.info
        )

        trigger_source = internal_symbol.trigger_symbol.trigger_hierarchy.trigger_source
        if trigger_source in ["on demand", "earthquake", "moms"]:
            od_id = None
            eq_id = None
            has_moms = None

            if trigger_source == "on demand":
                od_id = insert_to_on_demand_table(trigger, site_id)
            elif trigger_source == "earthquake":
                eq_id = insert_to_eq_table(trigger)
            elif trigger_source == "moms":
                has_moms = True
                id_list = insert_to_moms_table(release)

            trigger_misc = MonitoringTriggersMisc(
                trigger_id=trigger_id,
                od_id=od_id,
                eq_id=eq_id,
                has_moms=has_moms)

            DB.session.add(trigger_misc)
            DB.session.flush()

            if has_moms:
                for i in id_list:
                    moms_release = MonitoringMomsReleases(
                        trig_misc_id=trigger_misc.trig_misc_id,
                        moms_id=i
                    )

                    DB.session.add(moms_release)

        DB.session.add(new_trigger)


def prepare_release_publishers(release_id, release):
    publisher_mt = MonitoringReleasePublishers(
        release_id=release_id, user_id=release.reporter_id_mt, role="mt"
    )

    publisher_ct = MonitoringReleasePublishers(
        release_id=release_id, user_id=release.reporter_id_ct, role="ct"
    )
    return publisher_ct, publisher_mt


if __name__ == "__main__":
    CONFIG_NAME = os.getenv("FLASK_CONFIG")
    create_app(CONFIG_NAME, skip_memcache=True,
                 skip_websocket=True)
    main()
