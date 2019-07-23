"""
Test file
"""
import pytest
from run import APP
from src.utils.bulletin import (
    get_alert_description, AlertDescriptionProcessor, create_monitoring_bulletin)


@pytest.mark.parametrize("public_alert_level, trigger_list, result",
                         [
                             ("A0", "ND", "No significant ground movement***OR***Movement reduced to non-significant rates"),
                             ("A1", "R", "Recent rainfall may trigger landslide")
                         ]
                         )
def test_get_alert_description(public_alert_level, trigger_list, result):
    """
    Something
    """
    assert get_alert_description(public_alert_level, trigger_list) == result


def test_AlertDescriptionProcessor():
    """
    Something
    """
    a = AlertDescriptionProcessor(["s", "G", "m", "R", "D"])
    assert a.trigger_D == True
    assert a.create_alert_description() == ""


def test_create_monitoring_bulletin():
    """
    Something
    """
    a = create_monitoring_bulletin(19291)
    assert a == ""
