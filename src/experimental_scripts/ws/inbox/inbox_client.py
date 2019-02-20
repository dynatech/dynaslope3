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
        self.ser = serial.Serial('/dev/ttyUSB1', 56700, timeout=1)
        self.SendCommand(str.encode('ATZ\r'),False)
        self.SendCommand(str.encode('AT+CMGF=1\r'), False)

    def SendCommand(self,command, getline=False, timeout=2):
        self.ser.write(command)
        time.sleep(2)
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
        command = 'AT+CMGL="ALL"\r\n'
        print(self.SendCommand(str.encode(command),getline=False))
        data = self.ser.read(800)
        return str(data)

    def DeleteSMS(self, ack):
        if ack == "ACK":
            print("Deleting message...")
            self.ser.flushInput()
            self.ser.flushOutput()
            time.sleep(3)
            command = 'AT+CMGD=1\r\n'
            print(self.SendCommand(str.encode(command),getline=False))
            data = self.ser.readall()
        else:
            print("Error reading message...")
        return str(data)

async def message(port,inboxObj):
    async with websockets.connect("ws://localhost:"+port) as socket:
        start_time = time.time()
        temp = inboxObj.GetAllSMS().split("+CMGL:")
        print(temp)
        # if '+CMGS:' and '+CMGD:' not in temp[0]:
        #     temp = temp[1].replace('\\r\\n\\r\\nOK\\r\\n','')
        #     await socket.send(temp)
        #     sms_status = await socket.recv()
            # print("set:", sms_status)
            # print(type(sms_status))
            # status = inboxObj.DeleteSMS(sms_status)
            # if (status.decode("utf-8").find('OK') and status.decode("utf-8").find("+CMGS")):
            #     print("Message deleted...")
            # else:
            #     print("Failed to delete message...")
        print("--- %s seconds ---" % (time.time() - start_time))

if __name__ == "__main__":
    inboxObj = InboxClient()
    while LOOP == 1:
        asyncio.new_event_loop().run_until_complete(message(sys.argv[1],inboxObj))