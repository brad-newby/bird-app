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
import psycopg2
from flask_sqlalchemy import SQLAlchemy
from google.cloud.sql.connector import Connector, IPTypes
import pg8000

app = Flask(__name__)
CORS(app)
analyzer = Analyzer()
DB_USER = "postgres"
DB_PASS = "postgres"
DB_NAME = "birdDB"
INSTANCE_CONNECTION_NAME = "project-33453784-cd90-4e6a-8ac:us-central1:bird-app"
connector = Connector()

def connect_with_connector():
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        dbName=DB_NAME,
        ip_type=IPTypes.PUBLIC
    )
    return conn

pool = sqlalchemy.create_engine(
    "postgresql+pg8000://",
    creator=getconn,
)

def connect_test():
    try:
        with pool.connect() as db_conn:
            results = db_conn.execute(sqlalchemy.text("SELECT version()"))
            db_version = results.fetchone()
            return db_version
    except (psycopg2.DatabaseError, Exception) as error:
        print(f"An error occurred: {error}", flush=True)

def convert_to_binary_data(filename):
    with open(filename, 'rb') as file:
        blob_data = file.read()
    return blob_data

@app.route("/save",methods=['post'])
def save_prediction():
    try:
        predictions = request.form.get('predictionData')
        audioFile = request.files['file']
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        with open(temp_file.name, 'wb') as f:
            audioFile.save(f)
        audio_blob = convert_to_binary_data(temp_file.name)
        psy_binary_data = psycopg2.Binary(audio_blob)
        cur = conn.cursor()
        strPredictions = str(predictions)
        sql = """
        INSERT INTO analysis ("audioData","predictionData") VALUES (%s,%s)
        """
        cur.execute(sql,(psy_binary_data,strPredictions))
        conn.commit()
        data = {
            "data" : predictions,
            "status": "sucess"
        }
        cur.close()
        return jsonify(data)
    except (psycopg2.DatabaseError, Exception) as error:
        print(f"An error occurred: {error}", flush=True)
        data = {
            "data" : None,
            "staus": "failed"
        }
        return jsonify(data)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/health")
def health_check():
    db_check = connect_test()
    print("Health check", flush=True)
    data = {
        "db_status" : db_check,
        "status": "sucess"
    }
    return jsonify(data)

@app.route("/analyze",methods=['post'])
def analyze_bird():
    print("Analyzing...", flush=True)
    audioFile = request.files['file']
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    with open(temp_file.name, 'wb') as f:
        audioFile.save(f)
    latitude = request.form.get('lat')
    longitude = request.form.get('long')
    day = request.form.get('day')
    month = request.form.get('month')
    year = request.form.get('year')
    print("Analyzing Sounds...", flush=True)
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
        print("rerunning analysis with no lat/long", flush=True)
        newRecording = Recording(
            analyzer,
            temp_file.name,
            date=datetime(year=int(year), month=int(month), day=int(day)), # use date or week_48
            min_conf=0.25,
        )
        newRecording.analyze()
        print("Creating output...", flush=True)
        return jsonify(newRecording.detections)
    else:
        print("Creating output...", flush=True)
        return jsonify(recording.detections)

@app.route("/analysis-list",methods=['get'])
def get_all_anaylsis():
    try:
        cur = conn.cursor()
        sql = """
        SELECT * FROM analysis 
        """
        cur.execute(sql)
        rows = cur.fetchall()
        data = []
        for row in rows:
            entry = {
                "id" : row[0],
                "createdDate": row[1],
                "predictionData": row[2],
            }
            data.append(entry)
        cur.close()
        return data
    except (psycopg2.DatabaseError, Exception) as error:
        print(f"An error occurred: {error}", flush=True)
        data = {
            "data" : None,
            "staus": "failed"
        }
        return jsonify(data)
    
@app.route("/prediction", methods=['get'])
def get_prediction():
    try:
        id = request.args.get('id','')
        cur = conn.cursor()
        sql = """
        SELECT "audioData" FROM analysis WHERE id = %s
        """
        cur.execute(sql,(id,))
        audioFile = cur.fetchone()
        mview = audioFile[0]
        binary_data = bytes(mview)
        cur.close()
        return binary_data
    except (psycopg2.DatabaseError, Exception) as error:
        print(f"An error occurred: {error}", flush=True)
        data = {
            "data" : None,
            "staus": "failed"
        }
        return jsonify(data)