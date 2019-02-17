import asyncio
import websockets
import json
import MySQLdb
import time

DB_CONNECT = MySQLdb.connect(host="192.168.150.94",    # your host, usually localhost
                     user="root",         # your username
                     passwd="senslope",  # your password
                     db="comms_db")
LOOP = 1
TIME_OUT = 3

async def message():
	#while LOOP == 1:
	async with websockets.connect("ws://localhost:1234") as socket:
		sms_collection = checkUnsentSMS()
		for row in sms_collection:
			await socket.send(json.dumps(row))
			print(await socket.recv())
		time.sleep(TIME_OUT)

def checkUnsentSMS():
	fetch_unsent_sms_query = "SELECT outbox_id, sim_num, sms_msg, send_status FROM comms_db.smsoutbox_users INNER JOIN smsoutbox_user_status USING(outbox_id) INNER JOIN user_mobile USING(mobile_id) where send_status < 5 and send_status != 1;"
	result = readQuery(fetch_unsent_sms_query)
	return result

def readQuery(query=""):
	sms_container = []
	cur = DB_CONNECT.cursor()
	cur.execute(query)
	for row in cur.fetchall():
		sms_container.append(row)
	# DB_CONNECT.close()
	return sms_container

if __name__ == "__main__":
	asyncio.get_event_loop().run_until_complete(message())
	asyncio.get_event_loop().run_forever()