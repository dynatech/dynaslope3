"""
    Utility file for Narratives table.
    Contains functions essential in accessing and saving into narratives table.
"""
from connection import DB
from src.models.narratives import Narratives


def get_narratives(filter_type=None, filter_id=None, start=None, end=None):
    """
        Returns one or more row/s of narratives.

        Args:
            filter_type (String) - You can either use narrative_id or event_id.
            filter_id (Alphanumeric) - id, id + timestamp, or "null" for narratives with no event
    """
    nar = Narratives

    if filter_type == "narrative_id":
        narratives = nar.query.filter(nar.id == filter_id).all()

    elif filter_type == "event_id":
        if filter_id == "time":
            filter_var = nar.event_id == filter_id and (
                nar.timestamp >= start and nar.timestamp <= end)
        elif filter_id == "null":
            filter_var = nar.event_id.is_(None)
        else:
            filter_var = nar.event_id == filter_id

    else:
        filter_var = ""

    narratives = nar.query.order_by(DB.desc(nar.event_id)).filter(
        filter_var).all()

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
