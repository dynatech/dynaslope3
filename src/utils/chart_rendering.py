"""
Chart Rendering Utility
"""

import os
import glob
import json
import requests
import img2pdf
from flask import jsonify
from config import APP_CONFIG


def render_charts(user_id, site_code, charts, file_name=None):
    """
    Docstring
    """
    path = APP_CONFIG["charts_render_path"]

    save_path = f"{path}/{user_id}/{site_code}"
    for f in glob.glob(f"{save_path}/chart_*.jpg"):
        os.remove(f)

    for index, chart_type in enumerate(charts):
        svg = open(f"{save_path}/{chart_type}.svg", "r")

        options = {
            "svg": svg.read(),
            "type": "jpg",
            "logLevel": 4
        }

        json_object = json.dumps(options)
        headers = {"Content-type": "application/json"}
        r = requests.post("http://127.0.0.1:7801",
                          data=json_object, headers=headers)

        if r.status_code != 200:
            m = "Error chart rendering..."
            print(m)
            print(r.text)
            return jsonify({"status": False, "message": m})

        with open(f"{save_path}/chart_{index + 1}.jpg", "wb") as f:
            f.write(r.content)
            f.close()

        svg.close()

    if charts:
        file_path = render_to_pdf(save_path, file_name)
        print("Chart rendering successful...")
        response = {
            "status": True,
            "message": "Chart rendering successful...",
            "file_path": file_path
        }
    else:
        response = {"status": False,
                    "message": "No chart requested. Select charts first."}

    return response


def render_to_pdf(save_path, file_name=None):
    """
    Docstring
    """
    print("Rendering to PDF...")
    a4inpt = (img2pdf.mm_to_pt(210), img2pdf.mm_to_pt(297))
    layout_fun = img2pdf.get_layout_fun(a4inpt)
    final_file_name = save_path
    if file_name:
        final_file_name = f"{final_file_name}/{file_name}"
    else:
        final_file_name = f"{final_file_name}/charts.pdf"

    with open(final_file_name, "wb") as f:
        f.write(img2pdf.convert(
            [i.path for i in os.scandir(save_path) if i.name.endswith(".jpg")],
            dpi=150, layout_fun=layout_fun))
    print("Succesfully rendered PDF...")

    return final_file_name
