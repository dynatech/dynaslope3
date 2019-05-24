"""
Test file
"""
import pytest
from datetime import datetime
from run import APP
from src.experimental_scripts.public_alert_generator import (
    check_if_routine_or_event, get_event_start_timestamp)


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


def public_alert_sample(ts, pub_sym_id):
    class DotDict(dict):
        pass

    d = DotDict()
    d.ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
    d.pub_sym_id = pub_sym_id

    return d


def test_get_event_start_timestamp():
    """
    Something
    """
    arr = [
        public_alert_sample("2018-11-30 14:30:00", 3),
        public_alert_sample("2018-11-30 09:30:00", 2),
        public_alert_sample("2018-11-11 14:30:00", 1)
    ]

    result = get_event_start_timestamp(arr)
    expected = datetime.strptime(
        "2018-11-30 09:30:00", "%Y-%m-%d %H:%M:%S")
    print(result, expected)

    assert result == expected


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
