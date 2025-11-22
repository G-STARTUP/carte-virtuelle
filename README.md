# 💳 Carte Virtuelle - GWAP

Application de gestion de cartes virtuelles avec portefeuilles multi-devises.

**Stack technique** : React + TypeScript + Vite + PHP + MySQL

**Déploiement** : Hostinger (hébergement mutualisé)

---

## 📁 Structure du Projet

```
carte-virtuelle/
├── 📤 PROJET_A_TELEVERSER/   # ✅ Prêt pour le déploiement Hostinger
├── ⚛️  src/                   # Frontend React/TypeScript
├── 🔧 api/                    # Backend PHP
├── 📖 docs/                   # Documentation complète
├── ⚙️  scripts/               # Scripts utilitaires (.bat)
├── 💾 backup/                 # Anciens fichiers (dist, public, supabase)
├── 🔒 secure/                 # Fichiers de configuration sécurisés
├── 📦 package.json            # Dépendances npm
├── 📄 mysql_schema.sql        # Schéma de base de données
└── 📝 README.md               # Ce fichier
```

---

## 🚀 Déploiement sur Hostinger

**Tous les fichiers sont prêts dans le dossier `PROJET_A_TELEVERSER/`**

### Étapes rapides :
1. Téléversez le contenu de `PROJET_A_TELEVERSER/` vers `public_html/`
2. Éditez `public_html/api/env.ini` avec vos identifiants MySQL
3. Importez `mysql_schema.sql` dans phpMyAdmin
4. Testez : https://gwap.pro

📖 **Guide complet** : `docs/GUIDE_DEPLOIEMENT_HOSTINGER.md`

---

## 🛠️ Développement Local

### Prérequis
- Node.js 18+ & npm
- PHP 8.0+
- MySQL/MariaDB

### Installation

## How can I edit this code?

Il existe plusieurs façons de modifier l'application.

### Éditer via Lovable

Simply visit the [Lovable Project](https://lovable.dev/projects/115ed089-2593-4423-9efd-554980b692a4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

### Utiliser votre IDE local

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```bash
# 1. Cloner le dépôt
git clone https://github.com/G-STARTUP/carte-virtuelle.git
cd carte-virtuelle

# 2. Installer les dépendances
npm install

# 3. Configurer la base de données locale
# Exécutez le script setup-db.bat ou importez mysql_schema.sql manuellement

# 4. Configurer l'environnement
# Copiez api/env.ini et ajustez les paramètres MySQL locaux

# 5. Démarrer le serveur de développement
npm run dev
```

Le frontend sera disponible sur : http://localhost:5173  
L'API PHP doit être servie par un serveur local (XAMPP, WAMP, etc.)

---

## 📚 Documentation

Toute la documentation est disponible dans le dossier `docs/` :

- **GUIDE_DEPLOIEMENT_HOSTINGER.md** - Guide complet de déploiement
- **API_DOCUMENTATION.md** - Documentation de l'API PHP
- **ARCHITECTURE_HOSTINGER.md** - Architecture du système
- **STROWALLET_INTEGRATION.md** - Intégration API Strowallet
- **env.example.ini** - Exemple de configuration

---

## ⚙️ Scripts Utilitaires

Dans le dossier `scripts/` :

- **setup-db.bat** - Créer et importer la base de données MySQL
- **generate-jwt-secret.bat** - Générer un secret JWT sécurisé
- **verifier-deploiement.bat** - Vérifier que tout est prêt pour le déploiement

---

## 🔐 Sécurité

- ✅ Mots de passe hachés avec BCRYPT
- ✅ JWT pour l'authentification
- ✅ Validation des entrées utilisateur
- ✅ Protection CORS configurée
- ✅ Rate limiting sur les endpoints sensibles
- ⚠️ **IMPORTANT** : Ne jamais commiter les fichiers `env.ini` avec des vraies credentials

---

## 🆘 Support

En cas de problème :
1. Consultez `docs/GUIDE_DEPLOIEMENT_HOSTINGER.md`
2. Vérifiez les logs d'erreur PHP sur le serveur
3. Testez l'API avec : https://gwap.pro/api/diag.php

---

## 📝 Licence

Projet privé - Tous droits réservés

---

**Dernière mise à jour** : 2025-11-22

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/115ed089-2593-4423-9efd-554980b692a4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
