"""
Utility file for Loggers Table
Contains functions for getting and accesing Sites table only
"""

from connection import DB
from src.models.sites import Sites
from src.models.analysis import TSMSensors, Loggers
from sqlalchemy.orm import joinedload


def get_loggers(site_code=None, many=True):
    """
    Function that gets basic site data by site code
    """
    # base = DB.session.query(Loggers).order_by(DB.desc(Loggers.logger_id)).options(joinedload("tsm_sensor").joinedload("site"))
    base = Loggers.query.order_by(DB.desc(Loggers.logger_id)).join(TSMSensors).join(Sites)

    if site_code:
        base = base.filter(Sites.site_code == site_code)

    if many:
        loggers = base.all()
    else:
        loggers = base.first()

    return loggers
