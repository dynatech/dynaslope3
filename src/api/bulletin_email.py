"""
API for handling bulletin email
"""

from flask import Blueprint, jsonify
from datetime import datetime
from config import APP_CONFIG
from src.utils.emails import get_email_subject
from src.utils.monitoring import get_monitoring_releases
from src.utils.sites import build_site_address
from src.utils.bulletin import download_monitoring_bulletin
from src.utils.extra import var_checker, round_to_nearest_release_time

BULLETIN_EMAIL = Blueprint("bulletin_email", __name__)


@BULLETIN_EMAIL.route("/bulletin/download_bulletin/<release_id>", methods=["GET"])
def wrap_download_bulletin(release_id):
    """
    Function that lets users download bulletin by release id
    """

    try:
        ret = download_monitoring_bulletin(release_id=release_id)
        return "Success"
    except KeyError:
        return "Bulletin download FAILED."
    except Exception as err:
        raise err


def prepare_onset_message(release_data, address, site_alert_level):
    """
    Subset function of get_bulletin_email_body. 
    Prepares the onset message.
    """
    onset_msg = ""
    release_triggers = release_data.triggers

    highest_trigger = next(iter(sorted(release_triggers, \
            key=lambda x: x.internal_sym.trigger_symbol.alert_level, \
            reverse=True)))
    var_checker("highest_trigger", highest_trigger, True)

    trigger_ts = highest_trigger.ts
    f_trig_ts = datetime.strftime(trigger_ts, "%B %e, %Y, %I:%M %p")
    cause = highest_trigger.internal_sym.bulletin_trigger.first().cause

    onset_msg = f"As of {f_trig_ts}, {address} is under {site_alert_level} based on {cause}."

    return onset_msg


def prepare_base_email_body(address, alert_level, data_ts):
    """
    Prepare the basic bulletin email content.
    """
    f_r_time = datetime.strftime(data_ts, "%B %e, %Y, %I:%M %p")

    return f"\nDEWS-L Bulletin for {f_r_time}\n{alert_level} - {address}"


@BULLETIN_EMAIL.route("/bulletin_email/get_bulletin_email_details/<release_id>", methods=["GET"])
def get_bulletin_email_details(release_id):
    """
    Function for composing the email's recipients,
    subject, and mail body
    """
    recipients = []
    mail_body = ""
    subject = ""
    filename = ""

    bulletin_release_data = get_monitoring_releases(release_id=release_id, load_options="ewi_narrative")
    event_alert = bulletin_release_data.event_alert
    first_release = list(sorted(event_alert.releases, key=lambda x: x.data_ts))[0]
    var_checker("first_release", first_release, True)
    event = event_alert.event
    event_id = event.event_id

    # Get data needed to prepare base message
    site = event.site
    site_id = event.site_id
    site_address = build_site_address(site)
    p_a_level = event_alert.public_alert_symbol.alert_level
    site_alert_level = f"Alert {p_a_level}"
    data_ts = bulletin_release_data.data_ts

    # Get data needed to see if onset
    first_data_ts = first_release.data_ts
    data_ts = bulletin_release_data.data_ts
    is_onset = first_data_ts == data_ts

    # START BUILDING MAIL BODY
    mail_body = prepare_base_email_body(site_address, site_alert_level, data_ts)

    if is_onset:
        var_checker("THIS IS AN ONSET BULLETIN", "", True)
        onset_msg = prepare_onset_message(
            bulletin_release_data,
            site_address,
            site_alert_level
        )

        mail_body = f"{onset_msg}\n \n {mail_body}"

    var_checker("mail_body", mail_body, True)

    # GET THE SUBJECT NOW
    subject = get_email_subject(mail_type="bulletin", details={
        "site_code": site.site_code,
        "date": data_ts.strftime("%d %b %Y").upper()
    })

    # GET THE FILENAME NOW
    # NOTE: Static interval
    file_time = round_to_nearest_release_time(data_ts, 4).strftime("%l%p")
    file_date = data_ts.strftime("%d%b%y")
    filename = f"{site.site_code.upper()}_{file_date}_{file_time}".upper() + ".pdf"

    # GET THE RECIPIENTS NOW
    if APP_CONFIG["is_live_mode"]:
        recipients.extend(APP_CONFIG["director_and_head_emails"])
        if is_onset:
            recipients.extend(APP_CONFIG["dynaslope_groups"])
    else:
        # NOTE to front-end. CHECK if TEST SERVER by using typeof object.
        recipients.append({ "TEST_SERVER_EMAIL": APP_CONFIG["dev_email"] })

    # Get MT Publisher
    release_publishers = bulletin_release_data.release_publishers
    ct_reporter = next(filter(lambda reporter: reporter.role == 'ct', release_publishers)).user_details

    str_recipients = ""
    len_recipients = len(recipients)
    print(len_recipients)
    for index, recipient in enumerate(recipients):
        if isinstance(recipients, str):
            tmp_rcp = recipient
            var_checker("recipient", recipient, True)
            if tmp_rcp == "rusolidum@phivolcs.dost.gov.ph":
                tmp_rcp = "RUS"
            elif tmp_rcp == "asdaag48@gmail.com":
                tmp_rcp = "ASD"

            str_recipients = str_recipients + tmp_rcp
            print("index")
            print(index)

            if len_recipients != (index + 1):
                str_recipients = str_recipients + ", "

    narrative_details = {
        "site_list": [site_id],
        "event_id": event_id,
        "timestamp": datetime.now(),
        "narrative": f"Sent {file_time} EWI BULLETIN to {str_recipients}",
        "type_id": 1,
        "user_id": ct_reporter.user_id
    }

    var_checker("narrative_details", narrative_details, True)

    bulletin_email_details = {
        "recipients": recipients,
        "mail_body": mail_body,
        "subject": subject,
        "file_name": filename,
        "narrative_details": narrative_details
    }

    var_checker("bulletin_email_details", bulletin_email_details, True)

    return jsonify(bulletin_email_details)
