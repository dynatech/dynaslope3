from marshmallow import fields
from connection import DB, MARSHMALLOW


class ResourcesAndCapacities(DB.Model):
    """
    Class representation of resources_and_capacities table
    """
    __tablename__ = "resources_and_capacities"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": "commons_db"}

    resources_and_capacities_id = DB.Column(DB.Integer, primary_key=True)
    resource_and_capacity = DB.Column(DB.String(100))
    status = DB.Column(DB.String(45))
    owner = DB.Column(DB.String(45))

    def __repr__(self):
        return f"Class Representation"


class ResourcesAndCapacitiesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of ResourcesAndCapacities class
    """

    class Meta:
        """Saves table class structure as schema model"""
        model = ResourcesAndCapacities
