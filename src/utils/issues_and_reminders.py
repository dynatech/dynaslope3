"""
    Utility file for IssuesAndReminders table.
    Contains functions essential in accessing and saving into narratives table.
"""

from connection import DB
from sqlalchemy.orm import joinedload, raiseload, Load
from datetime import datetime
# from src.models.monitoring import IssuesAndReminders
from src.models.issues_and_reminders import IssuesAndReminders, IssuesRemindersPostings
from src.utils.monitoring import get_current_monitoring_instance_per_site
from src.utils.extra import (
    var_checker, retrieve_data_from_memcache, get_process_status_log,
)


def write_iar_transaction_entry(iar_id, is_event_entry, site_id=None):
    """
    Write the required transaction entry for each
    issue and reminder written

    Args:
        iar_id
        detail
        user_id
        ts_posted
        ts_posted_until
        resolved_by
        resolution
    """
    event_id = None
    if is_event_entry:
        event = get_current_monitoring_instance_per_site(site_id)
        if event:
            event_id = event.event_id

    new_issue = IssuesRemindersPostings(
        event_id=event_id,
        site_id=site_id,
        iar_id=iar_id
    )

    DB.session.add(new_issue)
    DB.session.flush()

    new_issue_id = new_issue.iar_id

    return new_issue_id


def write_issue_reminder_to_db(iar_id, detail, user_id, ts_posted, ts_posted_until, resolved_by, resolution, site_id_list, is_event_entry):
    """
    Insert method for issues_and_reminders table. Returns new issues_and_reminder ID.

    Args:
        detail
        user_id
        ts_posted
        ts_posted_until
        resolved_by
        resolution
        is_event_entry
    """

    if not ts_posted:
        ts_posted = datetime.now()
    else:
        if not isinstance(ts_posted, datetime):
            ts_posted = datetime.strptime(ts_posted, "%Y-%m-%d %H:%M:%S")
        if not isinstance(ts_posted_until, datetime) and ts_posted_until:
            ts_posted_until = datetime.strptime(ts_posted_until, "%Y-%m-%d %H:%M:%S")

    try:
        issue_reminder_row = IssuesAndReminders.query.filter_by(iar_id=iar_id).first()
        var_checker("issue_reminder_row", issue_reminder_row, True)

        if issue_reminder_row:
            print(get_process_status_log("update_issue_reminder_on_db", "start"))
            issue_reminder_row.detail = detail
            issue_reminder_row.user_id = user_id
            issue_reminder_row.ts_posted = ts_posted
            issue_reminder_row.ts_posted_until = ts_posted_until
            issue_reminder_row.resolved_by = resolved_by
            issue_reminder_row.resolution = resolution
            issue_reminder_row.site_id_list = site_id_list
            issue_reminder_row.is_event_entry = is_event_entry

            print(get_process_status_log("update_issue_reminder_on_db", "end"))
        else:
            print(get_process_status_log("write_issue_reminder_to_db", "start"))

            issue_and_reminder = IssuesAndReminders(
                detail=detail,
                user_id=user_id,
                ts_posted=ts_posted,
                ts_posted_until=ts_posted_until,
                resolved_by=resolved_by,
                resolution=resolution
            )
            var_checker("issue_and_reminder", issue_and_reminder, True)
            DB.session.add(issue_and_reminder)
            DB.session.flush()
            new_issue_and_reminder_id = issue_and_reminder.iar_id

            # Write the transaction log
            var_checker("site_id_list", site_id_list, True)
            if site_id_list:
                for site_id in site_id_list:
                    write_iar_transaction_entry(new_issue_and_reminder_id, is_event_entry=is_event_entry, site_id=site_id)
            else:
                write_iar_transaction_entry(new_issue_and_reminder_id, is_event_entry=False, site_id=None)

            print(get_process_status_log("write_issue_reminder_to_db", "end"))

    except Exception as err:
        print(err)
        raise

    return "success"


def get_issues_and_reminders(offset=None, limit=None, start=None, end=None, site_ids=None, include_count=None, search=None, event_id=None, include_expired=None):
    """
        Returns one or more row/s of narratives.

        Args:
            offset (Integer) -
            limit (Integer) -
            start () -
            end () -
            include_count (Boolean)
            search (String)
            event_id (Integer)
    """
    print(get_process_status_log("get_issues_and_reminders", "start"))
    var_checker("include_expired", include_expired, True)

    iar = IssuesAndReminders
    irp = IssuesRemindersPostings
    # base = DB.session.query(iar)
    base = DB.session.query(iar).options(joinedload(iar.postings).joinedload(irp.event))
    return_data = None

    if start and end:
        base = base.filter(iar.ts_posted.between(start, end))

    if not event_id:
        if search != "":
            base = base.filter(iar.detail.ilike("%" + search + "%"))

        if not include_expired:
            base = base.filter(iar.ts_posted_until > datetime.now());
        issues_and_reminders = base.order_by(DB.desc(iar.ts_posted)).limit(limit).offset(offset).all()
        DB.session.commit()

        if include_count:
            count = get_issues_count(base)
            return_data = [issues_and_reminders, count]
        else:
            return_data = issues_and_reminders
    else:
        issues_and_reminders = base.order_by(DB.desc(iar.timestamp)).filter(iar.event_id == event_id).all()
        DB.session.commit()
        return_data = issues_and_reminders

    print(get_process_status_log("get_issues_and_reminders", "end"))
    return return_data


def get_issues_count(q):
    count_q = q.statement.with_only_columns([DB.func.count()]).order_by(None)
    count = q.session.execute(count_q).scalar()

    return count
