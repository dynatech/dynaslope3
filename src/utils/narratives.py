"""
    Utility file for Narratives table.
    Contains functions essential in accessing and saving into narratives table.
"""

from datetime import datetime, timedelta
from connection import DB
from src.models.narratives import Narratives


def get_narratives(offset=None, limit=None, start=None, end=None, site_ids=None, include_count=None, search=None, event_id=None):
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


    if start is None and end is None:
        pass
    else:
        base = base.filter(nar.timestamp.between(start, end))

    if not event_id:
        if site_ids:
            base = base.filter(nar.site_id.in_(site_ids))

        if search != "":
            base = base.filter(nar.narrative.ilike("%" + search + "%"))

        narratives = base.order_by(
            DB.desc(nar.timestamp)).limit(limit).offset(offset).all()

        if include_count:
            count = get_narrative_count(base)
            return [narratives, count]
        else:
            return narratives
    else:
        narratives = base.order_by(DB.asc(nar.timestamp)).filter(nar.event_id == event_id).all()
        return narratives


def get_narrative_count(q):
    count_q = q.statement.with_only_columns([DB.func.count()]).order_by(None)
    count = q.session.execute(count_q).scalar()

    return count


def write_narratives_to_db(site_id, timestamp, narrative, event_id=None):
    """
    Insert method for narratives table. Returns new narrative ID.

    Args:
        site_id (Integer)
        event_id (Integer) - not required
        timestamp  (DateTime)
        narratives (String)

    Returns narrative ID.
    """
    try:
        narrative = Narratives(
            site_id=site_id,
            event_id=event_id,
            timestamp=timestamp,
            narrative=narrative
        )
        DB.session.add(narrative)
        DB.session.flush()

        new_narrative_id = narrative.id
    except Exception as err:
        print(err)
        DB.rollback()
        raise

    return new_narrative_id


# def get_narratives_based_on_timestamps(start_time, end_time):
#     print()
