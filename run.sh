#/bin/bash

sleep 3 && open "http://localhost:8081/index.html" &

echo "Starting service"

python -m SimpleHTTPServer 8081
