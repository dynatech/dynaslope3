from connection import DB, MARSHMALLOW


class UserInboxCollection(DB.Model):
    __tablename__ = "user_inbox_collection"

    __bind_key__ = "comms_db"

    collection_id = DB.Column(DB.Integer, primary_key=True)
    inbox_id = DB.Column(DB.Integer, nullable=False)
    read_status = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return f"Type <{self.inbox_id}>"


class UserInboxCollectionSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = UserInboxCollection
