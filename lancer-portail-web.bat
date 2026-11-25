@echo off
chcp 65001 > nul
echo ======================================================================
echo   LANCEMENT DU PORTAIL MARKETING ET DASHBOARD SAAS (NEXT.JS 14)
echo ======================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%apps\portal-nextjs"

echo Démarrage du serveur Web sur http://localhost:3000 ...
echo (Appuyez sur Ctrl+C dans cette fenêtre pour arrêter le site)
echo.

call npm.cmd run dev
pause
