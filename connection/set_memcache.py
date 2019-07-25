"""
Sets memcache for Dynaslope 3. Mainly symbol maps.
"""
from src.models.monitoring import (
    PublicAlertSymbols as pas, OperationalTriggerSymbols as ots,
    InternalAlertSymbols as ias, TriggerHierarchies as th)


def main(memory_client):
    table_list = {
        "public_alert_symbols": pas,
        "operational_trigger_symbols": ots,
        "internal_alert_symbols": ias,
        "trigger_hierarchies": th
    }

    for key in table_list:
        table_data = table_list[key].query.all()
        memory_client.set(f"D3_{key.upper()}", table_data)
