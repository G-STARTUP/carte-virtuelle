@echo off
echo ====================================
echo Generateur de JWT SECRET securise
echo ====================================
echo.
echo Generation d'une cle JWT aleatoire de 64 caracteres...
echo.

powershell -Command "$jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_}); Write-Host 'Votre JWT_SECRET :' -ForegroundColor Green; Write-Host $jwt -ForegroundColor Yellow; Write-Host ''; Write-Host 'Copiez cette valeur dans le fichier env.ini sur votre serveur Hostinger' -ForegroundColor Cyan; Write-Host 'Ligne : JWT_SECRET=...' -ForegroundColor Cyan"

echo.
echo ====================================
pause
