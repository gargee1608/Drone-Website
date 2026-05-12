@echo off
echo Testing drone delete functionality...

echo.
echo 1. First, let's list existing drones:
curl -s -H "Content-Type: application/json" http://localhost:4000/api/drones

echo.
echo.
echo 2. If you want to test delete, replace DRONE_ID below with an actual ID from the list above
echo curl -X DELETE -H "Content-Type: application/json" http://localhost:4000/api/drones/DRONE_ID

pause
