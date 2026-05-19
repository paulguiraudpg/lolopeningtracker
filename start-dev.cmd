@echo off
set PATH=C:\Users\Citizenguiraud\Desktop\guardlab\node-v22.16.0-win-x64;%PATH%
cd /d "%~dp0"
npm run dev -- --port 5173
