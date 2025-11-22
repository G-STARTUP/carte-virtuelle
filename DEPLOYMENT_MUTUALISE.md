# Déploiement Mutualisé Hostinger (Frontend Vite + API PHP)

## 1. Objectif
Automatiser la mise en ligne du frontend (React/Vite) et des scripts API PHP via GitHub Actions (FTP) sur un hébergement mutualisé Hostinger.

## 2. Structure de prod
```
public_html/
  index.html
  assets/* (Vite build)
  api/
    bootstrap.php
    auth.php
    cards.php
    customer.php
    fund.php
    webhook.php
    utils/
      jwt.php
      strowallet.php
  .htaccess
```

## 3. Fichier `.htaccess` recommandé
```
RewriteEngine On
# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# API clean URLs (e.g. /api/cards/123)
RewriteRule ^api/cards/(.*)$ api/cards.php?path=$1 [QSA,L]
RewriteRule ^api/customer/?$ api/customer.php [QSA,L]
RewriteRule ^api/fund/?$ api/fund.php [QSA,L]
RewriteRule ^api/webhook/?$ api/webhook.php [QSA,L]
RewriteRule ^api/auth/(register|login)$ api/auth.php?action=$1 [QSA,L]

# Security headers (tolerant)
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header set X-XSS-Protection "1; mode=block"
```

## 4. Variables d'environnement
Placer un fichier `env.ini` hors `public_html` si possible (ex: `../secure/env.ini`). Contenu:
```
MYSQL_HOST=localhost
MYSQL_USER=user_x
MYSQL_PASSWORD=***
MYSQL_DATABASE=carte
JWT_SECRET=change_me
STROWALLET_PUBLIC_KEY=***
STROWALLET_BASES=https://strowallet.com/api/bitvcard,https://strowallet.com/api
```
Charger via `parse_ini_file` dans `bootstrap.php`.

## 5. Build local
```powershell
npm ci
npm run build
```
Le répertoire `dist/` est prêt à être déployé.

## 6. Déploiement manuel (fallback)
1. Archiver: `npm run zip:dist`
2. Upload `dist/` + dossier `api/` via Gestionnaire de fichiers hPanel ou FTP.
3. Vérifier `index.html` accessible et une route SPA.
4. Tester API: `curl https://domain.com/api/auth/login`.

## 7. Déploiement automatique (GitHub Actions)
Workflow exemple: `.github/workflows/deploy.yml` (déjà présent) + `deploy-prod.yml` pour branche `main`.

Secrets à créer dans GitHub Repository Settings > Secrets and variables > Actions:
- `FTP_SERVER`
- `FTP_USER`
- `FTP_PASSWORD`
- (Option) `FTP_PORT` si différent de 21
- (Option) `FTP_SECURE` = `true` pour FTPS

## 8. Nouveau dépôt GitHub
```bash
git init
git remote add origin git@github.com:ORG/NOUVEAU-REPO.git
git add .
git commit -m "Initial commit"
git push -u origin main
```
Créer ensuite les secrets et ajouter workflows avant push si souhaité.

## 9. Workflow production avancé
Voir `deploy-prod.yml` (déclenchement sur tag ou push main).

## 10. Sécurité
- Ne jamais placer `env.ini` dans `public_html`.
- Forcer HTTPS via hPanel (Let’s Encrypt).
- Ajouter CSP si nécessaire.
- Limiter rate brute force déjà en place (table `api_rate_limiter`).
- Journaliser erreurs sensibles dans `api_logs` (éviter données personnelles).

## 11. Cron jobs
Utiliser hPanel Cron pour traitement webhook différé:
```
*/5 * * * * /usr/bin/php -d detect_unicode=0 /home/USER/public_html/api/cron/process_webhooks.php
```
Script `process_webhooks.php` parcourra `webhook_events` où `processed=0`.

## 12. Checkliste déploiement
- [ ] Secrets FTP créés
- [ ] Fichiers API présents
- [ ] .htaccess installé
- [ ] Build Vite effectué
- [ ] Tests API login/register OK
- [ ] Strowallet endpoints répondent
- [ ] Logs apparaissent dans `api_logs`

## 13. Rétrogradation (rollback)
Conserver tag Git `vX.Y.Z`. Pour rollback: re-pousser assets d’un tag ou utiliser script GitHub Action déclenché sur release.

## 14. Optimisations futures
- Minification HTML (plugin Vite).
- Compression Brotli/Gzip (non toujours configurable en mutualisé; activer via hPanel si dispo).
- Monitoring externe (UptimeRobot) API / Front.

Fin.
