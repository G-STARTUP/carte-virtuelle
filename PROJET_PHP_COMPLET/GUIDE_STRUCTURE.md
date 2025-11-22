# 📚 GWAP - Guide Complet de la Structure du Projet

## 🏗️ Vue d'ensemble de l'architecture

```
PROJET_PHP_COMPLET/
│
├── 🏠 PAGES PUBLIQUES (Accès sans authentification)
│   ├── index.php           # Page d'accueil avec présentation
│   ├── login.php           # Formulaire de connexion
│   └── register.php        # Formulaire d'inscription
│
├── 🔐 PAGES UTILISATEUR (Nécessite authentification role='user')
│   ├── dashboard.php       # Tableau de bord principal utilisateur
│   └── pages/
│       ├── cards.php       # Gestion des cartes virtuelles
│       ├── deposit.php     # Rechargement du compte
│       ├── transactions.php # Historique des transactions
│       └── profile.php     # Profil et paramètres
│
├── 🛡️ PAGES ADMIN (Nécessite authentification role='admin')
│   └── admin_dashboard.php # Tableau de bord administrateur
│
├── ⚙️ BACKEND API (Traitement des requêtes)
│   ├── api/
│   │   ├── bootstrap.php   # Initialisation, DB, erreurs
│   │   ├── env.ini         # Configuration (À ÉDITER!)
│   │   │
│   │   ├── 👤 AUTH & USERS
│   │   ├── auth.php        # Login, Register, Logout
│   │   ├── user.php        # Profil, Update, Change Password
│   │   │
│   │   ├── 💰 FINANCES
│   │   ├── wallets.php     # Portefeuilles, Transactions
│   │   ├── payment.php     # Rechargements, Paiements
│   │   ├── fund.php        # Gestion des fonds
│   │   │
│   │   ├── 💳 CARTES
│   │   ├── cards.php       # CRUD cartes virtuelles
│   │   ├── customer.php    # Clients Strowallet
│   │   │
│   │   ├── 🔧 ADMIN & TOOLS
│   │   ├── admin.php       # Fonctions administratives
│   │   ├── diag.php        # Diagnostic système
│   │   ├── install.php     # Installation initiale
│   │   ├── webhook.php     # Webhooks externes
│   │   │
│   │   └── utils/
│   │       ├── jwt.php     # Gestion tokens JWT
│   │       └── strowallet.php # Intégration API Strowallet
│   │
├── 🎨 TEMPLATES & ASSETS
│   ├── includes/
│   │   ├── header.php      # En-tête HTML + Tailwind CSS
│   │   └── footer.php      # Pied de page + JavaScript
│   │
│   └── assets/             # (À créer si nécessaire)
│       ├── css/            # Styles personnalisés
│       ├── js/             # Scripts JavaScript
│       └── images/         # Images et logos
│
├── 📊 BASE DE DONNÉES
│   └── mysql_schema.sql    # Schéma complet (16 tables)
│
└── 📖 DOCUMENTATION
    ├── README.md           # Installation et démarrage
    ├── IMPLEMENTATION.md   # Documentation technique complète
    └── GUIDE_STRUCTURE.md  # Ce fichier
```

---

## 🔄 Flux d'Utilisation

### 1️⃣ Visiteur → Utilisateur

```
Visiteur
   ↓
📄 index.php (Page d'accueil)
   ↓
📝 register.php → API: auth.php?action=register
   ↓
📧 Compte créé dans table 'users'
   ↓
🔐 login.php → API: auth.php?action=login
   ↓
🎫 JWT Token généré + Rôle vérifié
   ↓
   ├─→ role='user' → 📊 dashboard.php
   └─→ role='admin' → 🛡️ admin_dashboard.php
```

### 2️⃣ Navigation Utilisateur

```
📊 dashboard.php (Vue d'ensemble)
   │
   ├─→ 💳 pages/cards.php
   │      ├─ Voir mes cartes
   │      └─ Créer nouvelle carte → API: cards.php
   │
   ├─→ 💵 pages/deposit.php
   │      ├─ Choisir montant et devise
   │      └─ Payer → API: payment.php?action=deposit
   │
   ├─→ 📜 pages/transactions.php
   │      ├─ Filtrer par type/devise/date
   │      └─ Voir détails → API: wallets.php?action=transactions
   │
   └─→ 👤 pages/profile.php
          ├─ Modifier infos → API: user.php?action=update
          ├─ Changer MDP → API: user.php?action=change_password
          └─ Upload KYC → (En développement)
```

### 3️⃣ Navigation Admin

```
🛡️ admin_dashboard.php
   │
   ├─→ TAB: 👥 Utilisateurs
   │      ├─ Liste tous les users
   │      ├─ Rechercher
   │      ├─ Voir détail utilisateur
   │      └─ Bloquer/Débloquer → API: admin.php?action=block_user
   │
   ├─→ TAB: 💳 Cartes
   │      ├─ Toutes les cartes du système
   │      └─ Statistiques par statut
   │
   ├─→ TAB: 💸 Transactions
   │      ├─ Historique global
   │      └─ Export (À implémenter)
   │
   └─→ TAB: 🆔 KYC
          ├─ Demandes en attente
          ├─ Valider/Rejeter
          └─ Voir documents → API: admin.php?action=kyc
```

---

## 📋 Description Détaillée des Fichiers

### 🏠 Pages Publiques

#### `index.php`
- **Rôle** : Page d'accueil marketing
- **Contenu** :
  - Hero section avec call-to-action
  - Section features (sécurité, multi-devises, instantané)
  - Liens vers login/register
- **Accès** : Public

#### `login.php`
- **Rôle** : Authentification
- **Fonctionnalités** :
  - Formulaire email + password
  - Appel API `auth.php?action=login`
  - Stockage JWT + user data dans localStorage
  - Redirection automatique selon rôle
- **Accès** : Public

#### `register.php`
- **Rôle** : Création de compte
- **Fonctionnalités** :
  - Formulaire : nom, email, téléphone, password
  - Validation (min 8 caractères)
  - Appel API `auth.php?action=register`
  - Redirection vers login après succès
- **Accès** : Public

---

### 🔐 Pages Utilisateur

#### `dashboard.php`
- **Rôle** : Hub central utilisateur
- **Composants** :
  - **Navigation bar** : Logo, nom user, déconnexion
  - **Grille portefeuilles** : 3 cartes (USD, NGN, XOF) avec soldes
  - **Actions rapides** : 3 boutons (Mes Cartes, Recharger, Historique)
  - **Transactions récentes** : Table des 5 dernières transactions
- **API Utilisées** :
  - `wallets.php?action=list` (portefeuilles)
  - `wallets.php?action=transactions&limit=5` (historique)
- **Sécurité** :
  - Vérification token localStorage
  - Redirection admin → admin_dashboard.php
- **Accès** : Authentifié (user)

#### `pages/cards.php`
- **Rôle** : Gestion cartes virtuelles
- **Composants** :
  - Bouton "Nouvelle Carte"
  - Grille de cartes (style carte bancaire)
  - Affichage : 4 derniers chiffres, solde, devise, statut
- **API Utilisées** :
  - `cards.php?action=list` (liste cartes)
  - `cards.php?action=create` (création - modal)
- **Accès** : Authentifié (user)

#### `pages/deposit.php`
- **Rôle** : Rechargement compte
- **Composants** :
  - **Formulaire** :
    - Montant (min 10)
    - Devise (USD/NGN/XOF)
    - Méthode (Carte bancaire/Mobile Money)
  - **Infos** : Frais 2.5%, instantané, sécurisé
  - **Historique** : 5 derniers rechargements
- **API Utilisées** :
  - `payment.php?action=deposit` (initier paiement)
  - `payment.php?action=history` (historique)
- **Flux** :
  1. User remplit formulaire
  2. API crée transaction
  3. Redirection vers gateway (Stripe/PayPal/Wave)
  4. Webhook confirme paiement
  5. Solde mis à jour
- **Accès** : Authentifié (user)

#### `pages/transactions.php`
- **Rôle** : Historique complet
- **Composants** :
  - **Filtres** :
    - Type (crédit, débit, conversion, etc.)
    - Devise (USD, NGN, XOF)
    - Dates (début, fin)
  - **Table** :
    - Date/heure
    - Type avec badge coloré
    - Description
    - Montant (vert/rouge selon signe)
    - Référence
  - **Pagination** : Boutons numérotés
- **API Utilisées** :
  - `wallets.php?action=transactions&page=1&limit=20&type=...&currency=...&from=...&to=...`
- **Accès** : Authentifié (user)

#### `pages/profile.php`
- **Rôle** : Gestion profil
- **Composants** :
  - **Sidebar** :
    - Avatar avec initiales
    - Nom, email
    - Statut KYC (badge coloré)
    - Date d'inscription
  - **Infos personnelles** (éditable) :
    - Prénom, nom, téléphone, adresse
    - Bouton "Modifier" → active champs
  - **Changer mot de passe** :
    - MDP actuel, nouveau, confirmation
  - **KYC** : Bouton "Commencer vérification"
- **API Utilisées** :
  - `user.php?action=profile` (GET)
  - `user.php?action=update` (POST)
  - `user.php?action=change_password` (POST)
- **Accès** : Authentifié (user)

---

### 🛡️ Pages Admin

#### `admin_dashboard.php`
- **Rôle** : Centre de contrôle admin
- **Composants** :
  - **Métriques** (4 cards) :
    - 👥 Total utilisateurs
    - 💳 Cartes actives
    - 💰 Volume total ($)
    - 🕐 KYC en attente
  - **Tabs** :
    - **Utilisateurs** :
      - Table : ID, Nom, Email, KYC, Date, Actions
      - Recherche
      - Actions : Voir détail 👁️, Bloquer 🚫
    - **Cartes** :
      - Liste toutes les cartes
      - Filtres par statut
    - **Transactions** :
      - Historique global système
    - **KYC** :
      - Demandes en attente
      - Valider ✅ / Rejeter ❌
- **API Utilisées** :
  - `admin.php?action=stats` (métriques)
  - `admin.php?action=users` (liste users)
  - `admin.php?action=cards` (toutes cartes)
  - `admin.php?action=transactions` (global)
  - `admin.php?action=kyc` (demandes)
- **Sécurité** :
  - Vérification `user.role === 'admin'`
  - Redirection user → dashboard.php
- **Accès** : Authentifié (admin)

---

## 🔧 Backend API

### 📁 api/bootstrap.php
**Rôle** : Fichier d'initialisation chargé par TOUS les endpoints API

**Fonctions** :
1. **Configuration PHP** :
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', '0'); // Masquer erreurs HTML
   ```

2. **Headers CORS** :
   ```php
   header('Access-Control-Allow-Origin: *');
   header('Content-Type: application/json; charset=UTF-8');
   ```

3. **Handlers d'erreurs** :
   - `set_error_handler()` → Capture erreurs PHP → JSON
   - `set_exception_handler()` → Capture exceptions → JSON
   - `register_shutdown_function()` → Capture erreurs fatales → JSON

4. **Connexion DB** :
   ```php
   function db() {
       static $pdo = null;
       if (!$pdo) {
           $config = parse_ini_file(__DIR__ . '/env.ini');
           $pdo = new PDO("mysql:host={$config['MYSQL_HOST']};dbname={$config['MYSQL_DATABASE']}", ...);
       }
       return $pdo;
   }
   ```

5. **Fonctions utilitaires** :
   - `jsonResponse($data, $code)` : Envoyer réponse JSON
   - `getAuthUser()` : Décoder JWT et retourner user
   - `checkRole($role)` : Vérifier rôle admin/user

---

### 📁 api/auth.php
**Endpoints** :

| Action | Méthode | Description |
|--------|---------|-------------|
| `?action=register` | POST | Créer compte |
| `?action=login` | POST | Authentifier |
| `?action=logout` | POST | Déconnexion |

**Exemple Register** :
```php
// Input: {"name": "John Doe", "email": "john@example.com", "phone": "+221...", "password": "********"}
// 1. Valider données
// 2. Vérifier email unique
// 3. Hash password: password_hash($password, PASSWORD_BCRYPT)
// 4. INSERT INTO users
// 5. Créer portefeuilles (USD, NGN, XOF)
// Output: {"success": true, "message": "Compte créé"}
```

**Exemple Login** :
```php
// Input: {"email": "john@example.com", "password": "********"}
// 1. SELECT user WHERE email
// 2. Vérifier: password_verify($password, $user['password_hash'])
// 3. Récupérer rôle: SELECT role FROM user_roles WHERE user_id
// 4. Générer JWT avec payload: {id, email, name, role}
// Output: {"success": true, "data": {"token": "eyJ...", "user": {...}}}
```

---

### 📁 api/user.php
**Endpoints** :

| Action | Méthode | Auth | Description |
|--------|---------|------|-------------|
| `?action=profile` | GET | ✅ | Récupérer profil |
| `?action=update` | POST | ✅ | Modifier infos |
| `?action=change_password` | POST | ✅ | Changer MDP |

**Sécurité** : Vérifie JWT dans header `Authorization: Bearer TOKEN`

---

### 📁 api/wallets.php
**Endpoints** :

| Action | Méthode | Auth | Description |
|--------|---------|------|-------------|
| `?action=list` | GET | ✅ | Liste portefeuilles user |
| `?action=balance&currency=USD` | GET | ✅ | Solde spécifique |
| `?action=transactions` | GET | ✅ | Historique transactions |

**Exemple Transactions** :
```php
// Query params: ?action=transactions&page=1&limit=20&type=credit&currency=USD&from=2024-01-01&to=2024-12-31
// SQL:
SELECT wt.*, w.currency 
FROM wallet_transactions wt
JOIN wallets w ON wt.wallet_id = w.id
WHERE w.user_id = ? 
  AND (? IS NULL OR wt.type = ?)
  AND (? IS NULL OR w.currency = ?)
  AND (? IS NULL OR wt.created_at >= ?)
  AND (? IS NULL OR wt.created_at <= ?)
ORDER BY wt.created_at DESC
LIMIT ? OFFSET ?
```

---

### 📁 api/cards.php
**Endpoints** :

| Action | Méthode | Auth | Description |
|--------|---------|------|-------------|
| `?action=list` | GET | ✅ | Cartes du user |
| `?action=create` | POST | ✅ | Créer carte via Strowallet |
| `?action=fund` | POST | ✅ | Recharger carte |
| `?action=freeze` | POST | ✅ | Geler/Dégeler |

**Flux Création** :
```
1. User → API cards.php?action=create
2. Vérifier customer Strowallet existe (sinon créer)
3. Appel Strowallet API: POST /cards
4. INSERT INTO strowallet_cards
5. Débiter wallet_id pour frais création
6. INSERT INTO wallet_transactions
```

---

### 📁 api/payment.php
**Endpoints** :

| Action | Méthode | Auth | Description |
|--------|---------|------|-------------|
| `?action=deposit` | POST | ✅ | Initier rechargement |
| `?action=history` | GET | ✅ | Historique paiements |
| `?action=webhook` | POST | 🔓 | Callback provider |

**Flux Deposit** :
```
1. User envoie: {amount: 100, currency: "USD", payment_method: "card"}
2. Créer transaction en DB (status: "pending")
3. Appel API gateway (Stripe/PayPal/Wave)
4. Retourner: {payment_url: "https://..."}
5. User redirigé vers gateway
6. Paiement effectué
7. Webhook appelé → payment.php?action=webhook
8. Vérifier signature
9. UPDATE transaction status = "completed"
10. Créditer wallet: UPDATE wallets SET balance = balance + amount
11. INSERT wallet_transactions
```

---

### 📁 api/admin.php
**Endpoints** (Tous nécessitent role='admin') :

| Action | Méthode | Description |
|--------|---------|-------------|
| `?action=stats` | GET | Métriques globales |
| `?action=users` | GET | Liste utilisateurs |
| `?action=cards` | GET | Toutes les cartes |
| `?action=transactions` | GET | Historique global |
| `?action=kyc` | GET | Demandes KYC |
| `?action=approve_kyc` | POST | Valider KYC |
| `?action=reject_kyc` | POST | Rejeter KYC |
| `?action=block_user` | POST | Bloquer user |

**Exemple Stats** :
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM strowallet_cards WHERE status='active') as total_cards,
  (SELECT SUM(balance) FROM wallets WHERE currency='USD') as total_volume,
  (SELECT COUNT(*) FROM users WHERE kyc_status='pending') as pending_kyc
```

---

## 🗄️ Base de Données

### Tables Principales

#### `users`
```sql
- id (PK)
- email (UNIQUE)
- password_hash (bcrypt)
- first_name, last_name, phone, address
- kyc_status (not_verified, pending, verified, rejected)
- created_at, updated_at
```

#### `user_roles`
```sql
- id (PK)
- user_id (FK → users)
- role (admin, user)
- UNIQUE(user_id, role)
```

#### `wallets`
```sql
- id (PK)
- user_id (FK → users)
- currency (USD, NGN, XOF)
- balance (DECIMAL 15,2)
- UNIQUE(user_id, currency)
- CHECK(balance >= 0)
```

#### `wallet_transactions`
```sql
- id (PK)
- wallet_id (FK → wallets)
- amount (DECIMAL 15,2)
- type (credit, debit, conversion, card_purchase, card_reload, deposit)
- description, reference
- created_at
```

#### `strowallet_cards`
```sql
- id (PK)
- card_id (UNIQUE - ID Strowallet)
- user_id (FK → users)
- customer_id (Strowallet customer)
- name_on_card
- card_type (visa, mastercard)
- balance, currency
- status (active, frozen, inactive, blocked)
- card_pan_masked (ex: "4111...1111" - PAS le numéro complet!)
- expiration_date
```

**16 tables au total** - Voir `mysql_schema.sql` pour le schéma complet.

---

## 🎨 Templates & Includes

### `includes/header.php`
```php
<?php $pageTitle = $pageTitle ?? 'GWAP'; ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?></title>
    
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Custom Styles -->
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-hover { transition: all 0.3s; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
    </style>
</head>
<body class="bg-gray-50">
```

### `includes/footer.php`
```php
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <script>
        // API Request Helper
        async function apiRequest(url, options = {}) {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            };
            
            const response = await fetch(url, { ...options, headers });
            return await response.json();
        }
        
        // Notification Toast
        function showNotification(message, type = 'info') {
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500',
                warning: 'bg-yellow-500'
            };
            
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.remove(), 3000);
        }
    </script>
</body>
</html>
```

---

## 🚀 Guide de Déploiement

### Étape 1 : Préparation
```bash
# 1. Télécharger le dossier PROJET_PHP_COMPLET
# 2. Compresser en ZIP si nécessaire
```

### Étape 2 : Upload Hostinger
```
1. Connexion Hostinger → File Manager
2. Naviguer vers public_html/
3. Uploader tous les fichiers de PROJET_PHP_COMPLET/
4. Extraire si ZIP
```

### Étape 3 : Configuration Base de Données
```
1. cPanel → MySQL Databases
2. Créer base : gwap_db
3. Créer user : gwap_user
4. Attribuer tous privilèges
5. Noter : host, database, user, password
```

### Étape 4 : Import Schéma
```
1. phpMyAdmin → Sélectionner gwap_db
2. Import → Choisir mysql_schema.sql
3. Exécuter
4. Vérifier : 16 tables créées
```

### Étape 5 : Configuration env.ini
```ini
# Éditer public_html/api/env.ini

[database]
MYSQL_HOST=localhost
MYSQL_DATABASE=gwap_db
MYSQL_USER=gwap_user
MYSQL_PASSWORD=VotreMdpSecurise123!

[security]
JWT_SECRET=Yw94IGhfFeJAuU1nCbgWSLzkKB02Vtq7MvyQaRDXliZPjdN5rspEo8TH3mcxO6

[api]
STROWALLET_API_KEY=votre_cle_api
STROWALLET_SECRET_KEY=votre_secret
```

### Étape 6 : Permissions Fichiers
```bash
# Via File Manager ou SSH
chmod 600 api/env.ini      # Lecture seule PHP
chmod 755 api/             # Exécution scripts
```

### Étape 7 : Création Compte Admin
```
1. Aller sur https://gwap.pro/register.php
2. Créer compte : admin@gwap.pro
3. Se connecter à phpMyAdmin
4. Exécuter :
   SELECT id FROM users WHERE email = 'admin@gwap.pro';
   -- Noter l'ID (ex: 1)
   
   INSERT INTO user_roles (user_id, role) VALUES (1, 'admin');
5. Re-login sur le site
6. Redirection automatique vers admin_dashboard.php
```

### Étape 8 : Tests
```
✅ https://gwap.pro/ → Page d'accueil
✅ https://gwap.pro/register.php → Créer compte
✅ https://gwap.pro/login.php → Connexion
✅ https://gwap.pro/dashboard.php → Dashboard user
✅ https://gwap.pro/admin_dashboard.php → Dashboard admin
✅ https://gwap.pro/api/diag.php → Diagnostic système
```

---

## 🔐 Sécurité

### Checklist Production
- [ ] HTTPS activé (certificat SSL)
- [ ] `display_errors = 0` dans php.ini
- [ ] JWT_SECRET changé (64+ caractères aléatoires)
- [ ] Permissions fichiers correctes
- [ ] env.ini non accessible publiquement
- [ ] Rate limiting sur API login
- [ ] Backup automatique DB
- [ ] Monitoring erreurs (logs)
- [ ] CORS configuré (seulement votre domaine)

---

## 🐛 Dépannage

### Erreur 500
```bash
# Vérifier logs PHP
tail -f /var/log/apache2/error.log

# Vérifier api/env.ini existe et est lisible
ls -la api/env.ini

# Tester connexion DB
php -r "
\$config = parse_ini_file('api/env.ini');
\$pdo = new PDO('mysql:host='.\$config['MYSQL_HOST'].';dbname='.\$config['MYSQL_DATABASE'], \$config['MYSQL_USER'], \$config['MYSQL_PASSWORD']);
echo 'OK';
"
```

### JWT Invalid
```javascript
// Clear localStorage et re-login
localStorage.clear();
window.location.href = '/login.php';
```

### Cartes ne s'affichent pas
```sql
-- Vérifier données
SELECT * FROM strowallet_cards WHERE user_id = 1;

-- Vérifier API
curl -H "Authorization: Bearer YOUR_TOKEN" https://gwap.pro/api/cards.php?action=list
```

---

## 📞 Support

Pour toute question sur la structure :
- 📧 Email : support@gwap.pro
- 📖 Documentation complète : `IMPLEMENTATION.md`
- 🐛 Issues : GitHub (si configuré)

---

**Version** : 1.0.0  
**Dernière mise à jour** : 22 Novembre 2024  
**Auteur** : GWAP Development Team
