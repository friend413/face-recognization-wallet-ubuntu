import argparse
import numpy as np
import ctypes
import os.path
import time

from FaceOnLive_face.facewrapper.facewrapper import InitEngine, GetLiveness, ProcessAll, CompareFace

FEATURE_SIZE = 2056

def InitFaceSDK():
    licensePath = os.path.abspath(os.path.dirname(__file__)) + '/FaceOnLive_face/facewrapper/license.txt'
    dictFolder = os.path.abspath(os.path.dirname(__file__)) + '/FaceOnLive_face/facewrapper/'
    ret = InitEngine(licensePath.encode('utf-8'), dictFolder.encode('utf-8'))
    return ret

def GetLivenessInfo(image):
    bbox = np.zeros([4], dtype=np.int32)
    live_score = GetLiveness(image, image.shape[1], image.shape[0], bbox)

    if live_score == 1:
        result = "Genuine"
    elif live_score == -102:
        result = "Face not detected"
    elif live_score == -103:
        result = "Liveness failed"
    elif live_score == 0:
        result = "Spoof"
    elif live_score == -3:
        result = "Face is too small"
    elif live_score == -4:
        result = "Face is too large"
    else:
        result = "Error"

    return bbox, live_score, result

def GetFeatureInfo(image1):
    bbox1 = np.zeros([4], dtype=np.int32)
    attribute1 = np.zeros([4], dtype=np.int32)
    angles1 = np.zeros([3], dtype=np.float64)
    liveness1 = np.zeros([1], dtype=np.int32)
    age1 = np.zeros([1], dtype=np.int32)
    gender1 = np.zeros([1], dtype=np.int32)
    mask1 = np.zeros([1], dtype=np.int32)
    feature1 = np.zeros([FEATURE_SIZE], dtype=np.uint8)
    featureSize1 = np.zeros([1], dtype=np.int32)
    ret = ProcessAll(image1, image1.shape[1], image1.shape[0], bbox1, attribute1, angles1, liveness1, age1, gender1, mask1, feature1, featureSize1, 0)

    if ret != 0:
        if ret == -1:
            result = "Engine not inited"
        elif ret == -2:
            result = "No face detected in image1"
        else:
            result = "Error in image1"
        print(result)
        return None, None, None

    return bbox1, liveness1[0], feature1

def GetFaceSimilarity(feat1, feat2):
    return CompareFace(feat1, FEATURE_SIZE, feat2, FEATURE_SIZE)