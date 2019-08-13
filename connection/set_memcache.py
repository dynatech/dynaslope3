"""
Sets memcache for Dynaslope 3. Mainly symbol maps.
"""
from src.models.monitoring import (
    PublicAlertSymbols as pas, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies as th,
    PublicAlertSymbolsSchema as pasS, OperationalTriggerSymbolsSchema as otsS,
    InternalAlertSymbolsSchema as iasS, TriggerHierarchiesSchema as thS)


def main(memory_client):
    table_list = {
        "public_alert_symbols": (pas, pasS(many=True)),
        "operational_trigger_symbols": (ots, otsS(many=True)),
        "internal_alert_symbols": (ias, iasS(many=True)),
        "trigger_hierarchies": (th, thS(many=True))
    }
    # table_list = {
    #     "public_alert_symbols": pas,
    #     "operational_trigger_symbols": ots,
    #     "internal_alert_symbols": ias,
    #     "trigger_hierarchies": th
    # }

    for key in table_list:
        # table = table_list[key].query.all()
        # memory_client.set(f"D3_{key.upper()}", table)
        table = table_list[key][0].query.all()
        table_data = table_list[key][1].dump(table).data
        memory_client.set(f"D3_{key.upper()}", table_data)
