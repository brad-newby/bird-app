from flask import Flask, request
from flask import jsonify
from flask_cors import CORS
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from datetime import datetime
import os
import glob
import logging
import tempfile

app = Flask(__name__)
CORS(app)
analyzer = Analyzer()

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/health")
def health_check():
    data = {
        "status": "sucess"
    }
    return jsonify(data)

@app.route("/analyze",methods=['post'])
def analyze_bird():
    logging.info("Analyzing...")
    audioFile = request.files['file']
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    with open(temp_file.name, 'wb') as f:
        audioFile.save(f)
    latitude = request.form.get('lat')
    longitude = request.form.get('long')
    day = request.form.get('day')
    month = request.form.get('month')
    year = request.form.get('year')
    logging.info("Analyzing Sounds...")
    recording = Recording(
        analyzer,
        temp_file.name,
        lat=float(latitude),
        lon=float(longitude),
        date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
        min_conf=0.25,
    )
    recording.analyze()
    if (len(recording.detections) == 0):
        logging.info("rerunning analysis with no lat/long")
        newRecording = Recording(
            analyzer,
            temp_file.name,
            date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
            min_conf=0.25,
        )
        newRecording.analyze()
        logging.info("Creating output...")
        return jsonify(newRecording.detections)
    else:
        logging.info("Creating output...")
        return jsonify(recording.detections)
