# Déploiement sur Hostiger (hPanel)

Ce guide explique comment publier la partie front (Vite + React) de votre projet sur un hébergement mutualisé Hostiger via hPanel, tout en conservant Supabase pour l'authentification, la base de données et les Edge Functions.

## 1. Vue d'ensemble
- Frontend: application SPA Vite/React (dossier `dist` après build) servie statiquement par Hostiger.
- Backend / API: Supabase (Postgres + Auth + Functions). Les dossiers `supabase/` et vos fonctions ne sont pas déployés sur Hostiger mais via la CLI Supabase.
- Routage SPA: `react-router-dom` nécessite une réécriture vers `index.html` (gérée via `.htaccess`).

## 2. Préparation des variables d'environnement
Vite n'expose au bundle que les variables préfixées par `VITE_`. Créez un fichier `.env.production` à la racine (non commité si vous ajoutez plus tard `.gitignore`):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=****************************************
# Si vous avez besoin d'une clé OpenAI côté client (déconseillé) NE PAS l'exposer ici.
```

Recommandation: Ne jamais exposer une clé OpenAI ou des secrets sensibles dans le front. Utilisez une Supabase Function ou proxy côté serveur pour vos appels OpenAI.

### Exemple d'usage dans le code
Dans votre code React, vous pouvez lire: `import.meta.env.VITE_SUPABASE_URL`.

## 3. Build de production
Depuis votre machine locale:

```powershell
npm install
npm run build
```

Le résultat est dans `dist/`.

Optionnel: créer une archive prête à uploader:
```powershell
npm run zip:dist
```
Cela génère `dist.zip`.

## 4. Fichier `.htaccess` pour SPA
Un fichier `.htaccess` à placer dans `public/` (déjà ajouté) afin que Vite l'intègre dans `dist/`. Il force toutes les routes vers `index.html` et active quelques headers basiques.

Contenu actuel:
```
# Forcer index.html pour routes SPA
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# Sécurité minimale (adapter si besoin)
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header set X-XSS-Protection "1; mode=block"
```
Si Hostiger ne supporte pas certains headers en mutualisé, ce bloc sera simplement ignoré.

## 5. Upload via hPanel
1. Connectez-vous à hPanel.
2. Ouvrez le Gestionnaire de fichiers.
3. Allez dans `public_html/` (ou créez un sous-dossier si vous utilisez un sous-domaine).
4. Supprimez tout ancien contenu obsolète (sauf ce que vous devez garder).
5. Chargez soit le dossier `dist/` complet (en gardant sa structure interne), soit `dist.zip` puis décompressez.
6. Vérifiez que `index.html`, les assets et `.htaccess` sont bien présents directement dans le dossier public ciblé.

## 6. Configuration du domaine / sous-domaine
- Sur hPanel, ajoutez votre domaine ou sous-domaine et pointez-le vers le dossier où vous avez déployé le contenu de `dist/`.
- Activez SSL (Let’s Encrypt) dans la section SSL de hPanel. Après émission du certificat, vérifiez l’accès HTTPS.

## 7. Cache & Performances
- Les assets générés par Vite (hashés) sont safe pour un cache long. Vous pouvez ajouter dans `.htaccess`:
```
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```
- Gardez `index.html` avec un cache court (optionnel):
```
<Files "index.html">
  Header set Cache-Control "no-cache"
</Files>
```

## 8. Monitoring & Logs
Hostiger offre des statistiques basiques (trafic, utilisation). Pour logs applicatifs ou erreurs JS:
- Activez Sourcemaps: ajouter (si nécessaire) dans `vite.config.ts`:
```ts
build: { sourcemap: true }
```
- Utilisez un service externe (Sentry, LogRocket) en production si besoin.

## 9. Mise à jour (rollout) simplifiée
1. `git pull` / modifications locales
2. `npm run build`
3. `npm run zip:dist`
4. Upload `dist.zip` et extraction
5. Purge éventuelle du cache CDN (si ajouté) ou forcer un hard refresh.

## 10. Déploiement des fonctions Supabase
Indépendamment du front:
```powershell
supabase login
supabase link --project-ref <PROJECT_REF>
supabase functions deploy <nom-fonction>
```
Assurez-vous que vos fonctions n’exposent pas de secrets côté client et qu’elles gèrent l’authentification JWT Supabase si nécessaire.

## 11. Sécurité supplémentaire
- Si vous utilisez Auth (Supabase), tout se passe côté JS / réseau via `@supabase/supabase-js`.
- Envisagez un en-tête CSP (Content-Security-Policy) dans `.htaccess` (adapter selon scripts externes):
```
Header set Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://xxxxxxxxxxxx.supabase.co;"
```
Testez soigneusement pour éviter de bloquer des ressources légitimes.

## 12. Résolution de problèmes courants
| Problème | Cause probable | Solution |
|----------|----------------|----------|
| 404 sur routes internes | Pas de réécriture SPA | Vérifier `.htaccess` et activation de mod_rewrite |
| Variables `import.meta.env` undefined | Fichier `.env.production` absent ou pas préfixé `VITE_` | Recréer `.env.production` puis rebuild |
| Erreur OpenAI côté client | Clé exposée / CORS / key invalid | Déplacer logique dans une Supabase Function |
| Assets non mis à jour | Cache agressif | Hard refresh / ajuster headers Cache-Control |

## 13. Checklist finale
- [ ] `.env.production` créé
- [ ] `npm run build` OK
- [ ] `.htaccess` présent dans `public/`
- [ ] Upload `dist/` ou `dist.zip` réalisé
- [ ] SSL actif
- [ ] Routes SPA fonctionnelles
- [ ] Fonctions Supabase déployées si modifiées

## 14. Prochaines améliorations possibles
- Intégrer CI/CD (GitHub Actions: build + FTP deploy automatique)
- Ajouter Sentry pour erreurs runtime
- Mettre en place un script de purge cache si CDN utilisé

---
**Fin du guide**
