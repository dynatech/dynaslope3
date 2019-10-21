"""
File containing class representation of
Sites table (and related tables)
"""

from flask_login import UserMixin
from sqlalchemy.dialects.mysql import TINYINT
from marshmallow import fields
from connection import DB, MARSHMALLOW


class Sites(UserMixin, DB.Model):
    """
    Class representation of Sites table
    """

    __tablename__ = "sites"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    site_id = DB.Column(TINYINT, primary_key=True)
    site_code = DB.Column(DB.String(3), nullable=False)
    purok = DB.Column(DB.String(45))
    sitio = DB.Column(DB.String(45))
    barangay = DB.Column(DB.String(45), nullable=False)
    municipality = DB.Column(DB.String(45), nullable=False)
    province = DB.Column(DB.String(45), nullable=False)
    region = DB.Column(DB.String(45), nullable=False)
    active = DB.Column(DB.Boolean, nullable=False, default=True)
    barangay = DB.Column(DB.String(255), nullable=False)
    psgc = DB.Column(DB.Integer, nullable=False)
    season = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.seasons.season_group_id"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Site ID: {self.site_id}"
                f" Site Code: {self.site_code}")


class Seasons(DB.Model):
    """
    Class representation of Seasons Table
    """

    __tablename__ = "seasons"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    season_group_id = DB.Column(TINYINT, primary_key=True)
    january = DB.Column(DB.String(1))
    february = DB.Column(DB.String(1))
    march = DB.Column(DB.String(1))
    april = DB.Column(DB.String(1))
    may = DB.Column(DB.String(1))
    june = DB.Column(DB.String(1))
    july = DB.Column(DB.String(1))
    august = DB.Column(DB.String(1))
    september = DB.Column(DB.String(1))
    october = DB.Column(DB.String(1))
    november = DB.Column(DB.String(1))
    december = DB.Column(DB.String(1))
    sched_group_id = DB.Column(
        TINYINT, DB.ForeignKey("commons_db.routine_schedules.sched_group_id"))

    sites = DB.relationship(
        "Sites", backref=DB.backref("season_months", lazy="raise"), lazy="subquery")
    routine_schedules = DB.relationship(
        "RoutineSchedules", backref=DB.backref("seasons", lazy="subquery"), uselist=True, lazy="subquery")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Season Group ID: {self.season_group_id}")


class RoutineSchedules(DB.Model):
    """
    Class representation of Routine_schedules Table
    """

    __tablename__ = "routine_schedules"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    sched_id = DB.Column(TINYINT, primary_key=True)
    sched_group_id = DB.Column(TINYINT)
    season_type = DB.Column(DB.String(1))
    iso_week_day = DB.Column(TINYINT)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Sched ID: {self.sched_id}"
                f" Sched Group ID: {self.sched_group_id} Season Type: {self.season_type}"
                f" ISO Week Day: {self.iso_week_day}")


class SitesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Sites class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = Sites
        exclude = ("season_months", "moms_instance")
        ordered = False
