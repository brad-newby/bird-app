from flask import Flask, request
from flask import jsonify
from flask_cors import CORS
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from datetime import datetime
import os
import glob

app = Flask(__name__)
CORS(app)
analyzer = Analyzer()
pathToSounds = "SoundFiles/*"

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/health")
def health_check():
    data = {
        "message": "Healthy",
        "status": "sucess"
    }
    return jsonify(data)

@app.route("/analyze",methods=['post'])
def analyze_bird():
    audioFile = request.files['file']
    audioFile.save("SoundFiles/sample.mp3")
    fileList = glob.glob(pathToSounds)
    latitude = request.form.get('lat')
    longitude = request.form.get('long')
    day = request.form.get('day')
    month = request.form.get('month')
    year = request.form.get('year')
    if not fileList:
        return "no sounds files found"
    else:
        latestFile = max(fileList, key=os.path.getctime)
        print(f"The most recent file is: {latestFile}")
        print("Analyzing Sounds...")
        recording = Recording(
            analyzer,
            latestFile,
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
                latestFile,
                date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
                min_conf=0.25,
            )
            newRecording.analyze()
            print("Creating Output...")
            return jsonify(newRecording.detections)
        else:
            print("Creating Output...")
            return jsonify(recording.detections)


    

@app.route("/bird")
def bird_test():
    fileList = glob.glob(pathToSounds)
    if not fileList:
        return "no sounds files found"
    else:
        latestFile = max(fileList, key=os.path.getctime)
        print(f"The most recent file is: {latestFile}")
        print("Analyzing Sounds...")
        recording = Recording(
            analyzer,
            latestFile,
            lat=35.4244,
            lon=-120.7463,
            date=datetime(year=2022, month=5, day=10), # use date or week_48
            min_conf=0.25,
        )
        recording.analyze()
        print("Creating Output...")
        return jsonify(recording.detections)
