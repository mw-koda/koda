@echo off
setlocal
cd /d "%~dp0koda-backend"

echo [1/4] Resetting npx temp cache...
rmdir /s /q "%LOCALAPPDATA%\npm-cache\_npx" 2>nul
mkdir "%LOCALAPPDATA%\npm-cache\_npx" 2>nul

echo [2/4] Verifying npm cache...
call npm cache verify
if errorlevel 1 (
  echo npm cache verify failed
  exit /b 1
)

echo [3/4] Ensuring local Supabase CLI is installed...
if not exist "node_modules\.bin\supabase.cmd" (
  call npm install --save-dev supabase@2.90.0
  if errorlevel 1 (
    echo Failed to install supabase package
    exit /b 1
  )
)

echo [4/4] Starting Supabase...
call node_modules\.bin\supabase.cmd start
