"""
Organizations Model
"""

from marshmallow import fields
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW
from src.models.sites import Sites


class Organizations(DB.Model):
    """
    Class representation of organizations table
    """

    __tablename__ = "organizations"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    org_id = DB.Column(DB.Integer, primary_key=True)
    scope = DB.Column(DB.Integer, nullable=True)
    name = DB.Column(DB.String(45))

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}>: "
                f"org_id: {self.org_id} | scope: {self.scope} | name: {self.name}\n")


class UserOrganizations(DB.Model):
    """
    Class representation of user_organization table
    """

    __tablename__ = "user_organizations"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    user_org_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    site_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.sites.site_id"))
    org_name = DB.Column(DB.String(45))
    org_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.organizations.org_id"))
    primary_contact = DB.Column(DB.Integer, nullable=True)

    site = DB.relationship(
        Sites, backref=DB.backref("user", lazy="select"),
        primaryjoin="UserOrganizations.site_id==Sites.site_id", lazy="joined", innerjoin=True)

    organization = DB.relationship(
        Organizations, backref=DB.backref("users", lazy="subquery"),
        primaryjoin="UserOrganizations.org_id==Organizations.org_id", lazy="joined", innerjoin=True)

    def __repr__(self):
        return f"{self.org_name}"


class OrganizationsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of Organizations class
    """

    users = MARSHMALLOW.Nested("UserOrganizationsSchema",
                          many=True, exclude=["organization"])

    class Meta:
        """Saves table class structure as schema model"""
        model = Organizations


class UserOrganizationsSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of User Organizations class
    """

    site = MARSHMALLOW.Nested("SitesSchema")
    organization = MARSHMALLOW.Nested(OrganizationsSchema, exclude=["users"])

    class Meta:
        """Saves table class structure as schema model"""
        model = UserOrganizations
