# 🚀 GUIDE DE DÉPLOIEMENT SUR HOSTINGER

## ❌ PROBLÈME ACTUEL
L'erreur `500 Internal Server Error` avec `SyntaxError: Unexpected token '<'` indique que :
1. Le fichier `env.ini` n'est pas configuré sur le serveur
2. La base de données n'est pas encore créée/importée
3. Les fichiers corrigés ne sont pas téléversés

---

## ✅ SOLUTION : ÉTAPES À SUIVRE

### 📋 ÉTAPE 1 : TÉLÉVERSER LES FICHIERS

1. **Ouvrez votre client FTP** (FileZilla, WinSCP, ou le gestionnaire de fichiers Hostinger)
2. **Connectez-vous à votre serveur Hostinger**
3. **Naviguez vers le dossier `public_html`**
4. **SUPPRIMEZ tout le contenu actuel** de `public_html` (sauvegardez si nécessaire)
5. **Téléversez TOUT le contenu** du dossier local :
   ```
   PROJET_A_TELEVERSER/
   ```
   vers le dossier distant :
   ```
   public_html/
   ```

**Résultat attendu dans `public_html/` :**
```
public_html/
├── index.html
├── .htaccess
├── robots.txt
├── api/
│   ├── .htaccess
│   ├── auth.php
│   ├── bootstrap.php
│   ├── cards.php
│   ├── customer.php
│   ├── diag.php
│   ├── env.ini          ⬅️ IMPORTANT
│   ├── fund.php
│   ├── install.php
│   ├── payment.php
│   ├── user.php
│   ├── wallets.php
│   ├── webhook.php
│   └── utils/
│       ├── jwt.php
│       └── strowallet.php
└── assets/
    ├── index-5uEf9psv.js
    ├── index-Bae_yUnc.css
    ├── index-Byb8OJ4D.css
    └── ...
```

---

### 🔐 ÉTAPE 2 : CONFIGURER LE FICHIER `env.ini`

1. **Connectez-vous au panneau de contrôle Hostinger**
2. **Allez dans le gestionnaire de fichiers** (File Manager)
3. **Naviguez vers** : `public_html/api/env.ini`
4. **Cliquez-droit > Modifier** (ou "Edit")
5. **Remplacez les valeurs suivantes** :

```ini
; AVANT (template) :
MYSQL_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
JWT_SECRET=CHANGEZ_CETTE_VALEUR_PAR_UNE_LONGUE_CHAINE_ALEATOIRE_64_CARACTERES_MINIMUM

; APRÈS (vos vraies valeurs) :
MYSQL_PASSWORD=VotreMotDePasseMySQLHostinger
JWT_SECRET=a8f3k2m9p1x7z4c6v9b2n5q8w1e4r7t0y3u6i9o2l5k8m1n4p7s0v3x6z9c2f5h8
```

6. **Sauvegardez le fichier**

**🔑 Pour générer un JWT_SECRET sécurisé, utilisez :**
- https://www.random.org/strings/ (1 chaîne, 64 caractères, alphanumériques)
- Ou dans PowerShell : 
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
  ```

---

### 🗄️ ÉTAPE 3 : IMPORTER LA BASE DE DONNÉES

1. **Connectez-vous à phpMyAdmin** via votre panneau Hostinger
2. **Sélectionnez votre base de données** : `u540259652_gwapcarte`
3. **Cliquez sur l'onglet "Importer"** (Import)
4. **Cliquez sur "Choisir un fichier"** (Choose file)
5. **Sélectionnez le fichier** : `mysql_schema.sql` (depuis votre PC local)
6. **Cliquez sur "Exécuter"** (Go/Execute)
7. **Vérifiez le message de succès** : "L'importation s'est terminée avec succès"

**✅ Vérification :**
- Dans phpMyAdmin, vous devriez voir **15 tables** créées :
  - `users`
  - `user_roles`
  - `wallets`
  - `wallet_transactions`
  - `kyc_documents`
  - `strowallet_customers`
  - `strowallet_cards`
  - `card_transactions`
  - `fees_settings`
  - `api_logs`
  - `strowallet_api_logs`
  - `webhook_events`
  - `api_rate_limiter`
  - `moneroo_payments`
  - `nowpayments_transactions`
  - `api_config`

---

### 🧪 ÉTAPE 4 : TESTER L'API

1. **Ouvrez votre navigateur**
2. **Allez sur** : https://gwap.pro/api/diag.php
3. **Vous devriez voir une réponse JSON** comme :
   ```json
   {
     "status": "ok",
     "database": "connected",
     "env_loaded": true
   }
   ```

**❌ Si vous voyez une erreur :**
- Vérifiez que `env.ini` est bien configuré
- Vérifiez les identifiants MySQL dans `env.ini`
- Vérifiez que la base de données existe et contient les tables

---

### 🎯 ÉTAPE 5 : TESTER L'INSCRIPTION

1. **Allez sur** : https://gwap.pro
2. **Cliquez sur "S'inscrire"** (Sign up)
3. **Remplissez le formulaire** :
   - Email : `test@example.com`
   - Mot de passe : `Test123456`
   - Prénom : `Test`
   - Nom : `User`
4. **Cliquez sur "S'inscrire"**
5. **✅ Succès** : Vous devriez être connecté automatiquement

**❌ Si l'erreur persiste :**
- Vérifiez les logs d'erreur PHP dans le panneau Hostinger
- Vérifiez le fichier `public_html/api/env.ini`
- Assurez-vous que la base de données est bien importée

---

## 🔧 DÉPANNAGE

### Erreur : "SQLSTATE[HY000] [1045] Access denied"
➡️ **Solution** : Vérifiez les identifiants MySQL dans `env.ini`

### Erreur : "SQLSTATE[42S02]: Base table or view not found"
➡️ **Solution** : Importez `mysql_schema.sql` dans phpMyAdmin

### Erreur : "500 Internal Server Error" persistante
➡️ **Solution** : Vérifiez les logs d'erreur dans le panneau Hostinger
➡️ **Chemin des logs** : `public_html/error_log` ou via le panneau de contrôle

### Erreur : "Failed to load resource: net::ERR_BLOCKED_BY_RESPONSE"
➡️ **Solution** : Vérifiez le fichier `.htaccess` dans `public_html/api/`

---

## 📞 SUPPORT

Si le problème persiste après avoir suivi toutes les étapes :
1. Vérifiez le fichier de logs d'erreur PHP
2. Testez l'API directement : https://gwap.pro/api/auth.php?action=register
3. Partagez le message d'erreur exact du serveur

---

## ✨ RAPPEL : SÉCURITÉ

Après le déploiement :
- [ ] Changez `JWT_SECRET` avec une valeur forte et unique
- [ ] Changez `MYSQL_PASSWORD` si vous utilisez encore le mot de passe par défaut
- [ ] Supprimez `api/install.php` après la première utilisation
- [ ] Activez le SSL/HTTPS (normalement déjà fait sur Hostinger)
- [ ] Configurez les sauvegardes automatiques de la base de données

---

**Date de création** : 2025-11-22  
**Version** : 1.0
