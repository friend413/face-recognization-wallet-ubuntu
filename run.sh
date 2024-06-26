#!/bin/bash

/var/www/html/frweb/FaceOnLive_id/ocrengine/ttvocrsrv &
sleep 10
python3 /var/www/html/frweb/waitress_server.py &
