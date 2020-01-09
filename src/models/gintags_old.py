from marshmallow import fields
from connection import DB, MARSHMALLOW


class GintagsReference(DB.Model):
    """
    Class representation of general_data_references table
    """
    __tablename__ = "gintags_reference"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": "comms_db_3"}

    tag_id = DB.Column(DB.Integer, primary_key=True)
    tag_name = DB.Column(DB.String(200))
    tag_description = DB.Column(DB.String(1000))

    def __repr__(self):
        return f"Class Representation"


class Gintags(DB.Model):
    """
    Class representation of general_data_tag table
    """
    __tablename__ = "gintags"
    __bind_key__ = "comms_db_3"
    __table_args__ = {"schema": "comms_db_3"}

    gintags_id = DB.Column(DB.Integer, primary_key=True)
    tag_id_fk = DB.Column(
        DB.Integer, DB.ForeignKey("comms_db_3.gintags_reference.tag_id"))
    tagger_eid_fk = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.users.user_id"))
    table_element_id = DB.Column(DB.String(10))
    table_used = DB.Column(DB.String(45))
    timestamp = DB.Column(DB.String(45))
    remarks = DB.Column(DB.String(200))

    tag = DB.relationship("GintagsReference", backref="gintags",
                          lazy="joined")

    def __repr__(self):
        return f"Class Representation"
