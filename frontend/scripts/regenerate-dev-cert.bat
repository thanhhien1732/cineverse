@echo off
setlocal
set LAN_IP=%~1
if "%LAN_IP%"=="" set LAN_IP=192.168.160.124
cd /d "%~dp0\.."
powershell -ExecutionPolicy Bypass -File scripts\generate-dev-cert.ps1 -LanIp %LAN_IP%
endlocal
