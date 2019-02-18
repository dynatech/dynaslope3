import asyncio
import websockets
import RPi.GPIO as GPIO
import serial
import time, sys
import datetime
import array as arr
import json

P_BUTTON = 24 # Button, adapt to your wiring
SERIAL_PORT_GLOBE = "/dev/ttyUSB1" #Globe
SERIAL_PORT_SMART = "/dev/ttyUSB0" #Smart
LOOP = 1
TIME_OUT = 3
SER = None

def setupGSMModule():
	global SER
	SER = serial.Serial(SERIAL_PORT_GLOBE, baudrate = 9600, timeout = 5)
	GPIO.setmode(GPIO.BOARD)
	GPIO.setup(P_BUTTON, GPIO.IN, GPIO.PUD_UP)
	SER.write(str.encode("AT+CMGF=1\r"))

def parseMobileNumber(number):
	temp = number[-10:]
	return "63"+temp

def sendGSM(msg, number):
	global SER
	SER.write(str.encode('AT+CMGS="+'+number+'"\r'))
	time.sleep(3)
	temp = msg.split("\\n")
	for line in temp:
		SER.write(str.encode(line))
	SER.write(str.encode(chr(26)))
	SER.reset_input_buffer()
	time.sleep(3)
	print ("Sending SMS with info:" + msg)
	return SER.read(SER.inWaiting())

async def response(websocket, path):
	# while LOOP == 1:
	try:
		msg = await websocket.recv()
		data = json.loads(msg)
		start_time = time.time()
		print("Received server data: ",data)
		parsed_number = parseMobileNumber(data[1])
		temp = sendGSM(data[2], parsed_number)
		if (temp.decode("utf-8").find('OK') and temp.decode("utf-8").find("+CMGS")):
			status = 1
		else:
			status = 0
		print("--- %s seconds ---" % (time.time() - start_time))
		await websocket.send(json.dumps({"status": status, "outbox_id": data[0]})) #Response
	except Exception as e:
		print(e)
	finally:
		print("DO NOTHING..\n\n")

if __name__ == "__main__":
	setupGSMModule()
	start_server = websockets.serve(response, 'localhost', 1234)
	asyncio.get_event_loop().run_until_complete(start_server)
	asyncio.get_event_loop().run_forever()		
