import asyncio
import websockets
import json
import MySQLdb

DB_CONNECT = MySQLdb.connect(host="192.168.150.75",    # your host, usually localhost
                     user="pysys_local",         # your username
                     passwd="NaCAhztBgYZ3HwTkvHwwGVtJn5sVMFgg",  # your password
                     db="comms_db")

async def message():
	async with websockets.connect("ws://localhost:1234") as socket:
		msg = input("What do you want to send: ")
		test = {
			"name": "test",
			"msg": "TEST"
		}
		executeQuery()
		await socket.send(json.dumps(test))
		print(await socket.recv())

def checkDbNewRecord():
	print("test")

def executeQuery(query=""):
	cur = DB_CONNECT.cursor()
	cur.execute("SELECT * FROM users")
	for row in cur.fetchall():
	    print(row[0])
	DB_CONNECT.close()

if __name__ == "__main__":
	asyncio.get_event_loop().run_until_complete(message())
	asyncio.get_event_loop().run_forever()