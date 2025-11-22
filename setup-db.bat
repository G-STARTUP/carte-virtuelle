@echo off
echo ====================================
echo Configuration de la base de donnees
echo ====================================
echo.
echo Ce script va vous aider a creer la base de donnees MySQL locale.
echo.
echo PREREQUIS :
echo - MySQL/MariaDB doit etre installe et demarre
echo - Vous devez connaitre le mot de passe root MySQL
echo.
pause

echo.
echo Connexion a MySQL et creation de la base...
echo.

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS carte CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; SHOW DATABASES;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Impossible de se connecter a MySQL.
    echo Verifiez que MySQL est demarre et que le mot de passe est correct.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Base de donnees 'carte' creee !
echo ====================================
echo.
echo Importation du schema SQL...
echo.

mysql -u root -p carte < mysql_schema.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Erreur lors de l'importation du schema.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Schema importe avec succes !
echo ====================================
echo.
echo Prochaines etapes :
echo 1. Demarrez le serveur PHP : php -S localhost:8000 -t public
echo 2. Demarrez le frontend : npm run dev
echo 3. Testez l'inscription/connexion
echo.
pause
