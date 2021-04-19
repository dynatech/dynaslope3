"""
"""

from instance.config import SCHEMA_DICT
from marshmallow import EXCLUDE
from connection import DB, MARSHMALLOW


class DynamicVariables(DB.Model):
    """
    Class representation of narratives table
    """
    __tablename__ = "dynamic_variables"
    __bind_key__ = "commons_db"
    __table_args__ = {"schema": SCHEMA_DICT[__bind_key__]}

    var_id = DB.Column(DB.Integer, primary_key=True, nullable=False)
    var_name = DB.Column(DB.String(50), nullable=False)
    var_value = DB.Column(DB.Integer, nullable=False)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Variable ID: {self.var_id}"
                f" Variable Name: {self.var_name} Variable Value: {self.var_value}")


class DynamicVariablesSchema(MARSHMALLOW.SQLAlchemyAutoSchema):
    """
    Schema representation of DynamicVariables class
    """
    class Meta:
        model = DynamicVariables
