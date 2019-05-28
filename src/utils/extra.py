"""
Extra Utils

This file contains all utility functions that can be used on almost
any module in this project.

Software Infrastructure SubTeam
CBEWS-L Team
Dynaslope Project 2019

27 May 2019
"""
import pprint



def var_checker(var_name, var, have_spaces=False):
    """
    A function used to check variable value including 
    title and indentation and spacing for faster checking 
    and debugging.

    Args:
    var_name (String): the variable name or title you want display
    var (variable): variable (any type) to display
    have_spaces (Boolean): keep False is you dont need spacing for each display.
    """
    if have_spaces:
        print()
        print(f"===== {var_name} =====")
        printer = pprint.PrettyPrinter(indent=4)
        printer.pprint(var)
        print()
    else:
        print(f"===== {var_name} =====")
        printer = pprint.PrettyPrinter(indent=4)
        printer.pprint(var)
