# Dynaslope 3.0

## Development Notes

Create an ***.env*** file on our Python folder project and put your Python path variable.

```sh
$ PYTHONPATH=\path\to\project\folder
```

### Commit instructions

Use the following symbols for a visual guide on what changes we did to our project:

| Symbol | Meaning |
| ------ | ------ |
| + | Added a file or files |
| - | Modified a file |
| X | Deleted a file or files |
| * | Bug fixed |

Examples:
> \+ Added a new python script named "XXX.py" for uploading images on the UP DEWS Website
> \- Added a function to the "XXX.py" script. The new function adds a new filtering mechanism for data interpretation
> X Deleted old python script "too-old.py"
> \* Fixed bug that causes a crash on the uploading proces of "XXX.py"

## Running the Server

Set the following system variables on command line then run the Flask App (use ***SET*** on Windows and ***export*** on Linux environment):
```sh
$ SET FLASK_CONFIG=environment
$ SET FLASK_APP=run.py
$ flask run
```

## Requirements
Install all required Python packages inside the ***python-requirements.txt***

### Note: 
Install Python packages using ***Conda*** first. Only use ***Pip*** if package is not available in Conda.
