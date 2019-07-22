"""
Sets memcache for Dynaslope 3. Mainly symbol maps.
"""
from src.utils.extra import create_symbols_map


def main(memory_client):
    table_list = [
        "operational_trigger_symbols",
        "internal_alert_symbols",
        "public_alert_symbols",
        "trigger_hierarchies"
    ]

    for key in table_list:
        custom_map = create_symbols_map(key)
        memory_client.set(key.upper(), custom_map)
