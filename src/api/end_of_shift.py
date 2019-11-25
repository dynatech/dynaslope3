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
    get_monitoring_events, get_internal_alert_symbols, build_internal_alert_level,
    get_monitoring_releases, get_monitoring_triggers)
from src.utils.narratives import (get_narratives)
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

        event_id = event.event_id

        # if not (tuple_entry in unique_set):
        if not (event_id in unique_set):
            unique_set.add(event_id)
            unique_release_events.append({
                "site_code": event.site.site_code,
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

    if event_id:
        releases_list = get_monitoring_releases(
            ts_start=shift_start, ts_end=shift_end, event_id=event_id)
    else:
        releases_list = get_monitoring_releases(
            ts_start=shift_start, ts_end=shift_end)

    # Get unique releases and segregate by site_code
    unique_release_dict_list = extract_unique_release_events(releases_list)

    # Events List
    for unique_release_dict in unique_release_dict_list:
        releases_list = []
        most_recent = []
        shift_triggers_list = []

        event_alert = unique_release_dict["temp"].event_alert
        event = event_alert.event
        shift_triggers_list = get_monitoring_triggers(
            event_id=event.event_id, ts_start=shift_start, ts_end=shift_end)
        most_recent = get_monitoring_triggers(
            event_id=event.event_id, ts_start=shift_start - timedelta(hours=12), ts_end=shift_start)

        eos_data = {
            "event_id": event.event_id,
            "event_start": event.event_start,
            "validity": event.validity,
            "alert_level": event_alert.public_alert_symbol.alert_level,
            # "releases": releases_list,
            # "triggers": triggers_list,
            "first_trigger_info": "",
            "first_trigger_type": "",
            "most_recent": most_recent,
            "shift_triggers": shift_triggers_list,
            "internal_alert_level": build_internal_alert_level(
                event_alert.public_alert_symbol.alert_level,
                unique_release_dict["temp"].trigger_list
            )
        }

        first_trigger = get_monitoring_triggers(
            event_id=event.event_id, return_one=True, order_by_desc=False)
        if first_trigger:
            eos_data = {
                **eos_data,
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
    event_start_ts = eos_dict["eos_data"]["event_start"]
    report_start_ts = datetime.strftime(event_start_ts, "%B %d, %Y, %I:%M %p")

    first_trigger_type = eos_dict["eos_data"]["first_trigger_type"]
    first_trigger_info = eos_dict["eos_data"]["first_trigger_info"]

    if event_start_ts >= (shift_start_ts + timedelta(minutes=30)) and \
            event_start_ts <= (shift_end_ts - timedelta(minutes=30)):
        start_info = f"Monitoring initiated on {report_start_ts} due to" \
            f"{BASIS_TO_RAISE[str(first_trigger_type)][0]} ({first_trigger_info})."
    else:
        part_a = f"Event monitoring started on {report_start_ts} due to" \
            f"{BASIS_TO_RAISE[str(first_trigger_type)][0]} ({first_trigger_info})."
        part_b = ""
        most_recent_triggers = eos_dict["eos_data"]["most_recent"]
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

        start_header = f"<b>SHIFT START:<br/>\
            {datetime.strftime(shift_start_ts, '%B %d, %Y, %I:%M %p')}</b>"
        start_info = f"{start_header} <br />- Monitoring continued with {part_b}- {part_a}"

    return start_info


def get_shift_end_info(end_ts, eos_dict):
    """
    Prepare the end info of end-of-shift report.
    """
    shift_triggers = eos_dict["eos_data"]["shift_triggers"]
    validity = eos_dict["eos_data"]["validity"]
    internal_alert_level = eos_dict["eos_data"]["internal_alert_level"]

    if eos_dict["eos_data"]["alert_level"] == 1:
        end_info = f"- Alert <b>lowered to A0</b>; monitoring ended at <b> \
            {validity}</b>.<br/>"

    else:
        part_a = f"The current internal alert level is <b> \
            {internal_alert_level}</b>.<br/>- "

        if shift_triggers:
            part_a += "The following alert trigger/s was/were encountered: "
            part_a += "<ul>"
            for shift_trigger in shift_triggers:
                trigger_type = get_internal_alert_symbols(
                    shift_trigger.internal_sym_id)
                timestamp = shift_trigger.ts
                info = shift_trigger.info

                part_a += f"{part_a}<li> <b>{BASIS_TO_RAISE[trigger_type][1]} \
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

    return_data = ""
    eosa = EndOfShiftAnalysis
    base_query = eosa.query

    if shift_start and event_id:
        var_checker("shift_start", shift_start, True)
        var_checker("event_id", event_id, True)
        filter_value = eosa.shift_start == shift_start and eosa.event_id == event_id
        eos_data_analysis = base_query.filter(filter_value).first()
        if eos_data_analysis:
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
        event_id=event_id, start=str(start_timestamp), end=str(end_timestamp))

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


def process_eos_list(start_ts, end_ts, eos_data_list):
    """
    """
    eos_list = []
    # GET THE INITIALS FOR THE END OF SHIFT REPORTERS
    for eos_dict in eos_data_list:
        event_id = eos_dict["eos_data"]["event_id"]
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

        eos_head = f"<strong>END-OF-SHIFT REPORT ({publishers['mt']}, \
            {publishers['ct']})</strong> <br />"
        shift_start_info = get_shift_start_info(start_ts, end_ts, eos_dict)
        shift_end_info = get_shift_end_info(end_ts, eos_dict)
        data_analysis = get_eos_data_analysis(start_ts, event_id)
        raw_narratives = get_eos_narratives(start_ts, end_ts, event_id)
        narratives = get_formatted_shift_narratives(raw_narratives)

        eos_report_dict = {
            "site_code": eos_dict["site_code"],
            "eos_head": eos_head,
            "shift_start_info": shift_start_info,
            "shift_end_info": shift_end_info,
            "data_analysis": data_analysis,
            "narratives": narratives
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
