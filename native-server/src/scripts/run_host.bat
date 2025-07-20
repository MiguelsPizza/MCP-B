@echo off
setlocal enabledelayedexpansion

REM Setup paths
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "LOG_DIR=%SCRIPT_DIR%\logs"
set "NODE_SCRIPT=%SCRIPT_DIR%\index.js"

if not exist "%LOG_DIR%" md "%LOG_DIR%"

REM Generate timestamp
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set "TIMESTAMP=%%i"
set "WRAPPER_LOG=%LOG_DIR%\native_host_wrapper_windows_%TIMESTAMP%.log"
set "STDERR_LOG=%LOG_DIR%\native_host_stderr_windows_%TIMESTAMP%.log"

REM Initial logging
echo Wrapper script called at %DATE% %TIME% > "%WRAPPER_LOG%"
echo SCRIPT_DIR: %SCRIPT_DIR% >> "%WRAPPER_LOG%"
echo LOG_DIR: %LOG_DIR% >> "%WRAPPER_LOG%"
echo NODE_SCRIPT: %NODE_SCRIPT% >> "%WRAPPER_LOG%"
echo Initial PATH: %PATH% >> "%WRAPPER_LOG%"
echo User: %USERNAME% >> "%WRAPPER_LOG%"
echo Current PWD: %CD% >> "%WRAPPER_LOG%"

REM Node.js discovery
set "NODE_EXEC="

REM Priority 1: Installation-time node path
set "NODE_PATH_FILE=%SCRIPT_DIR%\node_path.txt"
echo Checking installation-time node path >> "%WRAPPER_LOG%"
if exist "%NODE_PATH_FILE%" (
    set /p EXPECTED_NODE=<"%NODE_PATH_FILE%"
    if exist "!EXPECTED_NODE!" (
        set "NODE_EXEC=!EXPECTED_NODE!"
        echo Found installation-time node at !NODE_EXEC! >> "%WRAPPER_LOG%"
    )
)

REM Priority 1.5: Fallback to relative path
if not defined NODE_EXEC (
    set "EXPECTED_NODE=%SCRIPT_DIR%\..\..\..\node.exe"
    echo Checking relative path >> "%WRAPPER_LOG%"
    if exist "%EXPECTED_NODE%" (
        set "NODE_EXEC=%EXPECTED_NODE%"
        echo Found node at relative path: !NODE_EXEC! >> "%WRAPPER_LOG%"
    )
)

REM Priority 2: where command
if not defined NODE_EXEC (
    echo Trying 'where node.exe' >> "%WRAPPER_LOG%"
    for /f "delims=" %%i in ('where node.exe 2^>nul') do (
        if not defined NODE_EXEC (
            set "NODE_EXEC=%%i"
            echo Found node using 'where': !NODE_EXEC! >> "%WRAPPER_LOG%"
        )
    )
)

REM Priority 3: Common paths
if not defined NODE_EXEC (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_EXEC=%ProgramFiles%\nodejs\node.exe"
        echo Found node at !NODE_EXEC! >> "%WRAPPER_LOG%"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "NODE_EXEC=%ProgramFiles(x86)%\nodejs\node.exe"
        echo Found node at !NODE_EXEC! >> "%WRAPPER_LOG%"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "NODE_EXEC=%LOCALAPPDATA%\Programs\nodejs\node.exe"
        echo Found node at !NODE_EXEC! >> "%WRAPPER_LOG%"
    )
)

REM Validation
if not defined NODE_EXEC (
    echo ERROR: Node.js executable not found! >> "%WRAPPER_LOG%"
    exit /B 1
)

echo Using Node executable: %NODE_EXEC% >> "%WRAPPER_LOG%"
call "%NODE_EXEC%" -v >> "%WRAPPER_LOG%" 2>>&1

if not exist "%NODE_SCRIPT%" (
    echo ERROR: Node.js script not found at %NODE_SCRIPT% >> "%WRAPPER_LOG%"
    exit /B 1
)

echo Executing: "%NODE_EXEC%" "%NODE_SCRIPT%" >> "%WRAPPER_LOG%"
call "%NODE_EXEC%" "%NODE_SCRIPT%" 2>> "%STDERR_LOG%"
set "EXIT_CODE=%ERRORLEVEL%"

echo Exit code: %EXIT_CODE% >> "%WRAPPER_LOG%"
endlocal
exit /B %EXIT_CODE%