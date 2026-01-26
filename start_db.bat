@echo off
echo Starting MongoDB Replica Set for Portfolio App...
echo Data Directory: f:\PROJECTS\Personal_Finance\db_data
echo Port: 27018

if not exist "f:\PROJECTS\Personal_Finance\db_data" mkdir "f:\PROJECTS\Personal_Finance\db_data"

"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "f:\PROJECTS\Personal_Finance\db_data" --port 27018 --replSet rs0 --bind_ip localhost

pause
