import MySQLdb
import var_dump
import configparser
from datetime import datetime as dt
from datetime import timedelta as td
from pprint import pprint

class DatabaseCredentials:
	def __new__(self):
		config = configparser.ConfigParser()
		config.read('../utils/config.cnf')
		config["CBEWSL_DB_CREDENTIALS"]
		return config

class DatabaseConnection:

	db_cred = None
	def __init__(self):
		self.db_cred = DatabaseCredentials()

	def get_all_outbox_sms_from_db(self, table, send_status, gsm_id):
		if not table:
			raise ValueError("No table definition")

		while True:
			try:
				db, cur = self.dbConnect(self.db_cred['CBEWSL_DB_CREDENTIALS']['db_comms'])
				query = ("select t1.stat_id,t1.mobile_id,t1.gsm_id,t1.outbox_id,"
					"t2.sms_msg from "
					"smsoutbox_%s_status as t1 "
					"inner join (select * from smsoutbox_%s) as t2 "
					"on t1.outbox_id = t2.outbox_id "
					"where t1.send_status < %d "
					"and t1.send_status >= 0 "
					"and t1.gsm_id = %d ") % (table[:-1],table,send_status,gsm_id)

				a = cur.execute(query)
				out = []
				if a:
					out = cur.fetchall()
					db.close()
				return out

			except MySQLdb.OperationalError:
				print('10.')
				time.sleep(20)

	def getAllLoggersMobile(self, host, simnum):
		try:
			db, cur = self.dbConnect(self.db_cred['CBEWSL_DB_CREDENTIALS']['db_comms'])
			query = ("SELECT t1.mobile_id, t1.sim_num, t1.gsm_id " \
				"FROM logger_mobile AS t1 " \
				"LEFT OUTER JOIN logger_mobile AS t2 " \
				"ON t1.sim_num = t2.sim_num " \
				"AND (t1.date_activated < t2.date_activated " \
				"OR (t1.date_activated = t2.date_activated " \
				"AND t1.mobile_id < t2.mobile_id)) " \
				"WHERE t2.sim_num IS NULL and t1.sim_num is not null")

			a = cur.execute(query)
			out = []
			if a:
				out = cur.fetchall()
				db.close()
			return out

		except MySQLdb.OperationalError:
			time.sleep(20)

	def getAllUsersMobile(self, sim_num, mobile_id_flag = False):
		try:
			db, cur = self.dbConnect(self.db_cred['CBEWSL_DB_CREDENTIALS']['db_comms'])
			if mobile_id_flag == False:
				query = "select mobile_id, sim_num, gsm_id from user_mobile where sim_num like '%"+sim_num+"%'"
			else:
				query = "select mobile_id, sim_num, gsm_id from user_mobile where mobile_id = '"+str(sim_num)+"'"
			a = cur.execute(query)
			out = []
			if a:
				out = cur.fetchall()
				db.close()
			return out

		except MySQLdb.OperationalError as mysqle:
			print("MySQLdb OP Error:",mysqle)
			time.sleep(20)

	def write_inbox(self, msglist='',gsm_info=''):
		if not msglist:
			raise ValueError("No msglist definition") # UNCOMMENT THIS ONE AFTER

		if not gsm_info:
			raise ValueError("No gsm_info definition") # UNCOMMENT THIS ONE AFTER

		ts_stored = dt.today().strftime("%Y-%m-%d %H:%M:%S")

		gsm_id = gsm_info['id']

		loggers_count = 0
		users_count = 0

		#query_loggers = ("insert into smsinbox_loggers (ts_sms, ts_stored, mobile_id, "
		#	"sms_msg,read_status,gsm_id) values ")                                           // TODO: change implem
		query_users = ("insert into smsinbox_users (ts_sms, ts_stored, mobile_id, "
			"sms_msg,read_status,gsm_id) values ")

		sms_id_ok = []
		sms_id_unk = []
		ts_sms = 0
		ltr_mobile_id= 0

		for m in msglist:
			# print m.simnum, m.data, m.dt, m.num
			ts_sms = m.dt
			sms_msg = m.data
			read_status = 0

			#logger_mobile_sim_nums = self.getAllLoggersMobile(host, m.simnum[:10]) // TODO: change implem
			user_mobile_sim_nums = self.getAllUsersMobile(m.simnum[:10])

			user_mobile_sim_nums = {sim_num: mobile_id for (mobile_id, sim_num, 
			gsm_id) in user_mobile_sim_nums}

			# if m.simnum in logger_mobile_sim_nums.keys():
			# 	query_loggers += "('%s','%s',%d,'%s',%d,%d)," % (ts_sms, ts_stored,
			# 		logger_mobile_sim_nums[m.simnum], sms_msg, read_status, gsm_id)
			# 	ltr_mobile_id= logger_mobile_sim_nums[m.simnum]
			# 	loggers_count += 1
			if m.simnum in user_mobile_sim_nums.keys():
				query_users += "('%s','%s',%d,'%s',%d,%d)," % (ts_sms, ts_stored,
					user_mobile_sim_nums[m.simnum], sms_msg, read_status, gsm_id)
				users_count += 1
			else:            
				print('Unknown number', m.simnum)
				sms_id_unk.append(m.num)
				continue

			sms_id_ok.append(m.num)

		# query_loggers = query_loggers[:-1]
		query_users = query_users[:-1]
		if len(sms_id_ok)>0:
			#if loggers_count > 0:
			#    dbio.write(query=query_loggers, host=sms_host, resource=resource)
			if users_count > 0:
				self.writeToDB(query=query_users, host=host)

	def writeToDB(self, query, last_insert_id = False):
		ret_val = None
		db, cur = self.dbConnect(self.db_cred['CBEWSL_DB_CREDENTIALS']['db_comms'])

		try:
			a = cur.execute(query)
			db.commit()
			if last_insert_id:
				b = cur.execute('select last_insert_id()')
				b = cur.fetchall()
				ret_val = b

		except IndexError:
			print("IndexError on ")
			print(str(inspect.stack()[1][3]))
		except (MySQLdb.Error, MySQLdb.Warning) as e:
			print (">> MySQL error/warning: %s" % e)
			print ("Last calls:") 
			for i in range(1,6):
				try:
					print("%s," % str(inspect.stack()[i][3]),)
				except IndexError:
					continue
			print("\n")

		finally:
			db.close()
			return ret_val

	def readDB(self, query):
		try:
			db, cur = self.dbConnect(self.db_cred['CBEWSL_DB_CREDENTIALS']['db_comms'])
			a = cur.execute(query)
			out = []
			if a:
				out = cur.fetchall()
				db.close()
			return out

		except MySQLdb.OperationalError as mysqle:
			print("MySQLdb OP Error:",mysqle)
			time.sleep(20)

	def dbConnect(self, schema):
		try:
			db = MySQLdb.connect(self.db_cred['CBEWSL_DB_CREDENTIALS']['host'], 
			self.db_cred['CBEWSL_DB_CREDENTIALS']['user'], 
			self.db_cred['CBEWSL_DB_CREDENTIALS']['password'], schema)
			cur = db.cursor()
			return db, cur
		except TypeError:
			print('Error Connection Value')
			return False
		except MySQLdb.OperationalError as mysqle:
			print("MySQL Operationial Error:",mysqle)
			return False
		except (MySQLdb.Error, MySQLdb.Warning) as e:
			print("MySQL Error:",e)
			return False

	def updateSentStatus(self, table='',status_list='',resource="sms_data"):
		if not table:
			raise ValueError("No table definition")

		if not status_list:
			raise ValueError("No status list definition")

		query = ("insert into smsoutbox_%s_status (stat_id,send_status,ts_sent,"
			"outbox_id,gsm_id,mobile_id) values ") % (table[:-1])

		for stat_id,send_status,ts_sent,outbox_id,gsm_id,mobile_id in status_list:
			query += "(%d,%d,'%s',%d,%d,%d)," % (stat_id, send_status, ts_sent,
				outbox_id, gsm_id, mobile_id)

		query = query[:-1]
		query += (" on duplicate key update stat_id=values(stat_id), "
			"send_status=send_status+values(send_status),ts_sent=values(ts_sent)")
		
		self.writeToDB(query=query, last_insert_id=False)

	def getGsmInfo(self, gsm_id):
		gsm_dict = {}
		query = "SELECT * FROM comms_db.gsm_modules where gsm_id = '"+str(gsm_id)+"';"
		gsm_info = self.readDB(query) # Refactor this
		for gsm_id, gsm_server_id, gsm_name, sim_num, network, port, pwr, rng, module_type in gsm_info:
			gsm_dict['gsm_id'] = gsm_id
			gsm_dict['gsm_server_id'] = gsm_server_id
			gsm_dict['gsm_name'] = gsm_name
			gsm_dict['sim_num'] = sim_num
			gsm_dict['network'] = network
			gsm_dict['port'] = port
			gsm_dict['pwr'] = pwr
			gsm_dict['rng'] = rng
			gsm_dict['module_type'] = module_type
		container = {gsm_id: gsm_dict}
		return container