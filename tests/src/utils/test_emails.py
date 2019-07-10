"""
Test file
"""
from src.utils.emails import prepare_body


def test_prepare_body():
    """
    Something
    """
    sender = "dynaslopeswat@gmail.com"
    recipients = ["dynaslopeswat+1@gmail.com"]
    subject = "Test Subject"
    message = "Test message"

    body = prepare_body(sender, recipients, subject, message)

    assert body["From"] == "dynaslopeswat@gmail.com"
    assert body["To"] == "dynaslopeswat+1@gmail.com"
    assert body["Subject"] == "Test Subject"
