@echo off
cd /d "%~dp0"
"X:\Node.js\node.exe" "node_modules\next\dist\bin\next" dev --hostname 127.0.0.1 --port 3000
