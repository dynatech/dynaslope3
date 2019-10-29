"""
Utility file for Monitoring Tables
Contains functions for getting and accesing Sites table only
"""

import re
import itertools
from datetime import datetime, timedelta
from pprint import pprint
from connection import DB
from marshmallow import fields
from src.models.monitoring import (
    MonitoringReleases, MonitoringReleasesSchema,
    BulletinResponses, BulletinTriggers)
from src.utils.monitoring import (
    get_monitoring_releases, process_trigger_list,
    get_monitoring_triggers, compute_event_validity)
from src.utils.extra import retrieve_data_from_memcache

# Number of hours extended if no_data upon validity
NO_DATA_HOURS_EXTENSION = retrieve_data_from_memcache(
    "dynamic_variables", {"var_name": "NO_DATA_HOURS_EXTENSION"}, retrieve_attr="var_value")


class AlertDescriptionProcessor:
    """
    Something
    """
    critical = []
    siginificant = []
    level_1 = []
    trigger_D = False
    priorities_dict = {
        "S": {"level": 2, "inherent": 1, "desc": "in sensors"},
        "G": {"level": 2, "inherent": 2, "desc": "in ground markers"},
        "M": {"level": 2, "inherent": 3, "desc": "as manifestation"},
        "R": {"level": 1, "inherent": 4, "desc": "recent rainfall"},
        "E": {"level": 1, "inherent": 5, "desc": "a recent earthquake"},
        "D": {"level": 0, "inherent": 6}
    }

    def __init__(self, triggers):
        self.triggers = triggers
        self.__sort_triggers()

    def __sort_triggers(self):
        triggers = self.triggers

        for trigger in triggers:
            uppercase = trigger.upper()
            temp = self.priorities_dict[uppercase]
            level = temp["level"]

            try:
                desc = temp["desc"]
            except KeyError:
                pass

            if level == 2:
                if trigger == uppercase:
                    self.critical.append(desc)
                else:
                    self.siginificant.append(desc)
            elif level == 0:
                self.trigger_D = True
            else:
                self.level_1.append(desc)

    @staticmethod
    def __join_list(array):
        separator = " and " if len(array) >= 2 else ""
        joined = separator.join([", ".join(array[0:-1]), array[-1]])

        return joined

    def create_alert_description(self):
        alert_description = ""

        critical = self.critical
        if critical:  # returns False if critical is empty
            combined = self.__join_list(critical)
            alert_description += f"Critical movement observed {combined}"

        significant = self.siginificant
        if significant:  # returns False if significant is empty
            combined = self.__join_list(significant)
            message = f"Significant movement observed {combined}"

            if alert_description == "":
                alert_description += message
            else:
                connector = " and"
                if len(critical) > 1:
                    connector = ";"
                alert_description += f"{connector} {message[0].lower()}{message[1:]}"

        level_1 = self.level_1
        if level_1:  # return False if level_1 is empty
            combined = self.__join_list(level_1)
            message = f"{combined} may trigger landslide"

            if not critical and not significant:
                alert_description += f"{message[0].upper()}{message[1:]}"
            else:
                alert_description += f"; {message}"

        if self.trigger_D:
            if alert_description == "":
                alert_description += "[requester] requested monitoring due to [reason]"
            else:
                alert_description += "; LEWC/LGU requested monitoring"

        return alert_description


def get_alert_description(public_alert_level, trigger_list_str):
    """
    Get internal alert description
    """
    alert_description = ""

    trigger_list_str = process_trigger_list(trigger_list_str)

    if public_alert_level == 1:
        alert_description = "No significant ground movement/Movement reduced to non-significant rates"
        return alert_description

    triggers = re.sub(r"0|[r]?x", "", trigger_list_str)
    triggers = list(triggers)

    alert_description = AlertDescriptionProcessor(
        triggers).create_alert_description()

    return alert_description


def create_monitoring_bulletin(release_id):
    """
    Creates monitoring bulletin
    """
    release = get_monitoring_releases(release_id=release_id)
    event_alert = release.event_alert
    event = event_alert.event
    site = event.site

    data_ts = release.data_ts + timedelta(minutes=30)
    bulletin_control_code = f"{site.site_code.upper()}-{data_ts.year}-{release.bulletin_number}"

    event_id = event_alert.event_id
    trigger_list = get_monitoring_triggers(
        event_id=event_id, ts_end=release.data_ts)
    most_recent_trigger_ts = trigger_list[0].ts

    grouped_triggers = {}
    for row in trigger_list:
        grouped_triggers.setdefault(row.internal_sym_id, []).append(row)

    pprint(grouped_triggers)

    trigger_list_str = release.trigger_list
    alert_level = event_alert.public_alert_symbol.alert_level
    computed_validity = compute_event_validity(
        most_recent_trigger_ts, alert_level)
    final_validity = computed_validity
    if computed_validity == data_ts:
        if re.search(r"ND|.0|[Rr]x", trigger_list_str):
            final_validity = data_ts + timedelta(hours=NO_DATA_HOURS_EXTENSION)
    final_validity = final_validity.strftime("%B %d, %Y, %I:%M %p")

    alert_description_group = f"A{alert_level} (), valid until {final_validity}"

    schema = MonitoringReleasesSchema(
        exclude=["event_alert.event.eos_analysis"]).dump(release).data

    schema = {
        **schema,
        "bulletin_control_code": bulletin_control_code,
        "site": schema["event_alert"]["event"]["site"],
        "alert_description_group": alert_description_group
    }
    return schema

    alert_description = get_alert_description(
        public_alert.alert_level, release.trigger_list)
    release.alert_description = alert_description

    # alert_description = get_alert_description(release.internal_alert_level)
    # release.alert_description = alert_description

    # public_alert = get_public_alert_level(release.internal_alert_level)
    # release.alert_responses = LUTResponses.query.filter(
    #     LUTResponses.public_alert_level == public_alert).first()

    # triggers = MonitoringTriggers.query.filter(
    #     MonitoringTriggers.event_id == release.event_id).order_by(
    #         DB.desc(MonitoringTriggers.timestamp)).all()

    # print()
    # for trigger in triggers:
    #     print(
    #         f"Row: {trigger.trigger_type}, {trigger.timestamp}, {trigger.event_id}")
    # print()

    # return BulletinSchema().dump(release).data


# class BulletinSchema(MonitoringReleasesSchema, LUTResponsesSchema):
#     """
#     Just a sample docstring.
#     """
#     alert_description = fields.String()
#     alert_responses = fields.Nested(LUTResponsesSchema)
