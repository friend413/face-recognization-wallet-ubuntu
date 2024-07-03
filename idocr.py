import os
import json
from FaceOnLive_id.ocrengine.ocrengine import TTVOcrGetHWID, TTVOcrSetActivation \
, TTVOcrInit, TTVOcrProcess, TTVOcrCreditCard, TTVOcrBarCode, ttv_if_checker

def InitIDOCRSDK():
    print("InitIDOCRSDK")
    ocrHWID = TTVOcrGetHWID()
    licenseKey = "KIYOT-NBHQV-MDDYN-QOYIV"
    ocrRet = TTVOcrSetActivation(licenseKey.encode('utf-8'))
    print('ocr activation: ', ocrRet.decode('utf-8'))

    dictPath = os.path.abspath(os.path.dirname(__file__)) + '/FaceOnLive_id/ocrengine/dict'
    ocrRet = TTVOcrInit(dictPath.encode('utf-8'))
    return ocrRet

def GetIDOCRInfo(front_file, back_file):
    ocrResult = TTVOcrProcess(front_file.encode('utf-8'), back_file.encode('utf-8'))
    status = "ok"
    if not ocrResult:
        ocrResDict = {}
        status = "error"
    else:
        ocrResDict = json.loads(ocrResult)  

    if_check = ttv_if_checker(front_file.encode('utf-8'))
    return status, ocrResDict, if_check