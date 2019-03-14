import pytest
import sys
import raw_test_file as test
from src.experimental_scripts.ws.parsers import parser
import pprint

raw = None
parser_func = None

def setup_module(module):
	global raw
	global parser_func
	raw = test.RawData()
	parser_func = parser.Parser()

def teardown_module(module):
	pass

def test_categorize_message():
	expected_output_type = ["v2","gateway1","gateway2","arq","v1","nodata","v2","b64"]
	actual_output_type = []
	for parsing_category in raw['test']:
		category = parser_func.msg_classifier(parsing_category)
		actual_output_type.append(category.type)
	assert actual_output_type == expected_output_type

def test_v1_parser():
	parser_func.subsurface_v1_parsers(raw['v1_data_sms'])

def test_v2_parser():
	parser_func.subsurface_v2_parsers(raw['v2_data_sms'])

def test_soms_parser():
	print("SKIP....")

def test_b64_parser():
	parser_func.subsurface_b64_parser(raw['b64_data_sms'])


