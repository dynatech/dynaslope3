"""
Test file
"""
import pytest
from run import APP
from src.experimental_scripts.public_alert_generator import (
    check_if_routine_or_event)


@pytest.mark.parametrize("pub_sym_id, result",
                         [
                             (1, "routine"),
                             (2, "event"),
                             (3, "event"),
                             (4, "event")
                         ]
                         )
def test_check_if_routine_or_event(pub_sym_id, result):
    """
    Something
    """
    assert check_if_routine_or_event(pub_sym_id) == result


@pytest.mark.xfail
@pytest.mark.parametrize("pub_sym_id, result",
                         [
                             (4, "routine"),
                             (3, "routine"),
                             (2, "routine"),
                             (1, "event")
                         ]
                         )
def test_check_if_routine_or_event_fail(pub_sym_id, result):
    """
    Something
    """
    assert check_if_routine_or_event(pub_sym_id) == result
