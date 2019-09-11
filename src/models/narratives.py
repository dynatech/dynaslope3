import datetime
from connection import DB, MARSHMALLOW
from marshmallow import fields
from src.models.sites import SitesSchema


class Narratives(DB.Model):
    """
    Class representation of narratives table
    """
    __tablename__ = "narratives"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.sites.site_id"), nullable=False)
    event_id = DB.Column(DB.Integer)
    timestamp = DB.Column(
        DB.DateTime, default=datetime.datetime.utcnow, nullable=False)
    narrative = DB.Column(DB.String(500), nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("narratives", lazy="raise"), lazy="select")

    def __repr__(self):
        return f"{self.timestamp, self.narrative}\n"


class NarrativesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Narratives class
    """
    site_id = fields.Integer()
    site = fields.Nested(SitesSchema)

    class Meta:
        model = Narratives
