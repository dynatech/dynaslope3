"""
    Utility file for Narratives table.
    Contains functions essential in accessing and saving into narratives table.
"""

from datetime import datetime, timedelta
from connection import DB
from src.models.narratives import Narratives


def get_narratives(offset, limit, start, end):
    """
        Returns one or more row/s of narratives.

        Args:
            event_id (Integer) - 
            start (datetime) - 
            end (datetime) - 
    """
    nar = Narratives

    if start is None and end is None:
        time_filter = ""
    else:
        time_filter = nar.timestamp.between(start, end)

    narratives = nar.query.order_by(
        DB.desc(nar.timestamp)).limit(limit).offset(offset).all()

    return narratives


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
