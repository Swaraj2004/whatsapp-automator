@echo off
cd /d "%~dp0"

REM Set default value to false
set HEADLESS_MODE=false

REM Check if .env file exists
if exist "dist\.env" (
    REM Try to read the HEADLESS_MODE value from .env file
    for /f "tokens=2 delims==" %%a in ('type dist\.env ^| findstr "HEADLESS_MODE" 2^>nul') do (
        set HEADLESS_MODE=%%a
    )
)

REM Remove quotes from the value
set HEADLESS_MODE=%HEADLESS_MODE:"=%

REM Check if HEADLESS_MODE is empty
if "%HEADLESS_MODE%"=="" (
    set "HEADLESS_MODE=false"
)

REM Check if HEADLESS_MODE is true or false
if "%HEADLESS_MODE%"=="false" (
    start "" /B wscript.exe "%~dp0hide.vbs"
    exit
) else (
    npm start
)
