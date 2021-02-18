"""
"""

import datetime
from marshmallow import fields
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW
from src.models.sites import SitesSchema
from src.models.users import UsersSchema


class Narratives(DB.Model):
    """
    Class representation of narratives table
    """
    __tablename__ = "narratives"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.sites.site_id"), nullable=False)
    event_id = DB.Column(DB.Integer)
    timestamp = DB.Column(
        DB.DateTime, default=datetime.datetime.now, nullable=False)
    narrative = DB.Column(DB.String(1000), nullable=False)
    type_id = DB.Column(DB.Integer, nullable=False)
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"), nullable=False)

    site = DB.relationship(
        "Sites", backref=DB.backref("narratives", lazy="raise"), lazy="select")
    user_details = DB.relationship(
        "Users", backref=DB.backref("narratives", lazy="raise"), lazy="select")

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Narrative ID: {self.id}"
                f" Site ID: {self.site_id} Event ID: {self.event_id}"
                f" Narrative: {self.narrative} Type ID: {self.type_id}")


class NarrativesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Narratives class
    """

    site_id = fields.Integer()
    user_id = fields.Integer()
    site = MARSHMALLOW.Nested(SitesSchema)
    user_details = MARSHMALLOW.Nested(UsersSchema)
    timestamp = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        model = Narratives
