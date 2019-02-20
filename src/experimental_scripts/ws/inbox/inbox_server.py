import asyncio
import websockets
import time
import sys
import datetime
import array as arr
import json
import sys


class InboxServer(object):
    def setupWebsocketServer(websocket, ws_port, host='localhost'):
        start_server = websockets.serve(response, 'localhost', sys.argv[2])
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

async def response(websocket, path):
    # while LOOP == 1:
    try:
        msg = await websocket.recv()
        data = msg
        print("Received server data: ", data)
        await websocket.send("ACK")
    except Exception as e:
        print(e)
    finally:
        print("Waiting for request...\n")

if __name__ == "__main__":
    inboxObj = InboxServer()
    inboxObj.setupWebsocketServer(response, sys.argv[2])