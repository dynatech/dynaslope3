from marshmallow import fields
from connection import DB, MARSHMALLOW


class BulletinResponses(DB.Model):
    """
    Class representation of bulletin_responses table
    """

    __tablename__ = "bulletin_responses"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    pub_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.public_alert_symbols.pub_sym_id"), primary_key=True)
    recommended = DB.Column(DB.String(200))
    lewc_lgu = DB.Column(DB.String(200))
    community = DB.Column(DB.String(200))

    public_alert_symbol = DB.relationship(
        "PublicAlertSymbols", backref=DB.backref("bulletin_response", lazy="dynamic"), lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Public Symbol ID: {self.pub_sym_id}"
                f" Recommended Response: {self.recommended} LEWC/LGU Response: {self.lewc_lgu}"
                f" Community Response: {self.community}")


class BulletinTriggers(DB.Model):
    """
    Class representation of bulletin_triggers table
    """

    __tablename__ = "bulletin_triggers"
    __bind_key__ = "ewi_db"
    __table_args__ = {"schema": "ewi_db"}

    internal_sym_id = DB.Column(DB.Integer, DB.ForeignKey(
        "ewi_db.internal_alert_symbols.internal_sym_id"), primary_key=True)
    description = DB.Column(DB.String(100))
    cause = DB.Column(DB.String(50))
    template = DB.Column(DB.String(100))
    sms = DB.Column(DB.String(200))

    internal_sym = DB.relationship(
        "InternalAlertSymbols", backref=DB.backref("bulletin_trigger", lazy="dynamic"), lazy="joined", innerjoin=True)

    def __repr__(self):
        return (f"Type <{self.__class__.__name__}> Public Symbol ID: {self.intermal_sym_id}"
                f" Recommended Response: {self.recommended} LEWC/LGU Response: {self.lewc_lgu}"
                f" Community Response: {self.community}")


class BulletinResponsesSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of BulletinResponses class
    """

    pub_sym_id = fields.Integer()
    public_alert_symbol = fields.Nested("PublicAlertSymbolsSchema")

    class Meta:
        """Saves table class structure as schema model"""
        model = BulletinResponses


class BulletinTriggersSchema(MARSHMALLOW.ModelSchema):
    """
    Schema representation of BulletinTriggers class
    """

    internal_sym_id = fields.Integer()
    internal_sym = fields.Nested("InternalAlertSymbolsSchema")

    class Meta:
        """Saves table class structure as schema model"""
        model = BulletinTriggers

# class EwiTemplates(DB.Model):
#     """
#     Class representation of ewi_templates table
#     """
#     __tablename__ = "ewi_templates"
#     __bind_key__ = "ewi_db"
#     __table_args__ = {"schema": "ewi_db"}

#     template_id = DB.Column(DB.Integer, primary_key=True)
#     pub_sym_id = DB.Column(DB.String(45))
#     alert_type = DB.Column(DB.String(45))
#     ewi_type = DB.Column(DB.String(45))
#     ewi_notice = DB.Column(DB.String(455))
#     modified_log = DB.Column(DB.String(45))

#     def __repr__(self):
#         return f"Class Representation"


# class EwiTemplatesSchema(MARSHMALLOW.ModelSchema):
#     """
#     Schema representation of EwiTemplates class
#     """

#     class Meta:
#         """Saves table class structure as schema model"""
#         model = EwiTemplates
