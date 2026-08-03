@echo off
setlocal
cd /d "%~dp0\.."
where py >nul 2>&1
if %errorlevel%==0 (
  py scripts\https_server.py --host 0.0.0.0 --port 9999
) else (
  python scripts\https_server.py --host 0.0.0.0 --port 9999
)
endlocal
