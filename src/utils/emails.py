"""
Utility file for Sending Emails
"""

import smtplib
import ssl
from email.mime.application import MIMEApplication
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.utils.bulletin import render_monitoring_bulletin
from src.utils.chart_rendering import render_charts
from src.utils.extra import var_checker

from config import APP_CONFIG
from instance.config import EMAILS


def get_email_credentials():
    sender = EMAILS["dev_email"]
    password = EMAILS["dev_password"]

    if APP_CONFIG["is_live_mode"]:
        sender = EMAILS["monitoring_email"]
        password = EMAILS["monitoring_password"]

    return sender, password


def setup_connection():
    """
    Something
    """
    context = ssl.create_default_context()

    sender, password = get_email_credentials()

    server = smtplib.SMTP(APP_CONFIG["smtp_server"], APP_CONFIG["port"])
    server.starttls(context=context)
    server.login(sender, password)
    return server


def get_email_subject(mail_type, details=None):
    """
    Returns subject for MailBox and Bulletin emails

    Args:
        mail_type (string) - to be used if you want custom subject based on
                            provided type
        details (dictionary) - required details for the subject e.g. site_code, date

    NOTE: Commented code if we want changes on format of subject
    """
    # subject = ""
    # if mail_type == "bulletin":
    #     print(details)
    #     subject = f"[BULLETIN]"
    # elif mail_type == "eos":
    #     subject = f"[END-OF-SHIFT]"
    # subject = f"{subject} {details['site_code'].upper()} {details['date']}"

    # return subject

    return f"{details['site_code'].upper()} {details['date']}"


def prepare_body(sender, recipients, subject, message, file_name=None, attachments=None):
    """
    Something
    """
    body = MIMEMultipart("alternative")
    body["To"] = ", ".join(recipients)
    body["From"] = f"Dynaslope Monitoring <{sender}>"
    body["Subject"] = subject
    body["In-Reply-To"] = f"<{sender}>"
    message = MIMEText(message, "html")

    body.attach(message)

    for f in attachments or []:
        with open(f, "rb") as fil:
            part = MIMEApplication(
                fil.read(),
                Name=file_name
            )

        # After the file is closed
        # part['Content-Disposition'] = 'attachment; filename="%s"' % basename(f)
        part["Content-Disposition"] = f"attachment; filename={file_name}"
        body.attach(part)

    return body


def send_mail(recipients, subject, message, file_name=None, bulletin_release_id=None, eos_data=None):
    """
    Util used to send email. Can be used for generic emails or for
    bulletins, eos. You just need to specify the right parameters

    Args:
        recipients
        subject
        message
        file_name
        bulletin_release_id
        eos_data (dictionary) - user_id, site_code, charts []
    """

    attachments = []
    if bulletin_release_id:
        attachments.append(render_monitoring_bulletin(
            release_id=bulletin_release_id))
    elif eos_data:
        user_id = eos_data["user_id"]
        site_code = eos_data["site_code"]
        charts = eos_data["charts"]
        if charts:
            render_charts_response = render_charts(
                user_id, site_code, charts, file_name)
            attachments.append(render_charts_response["file_path"])

    sender, _ = get_email_credentials()

    body = prepare_body(sender, recipients, subject,
                        message, file_name, attachments)
    text = body.as_string()

    try:
        server = setup_connection()
    except Exception as connection_err:
        raise connection_err

    try:
        server.sendmail(sender, recipients, text)
    except Exception as send_error:
        raise send_error
    finally:
        server.quit()


if __name__ == "__main__":
    send_mail(["dynaslopeswat+1@gmail.com"], "Test subject", "Test message")
