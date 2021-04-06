"""
    Utility file for monitoring_on_demand table.
    Contains functions essential in accessing and saving into monitoring_on_demand table.
"""

from connection import DB
from src.models.monitoring import (MonitoringOnDemand)


def get_on_demand(site_id, timestamp):
    """
    """

    m_od = MonitoringOnDemand

    on_demand_alerts = m_od.query \
        .order_by(
            DB.desc(m_od.request_ts)) \
        .filter_by(
            site_id=site_id,
            request_ts=timestamp
        ).all()

    return on_demand_alerts
