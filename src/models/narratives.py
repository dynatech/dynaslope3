import datetime
from connection import DB, MARSHMALLOW


class Narratives(DB.Model):
    __tablename__ = "narratives"

    __bind_key__ = "comms_db"

    id = DB.Column(DB.Integer, primary_key=True)
    event_id = DB.Column(DB.Integer, nullable=True)
    timestamp = DB.Column(DB.DateTime, default=datetime.datetime.utcnow)
    narrative = DB.Column(DB.String(500))

    def __repr__(self):
        return f"{self.narrative}\n"


class NarrativesSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = Narratives
