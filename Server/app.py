from flask import Flask, request
from flask import jsonify
from flask_cors import CORS
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from datetime import datetime
import os
import glob
import uuid
import logging

app = Flask(__name__)
CORS(app)
analyzer = Analyzer()

filePath = "/SoundFiles"

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/health")
def health_check():
    print("This is a test for the console log")
    temp = os.listdir(filePath)
    fd = os.open("/SoundFiles/FRIG7mZVEAALXcJ.jpg", os.O_RDWR)
    data = {
        "message": temp,
        "test": fd,
        "status": "sucess"
    }
    return jsonify(data)

@app.route("/analyze",methods=['post'])
def analyze_bird():
    logging.info("Analyzing...")
    audioFile = request.files['file']
    newId = uuid.uuid4()
    audioFilePath = os.path.join(filePath,str(newId)) + ".mp3"
    logging.info(audioFilePath)
    audioFile.save(audioFilePath)
    latitude = request.form.get('lat')
    longitude = request.form.get('long')
    day = request.form.get('day')
    month = request.form.get('month')
    year = request.form.get('year')
    logging.info("Analyzing Sounds...")
    recording = Recording(
        analyzer,
        audioFilePath,
        lat=float(latitude),
        lon=float(longitude),
        date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
        min_conf=0.25,
    )
    recording.analyze()
    logging.info("Possible outcomes: " + len(recording.detections))
    if (len(recording.detections) == 0):
        logging.info("rerunning analysis with no lat/long")
        newRecording = Recording(
            analyzer,
            audioFilePath,
            date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
            min_conf=0.25,
        )
        newRecording.analyze()
        logging.info("Creating output...")
        return jsonify(newRecording.detections)
    else:
        logging.info("Creating output...")
        return jsonify(recording.detections)
