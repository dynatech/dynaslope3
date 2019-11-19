"""
File containing class representation of
tables of users
"""

from flask_login import UserMixin
from marshmallow import fields
from connection import DB, MARSHMALLOW
from src.models.sites import Sites
from src.models.organizations import UserOrganizations, UserOrganizationsSchema


class Users(DB.Model, UserMixin):
    """
    Class representation of users table
    """
    __tablename__ = "users"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    user_id = DB.Column(DB.Integer, primary_key=True)
    salutation = DB.Column(DB.String(15))
    first_name = DB.Column(DB.String(45))
    middle_name = DB.Column(DB.String(45))
    last_name = DB.Column(DB.String(45))
    nickname = DB.Column(DB.String(45))
    sex = DB.Column(DB.String(1))
    status = DB.Column(DB.Integer, nullable=True)
    birthday = DB.Column(DB.DateTime)
    ewi_recipient = DB.Column(DB.Integer, nullable=True)

    def get_id(self):
        return self.user_id

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> User ID: {self.user_id}"
                f" First Name: {self.first_name} Last Name: {self.last_name}"
                f" Status: {self.status}")

#ilipat
class UserEwiStatus(DB.Model, UserMixin):
    """
    Class representation of users table
    """
    __tablename__ = "user_ewi_status"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    mobile_id = DB.Column(DB.Integer, primary_key=True)
    status = DB.Column(DB.Integer, nullable=True)
    remarks = DB.Column(DB.String(45))
    users_id = DB.Column(DB.Integer, nullable=True)

    def get_id(self):
        return self.mobile_id

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Mobile ID: {self.mobile_id}")

class UsersRelationship(Users):
    """
    Class representation of users relation in mobile and organization of users
    """
    __tablename__ = "users"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    # mobile_numbers = DB.relationship(
    #     "UserMobile", backref=DB.backref("user", lazy="joined", innerjoin=True), order_by="UserMobile.priority", lazy="subquery")
    # mobile_numbers = DB.relationship("UserMobiles", backref=DB.backref("user", lazy="joined", innerjoin=True),
    #                                  order_by="UserMobile.priority", lazy="subquery")

    organizations = DB.relationship(
        UserOrganizations, backref=DB.backref("user", lazy="joined", innerjoin=True), lazy="subquery")

    # user_hierarchy = DB.relationship(
    #     "UserHierarchy", backref=DB.backref("user", lazy=True), lazy="subquery")

    teams = DB.relationship(
        "UserTeamMembers", backref=DB.backref("user", lazy="joined", innerjoin=True), lazy="subquery")

    landline_numbers = DB.relationship(
        "UserLandlines", backref=DB.backref("user", lazy="joined", innerjoin=True),
        lazy="subquery")

    emails = DB.relationship(
        "UserEmails", backref=DB.backref("user", lazy="joined", innerjoin=True),
        lazy="subquery")

    # user_accounts = DB.relationship(
    #     "UserAccounts", backref=DB.backref("user", lazy="joined", innerjoin=True), lazy="subquery")

    def __repr__(self):
        return f"Type relationship"


# SOON TO BE DELETED BECAUSE OF REFACTORING
# SEE models/mobile_numbers.py
class UserMobile(DB.Model):
    """
    Class representation of user mobile table
    """
    __tablename__ = "user_mobile"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    mobile_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        "commons_db.users.user_id"), nullable=False)
    sim_num = DB.Column(DB.String(30))
    priority = DB.Column(DB.Integer, nullable=False)
    mobile_status = DB.Column(DB.Integer, nullable=False)
    gsm_id = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"{self.sim_num}"


class UserOrganization(DB.Model):
    """
    Class representation of user_organization table
    """

    __tablename__ = "user_organization"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    org_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.users.user_id"))
    fk_site_id = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.sites.site_id"))
    org_name = DB.Column(DB.String(45))
    scope = DB.Column(DB.Integer, nullable=True)

    site = DB.relationship(
        Sites, backref=DB.backref("user2", lazy="select"),
        primaryjoin="UserOrganization.fk_site_id==Sites.site_id", lazy=True)

    def __repr__(self):
        return f"{self.org_name}"



class UserLandlines(DB.Model):
    """
    Class representation of user_landlines table
    """
    __tablename__ = "user_landlines"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    landline_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.users.user_id"))
    landline_num = DB.Column(DB.String(30))
    remarks = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Type <{self.landline_num}"


# class UserHierarchy(DB.Model):
#     """
#     Class representation of user_hierarchy table
#     """
#     __tablename__ = "user_hierarchy"
#     __bind_key__ = "comms_db"
#     __table_args__ = {"schema": "comms_db"}

#     contact_hierarchy_id = DB.Column(DB.Integer, primary_key=True)
#     fk_user_id = DB.Column(
#         DB.Integer, DB.ForeignKey("commons_db.users.user_id"))
#     fk_user_organization_id = DB.Column(
#         DB.Integer, DB.ForeignKey("commons_db.user_organization.org_id"))
#     fk_site_id = DB.Column(
#         DB.Integer, DB.ForeignKey("sites.site_id"))
#     priority = DB.Column(DB.Integer, nullable=False)

#     def __repr__(self):
#         return f"Type <{self.priority}>"


class UserTeams(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "user_teams"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    team_id = DB.Column(DB.Integer, primary_key=True)
    team_code = DB.Column(DB.String(20))
    team_name = DB.Column(DB.String(20))
    remarks = DB.Column(DB.String(45))

    def __repr__(self):
        return f"{self.team_code}"


class UserTeamMembers(DB.Model):
    """
    Class representation of user_team_members table
    """
    __tablename__ = "user_team_members"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    member_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.users.user_id"))
    team_id = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.user_teams.team_id"))

    team = DB.relationship(
        "UserTeams", backref=DB.backref("team_members", lazy="joined", innerjoin=True), lazy="subquery")

    def __repr__(self):
        return (f"Member ID : {self.members_id} | User ID : {self.users_users_id}"
                f"Dewsl Team ID : {self.dewsl_teams_team_id} \n")


class UserEmails(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "user_emails"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    email_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.users.user_id"))
    email = DB.Column(DB.String(45))

    def __repr__(self):
        return f"{self.email}"


class UserAccounts(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "user_accounts"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    account_id = DB.Column(DB.Integer, primary_key=True)
    user_fk_id = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.users.user_id"))
    username = DB.Column(DB.String(45))
    password = DB.Column(DB.String(200))
    is_active = DB.Column(DB.Integer, nullable=True)
    salt = DB.Column(DB.String(200))

    user = DB.relationship(Users, backref=DB.backref(
        "account", lazy="raise", innerjoin=True), lazy="joined", innerjoin=True, uselist=False)

    def __repr__(self):
        return f"{self.email}"


class PendingAccounts(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "pending_accounts"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    pending_account_id = DB.Column(DB.Integer, primary_key=True)
    username = DB.Column(DB.String(45))
    password = DB.Column(DB.String(200))
    first_name = DB.Column(DB.String(45))
    last_name = DB.Column(DB.String(45))
    birthday = DB.Column(DB.String(25))
    sex = DB.Column(DB.String(10))
    salutation = DB.Column(DB.String(10))
    mobile_number = DB.Column(DB.String(12))
    validation_code = DB.Column(DB.String(4))
    role = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"{self.email}"


class UsersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = Users
        exclude = ["mobile_numbers", "landline_numbers", "account"]

class UserEwiStatusSchema(MARSHMALLOW.ModelSchema):
    """
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = UserEwiStatus


class UsersRelationshipSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users Relationships
    """
    mobile_numbers = fields.Nested(
        "UserMobilesSchema", many=True, exclude=("user",))

    organizations = fields.Nested(
        UserOrganizationsSchema, many=True, exclude=("user",))

    # user_hierarchy = fields.Nested(
    #     "UserHierarchySchema", many=True, exclude=("user",))

    teams = fields.Nested(
        "UserTeamsSchema", many=True, exclude=("user",))

    landline_numbers = fields.Nested(
        "UserLandlinesSchema", many=True, exclude=("user",))

    emails = fields.Nested(
        "UserEmailsSchema", many=True, exclude=("user",))

    class Meta:
        """Saves table class structure as schema model"""
        model = UsersRelationship
        exclude = ["account"]


class UserMobileSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of User Mobile class
    """
    user = fields.Nested(UsersRelationshipSchema, exclude=("mobile_numbers",))

    class Meta:
        """Saves table class structure as schema model"""
        model = UserMobile


class UserOrganizationSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of User Organization class
    """
    site = fields.Nested("SitesSchema")

    class Meta:
        """Saves table class structure as schema model"""
        model = UserOrganization


class UserLandlinesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of user_landlines class
    """

    user = fields.Nested(UsersRelationshipSchema,
                         exclude=("landline_numbers",))

    class Meta:
        """Saves table class structure as schema model"""

        model = UserLandlines


class UserEmailsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of user_emails class
    """

    user = fields.Nested(UsersRelationshipSchema, exclude=("emails",))

    class Meta:
        """Saves table class structure as schema model"""

        model = UserEmails


# class UserHierarchySchema(MARSHMALLOW.ModelSchema):
#     """
#     Schema representation of Users class
#     """

#     user = fields.Nested(UsersSchema)

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = UserHierarchy


class UserTeamsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    team_members = fields.Nested(
        "UserTeamMembersSchema", many=True, exclude=["team"])

    class Meta:
        """Saves table class structure as schema model"""
        model = UserTeams


class UserTeamMembersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """
    team = fields.Nested("UserTeamsSchema", exclude=("team_members",))

    class Meta:
        """Saves table class structure as schema model"""
        model = UserTeamMembers


class UserAccountsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    user = fields.Nested(UsersSchema)

    class Meta:
        """Saves table class structure as schema model"""
        model = UserAccounts


class PendingAccountsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = PendingAccounts
