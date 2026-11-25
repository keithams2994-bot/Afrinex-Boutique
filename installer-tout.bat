@echo off
chcp 65001 > nul
echo ======================================================================
echo   INSTALLATION AUTOMATIQUE DES MODULES - BOUTIQUE PRO SAAS
echo ======================================================================
echo.

set ROOT_DIR=%~dp0

echo [1/3] Installation des dépendances de l'API Backend NestJS...
cd /d "%ROOT_DIR%apps\backend-nestjs"
call npm.cmd install
if %ERRORLEVEL% NEQ 0 (
    echo [!] Erreur lors de l'installation du Backend.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Installation des dépendances du Portail Web Next.js...
cd /d "%ROOT_DIR%apps\portal-nextjs"
call npm.cmd install
if %ERRORLEVEL% NEQ 0 (
    echo [!] Erreur lors de l'installation du Portail Web.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Installation des paquets de l'application Flutter Caisse...
cd /d "%ROOT_DIR%apps\mobile-desktop-flutter"
where flutter >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    call flutter pub get
) else (
    echo [-] Flutter n'est pas encore installe sur ce PC (cette etape sera faite plus tard pour le mobile).
)

echo.
echo ======================================================================
echo   TOUTES LES DÉPENDANCES SONT INSTALLÉES AVEC SUCCÈS !
echo ======================================================================
echo.
pause
