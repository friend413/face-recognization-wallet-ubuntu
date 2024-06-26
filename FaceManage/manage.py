import sqlite3
import sys
import os
import os.path
import numpy as np

from face import GetFaceSimilarity

database_base_name = 'users'
table_name = "feature"
sqlite_insert_blob_query = "INSERT INTO " + table_name + " (id, name, features, customer, admin) VALUES (?, ?, ?, ?, ?)"
sqlite_create_table_query = "CREATE TABLE " + table_name + " ( id INTEGER PRIMARY KEY, name TEXT, features BLOB NOT NULL, customer VARCHAR, admin BOOLEAN)"

sqlite_update_all_query = "UPDATE " + table_name + " set name = ?, features = ? where id = ?"
sqlite_search_query = "SELECT * FROM " + table_name
sqlite_delete_all = "DELETE FROM " + table_name + " where admin = 0 and customer = ?"
sqlite_delete_user = "DELETE FROM " + table_name + " where name = ?"
sqlite_delete_id = "DELETE FROM " + table_name + " where id = ?"

sqlite_search_name = "SELECT count(*) FROM " + table_name + " where name = ?"

data_all = []
MATCHING_THRES = 0.91
FEATURE_SIZE = 2056
max_id = -1

face_database = None

#open databse
def open_database(db_no):
    global max_id
    global face_database

    db_name = database_base_name + str(db_no) + ".db"
    face_database = sqlite3.connect(db_name, check_same_thread=False)
#    clear_database()
    cursor = face_database.execute("SELECT name FROM sqlite_master WHERE type='table';")
    #check tables exist in database
    tables = [
        v[0] for v in cursor.fetchall()
        if v[0] != "sqlite_sequence"
    ]
    cursor.close()
    if not "feature" in tables:
        face_database.execute(sqlite_create_table_query)

    cursor = face_database.execute(sqlite_search_query)
    #load index and feature in "feature table"
    for row in cursor.fetchall():
        id = row[0]
        name = row[1]
        features = np.fromstring(row[2], dtype=np.uint8) 
        customer = row[3]
        admin = row[4]
        print(">>>>>>>>>>>>> Feature Shape", features.shape[0])
        if not features.shape[0] == FEATURE_SIZE:
            continue

        features = features.reshape(1, FEATURE_SIZE)
        
        data_all.append({'id':id, 'name':name, 'features':features, 'customer':customer, 'admin':admin})
        if id > max_id:
            max_id = id
    cursor.close()
    print('>>>>>>>>>>>> Load Users', len(data_all))

#create database
def create_database():
    db_no = 0
    db_name = ""
    while True:
        db_name = database_base_name + str(db_no) + ".db"
        if not os.path.isfile(db_name):
            break
        db_no += 1
    open_database(db_no)

def clear_database(custId):
    global face_database
    global data_all
    data_all = [data for data in data_all if data['admin'] or data['customer'] != custId]
    cursor = face_database.cursor()
    cursor.execute(sqlite_delete_all, (custId,))
    face_database.commit()
    cursor.close()
    return

def register_face(name, features, customer):
    id, _, _, _ = verify_face(features, customer)
    if id >= 0:
        return -1

    global face_database
    global max_id
    max_id = max_id + 1
    id = max_id
    cursor = face_database.cursor()


#ADD STUFF HERE
    cursor.execute(sqlite_search_name,(name,))
    hits = cursor.fetchone()[0]
    print(">>>>>> total hits are " , hits)
    print(" and cursor is ", cursor)
    if hits > 0:
        return -2

    cursor.execute(sqlite_insert_blob_query, (id, name, features.tostring(), customer, 0))
    face_database.commit()
    cursor.close()
    data_all.append({'id':id, 'name':name, 'features':features, 'customer':customer, 'admin':0})
    return id

def update_face(id = None, name = None, features = None):
    global face_database
    cursor = face_database.cursor()
    cursor.execute(sqlite_update_all_query, (name, features.tostring(), id))
    face_database.commit()
    cursor.close()

def verify_face(feat, customer):

    global max_id
    max_score = 0

    if len(data_all) == 0:
        return -2, None, None, 0
    find_id, find_name = -1, None
    for data in data_all:
        id = data['id']
        features = data['features']

        score = GetFaceSimilarity(feat, features) # [sub_id,:]
        print('>>>> Mathing Result', data['name'], score)
        if score >= max_score:
            print(">>>>>>>>>> data is ", data)
            max_score = score
            find_id = id
            find_name = data['name']
            find_cust = data['customer']
            admin = data['admin']

    if max_score >= MATCHING_THRES and find_cust == customer:
        print("score = ", max_score)
        return find_id, find_name, max_score, admin

    return -1, None, None, 0

def remove_face(feat, customer):
    global data_all
    face_id_list = []
   # print(">>>>>>> data in data all is ", data_all)
    for data in data_all:
        id = data['id']
        features = data['features']
        score = GetFaceSimilarity(feat, features)
        find_cust = data['customer']
        if score >= MATCHING_THRES and find_cust == customer:
            if data['admin']:
                return -1
            face_id_list.append(id)
    print('>>>>>>>>>> Ids to remove are ', face_id_list)
    global face_database
    cursor = face_database.cursor()
    for face_id in face_id_list:
        cursor.execute(sqlite_delete_id, (face_id,))
    face_database.commit()
    cursor.close()
    data_all = [data for data in data_all if data['id'] not in face_id_list]
    if len(face_id_list) > 0:
        return 1
    else:
        return 0



def verify_face_with_name(feat, name):

    global max_id
    max_score = 0

    if len(data_all) == 0:
        return -2, None, None
    find_id, find_name = -1, None
    for data in data_all:
        id = data['id']
        features = data['features']

        if data['name'].lower() != name.lower():
            continue

        score = GetFaceSimilarity(feat, features) # [sub_id,:]
        print('>>>> Mathing Result', data['name'], score)
        if score >= max_score:
            max_score = score
            find_id = id
            find_name = data['name']

    if max_score >= MATCHING_THRES:
        print("score = ", max_score)
        return find_id, find_name, max_score

    return -1, None, None

def get_info(id):
    for data in data_all:
        nid = data['id']
        if nid == id:
            return data['name'], data['features']
        else:
            return None, None, None, None, None

def get_userlist():
    userlist = []
    for data in data_all:
        userlist.append(data['name'])
    return userlist

def remove_user(name, custId):
    global data_all
    for data in data_all:
        if data['name'] == name and (data['admin'] or data['customer'] != custId):
            return
    global face_database
    cursor = face_database.cursor()
    cursor.execute(sqlite_delete_user, (name,))
    face_database.commit()
    cursor.close()
    data_all = [i for i in data_all if not (i['name'] == name)]

def set_threshold(th):
    threshold = th

def get_threshold():
    return threshold
