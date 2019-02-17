import asyncio
import websockets
import RPi.GPIO as GPIO
import serial
import time, sys
import datetime

P_BUTTON = 24 # Button, adapt to your wiring
SERIAL_PORT_GLOBE = "/dev/ttyUSB1" #Globe
SERIAL_PORT_SMART = "/dev/ttyUSB0" #Smart

def setupGSMModule():
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup(P_BUTTON, GPIO.IN, GPIO.PUD_UP)

def parseMobileNumber():
	print("TEST")

def sendGSM(msg):
	ser = serial.Serial(SERIAL_PORT_GLOBE, baudrate = 9600, timeout = 5)
	setupGSMModule()
	ser.write(str.encode("AT+CMGF=1\r")) # set to text mode
	time.sleep(1)
	ser.write(str.encode('AT+CMGDA="DEL ALL"\r')) # delete all SMS
	time.sleep(1)
	ser.write(str.encode('AT+CMGS="+639675980463"\r'))
	time.sleep(1)
	temp = msg.split("\\n")
	for line in temp:
		print(line)
		ser.write(str.encode(line+chr(13)))
	ser.write(str.encode(chr(26)))
	print ("Sending SMS with status info:" + msg)

async def response(websocket, path):
	msg = await websocket.recv()
	start_time = time.time()
	print("We got the message from the client: ",msg)
	# sendGSM(msg)
	print("--- %s seconds ---" % (time.time() - start_time))
	await websocket.send("I can confirm I got your message!") #Response

if __name__ == "__main__":
	start_server = websockets.serve(response, 'localhost', 1234)
	asyncio.get_event_loop().run_until_complete(start_server)
	asyncio.get_event_loop().run_forever()