from flask import Flask, request
from flask import jsonify
from flask_cors import CORS
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from datetime import datetime
import os
import glob
import uuid

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
    data = {
        "message": temp,
        "status": "sucess"
    }
    return jsonify(data)

@app.route("/analyze",methods=['post'])
def analyze_bird():
    audioFile = request.files['file']
    newId = uuid.uuid4()
    audioFilePath = os.path.join(filePath,str(newId)) + ".mp3"
    print(audioFilePath)
    audioFile.save(audioFilePath)
    latitude = request.form.get('lat')
    longitude = request.form.get('long')
    day = request.form.get('day')
    month = request.form.get('month')
    year = request.form.get('year')
    if not audioFile:
        return "no sounds files found"
    else:
        print("Analyzing Sounds...")
        recording = Recording(
            analyzer,
            audioFilePath,
            lat=float(latitude),
            lon=float(longitude),
            date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
            min_conf=0.25,
        )
        recording.analyze()
        print(len(recording.detections))
        if (len(recording.detections) == 0):
            print("Rerunning analysis with no lat or long")
            newRecording = Recording(
                analyzer,
                audioFilePath,
                date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
                min_conf=0.25,
            )
            newRecording.analyze()
            print("Creating Output...")
            return jsonify(newRecording.detections)
        else:
            print("Creating Output...")
            return jsonify(recording.detections)
