import asyncio
import websockets
import json
import MySQLdb
import time
import datetime
import sys
import serial

LOOP = 1
TIME_OUT = 3

class InboxClient(object):

    def __init__(self):
        self.open()

    def open(self):
        self.ser = serial.Serial('/dev/ttyUSB1', 56700, timeout=2)
        self.SendCommand(str.encode('ATZ\r'),False)
        self.SendCommand(str.encode('AT+CMGF=1\r'), False)

    def SendCommand(self,command, getline=False):
        self.ser.write(command)
        data = ''
        if getline:
            data=self.ReadLine()
        return data 

    def ReadLine(self):
        data = self.ser.readline()
        return data 

    def GetAllSMS(self):
        self.ser.flushInput()
        self.ser.flushOutput()
        time.sleep(3)
        command = 'AT+CMGR=1\r\n'
        command2 = 'AT+CMGR=2\r\n'
        print(self.SendCommand(str.encode(command),getline=False))
        data = self.ser.readall()
        return str(data)

async def message(port,inboxObj):
    async with websockets.connect("ws://localhost:"+port) as socket:
        temp = inboxObj.GetAllSMS().split("+CMGR:")
        temp = temp[1].replace('\\r\\n\\r\\nOK\\r\\n','')
        await socket.send(temp)
        sms_status = await socket.recv()
        print(sms_status)

if __name__ == "__main__":
    inboxObj = InboxClient()
    while LOOP == 1:
        asyncio.new_event_loop().run_until_complete(message(sys.argv[1],inboxObj))