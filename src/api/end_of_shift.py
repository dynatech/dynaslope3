"""
End of Shift Module Controller File

NAMING CONVENTION
- Name your blueprint as <controller>_blueprint
- Name routes as /<controller_name>/<function_name>
"""

from flask import Blueprint, jsonify
from connection import DB
from src.models.analysis import (EndOfShiftAnalysis, EndOfShiftAnalysisSchema)
from src.models.monitoring import (MonitoringReleasesSchema)
from src.utils.monitoring import (get_active_monitoring_events)


END_OF_SHIFT_BLUEPRINT = Blueprint("end_of_shift_blueprint", __name__)


def get_shift_start_info():
    """
    Prepare the start info of end-of-shift report.
    """

    return "shift start info"


def get_shift_end_info():
    """
    Prepare the end info of end-of-shift report.
    """

    return "shift end info"


def get_report_shift_start_info():
    """
    To be filled.
    """

    return "shift start info"


@END_OF_SHIFT_BLUEPRINT.route("/end_of_shift/get_end_of_shift_data", methods=["GET"])
@END_OF_SHIFT_BLUEPRINT.route(
    "/end_of_shift/get_end_of_shift_data/<shift_start>/<shift_end>", methods=["GET"])
def get_end_of_shift_data(shift_start=None, shift_end=None):
    events_for_eos = []

    active_events = get_active_monitoring_events()

    for event in active_events:
        releases = event.releases
        for release in releases:
            triggers = release.triggers

        data_analysis = get_end_of_shift_data_analysis(
            shift_start, event.event_id)
        narratives = []

        release_data = MonitoringReleasesSchema(
            many=True).dump(releases).data

        # Report data to be appended to return List
        eos_report_dict = {
            "latest_trigger": triggers,
            "latest_release": release_data,
            "data_analysis": data_analysis,
            "narratives": narratives
        }
        events_for_eos.append(eos_report_dict)

    return jsonify(events_for_eos)


def make_end_of_shift_summary(report_data=None):
    """
    This prepares the summary portion of EOS Report.

    These are the data required.
        mt,
        ct,
        event_start,
        most_recent,
        first_trigger: {
            trigger_type: first_trigger_type,
            info: first_trigger_info
        },
        internal_alert_level,
        validity,
        inshift_triggers
    """
    shift_start_info = get_shift_start_info()
    shift_end_info = get_shift_end_info()

    summary = shift_start_info + shift_end_info
    return summary


@END_OF_SHIFT_BLUEPRINT.route("/end_of_shift/get_end_of_shift_data_analysis", methods=["GET"])
@END_OF_SHIFT_BLUEPRINT.route("/end_of_shift/get_end_of_shift_data_analysis/<shift_start>/<event_id>", methods=["GET"])
def get_end_of_shift_data_analysis(shift_start=None, event_id=None):
    """
        Returns all data analysis based on a specified filter.
        Args:
            --
    """
    end_of_shift_schema = EndOfShiftAnalysisSchema(many=True)
    eos_class = EndOfShiftAnalysis

    if shift_start is None and event_id is None:
        filter_value = ""
    else:
        if shift_start == "all":
            filter_value = eos_class.event_id == event_id
        else:
            filter_value = eos_class.shift_start == shift_start and eos_class.event_id == event_id

    eos = eos_class.query.filter(filter_value).all()[0:10]

    eos_data = end_of_shift_schema.dump(eos).data

    return_data = jsonify(eos_data)

    return return_data
