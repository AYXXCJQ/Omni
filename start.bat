@echo off
title Omni

set ROOT=%~dp0
set PATH=%ROOT%node;%ROOT%node\node_modules\npm\bin;%SystemRoot%\system32;%SystemRoot%;%PATH%
set APP_DIR=%ROOT%app

cd /d %APP_DIR%

if not exist prisma\dev2.db (
    echo [1/2] Initializing database...
    call npx.cmd prisma db push --skip-generate
    if errorlevel 1 (
        echo [ERROR] Database init failed.
        pause
        exit /b 1
    )
)

echo.
echo   Omni starting...
echo   Open http://localhost:3000
echo   Press Ctrl+C to stop
echo.

node server.js
pause
