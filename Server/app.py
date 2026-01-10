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
import sqlalchemy
import psycopg2

app = Flask(__name__)
CORS(app)
analyzer = Analyzer()
db = None

def connect_unix_socket() -> sqlalchemy.engine.base.Engine:
    db_user = "postgres"
    db_pass = "pcFI@SCMR?1|a./r"
    db_name = "birdDB"
    unix_socket_path = "/cloudsql/project-33453784-cd90-4e6a-8ac:us-central1:bird-app"

    pool = sqlalchemy.create_engine(
        # Equivalent URL:
        # postgresql+pg8000://<db_user>:<db_pass>@/<db_name>
        #                         ?unix_sock=<INSTANCE_UNIX_SOCKET>/.s.PGSQL.5432
        # Note: Some drivers require the `unix_sock` query parameter to use a different key.
        # For example, 'psycopg2' uses the path set to `host` in order to connect successfully.
        sqlalchemy.engine.url.URL.create(
            drivername="postgresql+pg8000",
            username=db_user,
            password=db_pass,
            database=db_name,
            query={"unix_sock": f"{unix_socket_path}/.s.PGSQL.5432"},
        ),
        # ...
    )
    return pool

def connect_tcp_socket() -> sqlalchemy.engine.base.Engine:
    db_host = "34.28.125.208"
    db_user = "postgres"
    db_pass = "pcFI@SCMR?1|a./r"
    db_name = "birdDB"
    db_port = "5432"

    connect_args = {}

    pool = sqlalchemy.create_engine(
        sqlalchemy.engine.url.URL.create(
            drivername="postgresql+psycopg2",
            username=db_user,
            password=db_pass,
            database=db_name,
            query={"host": f"{db_host}"},
        ),
    )
    return pool

def check_db_version():
    query = sqlalchemy.text(
        "SELECT version()"
    )
    try:
        with db.connect() as conn:
            results = conn.execute(query)
            output = results.fetchone()
            return output
    except Exception as e:
        print(e)
        return None

def convert_to_binary_data(filename):
    with open(filename, 'rb') as file:
        blob_data = file.read()
    return blob_data

@app.before_request
def init_db() -> sqlalchemy.engine.base.Engine:
    global db
    if db is None:
        db = connect_unix_socket()
        #db = connect_tcp_socket()

@app.route("/save",methods=['post'])
def save_prediction():
    predictions = request.form.get('predictionData')
    audioFile = request.files['file']
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    with open(temp_file.name, 'wb') as f:
        audioFile.save(f)
    audio_blob = convert_to_binary_data(temp_file.name)
    psy_binary_data = psycopg2.Binary(audio_blob)
    strPredictions = str(predictions)
    sql = sqlalchemy.text(""" INSERT INTO analysis ("audioData","predictionData") VALUES (:audiodata,:predictionData) RETURNING id """)
    try:
        with db.connect() as conn:
            params = {"audiodata": psy_binary_data,"predictionData": strPredictions}
            results = conn.execute(sql, params)
            temp = results.fetchone()

            conn.commit()
            data = {
                "data" : temp[0],
                "status": "sucess"
            }
            return jsonify(data)
    except Exception as error:
        print(f"An error occurred: {error}", flush=True)
        data = {
            "error" : str(error),
            "staus": "failed"
        }
        return jsonify(data)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/health")
def health_check():
    print("Health check", flush=True)
    output = check_db_version()
    data = {
        "db_status" : output[0],
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
    query = sqlalchemy.text(
        """SELECT * FROM analysis ORDER BY "createdDate" DESC"""
    )
    try:
        with db.connect() as conn:
            results = conn.execute(query)
            output = results.fetchall()
            data = []
            for row in output:
                entry = {
                    "id" : row[0],
                    "createdDate": row[1],
                    "predictionData": row[2],
                }
                data.append(entry)
            return data
    except Exception as error:
        print(f"An error occurred: {error}", flush=True)
        data = {
            "error" : str(error),
            "staus": "failed"
        }
        return jsonify(data)
    
@app.route("/prediction", methods=['get'])
def get_prediction():
    id = request.args.get('id','')
    sql = sqlalchemy.text(""" SELECT "audioData" FROM analysis WHERE id = :id """)
    try:
        with db.connect() as conn:
            params = {"id" : id}
            results = conn.execute(sql, params)
            audioFile = results.fetchone()
            mview = audioFile[0]
            binary_data = bytes(mview)
            return binary_data
    except Exception as error:
        print(f"An error occurred: {error}", flush=True)
        data = {
            "error" : str(error),
            "staus": "failed"
        }
        return jsonify(data)