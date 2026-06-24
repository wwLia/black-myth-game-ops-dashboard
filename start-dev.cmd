@echo off
cd /d "%~dp0"
"X:\Node.js\node.exe" "node_modules\next\dist\bin\next" dev --hostname 0.0.0.0 --port 3000
