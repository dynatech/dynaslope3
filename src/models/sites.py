"""
File containing class representation of
Sites table (and related tables)
"""

from instance.config import SCHEMA_DICT
from sqlalchemy.dialects.mysql import TINYINT
from marshmallow import fields, EXCLUDE
from connection import DB, MARSHMALLOW


class Sites(DB.Model):
    """
    Class representation of Sites table
    """

    __tablename__ = "sites"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    site_id = DB.Column(TINYINT, primary_key=True)
    site_code = DB.Column(DB.String(3), nullable=False)
    purok = DB.Column(DB.String(45))
    sitio = DB.Column(DB.String(45))
    barangay = DB.Column(DB.String(45), nullable=False)
    municipality = DB.Column(DB.String(45), nullable=False)
    province = DB.Column(DB.String(45), nullable=False)
    region = DB.Column(DB.String(45), nullable=False)
    active = DB.Column(DB.Boolean, nullable=False, default=True)
    psgc = DB.Column(DB.Integer, nullable=False)
    households = DB.Column(DB.String(255), nullable=False)
    season = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.seasons.season_group_id"))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Site ID: {self.site_id}"
                f" Site Code: {self.site_code}")


class Seasons(DB.Model):
    """
    Class representation of Seasons Table
    """

    __tablename__ = "seasons"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

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
        TINYINT, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.routine_schedules.sched_group_id"))

    sites = DB.relationship(
        "Sites", backref=DB.backref("season_months", lazy="raise"), lazy="subquery", order_by="Sites.site_code")
    routine_schedules = DB.relationship(
        "RoutineSchedules", backref=DB.backref("seasons", lazy="subquery"),
        uselist=True, lazy="subquery")

    def __repr__(self):
        return (f"Type < {self.__class__.__name__} > "
                f"Season Group ID: {self.season_group_id}")


class RoutineSchedules(DB.Model):
    """
    Class representation of Routine_schedules Table
    """

    __tablename__ = "routine_schedules"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    sched_id = DB.Column(TINYINT, primary_key=True)
    sched_group_id = DB.Column(TINYINT)
    season_type = DB.Column(DB.String(1))
    iso_week_day = DB.Column(TINYINT)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Sched ID: {self.sched_id}"
                f" Sched Group ID: {self.sched_group_id} Season Type: {self.season_type}"
                f" ISO Week Day: {self.iso_week_day}")


class SitesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Sites class
    """

    def __init__(self, *args, **kwargs):
        self.include = kwargs.pop("include", None)
        super().__init__(*args, **kwargs)

    def _update_fields(self, *args, **kwargs):
        super()._update_fields(*args, **kwargs)
        if self.include:
            for field_name in self.include:
                self.fields[field_name] = self._declared_fields[field_name]

    season = MARSHMALLOW.Integer()
    season_months = MARSHMALLOW.Nested("SeasonsSchema") #NOTE EXCLUDE:exclude=("sites",)
    class Meta:
        """Saves table class structure as schema model"""
        model = Sites
        ordered = False
        # unknown = EXCLUDE
        exclude = ["season_months"]
        # EXCLUDE = ["season_months"]


class SeasonsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Seasons class
    """

    routine_schedules = MARSHMALLOW.Nested("RoutineSchedulesSchema", many=True) #NOTE EXCLUDE: exclude=("seasons",)

    class Meta:
        """Saves table class structure as schema model"""
        model = Seasons
        ordered = False


class RoutineSchedulesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of RoutineSchedules class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = RoutineSchedules
        ordered = False
