@echo off

REM Verify build before allow push
echo Verifying build...
call npm run build:local
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed. Please fix compilation errors before pushing.
    exit /b %errorlevel%
)

REM Add all changes
git add .

REM Commit changes
set /p commit_msg="Enter commit message: "
git commit -m "%commit_msg%"

REM Push changes
git push origin main

