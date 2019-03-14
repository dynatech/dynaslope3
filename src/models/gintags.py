from connection import DB, MARSHMALLOW


class Gintags(DB.Model):
    __tablename__ = "gintags"

    __bind_key__ = "comms_db"

    gintags_id = DB.Column(DB.Integer, primary_key=True)
    tag_id_fk = DB.Column(
        DB.Integer, DB.ForeignKey("gintags_reference.tag_id"))
    tagger_eid_fk = DB.Column(
        DB.Integer, DB.ForeignKey("users.user_id"))
    table_element_id = DB.Column(DB.String(10))
    table_used = DB.Column(DB.String(45))
    timestamp = DB.Column(DB.String(45))
    remarks = DB.Column(DB.String(200))

    def __repr__(self):
        return f"{self.gintags_id}\n"


class GintagsSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = Gintags
