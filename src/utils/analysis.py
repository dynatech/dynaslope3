"""
Utility code for analysis
"""

from src.utils.surficial import (
    get_sites_with_ground_meas, check_if_site_has_active_surficial_markers
)
from src.utils.manifestations_of_movements import get_moms_report


def check_ground_data_and_return_noun(site_id, timestamp, hour, minute):
    ground_data_noun = get_ground_data_noun(site_id=site_id)

    if ground_data_noun == "ground measurement":
        result = get_sites_with_ground_meas(timestamp,
                                            timedelta_hour=hour, minute=minute, site_id=site_id)
    else:
        result = get_moms_report(timestamp,
                                 timedelta_hour=hour, minute=hour, site_id=site_id)

    return ground_data_noun, result


def get_ground_data_noun(site_id):
    has_active_markers = check_if_site_has_active_surficial_markers(
        site_id=site_id)
    g_data = "ground measurement" if has_active_markers else "ground observation"

    return g_data
