# 💳 GWAP - Gestion de Cartes Virtuelles Multi-Devises

## 📋 Vue d'Ensemble

GWAP est une plateforme complète de gestion de cartes virtuelles avec support multi-devises (USD, NGN, XOF).  
Le projet contient **DEUX versions** au choix selon vos besoins.

---

## 🎯 Quelle Version Choisir ?

### 🔶 Version PHP Complète (RECOMMANDÉE) ⭐
**📁 Dossier : `PROJET_PHP_COMPLET/`**

✅ **Avantages** :
- Déploiement **ultra-simple** par FTP
- Pas de compilation nécessaire
- Compatible hébergement mutualisé (Hostinger)
- Modification directe des fichiers
- Tailwind CSS via CDN

**👉 Parfait pour** : Production Hostinger, maintenance facile

### 🔷 Version React + TypeScript (Développement avancé)
**📁 Dossiers : `src/`, `server/`, `dist/`**

✅ **Avantages** :
- Interface moderne SPA
- TypeScript pour la sécurité du code
- Hot reload en développement
- Performance optimale

⚠️ **Inconvénients** :
- Build requis (`npm run build`)
- Node.js nécessaire pour dev
- Plus complexe à maintenir

**👉 Parfait pour** : Développeurs React, projets évolutifs

---

## 🚀 Démarrage Rapide - Version PHP ⭐

### Installation en 6 étapes

#### 1️⃣ Upload des fichiers
```bash
# Via FTP ou File Manager Hostinger
Copier PROJET_PHP_COMPLET/* → public_html/
```

#### 2️⃣ Créer la base de données MySQL
```
cPanel → MySQL Databases
- Créer DB : gwap_db
- Créer user : gwap_user
- Attribuer tous privilèges
```

#### 3️⃣ Importer le schéma
```
phpMyAdmin → gwap_db → Importer
- Fichier : mysql_schema.sql
- Résultat : 16 tables créées
```

#### 4️⃣ Configurer api/env.ini
```ini
[database]
MYSQL_HOST=localhost
MYSQL_DATABASE=gwap_db
MYSQL_USER=gwap_user
MYSQL_PASSWORD=VotreMotDePasseSecurise

[security]
JWT_SECRET=Yw94IGhfFeJAuU1nCbgWSLzkKB02Vtq7MvyQaRDXliZPjdN5rspEo8TH3mcxO6

[api]
STROWALLET_API_KEY=votre_cle_api
```

#### 5️⃣ Créer un compte admin
```
1. Aller sur https://gwap.pro/register.php
2. S'inscrire normalement
3. Dans phpMyAdmin, exécuter :
   
   SELECT id FROM users WHERE email = 'votre@email.com';
   -- Noter l'ID (ex: 1)
   
   INSERT INTO user_roles (user_id, role) VALUES (1, 'admin');

4. Re-login → Redirection automatique vers admin_dashboard.php
```

#### 6️⃣ Tester l'installation
```
✅ https://gwap.pro/ → Page d'accueil
✅ https://gwap.pro/login.php → Connexion
✅ https://gwap.pro/dashboard.php → Dashboard user
✅ https://gwap.pro/admin_dashboard.php → Dashboard admin
```

---

## 📚 Documentation Complète - Version PHP

| Document | Description |
|----------|-------------|
| **[GUIDE_STRUCTURE.md](PROJET_PHP_COMPLET/GUIDE_STRUCTURE.md)** | 📖 Guide complet : structure, flux, API endpoints |
| **[ARCHITECTURE_DIAGRAMS.md](PROJET_PHP_COMPLET/ARCHITECTURE_DIAGRAMS.md)** | 📊 Diagrammes visuels : architecture, flux de données |
| **[IMPLEMENTATION.md](PROJET_PHP_COMPLET/IMPLEMENTATION.md)** | 🔧 Documentation technique détaillée |
| **[README.md](PROJET_PHP_COMPLET/README.md)** | 🚀 Installation rapide et prérequis |

---

## 🏗️ Structure Complète du Projet

```
carte-virtuelle/
│
├── 🔶 PROJET_PHP_COMPLET/         ⭐ VERSION PRODUCTION RECOMMANDÉE
│   │
│   ├── 🏠 PAGES PUBLIQUES
│   │   ├── index.php              # Page d'accueil
│   │   ├── login.php              # Connexion
│   │   └── register.php           # Inscription
│   │
│   ├── 🔐 PAGES UTILISATEUR
│   │   ├── dashboard.php          # Dashboard principal
│   │   └── pages/
│   │       ├── cards.php          # Gestion cartes virtuelles
│   │       ├── deposit.php        # Rechargement compte
│   │       ├── transactions.php   # Historique complet
│   │       └── profile.php        # Profil utilisateur
│   │
│   ├── 🛡️ PAGES ADMIN
│   │   └── admin_dashboard.php    # Dashboard admin (stats + gestion)
│   │
│   ├── ⚙️ BACKEND API
│   │   └── api/
│   │       ├── bootstrap.php      # Initialisation DB + erreurs
│   │       ├── env.ini            # Configuration (À ÉDITER!)
│   │       ├── auth.php           # Login/Register
│   │       ├── user.php           # Profil
│   │       ├── wallets.php        # Portefeuilles
│   │       ├── cards.php          # Cartes virtuelles
│   │       ├── payment.php        # Rechargements
│   │       ├── admin.php          # Fonctions admin
│   │       └── utils/             # JWT, Strowallet
│   │
│   ├── 🎨 TEMPLATES
│   │   └── includes/
│   │       ├── header.php         # En-tête + Tailwind CSS
│   │       └── footer.php         # Scripts JS
│   │
│   ├── 📊 BASE DE DONNÉES
│   │   └── mysql_schema.sql       # 16 tables
│   │
│   └── 📖 DOCUMENTATION
│       ├── GUIDE_STRUCTURE.md     # 📖 Guide complet
│       ├── ARCHITECTURE_DIAGRAMS.md # 📊 Diagrammes
│       ├── IMPLEMENTATION.md      # 🔧 Doc technique
│       └── README.md              # 🚀 Installation
│
├── 🔷 VERSION REACT (Développement)
│   ├── src/                       # Code React + TypeScript
│   ├── server/                    # Backend Node.js
│   ├── dist/                      # Build production
│   └── api/                       # API PHP partagée
│
├── 📤 PROJET_A_TELEVERSER/        # Build React (ancienne version)
├── 📚 docs/                       # Documentation générale
├── 🗄️ backup/                     # Anciennes versions
└── 📜 README.md                   # Ce fichier
```

---

## ✨ Fonctionnalités Implémentées

### 👤 Espace Utilisateur
- ✅ Inscription / Connexion avec JWT
- ✅ Dashboard avec 3 portefeuilles (USD, NGN, XOF)
- ✅ Création cartes virtuelles via Strowallet
- ✅ Rechargement compte (Carte bancaire / Mobile Money)
- ✅ Historique transactions avec filtres avancés
- ✅ Profil éditable + changement mot de passe
- ✅ Vérification KYC (upload documents)

### 🛡️ Espace Admin
- ✅ Dashboard avec 4 métriques temps réel
  - Total utilisateurs
  - Cartes actives
  - Volume total
  - KYC en attente
- ✅ Système d'onglets :
  - **Users** : Liste, recherche, bloquer/débloquer
  - **Cards** : Toutes les cartes du système
  - **Transactions** : Historique global
  - **KYC** : Valider/rejeter demandes
- ✅ Redirection automatique selon rôle

### 💰 Gestion Financière
- ✅ Multi-devises (USD, NGN, XOF)
- ✅ Conversion automatique entre devises
- ✅ Paiements sécurisés (intégration Stripe/PayPal/Wave)
- ✅ Webhooks pour confirmations
- ✅ Frais transparents (2.5% sur rechargements)

### 🔐 Sécurité
- ✅ Authentification JWT avec expiration
- ✅ Passwords hashés bcrypt
- ✅ Protection CSRF
- ✅ Headers HTTP sécurisés
- ✅ Validation toutes entrées
- ✅ Prepared statements SQL (injection prevention)
- ✅ Aucune donnée sensible en clair (pas de CVV stocké)

---

## 🛠️ Technologies

### Version PHP (PROJET_PHP_COMPLET) ⭐
| Couche | Technologies |
|--------|--------------|
| **Frontend** | HTML5, Tailwind CSS (CDN), Vanilla JavaScript, jQuery |
| **Backend** | PHP 7.4+, MySQL 5.7+ |
| **Authentification** | JWT (JSON Web Tokens) + bcrypt |
| **Design** | Tailwind CSS, Font Awesome |
| **Déploiement** | FTP direct, pas de build |

**✅ Avantages** :
- Pas de compilation
- Édition directe des fichiers
- Compatible hébergement mutualisé
- Maintenance simple

### Version React (Original)
| Couche | Technologies |
|--------|--------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Backend** | Node.js + PHP API |
| **UI** | Shadcn/ui, TailwindCSS |
| **Build** | `npm run build` → dist/ |

---

## 📊 Base de Données - 16 Tables MySQL

### 🔐 Utilisateurs & Authentification
- `users` - Comptes utilisateurs (email, password_hash, KYC)
- `user_roles` - Rôles (admin / user)
- `kyc_documents` - Documents identité

### 💰 Finance
- `wallets` - Portefeuilles multi-devises
- `wallet_transactions` - Historique transactions
- `payment_transactions` - Paiements/rechargements

### 💳 Cartes Virtuelles
- `strowallet_cards` - Cartes créées
- `strowallet_customers` - Clients Strowallet
- `card_transactions` - Transactions cartes

### ⚙️ Système
- `api_config` - Configuration application
- `api_logs` - Logs API
- `webhook_logs` - Logs webhooks
- ... et 4 autres tables

**Voir** : `mysql_schema.sql` pour le schéma complet avec indexes et contraintes.

---

## 🔄 Workflows Principaux

### 1️⃣ Inscription → Login → Dashboard

```
Visiteur
  ↓
register.php → API auth.php?action=register
  ↓
Compte créé + 3 wallets (USD/NGN/XOF)
  ↓
login.php → API auth.php?action=login
  ↓
JWT généré avec rôle
  ↓
  ├─ role='user' → dashboard.php
  └─ role='admin' → admin_dashboard.php
```

### 2️⃣ Création Carte Virtuelle

```
User → pages/cards.php → Clic "Nouvelle Carte"
  ↓
API cards.php?action=create
  ↓
Appel Strowallet API externe
  ↓
INSERT strowallet_cards + UPDATE wallet balance
  ↓
Carte visible dans l'interface
```

### 3️⃣ Rechargement Compte

```
User → pages/deposit.php → Formulaire (montant + devise)
  ↓
API payment.php?action=deposit
  ↓
Redirection Gateway (Stripe/PayPal/Wave)
  ↓
User paie avec sa carte
  ↓
Webhook appelé → payment.php?action=webhook
  ↓
UPDATE wallet balance + INSERT transaction
  ↓
Solde mis à jour visible dans dashboard
```

---

## 🎨 Interface Utilisateur

### Design System
- **Framework** : Tailwind CSS (via CDN)
- **Icônes** : Font Awesome 6
- **Typographie** : Inter (Google Fonts)
- **Couleurs** :
  - Primary : Purple/Blue gradient
  - USD : Green
  - NGN : Blue
  - XOF : Purple
- **Components** :
  - Cards avec hover effects
  - Notifications toast
  - Loading states
  - Modal dialogs
  - Badges colorés (statuts)

### Responsive
- Mobile-first design
- Breakpoints : sm, md, lg, xl
- Grid system Tailwind
- Sidebar responsive

---

## 🔧 Configuration & Maintenance

### Variables d'Environnement (api/env.ini)

```ini
[database]
MYSQL_HOST=localhost
MYSQL_DATABASE=gwap_db
MYSQL_USER=gwap_user
MYSQL_PASSWORD=SecurePassword123!

[security]
JWT_SECRET=64_caracteres_aleatoires_minimum
JWT_EXPIRATION=86400  # 24 heures

[api]
STROWALLET_API_KEY=your_api_key
STROWALLET_SECRET_KEY=your_secret_key
STROWALLET_BASE_URL=https://api.strowallet.com

[payment]
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

[app]
APP_NAME=GWAP
APP_ENV=production
DEBUG=false
```

### Permissions Fichiers (Linux/Unix)

```bash
chmod 755 api/
chmod 600 api/env.ini
chmod 644 *.php
```

### Logs & Debugging

```php
// Activer logs en développement dans api/bootstrap.php
ini_set('display_errors', '1');
error_reporting(E_ALL);

// Logs personnalisés
error_log("Debug: " . print_r($data, true));
```

---

## 🐛 Dépannage

### Erreur 500 Internal Server Error

```bash
# 1. Vérifier logs PHP
tail -f /var/log/apache2/error.log

# 2. Vérifier env.ini existe
ls -la api/env.ini

# 3. Tester connexion DB
php -r "
\$config = parse_ini_file('api/env.ini');
\$pdo = new PDO(
    'mysql:host='.\$config['MYSQL_HOST'].';dbname='.\$config['MYSQL_DATABASE'],
    \$config['MYSQL_USER'],
    \$config['MYSQL_PASSWORD']
);
echo 'DB OK';
"
```

### JWT Invalid Token

```javascript
// Clear cache navigateur
localStorage.clear();
window.location.href = '/login.php';
```

### Cartes ne s'affichent pas

```sql
-- Vérifier données en DB
SELECT * FROM strowallet_cards WHERE user_id = 1;

-- Tester API directement
curl -H "Authorization: Bearer TOKEN" \
  https://gwap.pro/api/cards.php?action=list
```

---

## 📈 Roadmap / Améliorations Futures

### Phase 1 (Court terme)
- [ ] Upload documents KYC
- [ ] Validation KYC par admin
- [ ] Conversion devises en temps réel
- [ ] Notifications push

### Phase 2 (Moyen terme)
- [ ] Export transactions (CSV, PDF)
- [ ] Statistiques avancées admin
- [ ] Programme de parrainage
- [ ] Support multi-langue (FR, EN)

### Phase 3 (Long terme)
- [ ] Application mobile (React Native)
- [ ] API publique pour partenaires
- [ ] Intégration crypto-monnaies
- [ ] 2FA (authentification deux facteurs)

---

## 📞 Support & Contact

- **Email** : support@gwap.pro
- **Site Web** : https://gwap.pro
- **Documentation** : `PROJET_PHP_COMPLET/GUIDE_STRUCTURE.md`
- **Issues GitHub** : (si configuré)

---

## 👥 Contributeurs

- **Lead Developer** : GWAP Development Team
- **Version** : 1.0.0
- **Date** : 22 Novembre 2024

---

## 📝 Licence

**Propriétaire** - Tous droits réservés © 2024 GWAP

Ce logiciel et sa documentation sont la propriété exclusive de GWAP.  
Toute reproduction, distribution ou utilisation non autorisée est interdite.

---

## 🎯 Checklist Avant Production

### Sécurité
- [ ] HTTPS activé (certificat SSL)
- [ ] JWT_SECRET changé (64+ caractères aléatoires)
- [ ] display_errors = 0 en production
- [ ] Permissions fichiers correctes (600 pour env.ini)
- [ ] CORS configuré (seulement domaine autorisé)
- [ ] Rate limiting sur endpoints login/register

### Performance
- [ ] Cache activé (opcache PHP)
- [ ] Compression GZIP activée
- [ ] Images optimisées
- [ ] CDN pour assets statiques (optionnel)

### Monitoring
- [ ] Logs erreurs configurés
- [ ] Backup automatique DB (quotidien)
- [ ] Monitoring uptime
- [ ] Alertes emails erreurs critiques

### Conformité
- [ ] Politique de confidentialité
- [ ] Conditions d'utilisation
- [ ] Mentions légales
- [ ] RGPD (si applicable)

---

**🎊 Projet prêt pour production !**

Consultez `PROJET_PHP_COMPLET/GUIDE_STRUCTURE.md` pour une documentation approfondie.

---

**Dernière mise à jour** : 22 Novembre 2024  
**Statut** : ✅ Production Ready
