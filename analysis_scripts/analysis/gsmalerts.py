from datetime import datetime, timedelta
import os
import sys

sys.path.append(os.path.dirname(os.path.realpath(__file__)))
import dynadb.db as db
import querydb as qdb
import publicalerts as pub
import gsm.gsmserver_dewsl3.sms_data as sms

def site_alerts(curr_trig, ts, release_data_ts, connection):
    site_id = curr_trig['site_id'].values[0]

    query = "SELECT site_id, stat.trigger_id, trigger_source, alert_level FROM "
    query += "  (SELECT * FROM alert_status "
    query += "  WHERE ts_last_retrigger >= '%s' " %(ts - timedelta(1))
    query += "  ) as stat "
    query += "INNER JOIN "
    query += "  (SELECT trigger_id, site_id, trigger_source, alert_level FROM "
    query += "    (SELECT * FROM operational_triggers "
    query += "    WHERE site_id = %s " %site_id
    query += "    ) AS op "
    query += "  INNER JOIN "
    query += "    (SELECT trigger_sym_id, trigger_source, alert_level FROM "
    query += "      .operational_trigger_symbols AS trig_sym "
    query += "    INNER JOIN "
    query += "      .trigger_hierarchies AS trig "
    query += "    USING (source_id) "
    query += "    ) as sym "
    query += "  USING (trigger_sym_id) "
    query += "  ) as sub "
    query += "USING (trigger_id)"
    sent_alert = db.df_read(query, connection=connection)

    query = "SELECT * FROM alert_status"
    query += " WHERE trigger_id in (%s)" %(','.join(map(lambda x: str(x), \
                                         set(curr_trig['trigger_id'].values))))
    written = db.df_read(query, connection=connection)

    site_curr_trig = curr_trig[~curr_trig.trigger_id.isin(written.trigger_id)]
    site_curr_trig = site_curr_trig.sort_values('alert_level', ascending=False)
    site_curr_trig = site_curr_trig.drop_duplicates('trigger_source')

    if len(site_curr_trig) == 0:
        qdb.print_out('no new trigger for site_id %s' %site_id)
        return

    if len(sent_alert) == 0:
        pass
    elif max(site_curr_trig.alert_level) <= max(sent_alert.alert_level):
        if max(sent_alert.alert_level) > 1 or \
                    (max(site_curr_trig.alert_level) == 1 and \
                    'surficial' not in site_curr_trig['trigger_source'].values):
            qdb.print_out('no higher trigger')
            return
        site_curr_trig = site_curr_trig[site_curr_trig.trigger_source == 'surficial']
    else:
        site_curr_trig = site_curr_trig[site_curr_trig.alert_level >
                max(sent_alert.alert_level)]
        
    alert_status = site_curr_trig[['ts_last_retrigger', 'trigger_id']]                
    alert_status = alert_status.rename(columns = {'ts': 
            'ts_last_retrigger'})
    alert_status['ts_set'] = datetime.now()
    data_table = sms.DataTable('alert_status', alert_status)
    db.df_write(data_table, connection=connection)

def main(connection='analysis'):
    start_time = datetime.now()
    qdb.print_out(start_time)
    
    ts = pub.round_data_ts(start_time)
    release_data_ts = pub.release_time(ts) - timedelta(hours=0.5)
    
    if qdb.does_table_exist('operational_triggers') == False:
        qdb.create_operational_triggers()
    
    query = "SELECT trigger_id, ts, site_id, trigger_source, "
    query += "alert_level, ts_updated FROM "
    query += "  (SELECT * FROM operational_triggers "
    query += "  WHERE ts <= '%s' " %ts
    query += "  AND ts_updated >= '%s' " %(ts - timedelta(1))
    query += "  ) AS op "
    query += "INNER JOIN " 
    query += "  (SELECT trigger_sym_id, alert_level, trigger_source FROM "
    query += "    (SELECT * FROM operational_trigger_symbols "
    query += "    WHERE alert_level > 0 "
    query += "    ) AS trig_sym "
    query += "  INNER JOIN "
    query += "    trigger_hierarchies AS trig "
    query += "  USING (source_id) "
    query += "  ) AS sym "
    query += "USING (trigger_sym_id) "
    query += "ORDER BY ts_updated DESC"
    curr_trig = db.df_read(query, connection=connection)

    if len(curr_trig) == 0:
        qdb.print_out('no new trigger')
        return
        
    if not qdb.does_table_exist('alert_status'):
        qdb.create_alert_status()

    curr_trig = curr_trig.rename(columns = {"ts_updated": "ts_last_retrigger"})
    site_curr_trig = curr_trig.groupby('site_id', as_index=False)
    site_curr_trig.apply(site_alerts, ts=ts, release_data_ts=release_data_ts, connection=connection)

################################################################################

if __name__ == "__main__":
    main()