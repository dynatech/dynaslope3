"""
Test file
"""
import pytest
from datetime import datetime
from run import APP
from src.experimental_scripts.candidate_alerts_generator import (
    fix_internal_alerts)


def test_fix_internal_alerts():
    """
    This function changes the internal alert string of each alert entry.
    """
    new_list = {
        "ts": "2018-11-30 14:30:00",
        "site_id": 16,
        "site_code": "ime",
        "public_alert": "A2",
        "internal_alert": "A2-sR",
        "triggers": [
            {
                "trigger_type": "subsurface",
                "trigger_id": 86739,
                "alert": "s2",
                "ts_updated": "2018-11-30 14:30:00",
                "tech_info": "IMESB (nodes 6, 15, 16, 18) exceeded velocity threshold",
                "invalid": True
            },
            {
                "trigger_type": "rainfall",
                "trigger_id": 86740,
                "alert": "r1",
                "ts_updated": "2018-11-30 14:30:00",
                "tech_info": "Rainfall above threshold"
            }
        ]
    }
    result_1 = "A1-R"
    result_2 = "partially_invalid"
    internal_alert, general_status = fix_internal_alerts(new_list)
    assert internal_alert == result_1 and general_status == result_2
