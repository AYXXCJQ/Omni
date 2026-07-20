$content = @"
@echo off
setlocal enabledelayedexpansion
set PATH=%SystemRoot%\system32;%SystemRoot%;%PATH%

set PORTABLE_VER=20.19.0
set DIST_DIR=dist
set APP_DIR=%DIST_DIR%\app

echo ========================================
echo   Omni Portable Build
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)
echo.
echo [2/5] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo Prisma generate failed
    pause
    exit /b 1
)
echo.
echo [3/5] Building Next.js...
call npm run build
if errorlevel 1 (
    echo Build failed
    pause
    exit /b 1
)
echo.
echo [4/5] Downloading portable Node.js %PORTABLE_VER%...
set ZIP_NAME=node-v%PORTABLE_VER%-win-x64.zip
set NODE_URL=https://nodejs.org/dist/v%PORTABLE_VER%/%ZIP_NAME%
if not exist %ZIP_NAME% (
    call :download
    if errorlevel 1 (
        echo Download failed. Manual download:
        echo %NODE_URL%
        pause
        exit /b 1
    )
)
echo.
echo [5/5] Packaging to %DIST_DIR%...
if exist %DIST_DIR% rmdir /s /q %DIST_DIR%
mkdir %DIST_DIR%

echo Unpacking Node.js...
%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -Command "Expand-Archive -Path '%ZIP_NAME%' -DestinationPath '%DIST_DIR%'"
for /d %%d in (%DIST_DIR%\node-*) do ren %%d node

echo Copying build output...
robocopy .next\standalone %APP_DIR% /E /NJH /NJS /NDL /NFL /R:2 /W:2 >nul
robocopy .next\static %APP_DIR%\.next\static /E /NJH /NJS /NDL /NFL /R:2 /W:2 >nul
robocopy prisma %APP_DIR%\prisma /E /NJH /NJS /NDL /NFL /R:2 /W:2 >nul
robocopy public %APP_DIR%\public /E /NJH /NJS /NDL /NFL /R:2 /W:2 >nul
copy .env %APP_DIR%\.env >nul
copy prisma.config.ts %APP_DIR%\prisma.config.ts >nul
robocopy node_modules\prisma %APP_DIR%\node_modules\prisma /E /NJH /NJS /NDL /NFL /R:2 /W:2 >nul
robocopy node_modules\@prisma %APP_DIR%\node_modules\@prisma /E /NJH /NJS /NDL /NFL /R:2 /W:2 >nul

echo Copying launcher...
copy start.bat %DIST_DIR%\start.bat >nul

echo.
echo ========================================
echo   Build complete!
echo   Output: %DIST_DIR%
echo.
echo   To use:
echo   1. Copy %DIST_DIR% to target machine
echo   2. Run start.bat
echo   3. Open http://localhost:3000
echo ========================================
pause
goto :eof

:download
%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%ZIP_NAME%'"
exit /b %errorlevel%
"@

[IO.File]::WriteAllText("D:\code\omni\build-portable.bat", $content, [Text.Encoding]::ASCII)
