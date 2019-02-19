from connection import DB, MARSHMALLOW

class UserEmails(DB.Model):
    __tablename__ = "user_emails"

    __bind_key__ = "comms_db"

    email_id = DB.Column(DB.Integer, primary_key=True)
    user_id = DB.Column(DB.Integer, nullable=False)
    email = DB.Column(DB.String(45))

    def __repr__(self):
        return (f"Type <{self.email}")


class UserEmailsSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserEmails
