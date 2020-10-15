"""
End of Shift Module Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from connection import DB
from config import APP_CONFIG
from instance.config import EMAILS

from src.models.monitoring import (
    MonitoringEventsSchema, EndOfShiftAnalysis
)

from src.utils.monitoring import (
    get_monitoring_events, get_internal_alert_symbols, build_internal_alert_level,
    get_monitoring_releases, get_monitoring_triggers, check_if_has_moms_or_earthquake_trigger,
    write_eos_data_analysis_to_db, get_active_monitoring_events)
from src.utils.emails import get_email_subject
from src.utils.narratives import get_narratives
from src.utils.subsurface import check_if_subsurface_columns_has_data
from src.utils.surficial import (
    check_if_site_has_active_surficial_markers, get_surficial_data,
    get_surficial_markers, get_marker_alerts)
from src.utils.chart_rendering import render_charts
from src.utils.extra import var_checker


END_OF_SHIFT_BLUEPRINT = Blueprint("end_of_shift_blueprint", __name__)

BASIS_TO_RAISE = {
    "D": ["a monitoring request of the LGU/LEWC", "On-Demand"],
    "R": ["accumulated rainfall value exceeding threshold level", "Rainfall"],
    "E": ["a detection of landslide-triggering earthquake", "Earthquake"],
    "g": ["significant surficial movement", "LEWC Ground Measurement"],
    "s": ["significant underground movement", "Subsurface Data"],
    "G": ["critical surficial movement", "LEWC Ground Measurement"],
    "S": ["critical underground movement", "Subsurface Data"],
    "m": ["significant movement observed as manifestation", "Manifestation"],
    "M": ["critical movement observed as manifestation", "Manifestation"]
}


@END_OF_SHIFT_BLUEPRINT.route("/end_of_shift/download_eos_charts", methods=["POST"])
def download_eos_charts():
    """
    """
    json_data = request.get_json()

    response = render_charts(
        user_id=json_data["user_id"],
        site_code=json_data["site_code"],
        charts=json_data["charts"],
        file_name=json_data["file_name"]
    )

    return jsonify({
        "message": "success",
        "file_response": response,
        "status": True
    })


@END_OF_SHIFT_BLUEPRINT.route(
    "/end_of_shift/get_eos_email_details/<event_id>/<shift_ts_end>", methods=["GET"])
def get_eos_email_details(event_id, shift_ts_end, to_json=True):
    """
    Returns the filename, recipients, and subject
    """
    event = get_monitoring_events(event_id=event_id)
    event_start = event.event_start
    site_code = event.site.site_code

    # GET SUBJECT
    subject = get_email_subject(mail_type="eos", details={
        "site_code": site_code,
        "date": datetime.strftime(event_start, "%d %b %Y").upper()
    })

    # GET RECIPIENTS
    recipients = []
    if not recipients:
        if APP_CONFIG["is_live_mode"]:
            # PRODUCTION
            recipients.extend(EMAILS["director_and_head_emails"])
            recipients.extend(EMAILS["dynaslope_groups"])
        else:
            # DEVELOPMENT
            recipients = [EMAILS["dev_email"]]

    # GET FILENAME
    datetime_ts = datetime.strptime(shift_ts_end, "%Y-%m-%d %H:%M:%S")
    formatted_ts_end = datetime.strftime(datetime_ts, "%d%b%y_%I%p")

    file_name = f"{site_code.upper()}_{formatted_ts_end}".upper() + ".pdf"

    ret_obj = {
        "file_name": file_name,
        "recipients": recipients,
        "subject": subject
    }

    if to_json:
        return jsonify(ret_obj)

    return ret_obj


def extract_unique_release_events(releases_list):
    """
    Remove duplicates per unique event. Assuming there was
    an order_by data_ts desc in utils, only latest
    releases per event was attached.
    """
    unique_release_events = []
    unique_set = set({})
    for release in releases_list:
        event = release.event_alert.event

        # NOTE: This function rejects all ROUTINE events
        if event.status != 2:
            continue

        if release.data_ts + timedelta(minutes=30) > event.validity:
            continue

        event_id = event.event_id
        if not event_id in unique_set:
            unique_set.add(event_id)
            site = event.site
            unique_release_events.append({
                "site_id": site.site_id,
                "site_code": site.site_code,
                "temp": release
            })

    return unique_release_events


def get_end_of_shift_data_list(shift_start, shift_end, event_id=None):
    """
    NOTE: This is still a work-to-do.
    """

    if not isinstance(shift_start, datetime) and not isinstance(shift_end, datetime):
        try:
            shift_start = datetime.strptime(shift_start, "%Y-%m-%d %H:%M:%S")
            shift_end = datetime.strptime(shift_end, "%Y-%m-%d %H:%M:%S")
        except TypeError as t_e:
            print(t_e)
            raise

    ts_start = shift_start + timedelta(minutes=30)
    ts_end = shift_end - timedelta(hours=1)

    if event_id:
        releases_list = get_monitoring_releases(
            ts_start=ts_start, ts_end=ts_end,
            event_id=event_id, exclude_routine=True,
            load_options="end_of_shift")
    else:
        releases_list = get_monitoring_releases(
            ts_start=ts_start, ts_end=ts_end,
            exclude_routine=True, load_options="end_of_shift")

    # Get unique releases and segregate by site_code
    unique_release_dict_list = extract_unique_release_events(releases_list)

    # Events List
    for unique_release_dict in unique_release_dict_list:
        releases_list = []
        most_recent = []
        shift_triggers_list = []

        event_alert = unique_release_dict["temp"].event_alert
        event = event_alert.event
        alert_level = event_alert.public_alert_symbol.alert_level
        trig_list = get_monitoring_triggers(
            event_id=event.event_id, ts_start=ts_start,
            ts_end=ts_end, load_options="end_of_shift")
        trig_id_list = []
        for row in trig_list:
            if row.internal_sym_id not in trig_id_list:
                shift_triggers_list.append(row)
                trig_id_list.append(row.internal_sym_id)

        most_recent = get_monitoring_triggers(
            event_id=event.event_id, ts_start=shift_start -
            timedelta(hours=11, minutes=30),
            ts_end=shift_start, load_options="end_of_shift")

        eos_data = {
            "event_id": event.event_id,
            "event_start": event.event_start,
            "validity": event.validity,
            "alert_level": alert_level,
            "first_trigger_id": None,
            "first_trigger_info": "",
            "first_trigger_type": "",
            "most_recent": most_recent,
            "shift_triggers": shift_triggers_list,
            "internal_alert_level": build_internal_alert_level(
                alert_level,
                unique_release_dict["temp"].trigger_list
            )
        }

        first_trigger = get_monitoring_triggers(
            event_id=event.event_id, return_one=True,
            order_by_desc=False, load_options="end_of_shift")
        if first_trigger:
            trig_id = first_trigger.trigger_id
            shift_triggers_list = filter(
                lambda x: x.trigger_id != trig_id, shift_triggers_list)
            eos_data = {
                **eos_data,
                "shift_triggers": list(shift_triggers_list),
                "first_trigger_id": trig_id,
                "first_trigger_info": first_trigger.info,
                "first_trigger_type": get_internal_alert_symbols(first_trigger.internal_sym_id)
            }

        unique_release_dict["eos_data"] = eos_data

    return unique_release_dict_list


def wrap_get_monitoring_events(event_id):
    """
    Sample
    """
    event = get_monitoring_events(event_id=event_id)
    ev_data = MonitoringEventsSchema().dump(event).data
    return jsonify(ev_data)


def get_shift_start_info(shift_start_ts, shift_end_ts, eos_dict):
    """
    Prepare the start info of end-of-shift report.
    """
    # event_start, shift_start, shift_end, first_trigger_type, first_trigger_info, most_recent
    eos_data = eos_dict["eos_data"]
    event_start_ts = eos_data["event_start"]
    report_start_ts = datetime.strftime(event_start_ts, "%B %d, %Y, %I:%M %p")

    first_trigger_type = eos_data["first_trigger_type"]
    first_trigger_info = eos_data["first_trigger_info"]

    start_header = f"<b>SHIFT START:<br/>\
            {datetime.strftime(shift_start_ts, '%B %d, %Y, %I:%M %p')}</b>"

    if event_start_ts >= (shift_start_ts + timedelta(minutes=30)) and \
            event_start_ts <= (shift_end_ts - timedelta(minutes=30)):
        start_info = f"{start_header} <br />- Monitoring initiated on {report_start_ts} due to " \
            f"{BASIS_TO_RAISE[str(first_trigger_type)][0]} ({first_trigger_info})."
    else:
        part_a = f"- Event monitoring started on {report_start_ts} due to " \
            f"{BASIS_TO_RAISE[str(first_trigger_type)][0]} ({first_trigger_info})."
        part_b = ""
        most_recent_triggers = eos_data["most_recent"]

        if most_recent_triggers:
            part_b = "the following recent trigger/s: "
            part_b += "<ul>"
            for recent in most_recent_triggers:
                trigger_type = get_internal_alert_symbols(
                    recent.internal_sym_id)
                timestamp = recent.ts
                formatted_timestamp = datetime.strftime(
                    timestamp, "%B %d, %Y, %I:%M %p")
                info = recent.info

                part_b = f"{part_b}<li> {BASIS_TO_RAISE[trigger_type][1]} - alerted on \
                    {formatted_timestamp} due to {BASIS_TO_RAISE[trigger_type][0]} ({info})</li>"

            part_b += "</ul>"
        else:
            part_b = "no new alert triggers from previous shift.<br/>"

        start_info = f"{start_header} <br />- Monitoring continued with {part_b}- {part_a}"

    return start_info


def get_shift_end_info(end_ts, eos_dict):
    """
    Prepare the end info of end-of-shift report.
    """

    eos_data = eos_dict["eos_data"]
    shift_triggers = eos_data["shift_triggers"]
    validity = eos_data["validity"]
    validity = datetime.strftime(validity, '%B %d, %Y, %I:%M %p')
    internal_alert_level = eos_data["internal_alert_level"]

    if eos_data["alert_level"] == 0:
        end_info = f"- Alert <b>lowered to A0</b>; monitoring ended at <b> \
            {validity}</b>.<br/>"
    else:
        part_a = f"- The current internal alert level is <b> \
            {internal_alert_level}</b>.<br/>- "

        if shift_triggers:
            part_a += "The following alert trigger/s was/were encountered: "
            part_a += "<ul>"
            for shift_trigger in shift_triggers:
                trigger_type = get_internal_alert_symbols(
                    shift_trigger.internal_sym_id)
                timestamp = shift_trigger.ts
                info = shift_trigger.info

                part_a += f"<li> <b>{BASIS_TO_RAISE[trigger_type][1]} \
                    </b> - alerted on <b>{datetime.strftime(timestamp, '%B %d, %Y, %I:%M %p')}</b> due to \
                        {BASIS_TO_RAISE[trigger_type][0]} ({info})</li>"
            part_a += "</ul>"

        else:
            part_a += "No new alert triggers encountered.<br/>"
            part_a += "</ul>"

        con = (f"Monitoring will continue until <b>{validity}</b>.<br/>")

        end_info = f"{part_a}- {con}"

    shift_end = f"<b>SHIFT END:<br/>{datetime.strftime(end_ts, '%B %d, %Y, %I:%M %p')}</b><br/>"
    end_info = shift_end + end_info

    return end_info


def process_eos_data_analysis(
        start_ts, event_id, subsurface_columns,
        has_markers, surficial_data, site_id):
    data_analysis = get_eos_data_analysis(start_ts, event_id)

    if not data_analysis:
        string = "<strong>DATA ANALYSIS:</strong><br />"

        subs = "No active subsurface sensors on site"
        if subsurface_columns:
            subs = ""
            has_data = []
            no_data = []
            for sc in subsurface_columns:
                if sc["has_data"]:
                    has_data.append(sc)
                else:
                    no_data.append(sc)

            if no_data:
                cols = list(
                    map(lambda x: x["logger"]["logger_name"].upper(), no_data))
                joiner = "" if len(cols) < 2 else " and "
                cols = joiner.join([", ".join(cols[0:-1]), cols[-1]])
                subs += f"No available data from <b>{cols}</b>. "

            for hd in has_data:
                subs += f'<b>{hd["logger"]["logger_name"].upper()} - [write analysis here]. </b>'

        string += f"- Subsurface data: {subs}"

        surf = "No active ground markers on site"
        if has_markers:
            surf = "No surficial data received from LEWC"
            if surficial_data:
                surf_data = surficial_data[0]
                alert_data = get_marker_alerts(site_id, surf_data.ts)
                markers = get_surficial_markers(site_id=site_id)
                latest_ts = surf_data.ts

                data_list = []
                for row in alert_data:
                    name_row = next(
                        x for x in markers if x.marker_id == row.marker_data.marker_id)
                    temp = {
                        "marker_name": name_row.marker_name,
                        "change": str(row.displacement) + "cm"
                    }
                    data_list.append(temp)

                delta = timedelta(hours=alert_data[0].time_delta)
                last_sending_ts = latest_ts - timedelta(seconds=delta.seconds)

                surf = (f"Latest data received last <b>"
                        f"{datetime.strftime(latest_ts, '%B %d, %Y, %I:%M %p')}</b>. ")
                surf += (f"Displacement of marker(s) from last data sending <b>"
                         f"({datetime.strftime(last_sending_ts, '%B %d, %Y, %I:%M %p')}):</b> ")
                surf += ", ".join(str("<b>" + x["marker_name"]
                                      + " -> " + x["change"] + "</b>") for x in data_list)

        string += f"<br/>- Surficial data: {surf}"

        moms_trig, eq_trig = check_if_has_moms_or_earthquake_trigger(event_id)

        if moms_trig or not has_markers:
            string += "<br/>- Manifestation of movement data: "
        if eq_trig:
            string += "<br/>- Earthquake data: "

        string += "<br/>- Rainfall data:"
        data_analysis = string

    return data_analysis


def get_eos_data_analysis(shift_start=None, event_id=None, analysis_only=True):
    """
        Returns all data analysis based on a specified filter.
        Args:
            --
    """

    return_data = ""
    eosa = EndOfShiftAnalysis
    base_query = eosa.query.options(DB.raiseload("*"))
    first_only = False

    if shift_start:
        base_query = base_query.filter(eosa.shift_start == shift_start)
        first_only = True

    if event_id:
        base_query = base_query.filter(eosa.event_id == event_id)

    if first_only:
        eos_data_analysis = base_query.first()
    else:
        eos_data_analysis = base_query.all()

    return_data = eos_data_analysis
    if eos_data_analysis and analysis_only:
        return_data = eos_data_analysis.analysis

    return return_data


def get_eos_narratives(start_timestamp, end_timestamp, event_id):
    """
    Uses a utilities function to get the Narratives of a specific shift.

    Args:
        start_timestamp - DateTime
        end_timestamp - DateTime
    """
    start_timestamp = start_timestamp + timedelta(minutes=30)
    end_timestamp = end_timestamp + timedelta(minutes=30)

    shift_narratives = get_narratives(
        event_id=event_id, start=str(start_timestamp),
        end=str(end_timestamp), order="asc")

    return shift_narratives


def get_formatted_shift_narratives(shift_narratives):
    """
    Format the narratives as needed.
    """
    narrative_string = "<strong>NARRATIVES:</strong><br />"
    for narrative in shift_narratives:
        narrative_string = narrative_string + \
            str(narrative.timestamp.strftime("%B %d, %Y  %I:%M %p")) + " - " + \
            str(narrative.narrative) + " <br/>"

    return narrative_string


def get_release_publishers_initials(first_name, last_name):
    """
    Return the MT and CT publishers
    """

    initials = first_name[0].upper() + last_name[0].upper()

    return initials


def process_eos_list(start_ts, end_ts, eos_data_list):
    """
    """
    eos_list = []
    # GET THE INITIALS FOR THE END OF SHIFT REPORTERS
    for eos_dict in eos_data_list:
        eos_data = eos_dict["eos_data"]
        event_id = eos_data["event_id"]
        validity = eos_data["validity"]
        site_code = eos_dict["site_code"]
        site_id = eos_dict["site_id"]
        # Get the EOS publishers
        for publisher in eos_dict["temp"].release_publishers:
            user_details = publisher.user_details
            pub_firstname = user_details.first_name
            pub_lastname = user_details.last_name

            initials = get_release_publishers_initials(
                pub_firstname, pub_lastname)

            if publisher.role == "mt":
                mt_initials = initials
            else:
                ct_initials = initials

        # Got the publishers
        publishers = {
            "mt": mt_initials,
            "ct": ct_initials
        }

        subsurface_columns = check_if_subsurface_columns_has_data(
            site_code, start_ts, end_ts)
        has_markers = check_if_site_has_active_surficial_markers(
            site_code=site_code)

        has_surficial_data = False
        surficial_data = None
        if has_markers:
            surficial_data = get_surficial_data(site_code=site_code, ts_order="desc",
                                                start_ts=start_ts, end_ts=end_ts,
                                                anchor="marker_observations")
            if surficial_data:
                has_surficial_data = True

        eos_head = f"<strong>END-OF-SHIFT REPORT FOR {site_code.upper()} <br/>({publishers['mt']}, \
            {publishers['ct']})</strong><br/>"
        shift_start_info = get_shift_start_info(start_ts, end_ts, eos_dict)
        shift_end_info = get_shift_end_info(end_ts, eos_dict)
        data_analysis = process_eos_data_analysis(
            start_ts, event_id, subsurface_columns,
            has_markers, surficial_data, site_id)
        raw_narratives = get_eos_narratives(start_ts, end_ts, event_id)
        narratives = get_formatted_shift_narratives(raw_narratives)

        eos_report_dict = {
            "site_code": site_code,
            "event_id": event_id,
            "validity": datetime.strftime(validity, "%Y-%m-%d %H:%M:%S"),
            "eos_head": eos_head,
            "shift_start_info": shift_start_info,
            "shift_end_info": shift_end_info,
            "data_analysis": data_analysis,
            "narratives": narratives,
            "subsurface_columns": subsurface_columns,
            "has_markers": has_markers,
            "has_surficial_data": has_surficial_data
        }
        eos_list.append(eos_report_dict)

    return eos_list


@END_OF_SHIFT_BLUEPRINT.route(
    "/end_of_shift/get_end_of_shift_reports/<shift_start>", methods=["GET"])
@END_OF_SHIFT_BLUEPRINT.route(
    "/end_of_shift/get_end_of_shift_reports/<shift_start>/<event_id>", methods=["GET"])
def get_end_of_shift_reports(shift_start, event_id=None):
    """
    This function returns a dictionary containing all
    4 major parts of the end of shift report.

    Returns a dictionary.
    """

    start_ts = datetime.strptime(shift_start, "%Y-%m-%d %H:%M:%S")
    end_ts = start_ts + timedelta(hours=13)

    if event_id:
        eos_dictionary = get_end_of_shift_data_list(start_ts, end_ts, event_id)
    else:
        eos_dictionary = get_end_of_shift_data_list(start_ts, end_ts)

    processed_eos_list = process_eos_list(start_ts, end_ts, eos_dictionary)
    return_json = json.dumps(processed_eos_list)

    return return_json


@END_OF_SHIFT_BLUEPRINT.route("/end_of_shift/save_eos_data_analysis", methods=["POST"])
def save_eos_data_analysis():
    """
    Saves the given data analysis
    """
    json_data = request.get_json()
    shift_ts = json_data["shift_ts"]
    event_id = json_data["event_id"]
    analysis = json_data["dataAnalysis"]

    response = write_eos_data_analysis_to_db(event_id, shift_ts, analysis)

    return response["message"]


@END_OF_SHIFT_BLUEPRINT.route("/end_of_shift/get_narrative/<shift_start>/<event_id>", methods=["GET"])
def get_narrative_per_event_id(shift_start, event_id=None):
    """
    Get narrative per event id
    """
    start_ts = datetime.strptime(shift_start, "%Y-%m-%d %H:%M:%S")
    end_ts = start_ts + timedelta(hours=13)

    raw_narratives = get_eos_narratives(start_ts, end_ts, event_id)
    narratives = get_formatted_shift_narratives(raw_narratives)

    return jsonify(narratives)


@END_OF_SHIFT_BLUEPRINT.route("/end_of_shift/get_active_events", methods=["GET"])
def get_active_events():
    """
    Get active events
    """

    active_events = get_active_monitoring_events()
    site_list = []
    for row in active_events:
        alert_level = row.public_alert_symbol.alert_level
        site_list.append({
            "site_id": row.event.site.site_id,
            "site_code": row.event.site.site_code,
            "alert_level": alert_level
        })
    return jsonify(site_list)
