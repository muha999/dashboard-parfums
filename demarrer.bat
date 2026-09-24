@echo off
echo Demarrage de Mon Comptoir a Parfums...
echo.

start /min "Backend Django" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python manage.py migrate && python manage.py runserver"

timeout /t 3 /nobreak >nul

start /min "Frontend React" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

set BRAVE="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"

if exist %BRAVE% (
    start "" %BRAVE% --app=http://localhost:5173
) else if exist %CHROME% (
    start "" %CHROME% --app=http://localhost:5173
) else (
    start http://localhost:5173
)

echo.
echo Les deux serveurs tournent chacun dans leur fenetre.
echo Pour tout arreter : ferme ces deux fenetres (ou Ctrl+C dans chacune).
exit
