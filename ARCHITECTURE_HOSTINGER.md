# Migration Architecture vers Hostinger (Front + Backend + MySQL)

Ce document décrit comment passer d'une architecture Front + Supabase (Postgres + Edge Functions) à une architecture entièrement hébergée chez Hostinger avec MySQL et un backend Node.js (Express).

## 1. Objectifs
- Héberger le **frontend** (Vite/React) sur l'hébergement web (mutualisé ou sous-domaine d'un VPS).
- Héberger le **backend Node.js** sur un **VPS Hostinger** (recommandé) ou via leur support Node (limité en mutualisé).
- Remplacer l'auth Supabase par un module d'auth maison (JWT + table `users`).
- Migrer les tables Supabase vers MySQL.
- Reproduire les fonctions Edge Supabase sous forme d'API REST Express.

## 2. Décision Hébergement
| Option | Avantages | Inconvénients | Usage recommandé |
|--------|-----------|---------------|------------------|
| Mutualisé (hPanel) | Simplicité, coût bas | Pas de process Node permanent, limite sur sockets, pas de PM2 | Front statique + backend PHP léger |
| VPS Hostinger | Liberté totale (Node, PM2, Docker) | Gestion serveur (sécurité, mises à jour) | Backend Node/Express + API temps réel |
| Cloud Managed (Autres) | Scalabilité, maintenance réduite | Coût plus élevé | Croissance rapide / besoins serverless |

## 3. Répartition des composants (Mutualisé)
| Composant | Emplacement | Dossier | Port |
|----------|-------------|---------|------|
| Frontend SPA | Mutualisé `public_html/` | `dist/` | 80/443 |
| Backend API PHP | Mutualisé `public_html/api/` | `api/` | 80/443 (même vhost) |
| Base MySQL | Instance MySQL Hostinger | n/a | 3306 |
| Cron / tâches différées | Mutualisé (hPanel Cron) | `api/cron/` | - |

## 4. Backend PHP (Mutualisé)
Le mutualisé ne garantit pas un process Node long vivant; on remplace Express par des scripts PHP REST.
Structure recommandée:
```
public_html/
  index.html (SPA)
  assets/...
  .htaccess (rewrite SPA + API)
  api/
    bootstrap.php (autoload DB, headers)
    auth.php (register/login JWT)
    cards.php (GET /api/cards/{id})
    customer.php (POST /api/customer)
    utils/ (jwt.php, response.php, validation.php)
    cron/ (scripts appelés par hPanel Cron si nécessaire)
```
Points clés:
- JWT signé avec `HS256` et secret dans fichier hors `public_html` si possible (ex: `../secure/.env`).
- Connexion MySQL via PDO persistante courte (script par requête).
- Rate limiting basique via table `api_rate_limiter` ou headers + Cloudflare.

## 5. Migration Schéma Postgres -> MySQL
Extraire depuis `supabase/migrations/*.sql`. Principales différences:
| Élément | Postgres | MySQL | Action |
|--------|----------|-------|--------|
| UUID | `uuid` + extension | `CHAR(36)` ou `BINARY(16)` | Utiliser `CHAR(36)` simple |
| JSONB | `jsonb` | `JSON` | Remplacer par `JSON` |
| Timestamps | `timestamptz` | `TIMESTAMP` (ou `DATETIME`) | Utiliser `TIMESTAMP` + `DEFAULT CURRENT_TIMESTAMP` |
| Upsert | `INSERT ... ON CONFLICT` | `INSERT ... ON DUPLICATE KEY UPDATE` | Adapter la logique |

### Exemple table `strowallet_cards` (simplifié):
```sql
CREATE TABLE strowallet_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(32),
  card_number VARCHAR(32),
  name_on_card VARCHAR(128),
  expiry_month INT,
  expiry_year INT,
  raw_response JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (user_id)
);
```

## 6. Authentification
- Table `users (id INT PK, email VARCHAR(255) UNIQUE, password_hash VARCHAR(255), created_at TIMESTAMP)`.
- Enregistrement: hash via `bcrypt`.
- Login: vérification et création JWT (`userId`, `email`).
- Protection: middleware `authMiddleware`.

## 7. Conversion d'une Fonction Supabase -> Route Express
Exemple `get-card-details`:
1. Auth JWT -> récupère `req.user.userId`.
2. SELECT carte par `card_id` + `user_id`.
3. Appel API Strowallet -> mise à jour DB.
4. Retour JSON.

Pseudocode:
```ts
router.get('/:id', auth, async (req,res)=> {
  // 1. check
  // 2. select
  // 3. external fetch
  // 4. update + respond
});
```

## 8. Sécurité & Headers
- Mettre un reverse proxy (Nginx) devant Node sur VPS:
```nginx
server {
  server_name api.example.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```
- Activer HTTPS (certbot + cron renouvellement).

## 9. Déploiement Frontend (Mutualisé)
1. `npm run build`
2. Upload contenu `dist/` dans `public_html/` (ou sous-dossier).
3. `.htaccess` pour SPA réécrit.

## 10. Déploiement Backend (Mutualisé PHP)
1. Activer une base MySQL dans hPanel (créer DB + user dédié IP restreinte si possible).
2. Créer dossier `api/` dans `public_html/` et uploader scripts.
3. Placer un fichier `bootstrap.php` qui charge `.env` (via `parse_ini_file`) situé idéalement hors `public_html`.
4. Protéger contre accès direct aux fichiers internes (`deny from all` dans sous-dossiers sensibles ou utiliser une structure hors racine web).
5. Tester endpoints `/api/auth.php?action=login` etc.
6. Ajouter règles `.htaccess` pour réécriture propre (ex: `/api/cards/123`).

## 11. Variables d'environnement backend
Dans mutualisé sans process long, utiliser fichier `.env` INI:
```
MYSQL_HOST=localhost
MYSQL_USER=user_x
MYSQL_PASSWORD=***
MYSQL_DATABASE=carte
JWT_SECRET=change_me
STROWALLET_PUBLIC_KEY=***
```
Ne pas exposer ce fichier au téléchargement (idéal hors `public_html`).

## 12. Flux de déploiement CI (optionnel - mutualisé)
GitHub Actions + FTP deploy:
1. Job build Front: `npm ci && npm run build`.
2. Upload `dist/` via FTP (action marketplace) vers `public_html/`.
3. Upload scripts PHP `api/`.
4. (Option) Purge CDN / Cloudflare cache.

## 13. Étapes prioritaires restantes
- Conversion fonctions Strowallet vers scripts PHP sécurisés (auth + filtrage). 
- Création tables MySQL + indexes.
- Validation input (regex + filtres) car pas de Zod.
- Mise en place logs dans table `api_logs` + rotation par Cron.

## 15. Workflow CI/CD FTP (Exemple)
Fichier `.github/workflows/deploy.yml` :
```
name: Deploy Mutualise
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Upload dist via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASSWORD }}
          server-dir: public_html/
          local-dir: dist/
      - name: Upload API scripts
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASSWORD }}
          server-dir: public_html/api/
          local-dir: api/
```
Secrets à définir dans GitHub: `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD`.

## 14. Checklist Migration
- [ ] VPS provisionné
- [ ] MySQL créé + utilisateur restreint
- [ ] Schéma MySQL importé/migré
- [ ] Backend déployé (PM2)
- [ ] Nginx reverse proxy + SSL
- [ ] Frontend déployé
- [ ] Tests endpoints (Postman)
- [ ] Monitoring (uptime + logs)

---
Fin.
