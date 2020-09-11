"""
File containing class representation of
tables of users
"""

from flask_login import UserMixin
from marshmallow import fields
from instance.config import SCHEMA_DICT
from connection import DB, MARSHMALLOW
from src.models.sites import Sites
from src.models.organizations import UserOrganizations, UserOrganizationsSchema


class Users(DB.Model, UserMixin):
    """
    Class representation of users table
    """

    __tablename__ = "users"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    user_id = DB.Column(DB.Integer, primary_key=True)
    salutation = DB.Column(DB.String(15))
    first_name = DB.Column(DB.String(45))
    middle_name = DB.Column(DB.String(45))
    last_name = DB.Column(DB.String(45))
    nickname = DB.Column(DB.String(45))
    sex = DB.Column(DB.String(1))
    status = DB.Column(DB.Integer, nullable=True)
    birthday = DB.Column(DB.Date)
    ewi_recipient = DB.Column(DB.Integer, nullable=True)

    def get_id(self):
        """Filler docstring"""
        return self.user_id

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> User ID: {self.user_id}"
                f" First Name: {self.first_name} Last Name: {self.last_name}"
                f" Status: {self.status}")


class UsersRelationship(Users):
    """
    Class representation of users relation in mobile and organization of users
    """
    __tablename__ = "users"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    organizations = DB.relationship(
        UserOrganizations, backref=DB.backref(
            "user", lazy="joined", innerjoin=True),
        lazy="subquery")

    ewi_restriction = DB.relationship(
        "UserEwiRestrictions", backref=DB.backref("user", lazy="joined", innerjoin=True),
        lazy="joined", uselist=False)

    teams = DB.relationship(
        "UserTeamMembers", backref=DB.backref("user", lazy="joined", innerjoin=True),
        lazy="subquery")

    landline_numbers = DB.relationship(
        "UserLandlines", backref=DB.backref("user", lazy="joined", innerjoin=True),
        lazy="subquery")

    emails = DB.relationship(
        "UserEmails", backref=DB.backref("user", lazy="joined", innerjoin=True),
        lazy="subquery")
    # user_account relationship declared on UserAccounts

    def __repr__(self):
        return f"Type relationship"


class UserOrganization(DB.Model):
    """
    Class representation of user_organization table
    """

    __tablename__ = "user_organization"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    org_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    fk_site_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.sites.site_id"))
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
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    landline_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    landline_num = DB.Column(DB.String(30))
    remarks = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Type <{self.landline_num}"


class UserTeams(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "user_teams"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

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
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    member_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    team_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.user_teams.team_id"))

    team = DB.relationship(
        "UserTeams",
        backref=DB.backref("team_members", lazy="joined", innerjoin=True),
        lazy="subquery")

    def __repr__(self):
        return (f"Member ID : {self.members_id} | User ID : {self.users_users_id}"
                f"Dewsl Team ID : {self.dewsl_teams_team_id} \n")


class UserEmails(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "user_emails"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    email_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    email = DB.Column(DB.String(45))

    def __repr__(self):
        return f"{self.email}"


class UserAccounts(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "user_accounts"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    account_id = DB.Column(DB.Integer, primary_key=True)
    user_fk_id = DB.Column(
        DB.Integer, DB.ForeignKey(f"{SCHEMA_DICT['commons_db']}.users.user_id"))
    username = DB.Column(DB.String(45))
    password = DB.Column(DB.String(200))
    is_active = DB.Column(DB.Integer, nullable=True)
    salt = DB.Column(DB.String(200))

    user = DB.relationship(Users, backref=DB.backref(
        "account", lazy="raise", innerjoin=True, uselist=False), lazy="joined", uselist=False)

    def __repr__(self):
        return f"{self.email}"


class PendingAccounts(DB.Model):
    """
    Class representation of user_teams table
    """
    __tablename__ = "pending_accounts"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

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


class UserEwiRestrictions(DB.Model):
    """
    Class representation of user_ewi_restrictions table
    """

    __tablename__ = "user_ewi_restrictions"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    user_id = DB.Column(DB.Integer, DB.ForeignKey(
        f"{SCHEMA_DICT['commons_db']}.users.user_id"), primary_key=True)
    alert_level = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> User ID: {self.user_id}"
                f" Alert Level: {self.alert_level}")


class UsersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users class
    """

    birthday = fields.DateTime("%Y-%m-%d %H:%M:%S")

    class Meta:
        """Saves table class structure as schema model"""
        model = Users
        exclude = ["mobile_numbers", "landline_numbers", "account"]


class UsersRelationshipSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of Users Relationships
    """

    def __init__(self, *args, **kwargs):
        self.include = kwargs.pop("include", None)
        super().__init__(*args, **kwargs)

    def _update_fields(self, *args, **kwargs):
        super()._update_fields(*args, **kwargs)
        if self.include:
            for field_name in self.include:
                self.fields[field_name] = self._declared_fields[field_name]
            self.include = None

    birthday = fields.DateTime("%Y-%m-%d")

    mobile_numbers = fields.Nested(
        "UserMobilesSchema", many=True, exclude=("user",))

    organizations = fields.Nested(
        UserOrganizationsSchema, many=True, exclude=("user",))

    ewi_restriction = fields.Nested(
        "UserEwiRestrictionsSchema", exclude=("user",))

    teams = fields.Nested(
        "UserTeamMembersSchema", many=True, exclude=("user",))

    landline_numbers = fields.Nested(
        "UserLandlinesSchema", many=True, exclude=("user",))

    emails = fields.Nested(
        "UserEmailsSchema", many=True, exclude=("user",))

    account = fields.Nested(
        "UserAccountsSchema", many=False, exclude=("user",))

    class Meta:
        """Saves table class structure as schema model"""
        model = UsersRelationship
        exclude = ["account"]


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


class UserEwiRestrictionsSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of UserEwiRestrictions class
    """
    user = fields.Nested(UsersRelationshipSchema)

    class Meta:
        """Saves table class structure as schema model"""
        model = UserEwiRestrictions
