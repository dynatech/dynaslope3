from connection import DB, MARSHMALLOW

class QuickInbox():
	__tablename__ = "smsinbox_users"

	__bind_key__ = "comms_db"

class QuickInboxSchema():
	class Meta:
		model = QuickInbox

class QuickUnregisteredInbox():
	__tablename__ = "smsinbox_users"

	__bind_key__ = "comms_db"

class QuickUnregisteredInboxSchema():
	class Meta:
		model = QuickUnregisteredInbox