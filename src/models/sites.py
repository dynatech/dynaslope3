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
    __bind_key__ = "senslopedb"

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
    season = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Site ID: {self.site_id}"
                f" Site Code: {self.site_code}")


class SitesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Sites class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = Sites
        ordered = False
