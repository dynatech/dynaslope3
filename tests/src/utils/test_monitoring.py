"""
Test file for Monitoring File on utils
"""
import pytest
from datetime import datetime
from src.utils.monitoring import (
    get_public_alert_level, round_to_nearest_release_time, compute_event_validity)


@pytest.mark.parametrize("internal_alert, return_triggers, result",
                         [
                             ("A1-R", False, "A1"),
                             ("ND-R", False, "A1"),
                             ("ND", False, "A0"),
                             ("A2-SR", False, "A2"),
                             ("A2-SR", True, ("A2", "SR")),
                             ("ND", True, ("A0", None)),
                             ("ND-R", True, ("A1", "R")),
                         ]
                         )
def test_get_public_alert_level(internal_alert, return_triggers, result):
    temp = get_public_alert_level(
        internal_alert, return_triggers=return_triggers)

    assert temp == result


@pytest.mark.xfail
@pytest.mark.parametrize("internal_alert, return_triggers, result",
                         [
                             ("A1-R", False, "A0"),
                             ("ND-R", False, "A0"),
                             ("ND", False, "A1"),
                             ("A2-SR", False, "A1"),
                             ("A2-SR", True, ("A2", None)),
                             ("ND", True, ("A0", "D")),
                             ("ND-R", True, ("A0", "R")),
                         ]
                         )
def test_get_public_alert_level_fail(internal_alert, return_triggers, result):
    temp = get_public_alert_level(
        internal_alert, return_triggers=return_triggers)

    assert temp == result


@pytest.mark.parametrize("data_ts, result", [
    (datetime(2019, 1, 30, 10, 30), datetime(2019, 1, 30, 12, 00)),
    (datetime(2019, 1, 21, 23, 30), datetime(2019, 1, 22, 00, 00)),
    (datetime(2019, 1, 30, 00, 00), datetime(2019, 1, 30, 4, 00))
])
def test_round_to_nearest_release_time(data_ts, result):
    assert round_to_nearest_release_time(data_ts) == result


@pytest.mark.parametrize("data_ts, public_alert, result", [
    (datetime(2018, 10, 11, 23, 30), "A3", datetime(2018, 10, 14, 0, 00)),
    (datetime(2018, 10, 11, 12, 30), "A2", datetime(2018, 10, 12, 16, 00)),
    (datetime(2018, 10, 11, 00, 30), "A1", datetime(2018, 10, 12, 4, 00)),
])
def test_compute_event_validity(data_ts, public_alert, result):
    assert compute_event_validity(data_ts, public_alert) == result
