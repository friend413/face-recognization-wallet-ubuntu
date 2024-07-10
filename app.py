import os
import cv2
import numpy as np
import base64
import FaceManage.manage as db_manage
from flask import Flask, render_template, request, jsonify, send_from_directory
import base64
import requests
import logging
import uuid
from flask_cors import CORS
from dotenv import load_dotenv
from face import InitFaceSDK, GetLivenessInfo, GetFeatureInfo
from idocr import InitIDOCRSDK, GetIDOCRInfo

load_dotenv()
ret = InitFaceSDK()
print('Init Face Engine', ret)
# ret = InitIDOCRSDK()
# print('Init IDOCR Engine', ret)

# app = Flask(__name__)
app = Flask(__name__, static_folder='wallet')
CORS(app)

db_manage.open_database(0)

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)
# @app.route('/')
# def home():
#     return render_template('index.html')

@app.route("/create_wallet", methods=['POST'])
def enroll_user():
    content = request.get_json()
    print(" =================== Enrol User =================== ")
    imageBase64 = content['image'][22:]
    image = cv2.imdecode(np.frombuffer(base64.b64decode(imageBase64), dtype=np.uint8), cv2.IMREAD_COLOR)
    # return imageBase64
    box, liveness, result = GetLivenessInfo(image)
    address = ""
    msg = ""
    token = ""

    if liveness == 1:
        idx = 0
        face_width = box[2] - box[0]
        if face_width < 150:
            result = 'Move Closer'
        elif face_width > 210:
            result = 'Go Back'
        else:
            box, liveness, feature = GetFeatureInfo(image)

            print(" -------------------- Before find face {} {}", feature, type(feature))
            id, address, token = db_manage.find_face(feature)
            print(" -------------------- After find face {} {} {}", id, address, token)
            print("<<<<<<<<<<<<<<<<<<<<<<<<User is Existing id is ", id)
            if id >= 0:
                result = 'Already Exist'
            else:
                rust_server_url = os.getenv('RUST_SERVER_URL', 'http://localhost:8799')

                payload = {
                    "uid": id + 1
                }
                # send request to rust server
                try:
                    ret = requests.post(rust_server_url + '/create_wallet', json=payload)
                    ret.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)

                    address = ret.json().get('wallet_address')
                    result = ret.json().get('result')
                    msg = ret.json().get('msg')
                    token = ret.json().get('token')
                    db_manage.register(id + 1, "", feature, address, "", token)

                except requests.exceptions.RequestException as e:
                    result = "Error"
                    msg = "Rust backend: " + str(e)

    response = jsonify({"status": result, "msg": msg, "wallet_address": address, "token": token})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

@app.route("/get_wallet", methods=['POST'])
def verify_user():
    content = request.get_json()
    imageBase64 = content['image'][22:]
    image = cv2.imdecode(np.frombuffer(base64.b64decode(imageBase64), dtype=np.uint8), cv2.IMREAD_COLOR)

    box, liveness, result = GetLivenessInfo(image)

    result = 'Error'
    msg = ''
    face_score = 0
    token = ''
    address = ''
    id = 0

    if liveness == 1:
        face_width = box[2] - box[0]
        print('>>>>>>>>>> Face Width', box[0], face_width)
        if face_width < 150:
            result = 'Move Closer'
        elif face_width > 210:
            result = 'Go Back'
        else:
            box, liveness, feature = GetFeatureInfo(image)
            print("----------->>>>>>>>>>>>>>> get wallet 1")
            id, address, token = db_manage.find_face(feature)
            print("----------->>>>>>>>>>>>>>> get wallet 2 {}", id, address)
            if id >= 0:
                result = 'Success'
                msg = 'Got wallet successfully'
            else:
                result = 'Error'
                msg = 'Unregistered user'

    response = jsonify({"status": result, "msg": msg, "token": token, "liveness": str(liveness), "matching": "score", "address": address})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

@app.route("/remove_user_by_face", methods=['POST'])
def remove_user_by_face():
    print('>>>>>>>> removal in progress')
    content = request.get_json()
    imageBase64 = content['image'][22:]
    image = cv2.imdecode(np.frombuffer(base64.b64decode(imageBase64), dtype=np.uint8), cv2.IMREAD_COLOR)

    box, liveness, result = GetLivenessInfo(image)
    
    result = 'Removal Failed'
    name = ''
    face_score = 0

    if liveness == 1:
        face_width = box[2] - box[0]
        print('>>>>>>>>>> Face Width', box[0], face_width)
        if face_width >= 150 and face_width <=210:
            box, liveness, feature = GetFeatureInfo(image)
            face_removed = db_manage.remove_face(feature, content['customer'])
            if face_removed == 1:
                result = 'Removed Face'
            elif face_removed == 0:
                result = 'No Face'
            elif face_removed == -1:
                result = 'Admin'
    response = jsonify({"status": result})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response


@app.route("/verify_user_with_name", methods=['POST'])
def verify_user_with_name():
    content = request.get_json()
    imageBase64 = content['image'][22:]
    image = cv2.imdecode(np.frombuffer(base64.b64decode(imageBase64), dtype=np.uint8), cv2.IMREAD_COLOR)

    box, liveness, result = GetLivenessInfo(image)

    result = 'Verify Failed'
    name = ''

    face_score = 0
    if liveness == 1:
        face_width = box[2] - box[0]
        print('>>>>>>>>>> Face Width', box[0], face_width)
        if face_width < 150:
            result = 'Move Closer'
        elif face_width > 210:
            result = 'Go Back'
        else:
            box, liveness, feature = GetFeatureInfo(image)
            id, fname, face_score = db_manage.verify_face_with_name(feature, content['name'])
            if id >= 0:
                result, name = 'Verify OK', fname
            if id == -2:
                result = 'No Users'

    response = jsonify({"status": result, "name": name, "liveness": str(liveness), "matching": str(face_score)})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

@app.route("/remove_all", methods=['POST'])
def remove_all():
    content = request.get_json()
    customer = content['customer']
    db_manage.clear_database(customer)

    response = jsonify({"status": "OK"})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

@app.route("/user_list", methods=['POST'])
def user_list():
    userlist = db_manage.get_userlist()

    response = jsonify({"status": "OK", "users": userlist})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

@app.route("/remove_user", methods=['POST'])
def remove_user():
    content = request.get_json()
    name = content['name']
    customer = content['customer']
    db_manage.remove_user(name, customer)
    response = jsonify({"status": "OK"})
    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response

@app.route('/ocr/idcard', methods=['POST'])
def ocr_idcard():
    file1 = request.files['image1']

    file_name1 = uuid.uuid4().hex[:6]
    save_path1 = '/tmp/' + file_name1 + '_' + file1.filename
    file1.save(save_path1)

    file_path1 = os.path.abspath(save_path1)

    if 'image2' not in request.files:
        file_path2 = ''
    else:
        file2 = request.files['image2']

        file_name2 = uuid.uuid4().hex[:6]
        save_path2 = '/tmp/' + file_name2 + '_' + file2.filename
        file2.save(save_path2)

        file_path2 = os.path.abspath(save_path2)

    status, ocrResDict, if_check = GetIDOCRInfo(file_path1, file_path2)
    response = jsonify({"status": status, "data": ocrResDict, "authenticity": if_check})

    os.remove(file_path1)
    if 'image2' in request.files:
        os.remove(file_path2)

    response.status_code = 200
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response
