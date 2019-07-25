"""
End of Shift Module Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

import json
from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from src.models.monitoring import (MonitoringEventsSchema, EndOfShiftAnalysis)
from src.utils.monitoring import (
    get_monitoring_events, get_internal_alert_symbols, build_internal_alert_level)
from src.utils.narratives import (get_narratives)


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


def get_end_of_shift_data(shift_start, shift_end, event_id):
    """
    NOTE: This is still a work-to-do.
    """

    event = get_monitoring_events(event_id=event_id)
    event_alerts = event.event_alerts

    event_alerts_list = []
    releases_list = []
    triggers_list = []
    most_recent = []
    shift_triggers_list = []

    for event_alert in event_alerts:
        event_alerts_list.append(event_alert)
        releases = event_alert.releases.all()

        for release in releases:
            releases_list.append(release)
            triggers = release.triggers

            for trigger in triggers:
                triggers_list.append(trigger)
                if shift_start <= trigger.ts and trigger.ts <= shift_end:
                    shift_triggers_list.append(trigger)
                elif trigger.ts <= shift_start and trigger.ts >= \
                        shift_start - timedelta(hours=12):
                    most_recent.append(trigger)

    eos_data = {
        "event": event,
        "latest_event_alert": event_alerts_list[-1],
        "releases": releases_list,
        "triggers": triggers_list,
        "most_recent": most_recent,
        "first_trigger": triggers_list[0],
        "first_trigger_info": triggers_list[0].info,
        "first_trigger_type": get_internal_alert_symbols(triggers_list[0].internal_sym_id),
        "shift_triggers": shift_triggers_list,
        "internal_alert_level": build_internal_alert_level(
            event_alerts_list[-1].public_alert_symbol.alert_level, releases_list[-1].trigger_list)
    }

    return eos_data


def wrap_get_monitoring_events(event_id):
    """
    Sample
    """
    event = get_monitoring_events(event_id=event_id)
    ev_data = MonitoringEventsSchema().dump(event).data
    return jsonify(ev_data)


def get_shift_start_info(shift_start_ts, shift_end_ts, eos_data):
    """
    Prepare the start info of end-of-shift report.
    """
    # event_start, shift_start, shift_end, first_trigger_type, first_trigger_info, most_recent
    event_start_ts = eos_data["event"].event_start

    report_start_ts = datetime.strftime(event_start_ts, "%B %d, %Y, %I:%M %p")

    first_trigger_type = eos_data["first_trigger_type"]
    first_trigger_info = eos_data["first_trigger_info"]

    if event_start_ts >= (shift_start_ts + timedelta(minutes=30)) and \
            event_start_ts <= (shift_end_ts - timedelta(minutes=30)):
        start_info = f"Monitoring initiated on {report_start_ts} due to \
            {BASIS_TO_RAISE[str(first_trigger_type)][0]} ({first_trigger_info})."

    else:
        part_a = f"Event monitoring started on {report_start_ts} due to \
            {BASIS_TO_RAISE[str(first_trigger_type)][0]} ({first_trigger_info})."
        part_b = ""
        # if len(eos_data["most_recent"]) > 0:
        if not eos_data["most_recent"]:
            part_b = "the following recent trigger/s: "
            part_b += "<ul>"

            recent = eos_data["most_recent"][-1]
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

        start_header = f"<b>SHIFT START:<br/>\
            {datetime.strftime(shift_start_ts, '%B %d, %Y, %I:%M %p')}</b>"
        start_info = f"{start_header} <br />- Monitoring continued with {part_b}- {part_a}"

    return start_info


def get_shift_end_info(end_ts, eos_data):
    """
    Prepare the end info of end-of-shift report.
    """
    shift_triggers = eos_data["shift_triggers"]
    validity = eos_data["event"].validity
    internal_alert_level = eos_data["internal_alert_level"]

    if eos_data["latest_event_alert"].pub_sym_id == 1:
        end_info = f"- Alert <b>lowered to A0</b>; monitoring ended at <b> \
            {validity}</b>.<br/>"

    else:
        part_a = f"The current internal alert level is <b> \
            {internal_alert_level}</b>.<br/>- "
        # if shift_triggers != "" and len(shift_triggers) != 0:
        if shift_triggers != "" and not shift_triggers:
            part_a += "The following alert trigger/s was/were encountered: "
            part_a += "<ul>"
            for shift_trigger in shift_triggers:
                trigger_type = shift_trigger["trigger_type"]
                timestamp = shift_trigger["timestamp"]
                info = shift_trigger["info"]

                part_a = f"{part_a}<li> <b>{BASIS_TO_RAISE[trigger_type][1]} \
                    </b> - alerted on <b>{timestamp}</b> due to \
                        {BASIS_TO_RAISE[trigger_type][0]} ({info})</li>"
            part_a += "</ul>"

        else:
            part_a += "No new alert triggers encountered.<br/>"
            part_a += "</ul>"

        con = f"Monitoring will continue until <b>{validity}</b>.<br/>"

        end_info = f"{part_a}- {con}"

    shift_end = f"<b>SHIFT END:<br/>{datetime.strftime(end_ts, '%B %d, %Y, %I:%M %p')}</b><br />"
    end_info = shift_end + end_info

    return end_info


def get_eos_data_analysis(shift_start=None, event_id=None):
    """
        Returns all data analysis based on a specified filter.
        Args:
            --
    """
    eosa = EndOfShiftAnalysis
    filter_value = eosa.shift_start == shift_start and eosa.event_id == event_id

    eos_data_analysis = eosa.query.filter(filter_value).first()

    return eos_data_analysis.analysis


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
        event_id, str(start_timestamp), str(end_timestamp))

    return shift_narratives


def get_formatted_shift_narratives(shift_narratives):
    """
    Format the narratives as needed.
    """
    narrative_string = "<strong>NARRATIVES:</strong><br />"
    for narrative in shift_narratives:
        narrative_string = narrative_string + \
            str(narrative.timestamp) + " - " + \
            str(narrative.narrative) + " <br/>"

    return narrative_string


def get_release_publishers_initials(first_name, last_name):
    """
    Return the MT and CT publishers
    """

    initials = first_name[0].upper() + last_name[0].upper()

    return initials


@END_OF_SHIFT_BLUEPRINT.route(
    "/end_of_shift/get_end_of_shift_report/<shift_start>/<event_id>", methods=["GET"])
def get_end_of_shift_report(shift_start, event_id):
    """
    This function returns a dictionary containing all
    4 major parts of the end of shift report.

    Returns a dictionary.
    """
    start_ts = datetime.strptime(shift_start, "%Y-%m-%d %H:%M:%S")
    end_ts = start_ts + timedelta(hours=13)

    eos_data = get_end_of_shift_data(start_ts, end_ts, event_id)

    # GET THE INITIALS FOR THE END OF SHIFT REPORTERS
    for publisher in eos_data["releases"][-1].release_publishers:
        user_details = publisher.user_details
        pub_firstname = user_details.first_name
        pub_lastname = user_details.last_name

        initials = get_release_publishers_initials(pub_firstname, pub_lastname)

        if publisher.role == "mt":
            mt_initials = initials
        else:
            ct_initials = initials

    publishers = {
        "mt": mt_initials,
        "ct": ct_initials
    }
    # Got the publishers

    eos_head = f"<strong>END-OF-SHIFT REPORT ({publishers['mt']}, \
        {publishers['ct']})</strong> <br />"
    shift_start_info = get_shift_start_info(start_ts, end_ts, eos_data)
    shift_end_info = get_shift_end_info(end_ts, eos_data)
    data_analysis = get_eos_data_analysis(shift_start, event_id)
    raw_narratives = get_eos_narratives(start_ts, end_ts, event_id)
    narratives = get_formatted_shift_narratives(raw_narratives)

    eos_report_dict = {
        "eos_head": eos_head,
        "shift_start_info": shift_start_info,
        "shift_end_info": shift_end_info,
        "data_analysis": data_analysis,
        "narratives": narratives
    }

    return_json = json.dumps(eos_report_dict, indent=2)

    return return_json
