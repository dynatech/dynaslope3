"""

"""

from datetime import timedelta
from connection import DB
from src.models.monitoring import MonitoringMoms, MonitoringMomsSchema, MomsInstances


def get_moms_report(timestamp, timedelta_hour=1, minute=59, site_id=0):
    """
    Function that gets monitoring moms
    """

    run_down_ts = timestamp - timedelta(hours=timedelta_hour, minutes=minute)

    query = MonitoringMoms.query.options(
        DB.subqueryload("moms_instance").joinedload("site").raiseload("*"),
        DB.raiseload("*")
    ).join(MomsInstances).filter(MomsInstances.site_id == site_id).filter(
        MonitoringMoms.observance_ts.between(run_down_ts, timestamp)
    ).all()

    excluded = ["reporter", "moms_instance.feature", "validator", "narrative"]
    result = MonitoringMomsSchema(many=True, exclude=excluded).dump(query)

    return result
