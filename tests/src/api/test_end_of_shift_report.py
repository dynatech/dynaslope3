"""
Test file for End of Shift Report api
"""
import pytest
from run import APP
from src.api.end_of_shift import (get_end_of_shift_data, get_eos_narratives,
                                  get_formatted_shift_narratives,
                                  get_release_publishers_initials)


@pytest.mark.parametrize("firstname, lastname, result",
                         [("John", "Cross", "JC"), ("gerry", "liaO", "GL")])
def test_get_release_publishers_initials(firstname, lastname, result):
    """
    Something
    """
    assert get_release_publishers_initials(firstname, lastname) == result
