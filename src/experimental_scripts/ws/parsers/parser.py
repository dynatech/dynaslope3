import re
import sys
from src.experimental_scripts.ws.parsers.ref_subsurface import SubSurface as SubSurfaceParser
# import subsurface


class SubSurfaceData:
    def __init__(self):
        self.version = 0
        self.gid = 0
        self.accelNumber = 0
        self.timestamp = 0
        self.freqShift = 0
        self.voltage = 0
        self.x = 0
        self.y = 0
        self.z = 0


class LoggerMessage():
    def __init__(self):
        self.type = "0"
        self.msg = ""
        self.partsLength = 0


class Parser():

    def msg_classifier(self, message):
        types = ["v2", "gateway1", "gateway2",
                 "arq", "v1", "nodata", "extenso", "b64"]
        messageParts = re.split(",|\\+|\\*", message)
        messagePartsLength = len(messageParts)
        msg = LoggerMessage()
        msg.msg = messageParts
        msg.partsLength = messagePartsLength
        if messagePartsLength == 1:
            msg.type = types[5]
        elif messagePartsLength == 3:
            msg.type = types[4]
        elif messagePartsLength >= 4:
            if messageParts[0] == "ARQ":
                msg.type = types[3]
            elif messageParts[0] == "GATEWAY":
                msg.type = types[2]
            elif len(messageParts[0]) == 4:
                msg.type = types[1]
            elif len(messageParts[0]) == 5:
                if len(messageParts[1]) == 2:
                    msg.type = types[7]
                else:
                    msg.type = types[0]

            else:
                msg.type = "others"
        else:
            msg.type = "unknown"

        return msg

    def subsurface_v1_parsers(self, sms):
        sub_parser = SubSurfaceParser()
        sub_parser.v1_parser(sms)

    def subsurface_v2_parsers(self, sms):
        sub_parser = SubSurfaceParser()
        sub_parser.v2_parser(sms)

    def subsurface_b64_parser(self, sms):
        sub_parser = SubSurfaceParser()
        sub_parser.b64_parser(sms)


if __name__ == "__main__":
    subsurface_data = SubSurfaceData()
    logger_message = LoggerMessage()
    parser = Parser()
