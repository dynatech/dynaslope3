import asyncio
import websockets
import RPi.GPIO as GPIO
import serial
import time
import sys
import datetime
import array as arr
import json
import sys

P_BUTTON = 24  # Button, adapt to your wiring
SERIAL_PORT_GLOBE = "/dev/ttyUSB1"  # Globe
SERIAL_PORT_SMART = "/dev/ttyUSB0"  # Smart
LOOP = 1
TIME_OUT = 3
SER = None


def setupGSMModule():
    global SER
    if sys.argv[1] == '-g':
        port = SERIAL_PORT_GLOBE
    elif sys.argv[1] == '-s':
        port = SERIAL_PORT_SMART
    else:
        print("GSM Port unknown...")
        print("Exiting...")
        sys.exit(0)

    print("Connecting to GSM Port..")
    try:
        SER = serial.Serial(port, baudrate=9600, timeout=5)
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(P_BUTTON, GPIO.IN, GPIO.PUD_UP)
        SER.write(str.encode("AT+CMGF=1\r"))
        print("Connected to GSM Port:", port)
        print("Websocket port:", sys.argv[2])
    except Exception as e:
        print("Error connecting to specified port..\n")
        print("Error: ", e)


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
    print("Sending SMS with info:" + msg)
    return SER.read(SER.inWaiting())


def setupWebsocketServer(websocket, ws_port, host='localhost'):
    start_server = websockets.serve(response, 'localhost', sys.argv[2])
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()


async def response(websocket, path):
    # while LOOP == 1:
    try:
        msg = await websocket.recv()
        data = json.loads(msg)
        start_time = time.time()
        print("Received server data: ", data)
        parsed_number = parseMobileNumber(data[1])
        temp = sendGSM(data[2], parsed_number)
        if (temp.decode("utf-8").find('OK') and temp.decode("utf-8").find("+CMGS")):
            status = 1
        else:
            status = 0
        print("--- %s seconds ---" % (time.time() - start_time))
        # Response
        await websocket.send(json.dumps({"status": status, "outbox_id": data[0]}))
    except Exception as e:
        print(e)
    finally:
        print("Waiting for request...\n")

if __name__ == "__main__":
    setupGSMModule()
    setupWebsocketServer(response, sys.argv[2])
