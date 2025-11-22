# 🎯 GWAP - Projet PHP Complet - Documentation Technique

## ✅ État d'implémentation

### 📱 Pages Utilisateur (User Role)
- ✅ **index.php** - Page d'accueil avec hero section et features
- ✅ **login.php** - Authentification avec JWT
- ✅ **register.php** - Inscription nouveaux utilisateurs
- ✅ **dashboard.php** - Tableau de bord utilisateur avec:
  - Affichage des portefeuilles (USD, NGN, XOF)
  - Statistiques de soldes
  - Actions rapides (cartes, rechargement, historique)
  - Transactions récentes
- ✅ **pages/cards.php** - Gestion des cartes virtuelles
- ✅ **pages/deposit.php** - Rechargement de compte
- ✅ **pages/transactions.php** - Historique complet avec filtres
- ✅ **pages/profile.php** - Profil utilisateur avec:
  - Modification informations personnelles
  - Changement de mot de passe
  - Statut KYC
  - Vérification d'identité

### 🛡️ Pages Administrateur (Admin Role)
- ✅ **admin_dashboard.php** - Tableau de bord admin avec:
  - **Statistiques globales**: Utilisateurs, Cartes, Volume, KYC
  - **Onglet Utilisateurs**: Liste complète avec recherche
  - **Onglet Cartes**: Toutes les cartes du système
  - **Onglet Transactions**: Historique global
  - **Onglet KYC**: Demandes de vérification
  - Actions: Voir détails, Bloquer utilisateur

### 🔧 Fonctionnalités Implémentées

#### Authentification & Sécurité
- ✅ JWT Token authentication
- ✅ Gestion des rôles (admin/user)
- ✅ Redirection automatique selon le rôle
- ✅ Protection des routes
- ✅ LocalStorage pour session

#### Gestion des Portefeuilles
- ✅ Multi-devises (USD, NGN, XOF)
- ✅ Affichage des soldes en temps réel
- ✅ Historique des transactions
- ✅ Filtres avancés (type, devise, date)
- ✅ Pagination des résultats

#### Gestion des Cartes
- ✅ Liste des cartes virtuelles
- ✅ Affichage du solde et statut
- ✅ Masquage sécurisé des numéros (PAN)
- ✅ Interface de création (en développement)

#### Rechargement & Paiements
- ✅ Formulaire de rechargement
- ✅ Choix de la devise
- ✅ Méthodes: Carte bancaire / Mobile Money
- ✅ Historique des rechargements
- ✅ Calcul des frais (2.5%)

#### Profil Utilisateur
- ✅ Visualisation des informations
- ✅ Modification des données personnelles
- ✅ Changement de mot de passe
- ✅ Statut KYC avec badges colorés
- ✅ Initiales en avatar

#### Administration
- ✅ Dashboard avec métriques en temps réel
- ✅ Gestion des utilisateurs
- ✅ Vue sur toutes les cartes
- ✅ Monitoring des transactions
- ✅ Gestion des demandes KYC
- ✅ Système de tabs pour navigation

### 🎨 Design & UI/UX
- ✅ Tailwind CSS via CDN (pas de build)
- ✅ Responsive design (mobile-first)
- ✅ Animations et transitions
- ✅ Icônes Font Awesome
- ✅ Notifications toast
- ✅ Loading states
- ✅ Color-coded statuses
- ✅ Gradient backgrounds
- ✅ Cards with hover effects

### 🔌 API Backend
- ✅ **auth.php** - Login/Register/Logout
- ✅ **user.php** - Profile management
- ✅ **wallets.php** - Portefeuilles & transactions
- ✅ **cards.php** - Gestion des cartes
- ✅ **admin.php** - Fonctions administratives
- ✅ **payment.php** - Rechargements
- ✅ **customer.php** - Clients Strowallet
- ✅ **fund.php** - Gestion des fonds

### 📊 Base de Données
Tables complètes:
- ✅ `users` - Utilisateurs avec KYC
- ✅ `user_roles` - Rôles (admin/user)
- ✅ `wallets` - Portefeuilles multi-devises
- ✅ `wallet_transactions` - Historique
- ✅ `strowallet_cards` - Cartes virtuelles
- ✅ `strowallet_customers` - Clients
- ✅ `kyc_documents` - Documents KYC
- ✅ `card_transactions` - Transactions cartes
- ✅ `api_config` - Configuration
- ✅ ... (16 tables au total)

## 🚀 Déploiement sur Hostinger

### Étapes d'installation

1. **Téléverser les fichiers**
   ```
   Copier PROJET_PHP_COMPLET/* → public_html/
   ```

2. **Configurer la base de données**
   ```ini
   # Éditer api/env.ini
   MYSQL_HOST=localhost
   MYSQL_DATABASE=votre_base
   MYSQL_USER=votre_user
   MYSQL_PASSWORD=votre_password
   JWT_SECRET=Yw94IGhfFeJAuU1nCbgWSLzkKB02Vtq7MvyQaRDXliZPjdN5rspEo8TH3mcxO6
   ```

3. **Importer la base**
   ```
   phpMyAdmin → Importer mysql_schema.sql
   ```

4. **Créer un admin**
   ```sql
   -- Après inscription via register.php, promouvoir en admin:
   INSERT INTO user_roles (user_id, role) VALUES (1, 'admin');
   ```

5. **Tester**
   ```
   https://gwap.pro/
   ```

## 🔐 Gestion des Rôles

### Attribution du rôle Admin
```sql
-- Vérifier l'ID de l'utilisateur
SELECT id, email FROM users WHERE email = 'admin@gwap.pro';

-- Attribuer le rôle admin
INSERT INTO user_roles (user_id, role) VALUES (ID_UTILISATEUR, 'admin');
```

### Fonctionnement
```javascript
// Le login retourne le rôle dans le token
localStorage.setItem('user', JSON.stringify({
    id: 1,
    email: 'admin@gwap.pro',
    name: 'Administrateur',
    role: 'admin' // ou 'user'
}));

// Redirection automatique
if (user.role === 'admin') {
    window.location.href = 'admin_dashboard.php';
} else {
    window.location.href = 'dashboard.php';
}
```

## 📱 Interface Utilisateur

### Dashboard User
- **Portefeuilles**: 3 cartes colorées (USD vert, NGN bleu, XOF violet)
- **Actions rapides**: Mes Cartes, Recharger, Historique
- **Transactions récentes**: Table avec 5 dernières transactions

### Dashboard Admin
- **Stats**: 4 métriques (Utilisateurs, Cartes, Volume, KYC)
- **Tabs**: Utilisateurs / Cartes / Transactions / KYC
- **Actions**: Voir détail / Bloquer

### Pages Fonctionnelles
- **Cards**: Grid de cartes avec statut et solde
- **Deposit**: Formulaire de rechargement avec infos
- **Transactions**: Table filtrable avec pagination
- **Profile**: Édition infos + changement MDP + KYC

## 🛠️ Technologies

### Frontend
- HTML5 / CSS3
- **Tailwind CSS** (via CDN - pas de build)
- **Font Awesome** (icônes)
- **Vanilla JavaScript** (pas de framework)
- jQuery (pour les requêtes)

### Backend
- **PHP 7.4+** (pur, sans framework)
- **MySQL** (avec prepared statements)
- **JWT** (authentification)
- **bcrypt** (hashage passwords)

### Avantages
- ✅ Pas de compilation nécessaire
- ✅ Édition directe des fichiers
- ✅ Compatible hébergement mutualisé
- ✅ Déploiement simple via FTP
- ✅ Pas de node_modules

## 📂 Structure des Fichiers

```
PROJET_PHP_COMPLET/
├── index.php                  # Accueil
├── login.php                  # Connexion
├── register.php               # Inscription
├── dashboard.php              # Dashboard user
├── admin_dashboard.php        # Dashboard admin
├── .htaccess                  # Config Apache
├── includes/
│   ├── header.php            # Header avec Tailwind
│   └── footer.php            # Footer avec JS
├── pages/
│   ├── cards.php             # Gestion cartes
│   ├── deposit.php           # Rechargement
│   ├── transactions.php      # Historique
│   └── profile.php           # Profil user
├── api/
│   ├── bootstrap.php         # Init + DB
│   ├── auth.php              # Authentification
│   ├── user.php              # Gestion utilisateur
│   ├── admin.php             # Fonctions admin
│   ├── wallets.php           # Portefeuilles
│   ├── cards.php             # Cartes
│   ├── payment.php           # Paiements
│   ├── customer.php          # Clients
│   └── env.ini              # Config (À ÉDITER!)
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── mysql_schema.sql          # Base de données
```

## 🔄 Flux d'authentification

```
1. Utilisateur → register.php
   ↓
2. API → /api/auth.php?action=register
   ↓
3. Insertion dans `users` table
   ↓
4. Redirection → login.php
   ↓
5. API → /api/auth.php?action=login
   ↓
6. Génération JWT + vérification rôle
   ↓
7. Redirection selon rôle:
   - admin → admin_dashboard.php
   - user → dashboard.php
```

## 📊 API Endpoints

### Auth
- `POST /api/auth.php?action=register` - Inscription
- `POST /api/auth.php?action=login` - Connexion
- `POST /api/auth.php?action=logout` - Déconnexion

### User
- `GET /api/user.php?action=profile` - Récupérer profil
- `POST /api/user.php?action=update` - Modifier profil
- `POST /api/user.php?action=change_password` - Changer MDP

### Wallets
- `GET /api/wallets.php?action=list` - Liste portefeuilles
- `GET /api/wallets.php?action=transactions` - Historique

### Cards
- `GET /api/cards.php?action=list` - Liste cartes
- `POST /api/cards.php?action=create` - Créer carte

### Admin
- `GET /api/admin.php?action=stats` - Statistiques
- `GET /api/admin.php?action=users` - Liste utilisateurs

### Payment
- `POST /api/payment.php?action=deposit` - Rechargement
- `GET /api/payment.php?action=history` - Historique

## 🎨 Codes Couleurs

### Statuts KYC
- 🟢 **verified** - bg-green-100 text-green-800
- 🟡 **pending** - bg-yellow-100 text-yellow-800
- ⚪ **not_verified** - bg-gray-100 text-gray-800
- 🔴 **rejected** - bg-red-100 text-red-800

### Types Transactions
- 🟢 **credit/deposit** - bg-green-100 text-green-800
- 🔴 **debit** - bg-red-100 text-red-800
- 🔵 **conversion** - bg-blue-100 text-blue-800
- 🟣 **card_purchase** - bg-purple-100 text-purple-800

### Devises
- 💚 **USD** - from-green-500 to-green-600
- 💙 **NGN** - from-blue-500 to-blue-600
- 💜 **XOF** - from-purple-500 to-purple-600

## 📝 TODO / Améliorations Futures

### Fonctionnalités
- [ ] Création de cartes via API Strowallet
- [ ] Upload documents KYC
- [ ] Validation KYC par admin
- [ ] Conversion de devises
- [ ] Notifications en temps réel
- [ ] Export transactions (CSV/PDF)
- [ ] Système de tickets support
- [ ] Programme de parrainage
- [ ] 2FA (authentification à deux facteurs)

### Optimisations
- [ ] Cache Redis pour sessions
- [ ] Pagination côté serveur
- [ ] Rate limiting API
- [ ] CDN pour assets statiques
- [ ] Compression images
- [ ] Minification CSS/JS

### Sécurité
- [ ] HTTPS obligatoire
- [ ] CSP (Content Security Policy)
- [ ] Audit logs admin
- [ ] Détection fraude
- [ ] Blocage tentatives brute-force

## 🐛 Debugging

### Erreurs communes

1. **500 Internal Server Error**
   - Vérifier `api/env.ini` existe
   - Vérifier permissions fichiers
   - Checker logs PHP

2. **JWT Invalid Token**
   - Vérifier JWT_SECRET dans env.ini
   - Clear localStorage
   - Re-login

3. **Database Connection Failed**
   - Vérifier credentials MySQL
   - Tester connexion phpMyAdmin
   - Vérifier host (localhost vs 127.0.0.1)

4. **CORS Errors**
   - Vérifier headers dans bootstrap.php
   - Autoriser origin dans .htaccess

### Logs
```php
// Activer logs dans bootstrap.php
ini_set('display_errors', '1');
error_log("Debug: " . print_r($data, true));
```

## 📞 Support

Pour toute question:
- 📧 Email: support@gwap.pro
- 📱 Téléphone: +221 XX XXX XX XX
- 🌐 Site: https://gwap.pro

---

**Version**: 1.0.0 PHP Complete  
**Date**: 22 Novembre 2024  
**Auteur**: GWAP Development Team  
**License**: Propriétaire
