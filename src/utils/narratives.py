"""
    Utility file for Narratives table.
    Contains functions essential in accessing and saving into narratives table.
"""

from datetime import datetime, timedelta
from connection import DB
from src.models.narratives import Narratives


def get_narratives(event_id=None, start=None, end=None):
    """
        Returns one or more row/s of narratives.

        Args:
            event_id (Integer) - 
            start (datetime class) - 
            end (datetime class) - 
    """
    nar = Narratives

    # Convert timestamp string to Datetime
    start = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
    end = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")

    if start is None and end is None:
        time_filter = ""
    else:
        time_filter = nar.timestamp.between(start, end)

    narratives = nar.query.order_by(
        DB.desc(nar.timestamp)).filter(nar.event_id == event_id).filter(time_filter).all()

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
