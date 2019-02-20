import serial
import time
import re
import RPi.GPIO as GPIO
from messaging.sms import SmsDeliver as smsdeliver
from messaging.sms import SmsSubmit as smssubmit

class GsmSms:
    def __init__(self,num,sender,data,dt):
       self.num = num
       self.simnum = sender
       self.data = data
       self.dt = dt

class GsmModem:

    REPLY_TIMEOUT = 30
    SEND_INITIATE_REPLY_TIMEOUT = 20
    SENDING_REPLY_TIMEOUT = 60
    RESET_DEASSERT_DELAY = 1
    RESET_ASSERT_DELAY = 5     # delay when module power is off
    WAIT_FOR_BYTES_DELAY = 0.5
    POWER_ON_DELAY = 10

    def __init__(self, ser_port = '/dev/ttyUSB1', ser_baud = 57600, pow_pin = 33, ring_pin = 15):
	    self.ser_port = ser_port
	    self.ser_baud = ser_baud
	    self.gsm = self.init_serial()
	    GPIO.setmode(GPIO.BOARD)
	    GPIO.setup(pow_pin, GPIO.OUT)
	    GPIO.output(pow_pin, 0)
	    GPIO.setup(ring_pin, GPIO.IN)
	    self.pow_pin = pow_pin
	    self.ring_pin = ring_pin

    def init_serial(self):
        print('Connecting to GSM modem at', self.ser_port)

        gsm = serial.Serial()
        gsm.port = self.ser_port
        gsm.baudrate = self.ser_baud
        gsm.timeout = 2
        if(gsm.isOpen() == False):
            gsm.open()

        return gsm

    def set_defaults(self):
        GPIO.output(self.pow_pin, 0)
        time.sleep(self.POWER_ON_DELAY)
        try:
            for i in range(0,4):
                self.gsm.write(str.encode('AT\r\n'))
                time.sleep(0.5)
            print ("Switching to no-echo mode",)
            print (self.at_cmd('ATE0').strip('\r\n'))
            print ("Switching to PDU mode" )
            print (self.at_cmd('AT+CMGF=0').rstrip('\r\n'))
            print ("Disabling unsolicited CMTI",)
            print (self.at_cmd('AT+CNMI=2,0,0,0,0').rstrip('\r\n'))
            return True
        except AttributeError:
            print("")
            return None

    def at_cmd(self, cmd = "", expected_reply = 'OK'):
        if cmd == "":
            raise ValueError("No cmd given")
        try:
            self.gsm.flushInput()
            self.gsm.flushOutput()
            a = ''
            now = time.time()
            self.gsm.write(str.encode(cmd+'\r\n'))

            while (a.find(expected_reply) < 0 and a.find('ERROR') < 0):
                a = a + self.gsm.read(self.gsm.inWaiting()).decode('utf-8')
                time.sleep(self.WAIT_FOR_BYTES_DELAY)

            if time.time() > now + self.REPLY_TIMEOUT:
                a = '>> Error: GSM Unresponsive'
                except_str = (">> Raising exception to reset code "
                    "from GSM module reset")
                raise ResetException(except_str)
            elif a.find('ERROR') >= 0:
                print("Modem: ERROR")
                return False
            else:
                return a
        except serial.SerialException:
            print("NO SERIAL COMMUNICATION (gsm_cmd)")

    def get_all_sms(self):
        allmsgs = 'd' + self.at_cmd('AT+CMGL=4')
        allmsgs = re.findall("(?<=\+CMGL:).+\r\n.+(?=\n*\r\n\r\n)",allmsgs)
        msglist = []

        for msg in allmsgs:
            try:
                pdu = re.search(r'[0-9A-F]{20,}',msg).group(0)
            except AttributeError:
                print(">> Error: cannot find pdu text", msg)
                continue

            try:
                smsdata = smsdeliver(str(pdu, 'utf-8')).data
            except ValueError as e:
                print(">> Error: conversion to pdu (cannot decode odd-length)")
                print(">> Error: ",e)
                continue
            except IndexError:
                print(">> Error: convertion to pdu (pop from empty array)")
                continue

            smsdata = self.manage_multi_messages(smsdata)

            if smsdata == "":
                continue

            try:
                txtnum = re.search(r'(?<= )[0-9]{1,2}(?=,)',msg).group(0)
            except AttributeError:
                print(">> Error: message may not have correct construction", msg)
                continue

            txtdatetimeStr = smsdata['date'] + td(hours=8)
            txtdatetimeStr = txtdatetimeStr.strftime('%Y-%m-%d %H:%M:%S')

            try:        
                smsItem = GsmSms(txtnum, smsdata['number'].strip('+'), 
                    str(smsdata['text']), txtdatetimeStr)
                sms_msg = str(smsdata['text'])

                if len(sms_msg) < 30:
                    print(sms_msg)
                else:
                    print(sms_msg[:10], "...", sms_msg[-20:])

                msglist.append(smsItem)
            except UnicodeEncodeError:
                print(">> Unknown character error. Skipping message")
                continue
        return msglist

if __name__ == "__main__":
	init = GsmModem()
	print("Connected: ",init.set_defaults())
	print(init.get_all_sms())