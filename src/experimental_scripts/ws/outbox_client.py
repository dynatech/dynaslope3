import asyncio
import websockets
import json
import MySQLdb
import time
import datetime


LOOP = 1
TIME_OUT = 3
INCREAMENT = 0

async def message():
	async with websockets.connect("ws://localhost:1234") as socket:
		global LOOP, TIME_OUT, INCREAMENT
		# while LOOP == 1:
		sms_collection = checkUnsentSMS()
		if (len(sms_collection) != 0):
			for row in sms_collection:
				await socket.send(json.dumps(row))
				sms_status = json.loads(await socket.recv())
				if sms_status["status"] == 1:
					update_status = updateSendStatus(sms_status)
					if (update_status == 1):
						print("SMS Sent.\n")
					else:
						print("retry update...")
				else:
					print("retry...")
			time.sleep(TIME_OUT)
		else:
			print("No pending sms...\n")
			time.sleep(TIME_OUT)
		INCREAMENT = INCREAMENT + 1

def db_connect():
	DB_CONNECT = MySQLdb.connect(host="192.168.150.94",    # your host, usually localhost
                     user="root",         # your username
                     passwd="senslope",  # your password
                     db="comms_db")
	return DB_CONNECT

def checkUnsentSMS():
	fetch_unsent_sms_query = "SELECT outbox_id, sim_num, sms_msg, send_status FROM comms_db.smsoutbox_users INNER JOIN smsoutbox_user_status USING(outbox_id) INNER JOIN user_mobile USING(mobile_id) where send_status < 5 and send_status != 1 limit 1;"
	result = readQuery(fetch_unsent_sms_query)
	return result

def readQuery(query=""):
	sms_container = []
	DB_CONNECT = db_connect()
	cur = DB_CONNECT.cursor()
	cur.execute(query)
	for row in cur.fetchall():
		sms_container.append(row)
	DB_CONNECT.close()
	return sms_container

def writeQuery():
	print("write")

def updateQuery(query=""):
	DB_CONNECT = db_connect()
	cur = DB_CONNECT.cursor()
	cur.execute(query)
	DB_CONNECT.commit()
	DB_CONNECT.close()
	return cur.rowcount

def updateSendStatus(data):
	current_date = datetime.datetime.now().replace(microsecond=0)
	update_sms_status_query = "UPDATE smsoutbox_user_status SET ts_sent = '"+str(current_date)+"', send_status = '5' WHERE outbox_id = '"+str(data["outbox_id"])+"'"
	update_status = updateQuery(update_sms_status_query)
	return update_status

if __name__ == "__main__":
	while LOOP == 1:
		asyncio.new_event_loop().run_until_complete(message())