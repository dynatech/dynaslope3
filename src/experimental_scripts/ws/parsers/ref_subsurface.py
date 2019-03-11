import sys,re
import pandas as pd
import numpy as np
from pprint import pprint
# import dynadb.db as dynadb
from datetime import datetime as dt
from src.experimental_scripts.ws.parsers.sms_data import DataTable

class SubSurface():
	cols = ['site','timestamp','id', 'msgid', 'mval1', 'mval2']
	prevdatetime = ['0','0','0']
	backupGID=['0','0','0']
	tempbuff =['0','0','0']
	temprawlist=[]
	buff=[]
	SOMS=[]
	conversion = ['A','B','C','D','E','F','G','H','I'
	,'J','K','L','M','N','O','P','Q','R','S','T','U'
	,'V','W','X','Y','Z','a','b','c','d','e','f','g'
	,'h','i','j','k','l','m','n','o','p','q','r','s'
	,'t','u','v','w','x','y','z','0','1','2','3','4'
	,'5','6','7','8','9','+','/']

	def v1_parser(self, sms):
		data = sms['msg']
		data = data.replace("DUE","")
		data = data.replace(",","*")
		data = data.replace("/","")
		line = data[:-2]

	   
		tsm_name = line[0:4]
		print('SITE: ' + tsm_name)
		try:
			msgdata = (line.split('*'))[1]
		except IndexError:
			raise ValueError("Wrong message construction")
			
		print('raw data: ' + msgdata)
		try:
			timestamp = (line.split('*'))[2][:10]
			print('date & time: ' + timestamp)
		except:
			print('>> Date and time defaults to SMS not sensor data')
			timestamp = sms['ts']

		if tsm_name == 'PUGB':
			timestamp = sms['ts']
			print("date & time adjusted " + timestamp)
		else:
			try:
				timestamp = dt.strptime(timestamp,
					'%y%m%d%H%M').strftime('%Y-%m-%d %H:%M:00')
			except ValueError:
				print(">> Error: date time conversion")
				return False
			print('date & time no change')
			
		dlen = len(msgdata)
		nodenum = dlen/15

		if dlen == 0:
			print('Error: There is NO data!')
			return 
		elif((dlen % 15) == 0):
			#print 'Data has correct length!'
			valid = dlen
		else:
			print('Warning: Excess data will be ignored!')
			valid = nodenum*15
			
		outl_tilt = []
		outl_soms = []
		try:    
			i = 0
			while i < valid:
				node_id = int('0x' + msgdata[i:i+2],16)
				i=i+2
				
				tempx = int('0x' + msgdata[i:i+3],16)
				i=i+3
				
				tempy = int('0x' + msgdata[i:i+3],16)
				i=i+3
				
				tempz = int('0x' + msgdata[i:i+3],16)
				i=i+3
				
				tempf = int('0x' + msgdata[i:i+4],16)
				i=i+4
				
				valueX = tempx
				if valueX > 1024:
					valueX = tempx - 4096

				valueY = tempy
				if valueY > 1024:
					valueY = tempy - 4096

				valueZ = tempz
				if valueZ > 1024:
					valueZ = tempz - 4096

				valueF = tempf


				tsm_name=tsm_name.lower()
				line_tilt = {"ts":timestamp,"node_id": node_id,"xval":valueX,"yval":valueY,"zval":valueZ}
				line_soms = {"ts":timestamp,"node_id": node_id,"mval1":valueF}
				outl_tilt.append(line_tilt)
				outl_soms.append(line_soms)
				
			if len(outl_tilt) != 0:
				df_tilt = DataTable('tilt_'+tsm_name,pd.DataFrame(outl_tilt))
				df_soms = DataTable('soms_'+tsm_name,pd.DataFrame(outl_soms))
				data = [df_tilt,df_soms]
				return data
			else:
				print('\n>>Error: Error in Data format')
				return 
		  
		except KeyError:
			print('\n>>Error: Error in Data format')
			return
		except KeyboardInterrupt:
			print('\n>>Error: Unknown')
			raise KeyboardInterrupt
			return
		except ValueError:
			print('\n>>Error: Unknown')
			return

	def v2_parser(self, sms):
		msg = sms['msg']
		
		if len(msg.split(",")) == 3:
			print(">> Editing old data format")
			datafield = msg.split(",")[1]
			dtype = datafield[2:4].upper()
			if dtype == "20" or dtype == "0B":
				dtypestr = "x"
			elif dtype == "21" or dtype == "0C":
				dtypestr = "y"
			elif dtype == "6F" or dtype == "15":
				dtypestr = "b"
			elif dtype == "70" or dtype == "1A":
				dtypestr = "c"
			else:
				raise ValueError(">> Data type" + dtype + "not recognized")
				
			
			i = msg.find(",")
			msg = msg[:i] + "*" + dtypestr + "*" + msg[i+1:]
			msg = msg.replace(",","*").replace("/","")
			
		outl = []
		msgsplit = msg.split('*')
		tsm_name = msgsplit[0]

		if len(msgsplit) != 4:
			print('*** wrong data format')
			return

		if len(tsm_name) != 5:
			print('*** wrong master name')
			return

		print(msg)

		dtype = msgsplit[1].upper()
	
		datastr = msgsplit[2]
		
		if len(datastr) == 136:
			datastr = datastr[0:72] + datastr[73:]
		
		ts = msgsplit[3].strip()
	
		if datastr == '':
			datastr = '000000000000000'
			print(">> Error: No parsed data in sms")
			return
	
		if len(ts) < 10:
			print(">> Error in time value format: ")
			return
		
		ts_patterns = ['%y%m%d%H%M%S', '%Y-%m-%d %H:%M:%S']
		timestamp = ''
		ts = re.sub("[^0-9]","",ts)
		for pattern in ts_patterns:
			try:
				timestamp = dt.strptime(ts,pattern).strftime('%Y-%m-%d %H:%M:00')
				break
			except ValueError:
				print("Error: wrong timestamp format", ts, "for pattern", pattern)
	
		if timestamp == '':
			raise ValueError(">> Error: Unrecognized timestamp pattern " + ts)

		if dtype == 'Y' or dtype == 'X':
			n = 15
			sd = [datastr[i:i+n] for i in range(0,len(datastr),n)]
		elif dtype == 'B':
			outl = soms_parser(msg,1,10,0)    
			name_df = 'soms_'+tsm_name.lower()   
		elif dtype == 'C':

			outl = soms_parser(msg,2,7,0)
			name_df = 'soms_'+tsm_name.lower()  

		else:
			raise IndexError("Undefined data format " + dtype )
		

		if dtype.upper() == 'X' or dtype.upper() =='Y':
			outl = []
			name_df = 'tilt_'+tsm_name.lower()
			for piece in sd:
				try:
						# print piece
					ID = int(piece[0:2],16)
					msgID = int(piece[2:4],16)
					xd = self.twos_compliment_converter(piece[4:7])
					yd = self.twos_compliment_converter(piece[7:10])
					zd = self.twos_compliment_converter(piece[10:13])
					bd = (int(piece[13:15],16)+200)/100.0

					line = {"ts":timestamp, "node_id":ID, "type_num":msgID,
					"xval":xd, "yval":yd, "zval":zd, "batt":bd}
					outl.append(line)
				except ValueError:
					print(">> Value Error detected.", piece)
					print("*** Piece of data to be ignored")
					return
		
		df = pd.DataFrame(outl)
		data = DataTable(name_df,df)
		return  data

	def soms_parser(self, msgline, mode, div, err):
		global backupGID
		global tempbuff
		global temprawlist
		siteptr={'NAGSAM':1, 'BAYSBM':0}
		rawlist=[]
		rawdata1=0
		rawdata2=0
		if mode == 1:
			nodecommands = [110, 111, 21]
			maxnode= 13
		if mode == 2:
			nodecommands = [112, 113, 26]
			maxnode = 19
		if mode == 3:
			nodecommands = [110, 111, 21, 112, 113, 26 ]
			maxnode = 9
			
		r = msgline.split('*')
		site = r[0]
		data = r[2]    
		if site in ['NAGSAM', 'BAYSBM']:
			a = siteptr[site]
		else:
			a = 2
		try:      
			dt=pd.to_datetime(r[3][:12],format='%y%m%d%H%M%S')
		except:
			dt='0000-00-00 00:00:00'
			log_errors(4,msgline,dt)
			return rawlist   
	
		   
		try:
			firsttwo = int('0x'+data[:2],base=0)
		except:
			firsttwo = data[:2]
			log_errors(10,msgline,dt) 
			
		if firsttwo in nodecommands:
			log_errors(2,msgline,dt)
				
			if long(r[3][:10])-long(prevdatetime[a])<=10:
				data=backupGID[a]+r[2]
			else:
				tempbuff[a] = msgline
				return []

		for i in range (0, int(len(data)/div)):
			try:
				GID=int("0x"+data[i*div:2+div*i],base=0)
			except:
				log_errors(10, msgline, dt)
				continue
			try:    
				CMD = int('0x'+data[2+div*i:4+div*i],base=0)
			except:
				log_errors(10, msgline, dt)
				continue
			
			if CMD in nodecommands:
				if div==6:
					rawdata1 = np.NaN
				else:
					try:    
						rawdata1= int('0x'+ data[6+div*i:7+div*i] 
							+ data[4+div*i:6+div*i], base=0)
					except:
						log_errors(10,msgline,dt)
						rawdata1=np.nan
			else:

				if mode == 1: 
					if err == 0:
						if CMD in [112,113,26]:
							log_errors(0, msgline, dt)
							return soms_parser(msgline,2,7,1)
						else:
							log_errors(1,msgline,dt)
							return soms_parser(msgline,1,12,2)
					elif err == 1:
						log_errors(1,msgline,dt)
						return soms_parser(msgline,1,12,2)
					elif err == 2:
						log_errors(2,msgline,dt)
						return rawlist
					else:
						log_errors(3, msgline, dt)
						return rawlist

				if mode == 2:
					if err == 0:
						if CMD in [110, 111, 21]:
							log_errors(0,msgline,dt)
							return soms_parser(msgline,1,10,1)
						else:
							log_errors(1,msgline,dt)

							return soms_parser(msgline,2,6,2)
					elif err == 1:
						log_errors(1,msgline,dt)
						return soms_parser(msgline,2,6,2)
					elif err == 2:
						log_errors(2,msgline,dt)
						return rawlist
					else:
						log_errors(3,msgline,dt)
						return rawlist
				if mode == 3:
					return rawlist

					
			if div == 10 or div == 12 or div == 15:
				try:
					rawdata2= int('0x' + data[9 + div*i:10 + div*i]
						+ data[7+ div*i:9 + div*i], base =0)
				except:
					log_errors(10, msgline, dt)
					rawdata2 = np.nan


			rawlist.append({"ts":str(dt), "node_id":GID, "type_num":CMD, "mval1":rawdata1, "mval2":rawdata2})
	
		if len(data)%div!=0:

			prevdatetime[a]=r[3][:10]
			backupGID[a]=data[maxnode*div:2+div*maxnode]
			if len(tempbuff[a])>1:
				temprawlist = rawlist
				buff = soms_parser(tempbuff[a],1,10,0)

				return temprawlist+buff      
		return rawlist

	def b64_parser(self, sms):
		msg = sms['msg']
		print(msg)
		if len(msg.split("*")) == 4:
			msgsplit = msg.split('*')
			
			tsm_name = msgsplit[0]
			if len(tsm_name) != 5:
				raise ValueError("length of tsm_name != 5")

			dtype = msgsplit[1]
			if len(dtype) == 2:
				dtype = self.b64_dec_converter(dtype)
			else:
				raise ValueError("length of dtype != 2")
			
			datastr = msgsplit[2]
			if len(datastr) == 0:
				raise ValueError("length of data == 0")
			ts = msgsplit[3]
			ts_patterns = ['%y%m%d%H%M%S', '%Y-%m-%d %H:%M:%S']
			timestamp = ''        
			if len(ts) not in [6,12]:
				raise ValueError("length of ts != 6 or 12")
				
			for pattern in ts_patterns:
				try:
					timestamp = dt.strptime(ts,pattern).strftime('%Y-%m-%d %H:%M:00')
					break
				except ValueError:
					print("Error: wrong timestamp format", ts, "for pattern", pattern)

			outl = []
			if dtype in [11,12,32,33]:
				name_df = 'tilt_'+tsm_name.lower()
				n = 9
				sd = [datastr[i:i+n] for i in range(0,len(datastr),n)]
				for piece in sd:
					try:
						ID = self.b64_dec_converter(piece[0])
						msgID = dtype
						xd = self.b64_twos_compliment_converter(self.b64_dec_converter(piece[1:3]))
						yd = self.b64_twos_compliment_converter(self.b64_dec_converter(piece[3:5]))
						zd = self.b64_twos_compliment_converter(self.b64_dec_converter(piece[5:7]))
						bd = self.b64_twos_compliment_converter(self.b64_dec_converter(piece[7:9]))
						line = {"ts":timestamp, "node_id":ID, "type_num":msgID,
						"xval":xd, "yval":yd, "zval":zd, "batt":bd}
						outl.append(line)
					except ValueError:
						print(">> b64 Value Error detected.", piece,)
						print("Piece of data to be ignored")
						return
			elif dtype in [110,113,10,13]:
				name_df = 'soms_'+tsm_name.lower() 
				n = 4
				sd = [datastr[i:i+n] for i in range(0,len(datastr),n)]
				for piece in sd:
					try:
						ID = self.b64_dec_converter(piece[0])
						msgID = dtype
						soms = self.b64_dec_converter(piece[1:4])
						line = {"ts":timestamp, "node_id":ID, "type_num":msgID,
						"mval1":soms, "mval2":0}
						outl.append(line)
					except ValueError:
						print(">> b64 Value Error detected.", piece,)
						print("Piece of data to be ignored")
						return
			else:
				raise ValueError("dtype not recognized")

		else:
			raise ValueError("msg was not split into 3")
		df = pd.DataFrame(outl)
		data = DataTable(name_df,df)
		return data

	def twos_compliment_converter(self, hexstr):
		num = int(hexstr[2:4]+hexstr[0:2],16)
		if len(hexstr) == 4:
			sub = 65536
		else:
			sub = 4096
		if num > 2048:  
			return num - sub
		else:
			return num

	def b64_dec_converter(self, b64):
		dec = 0
		for i in range (0,len(b64)):
			dec = dec + ((64**i)*int(self.conversion.index(b64[len(b64)-(i+1)])))
		return dec
				
	def b64_twos_compliment_converter(self, num):
		sub = 4096
		if num > 2048:  
			return num - sub
		else:
			return num

