"""
Utility file for Sending Emails
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = "smtp.gmail.com"
PORT = 587
SENDER_EMAIL = "dynaslopeswat@gmail.com"
PASSWORD = "dynaslopeswat"


def setup_connection():
    """
    Something
    """
    context = ssl.create_default_context()

    server = smtplib.SMTP(SMTP_SERVER, PORT)
    server.starttls(context=context)
    server.login(SENDER_EMAIL, PASSWORD)
    return server


def prepare_body(sender, recipients, subject, message):
    """
    Something
    """
    body = MIMEMultipart("alternative")
    body["To"] = ", ".join(recipients)
    body["From"] = sender
    body["Subject"] = subject
    message = MIMEText(message, "html")

    body.attach(message)

    return body


def send_mail(recipients, subject, message):
    """
    Something
    """
    body = prepare_body(SENDER_EMAIL, recipients, subject, message)
    text = body.as_string()

    try:
        server = setup_connection()
    except Exception as connection_err:
        raise connection_err

    try:
        server.sendmail(SENDER_EMAIL, recipients, text)
    except Exception as send_error:
        raise send_error
    finally:
        server.quit()


if __name__ == "__main__":
    send_mail(["dynaslopeswat+1@gmail.com"], "Test subject", "Test message")
