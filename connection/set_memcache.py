"""
Sets memcache for Dynaslope 3. Mainly symbol maps.
"""

from src.models.monitoring import (
    PublicAlertSymbols as pas, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies as th,
    PublicAlertSymbolsSchema as pasS, OperationalTriggerSymbolsSchema as otsS,
    InternalAlertSymbolsSchema as iasS, TriggerHierarchiesSchema as thS)
from src.models.api import (
    BulletinResponses as br, BulletinResponsesSchema as brS,
    BulletinTriggers as bt, BulletinTriggersSchema as btS)
from src.models.dynamic_variables import (
    DynamicVariables as dv, DynamicVariablesSchema as dvS)


def main(memory_client):
    table_list = {
        "public_alert_symbols": (pas, pasS(many=True)),
        "operational_trigger_symbols": (ots, otsS(many=True)),
        "internal_alert_symbols": (ias, iasS(many=True)),
        "trigger_hierarchies": (th, thS(many=True)),
        "dynamic_variables": (dv, dvS(many=True)),
        "bulletin_responses": (br, brS(many=True)),
        "bulletin_triggers": (bt, btS(many=True))
    }

    for key in table_list:
        table = table_list[key][0].query.all()
        table_data = table_list[key][1].dump(table).data
        memory_client.set(f"D3_{key.upper()}", table_data)
