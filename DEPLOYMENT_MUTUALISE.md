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
- [ ] Script install supprimé après usage

## 16. Installation automatisée des tables (optionnelle)
Endpoint protégé: `/api/install?token=VOTRE_TOKEN`
Pré-requis: ajouter `INSTALL_SECRET=VOTRE_TOKEN` dans `env.ini` (hors `public_html`).
Processus:
1. Déployer `mysql_schema.sql` et `api/install.php`.
2. Appeler l’URL (GET ou POST) une fois.
3. Vérifier réponse JSON: toutes les tables `OK`.
4. Supprimer `api/install.php` du serveur.

Exemple (PowerShell):
```powershell
curl https://example.com/api/install?token=VOTRE_TOKEN
```
Réponse attendue:
```json
{ "success": true, "tables": { "users": "OK", ... }, "recommendation": "Remove install.php now." }
```
Sécurité: ne pas laisser le script accessible sans suppression; le token ne doit pas être prévisible.

## 13. Rétrogradation (rollback)
Conserver tag Git `vX.Y.Z`. Pour rollback: re-pousser assets d’un tag ou utiliser script GitHub Action déclenché sur release.

## 14. Optimisations futures
- Minification HTML (plugin Vite).
- Compression Brotli/Gzip (non toujours configurable en mutualisé; activer via hPanel si dispo).
- Monitoring externe (UptimeRobot) API / Front.

Fin.

## 15. Déploiement Automatique via Webhook Hostinger
Hostinger fournit une URL webhook de déploiement: `https://webhooks.hostinger.com/deploy/8e277ebef8a1ac93d532f7c2b8ca5935`.

### Étapes de configuration (GitHub)
1. Aller sur: `https://github.com/G-STARTUP/carte-virtuelle/settings/hooks/new`.
2. Payload URL: `https://webhooks.hostinger.com/deploy/8e277ebef8a1ac93d532f7c2b8ca5935`.
3. Content type: `application/json`.
4. Secret: générer une valeur aléatoire (ex. PowerShell):
   ```powershell
   -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
   ```
   (Conserver ce secret pour vérification éventuelle; Hostinger peut l'ignorer selon implémentation.)
5. SSL verification: activée.
6. Which events trigger the webhook: sélectionner "Just the push event" (éviter surcharge). Si déploiement sur tags releases, ajouter event `Create` ou `Release`.
7. Cliquer "Add webhook".

### Interaction avec GitHub Actions
Deux options:
- Utiliser uniquement le webhook Hostinger (simple, pas de build local si Hostinger reconstruit automatiquement votre projet).
- Combiner avec Actions: laisser l'Action faire le build et push artefacts via FTP, désactiver alors le webhook pour éviter double déploiement.

Si vous gardez les deux: limiter le webhook aux pushes sur `main` en déplaçant travail dans une branche de feature (Actions build sur PR, webhook sur merge).

### Validation
Après ajout du webhook, faire un commit sur `main` (une fois le compte GitHub rétabli) et vérifier dans GitHub Settings > Webhooks > Détails que la livraison ("Recent Deliveries") renvoie `200`.

### Exemple de payload réduit (push event)
```json
{
  "ref": "refs/heads/main",
  "before": "<commit_sha>",
  "after": "<commit_sha>",
  "repository": { "name": "carte-virtuelle", "full_name": "G-STARTUP/carte-virtuelle" },
  "pusher": { "name": "USERNAME" }
}
```

### Bonnes pratiques
- N'utiliser le webhook qu'après stabilisation de la branche principale.
- Conserver un tag avant chaque livraison majeure pour rollback.
- Documenter dans un fichier `WEBHOOK.md` la date de mise en place et le secret choisi.

### Contrôle de signature (optionnel)
Si Hostinger renvoie un header signature (ex: `X-Hub-Signature-256`), vous pouvez le vérifier côté intermédiaire (si vous intercalez votre propre proxy). Sur mutualisé simple, validation souvent non nécessaire.

### Désactivation / Rotation
Pour désactiver temporairement: Editer le webhook et décocher "Active". Pour rotation de secret: générer nouveau secret et mettre à jour; commits suivants utiliseront le nouveau.

