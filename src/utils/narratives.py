"""
    Utility file for Narratives table.
    Contains functions essential in accessing and saving into narratives table.
"""

from connection import DB
from src.models.narratives import Narratives
from src.models.monitoring import MonitoringEvents, MonitoringEventAlerts
from src.utils.extra import (
    var_checker, retrieve_data_from_memcache, get_process_status_log)


def get_narrative_text(narrative_type, details):
    """
    """
    narrative_text = ""
    tag = details["tag"]

    try:
        data = details['additional_data']
    except KeyError:
        data = ""

    if narrative_type == "sms_tagging":
        if tag == "#GroundMeas":
            narrative_text = f"Received surficial ground data from {data}"
        elif tag == "#GroundObs":
            narrative_text = (f"Received onsite ground observation data "
                              f"from {data}")
        elif tag == "#EwiResponse":
            narrative_text = f"EWI SMS acknowledged by {data}"
        elif tag == "#EwiResponse":
            narrative_text = f"EWI SMS acknowledged by {data}"
        elif tag == "#EwiMessage":
            narrative_text = f"Sent EWI SMS (manually created and tagged)"
        elif tag == "#RainInfo":
            narrative_text = f"Sent rainfall information to {data}"
        elif tag == "#AlertFYI":
            narrative_text = f"Sent FYI message to RUS, ASD, RANK, and Dyna-GLOBE-GSM re {data}"

    return narrative_text


def delete_narratives_from_db(narrative_id):
    """
    """
    print(get_process_status_log("delete_narratives_from_db", "start"))
    try:
        narrative_for_delete = Narratives.query.filter(
            Narratives.id == narrative_id).first()
        DB.session.delete(narrative_for_delete)
        # DB.session.commit()
        print(get_process_status_log("delete_narratives_from_db", "end"))
    except:
        return "Failed"
        print(get_process_status_log("delete_narratives_from_db", "fail"))
        raise

    return "Success"


def find_narrative_event_id(timestamp, site_id):
    """
    """
    me = MonitoringEvents
    mea = MonitoringEventAlerts
    event_id = None

    filtering = DB.or_(DB.and_(
        mea.ts_start <= timestamp, timestamp <= mea.ts_end), DB.and_(
        mea.ts_start <= timestamp, mea.ts_end.is_(None)))

    event_alert = mea.query.options(DB.joinedload("event", innerjoin=True), DB.raiseload("*")) \
        .order_by(DB.desc(mea.event_alert_id)) \
        .join(me).filter(filtering).filter(me.site_id == site_id) \
        .first()

    if event_alert:
        event_id = event_alert.event.event_id

    return event_id


def get_narratives(
        offset=None, limit=None, start=None,
        end=None, site_ids=None, include_count=None,
        search=None, event_id=None, raise_site=True,
        order_by="timestamp", order="desc"
):
    """
        Returns one or more row/s of narratives.

        Args:
            offset (Integer) -
            limit (Integer) -
            start () -
            end () -
            site_ids (Integer) -
            include_count (Boolean)
            search (String)
            event_id (Integer)
    """

    nar = Narratives
    base = nar.query

    if raise_site:
        base = base.options(DB.raiseload("site"))
    if start is None and end is None:
        pass
    else:
        base = base.filter(nar.timestamp.between(start, end))

    order_attr = nar.timestamp
    if order_by == "id":
        order_attr = nar.id

    ordering = DB.desc(order_attr)
    if order == "asc":
        ordering = DB.asc(order_attr)

    base = base.order_by(ordering)

    if not event_id:
        if site_ids:
            base = base.filter(nar.site_id.in_(site_ids))

        if search != "":
            base = base.filter(nar.narrative.ilike("%" + search + "%"))

        nar_base = base.limit(limit).offset(offset)
    else:
        nar_base = base.filter(
            nar.event_id == event_id)

    narratives = nar_base.all()
    DB.session.commit()

    if include_count:
        count = get_narrative_count(base)
        return [narratives, count]
    else:
        return narratives


def get_narrative_count(q):
    count_q = q.statement.with_only_columns([DB.func.count()]).order_by(None)
    count = q.session.execute(count_q).scalar()

    return count


def write_narratives_to_db(site_id, timestamp, narrative, type_id, user_id, event_id=None):
    """
    Insert method for narratives table. Returns new narrative ID.

    Args:
        site_id (Integer)
        event_id (Integer)
        timestamp  (DateTime)
        narratives (String)

    Returns narrative ID.
    """

    # print(get_process_status_log("write_narratives_to_db", "start"))
    try:
        narrative = Narratives(
            site_id=site_id,
            event_id=event_id,
            timestamp=timestamp,
            narrative=narrative,
            type_id=type_id,
            user_id=user_id
        )
        DB.session.add(narrative)
        DB.session.commit()

        new_narrative_id = narrative.id
    except Exception as err:
        print(err)
        DB.session.rollback()
        raise

    # print(get_process_status_log("write_narratives_to_db", "end"))

    return new_narrative_id


def update_narratives_on_db(narrative_id, site_id, timestamp, narrative, type_id, user_id, event_id=None):
    """
    """
    print(get_process_status_log("update_narratives_on_db", "start"))
    try:
        narrative_row = Narratives.query.filter_by(id=narrative_id).first()

        if narrative_row:
            narrative_row.site_id = site_id
            narrative_row.timestamp = timestamp
            narrative_row.narrative = narrative
            narrative_row.type_id = type_id
            narrative_row.user_id = user_id
            narrative_row.event_id = event_id
        else:
            print(get_process_status_log("Narrative not found!", "fail"))
            raise Exception("Narrative not found!")

    except Exception as err:
        print(err)
        raise

    return "Success"

# def get_narratives_based_on_timestamps(start_time, end_time):
#     print()
