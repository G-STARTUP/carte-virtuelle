@echo off
chcp 65001 > nul
echo.
echo ========================================
echo ✅ VÉRIFICATION PRÉ-DÉPLOIEMENT
echo ========================================
echo.

set "ERROR=0"

echo 📁 Vérification du dossier PROJET_A_TELEVERSER...
if exist "PROJET_A_TELEVERSER" (
    echo    ✅ Dossier existe
) else (
    echo    ❌ Dossier manquant
    set "ERROR=1"
)

echo.
echo 📄 Vérification des fichiers essentiels...

if exist "PROJET_A_TELEVERSER\index.html" (
    echo    ✅ index.html
) else (
    echo    ❌ index.html manquant
    set "ERROR=1"
)

if exist "PROJET_A_TELEVERSER\.htaccess" (
    echo    ✅ .htaccess
) else (
    echo    ❌ .htaccess manquant
    set "ERROR=1"
)

if exist "PROJET_A_TELEVERSER\api\bootstrap.php" (
    echo    ✅ api/bootstrap.php
) else (
    echo    ❌ api/bootstrap.php manquant
    set "ERROR=1"
)

if exist "PROJET_A_TELEVERSER\api\auth.php" (
    echo    ✅ api/auth.php
) else (
    echo    ❌ api/auth.php manquant
    set "ERROR=1"
)

if exist "PROJET_A_TELEVERSER\api\env.ini" (
    echo    ✅ api/env.ini
) else (
    echo    ❌ api/env.ini manquant
    set "ERROR=1"
)

if exist "PROJET_A_TELEVERSER\api\.htaccess" (
    echo    ✅ api/.htaccess
) else (
    echo    ❌ api/.htaccess manquant
    set "ERROR=1"
)

if exist "PROJET_A_TELEVERSER\assets" (
    echo    ✅ dossier assets/
) else (
    echo    ❌ dossier assets/ manquant
    set "ERROR=1"
)

echo.
echo 📋 Vérification des guides...

if exist "PROJET_A_TELEVERSER\CONFIG_HOSTINGER.txt" (
    echo    ✅ CONFIG_HOSTINGER.txt
) else (
    echo    ⚠️ CONFIG_HOSTINGER.txt manquant (optionnel)
)

if exist "PROJET_A_TELEVERSER\LIRE_MOI_DEPLOIEMENT.txt" (
    echo    ✅ LIRE_MOI_DEPLOIEMENT.txt
) else (
    echo    ⚠️ LIRE_MOI_DEPLOIEMENT.txt manquant (optionnel)
)

if exist "mysql_schema.sql" (
    echo    ✅ mysql_schema.sql (à importer dans phpMyAdmin)
) else (
    echo    ❌ mysql_schema.sql manquant
    set "ERROR=1"
)

echo.
echo ========================================

if "%ERROR%"=="0" (
    echo ✅ TOUT EST PRÊT POUR LE DÉPLOIEMENT
    echo.
    echo 📤 PROCHAINES ÉTAPES :
    echo    1. Téléversez le contenu de PROJET_A_TELEVERSER/ vers public_html/
    echo    2. Éditez public_html/api/env.ini avec vos identifiants MySQL
    echo    3. Importez mysql_schema.sql dans phpMyAdmin
    echo    4. Testez : https://gwap.pro/api/diag.php
    echo.
    echo 📖 Consultez : GUIDE_DEPLOIEMENT_HOSTINGER.md
) else (
    echo ❌ ERREUR : Fichiers manquants
    echo    Relancez la préparation du projet
)

echo ========================================
echo.
pause
