from marshmallow import fields
from connection import DB, MARSHMALLOW


class GeneralDataReferences(DB.Model):
    """
    Class representation of general_data_references table
    """
    __tablename__ = "general_data_references"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    tag_id = DB.Column(DB.Integer, primary_key=True)
    tag_name = DB.Column(DB.String(200))
    tag_description = DB.Column(DB.String(1000))

    def __repr__(self):
        return f"Class Representation"


class GeneralDataTag(DB.Model):
    """
    Class representation of general_data_tag table
    """
    __tablename__ = "general_data_tag"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    gintags_id = DB.Column(DB.Integer, primary_key=True)
    tag_id_fk = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.general_data_references.tag_id"))
    tagger_eid_fk = DB.Column(
        DB.Integer, DB.ForeignKey("comms_db_2.users.user_id"))
    table_element_id = DB.Column(DB.String(10))
    table_used = DB.Column(DB.String(45))
    timestamp = DB.Column(DB.String(45))
    remarks = DB.Column(DB.String(200))

    def __repr__(self):
        return f"Class Representation"


class GeneralDataTagManager(DB.Model):
    """
    Class representation of general_data_tag_manager table
    """
    __tablename__ = "general_data_tag_manager"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    id = DB.Column(DB.Integer, primary_key=True)
    tag_id_fk = DB.Column(
        DB.Integer, DB.ForeignKey("commons_db.general_data_references.tag_id"))
    description = DB.Column(DB.String(60))
    narrative_input = DB.Column(DB.String(100))
    last_update = DB.Column(DB.String(45))

    tag_manager_reference = DB.relationship(
        "GeneralDataReferences", backref=DB.backref(
            "reference", lazy="joined"), lazy="subquery")

    def __repr__(self):
        return f"Class Representation"


class GeneralDataReferencesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of GeneralDataReferences class
    """
    class Meta:
        """Saves table class structure as schema model"""
        model = GeneralDataReferences


class GeneralDataTagManagerSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of GeneraDataTagManager class
    """
    tag_manager_reference = fields.Nested(
        GeneralDataReferencesSchema, exclude=("reference",))

    class Meta:
        """Saves table class structure as schema model"""
        model = GeneralDataTagManager


class GeneralDataTagSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of GeneralDataTag class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = GeneralDataTag
