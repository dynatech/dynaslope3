import datetime
from connection import DB, MARSHMALLOW


class Narratives(DB.Model):
    __tablename__ = "narratives"

    id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    site_id = DB.Column(DB.Integer, DB.ForeignKey(
        "sites.site_id"), nullable=False)
    event_id = DB.Column(DB.Integer)
    timestamp = DB.Column(
        DB.DateTime, default=datetime.datetime.utcnow, nullable=False)
    narrative = DB.Column(DB.String(500), nullable=False)

    def __repr__(self):
        return f"{self.narrative}\n"


class NarrativesSchema(MARSHMALLOW.ModelSchema):
    class Meta:
        model = Narratives
