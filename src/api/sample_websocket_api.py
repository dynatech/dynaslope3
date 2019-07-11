"""
This is a sample usage of SOCKETIO for websocket request and response.
@SOCKETIO.on(<sort of url>, namespace="/<monitoring/comms>")
def <function_name>(<attributes>):
    <to do>

    # The following replaces the return statement.
    SOCKETIO.emit("<url to find>", <data to be sent back>, callback="<status>", namespace="/<monitoring/comms>") 

"""

from connection import SOCKETIO

##########################
# SOCKET IO SAMPLE BELOW #
##########################
count = 0


@SOCKETIO.on('connect', namespace="/test")
def test_connect():
    global count
    count += 1
    print("I am the connect function - user count: ", count)


@SOCKETIO.on("get_generated_alerts", namespace="/test")
def sample_websocket(interval):
    print("===> One client connected by ", interval)

    SOCKETIO.emit("receive_generated_alerts", "Connected",
                  callback="successfully accessed", namespace="/test")

    SOCKETIO.emit("sample_2", "Resent connected successful",
                  callback="successfully accessed", broadcast=True)


@SOCKETIO.on('disconnect')
def test_disconnect():
    global count
    count -= 1
    print('I am disconnect function - user count: ', count)
