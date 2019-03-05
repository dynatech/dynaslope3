import datetime
from marshmallow import fields
from connection import DB, MARSHMALLOW


class Users(DB.Model):
    __tablename__ = "users"
    __bind_key__ = "comms_db"
    __table_args__ = {"schema": "comms_db"}

    user_id = DB.Column(DB.Integer, primary_key=True)
    salutation = DB.Column(DB.String(15))
    firstname = DB.Column(DB.String(45))
    middlename = DB.Column(DB.String(45))
    lastname = DB.Column(DB.String(45))
    nickname = DB.Column(DB.String(45))
    sex = DB.Column(DB.String(1))
    status = DB.Column(DB.Integer, nullable=True)
    birthday = DB.Column(DB.Integer, nullable=True)

    def __repr__(self):
        return f"Type <{self.firstname}>"


# class UsersRelationship(Users):
#     __tablename__ = "users"
#     __bind_key__ = "comms_db"
#     __table_args__ = {"schema": "comms_db"}

#     mobile_numbers = DB.relationship(
#         "UserMobile", backref=DB.backref("user", lazy="joined", innerjoin=True),
#         primaryjoin="UsersRelationship.user_id==UserMobile.user_id", lazy="subquery")

#     def __repr__(self):
#         return f"Type relationship"


# class UserMobile(DB.Model):
#     __tablename__ = "user_mobile"
#     __bind_key__ = "comms_db"
#     __table_args__ = {"schema": "comms_db"}

#     mobile_id = DB.Column(DB.Integer, primary_key=True)
#     user_id = DB.Column(DB.Integer, DB.ForeignKey(
#         "comms_db.users.user_id"), nullable=False)
#     sim_num = DB.Column(DB.String(30))
#     priority = DB.Column(DB.Integer, nullable=False)
#     mobile_status = DB.Column(DB.Integer, nullable=False)
#     gsm_id = DB.Column(DB.Integer, nullable=False)

#     def __repr__(self):
#         return (f"{self.sim_num}")


class UsersSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = Users


# class UsersRelationshipSchema(MARSHMALLOW.ModelSchema):
#     mobile_numbers = fields.Nested(
#         "UserMobileSchema1", many=True, exclude=("user",))

#     class Meta:
#         model = UsersRelationship


# class UserMobileSchema(MARSHMALLOW.ModelSchema):
#     user = fields.Nested(UsersSchema)

#     class Meta:
#         model = UserMobile
