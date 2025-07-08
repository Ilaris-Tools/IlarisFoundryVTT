@echo off
echo Windows Batch Command
set script_path=%~dp0
set developer_env=%script_path%developer.env

echo Script path: %script_path%
echo Developer env: %developer_env%

if not exist "%developer_env%" (
    echo.
    echo Please create an 'developer.env' based on 'developer.template.env' with the content that matches your operating system in the same folder as the 'developer.template.env' and enter the information after the '='
    echo.
    pause
    exit /b 1
)

REM Read environment variables from developer.env
for /f "usebackq delims=" %%a in ("%developer_env%") do (
    echo Processing: %%a
    if "%%a" neq "" if not "%%a:~0,3%%"=="REM" %%a
)

cd /d %USERPROFILE%

echo Starting FoundryVTT...
echo Full path: "%PATH_TO_FOUNDRY%%FILE_TO_START_FOUNDRY%"

"%PATH_TO_FOUNDRY%%FILE_TO_START_FOUNDRY%" 
