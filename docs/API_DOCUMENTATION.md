# API Documentation - VirtualPay Backend

Documentation complète des endpoints MySQL pour les tableaux de bord admin et utilisateur.

---

## Table des matières

1. [Authentication](#authentication)
2. [Admin Endpoints](#admin-endpoints)
3. [User Endpoints](#user-endpoints)
4. [Wallet Endpoints](#wallet-endpoints)
5. [Card Endpoints](#card-endpoints)
6. [Exemples de requêtes](#exemples-de-requêtes)

---

## Authentication

Tous les endpoints protégés nécessitent un token JWT dans le header `Authorization`:

```
Authorization: Bearer <TOKEN_JWT>
```

### POST `/api/auth?action=register`

Inscription d'un nouvel utilisateur avec création automatique de 3 wallets (USD, NGN, XOF).

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response 200:**
```json
{
  "success": true,
  "user_id": 123
}
```

### POST `/api/auth?action=login`

Connexion et récupération du token JWT.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Admin Endpoints

**Accès:** Rôle `admin` requis

### GET `/api/admin?action=stats`

Statistiques globales du dashboard admin.

**Response 200:**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 1250,
      "verified": 980,
      "pending_kyc": 270
    },
    "cards": {
      "total": 3450,
      "active": 3120,
      "inactive": 330
    },
    "wallets": {
      "balances": {
        "USD": 125000.50,
        "NGN": 85000000.00,
        "XOF": 50000000.00
      },
      "card_balances": {
        "USD": 75000.25
      }
    },
    "transactions": {
      "last_7_days": 8450,
      "volume_7_days": 345000.75
    },
    "webhooks": {
      "pending": 12
    }
  }
}
```

### GET `/api/admin?action=users`

Liste paginée des utilisateurs.

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `search` (string, optionnel): recherche sur email/nom/prénom

**Response 200:**
```json
{
  "success": true,
  "users": [
    {
      "id": 123,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "kyc_status": "verified",
      "created_at": "2025-11-20 10:30:00",
      "updated_at": "2025-11-22 14:20:00",
      "roles": "admin,user",
      "card_count": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

### PUT `/api/admin?action=users`

Mettre à jour un utilisateur (KYC status, rôles).

**Body:**
```json
{
  "user_id": 123,
  "kyc_status": "verified",
  "roles": ["admin", "user"]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Utilisateur mis à jour"
}
```

### GET `/api/admin?action=cards`

Liste paginée des cartes.

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `status` (string, optionnel): filter par statut (active, frozen, inactive, blocked)

**Response 200:**
```json
{
  "success": true,
  "cards": [
    {
      "id": 456,
      "card_id": "card_ABC123XYZ",
      "user_id": 123,
      "name_on_card": "JOHN DOE",
      "balance": 150.50,
      "currency": "USD",
      "status": "active",
      "card_number": "****1234",
      "created_at": "2025-11-22 08:15:00",
      "updated_at": "2025-11-22 14:30:00",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3450,
    "pages": 173
  }
}
```

### POST `/api/admin?action=manage_wallet`

Ajouter ou retirer du solde d'un wallet utilisateur.

**Body:**
```json
{
  "wallet_action": "add",
  "user_id": 123,
  "wallet_id": 45,
  "amount": 100.00,
  "description": "Bonus admin"
}
```

**Valeurs `wallet_action`:**
- `add`: ajouter au solde
- `subtract`: retirer du solde

**Response 200:**
```json
{
  "success": true,
  "wallet": {
    "id": 45,
    "currency": "USD",
    "old_balance": 250.50,
    "new_balance": 350.50,
    "amount_changed": 100.00
  },
  "message": "Solde ajouté avec succès: +100 USD"
}
```

### GET `/api/admin?action=logs`

Récupérer les logs API.

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 50, max: 200)

**Response 200:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 12345,
      "route": "/api/admin/stats",
      "method": "GET",
      "status_code": 200,
      "user_id": 5,
      "ip_address": "192.168.1.10",
      "message": "Stats retrieved",
      "created_at": "2025-11-22 14:35:12"
    }
  ]
}
```

### GET `/api/admin?action=fees`

Récupérer tous les paramètres de frais.

**Response 200:**
```json
{
  "success": true,
  "fees": [
    {
      "id": 1,
      "setting_key": "card_creation_fixed_fee_usd",
      "setting_value": 2.00,
      "description": "Frais fixe de création de carte en USD",
      "currency": "USD",
      "created_at": "2025-11-20 10:00:00",
      "updated_at": "2025-11-22 09:15:00"
    }
  ]
}
```

### PUT `/api/admin?action=fees`

Mettre à jour un paramètre de frais.

**Body:**
```json
{
  "setting_key": "card_creation_fixed_fee_usd",
  "setting_value": 2.50
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Frais mis à jour"
}
```

---

## User Endpoints

**Accès:** Utilisateur authentifié

### GET `/api/user?action=dashboard`

Dashboard personnel de l'utilisateur connecté.

**Response 200:**
```json
{
  "success": true,
  "dashboard": {
    "wallets": [
      {
        "id": 45,
        "currency": "USD",
        "balance": 350.50
      },
      {
        "id": 46,
        "currency": "NGN",
        "balance": 125000.00
      },
      {
        "id": 47,
        "currency": "XOF",
        "balance": 85000.00
      }
    ],
    "cards": {
      "total": 5,
      "active": 4,
      "balances": {
        "USD": 750.25
      }
    },
    "recent_transactions": [
      {
        "id": 8901,
        "amount": 50.00,
        "type": "credit",
        "description": "Deposit via Moneroo",
        "reference": "deposit-123456",
        "created_at": "2025-11-22 14:20:00",
        "currency": "USD"
      }
    ]
  }
}
```

### GET `/api/user?action=profile`

Récupérer le profil utilisateur.

**Response 200:**
```json
{
  "success": true,
  "profile": {
    "id": 123,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City",
    "kyc_status": "verified",
    "created_at": "2025-11-20 10:30:00",
    "updated_at": "2025-11-22 14:20:00",
    "roles": ["user"]
  }
}
```

### PUT `/api/user?action=profile`

Mettre à jour le profil utilisateur.

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "address": "456 New St, New City"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Profil mis à jour"
}
```

### GET `/api/user?action=wallets`

Liste des wallets de l'utilisateur.

**Response 200:**
```json
{
  "success": true,
  "wallets": [
    {
      "id": 45,
      "currency": "USD",
      "balance": 350.50,
      "created_at": "2025-11-20 10:30:05",
      "updated_at": "2025-11-22 14:25:00"
    }
  ]
}
```

### GET `/api/user?action=transactions`

Historique des transactions wallet.

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 50, max: 100)
- `wallet_id` (int, optionnel): filter par wallet

**Response 200:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 8901,
      "wallet_id": 45,
      "amount": 50.00,
      "type": "credit",
      "description": "Deposit via Moneroo",
      "reference": "deposit-123456",
      "created_at": "2025-11-22 14:20:00",
      "currency": "USD"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "pages": 3
  }
}
```

### GET `/api/user?action=card_transactions`

Historique des transactions carte.

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 50, max: 100)
- `card_id` (string, optionnel): filter par carte

**Response 200:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 6701,
      "card_id": "card_ABC123XYZ",
      "transaction_id": "txn_XYZ789",
      "amount": 25.50,
      "type": "charge",
      "status": "completed",
      "description": "Payment at Amazon",
      "merchant_name": "Amazon",
      "merchant_category": "E-commerce",
      "currency": "USD",
      "created_at": "2025-11-22 13:45:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 89,
    "pages": 2
  }
}
```

---

## Wallet Endpoints

**Accès:** Utilisateur authentifié

### GET `/api/wallets`

Liste complète des wallets avec statistiques.

**Response 200:**
```json
{
  "success": true,
  "wallets": [
    {
      "id": 45,
      "currency": "USD",
      "balance": 350.50,
      "created_at": "2025-11-20 10:30:05",
      "updated_at": "2025-11-22 14:25:00",
      "stats": {
        "transaction_count": 142,
        "total_credits": 1250.75,
        "total_debits": 900.25
      }
    }
  ]
}
```

### GET `/api/wallets/:id/transactions`

Transactions détaillées d'un wallet spécifique.

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 50, max: 100)

**Example:** `/api/wallets/45/transactions?page=1&limit=20`

**Response 200:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 8901,
      "amount": 50.00,
      "type": "credit",
      "description": "Deposit via Moneroo",
      "reference": "deposit-123456",
      "created_at": "2025-11-22 14:20:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "pages": 8
  }
}
```

---

## Card Endpoints

### GET `/api/cards`

Liste des cartes de l'utilisateur.

**Response 200:**
```json
{
  "success": true,
  "cards": [
    {
      "id": 456,
      "card_id": "card_ABC123XYZ",
      "name_on_card": "JOHN DOE",
      "balance": 150.50,
      "currency": "USD",
      "status": "active",
      "card_number": "****1234",
      "created_at": "2025-11-22 08:15:00",
      "updated_at": "2025-11-22 14:30:00"
    }
  ]
}
```

### GET `/api/cards/:card_id`

Détails complets d'une carte avec appel API Strowallet.

**Response 200:**
```json
{
  "success": true,
  "card": {
    "card_id": "card_ABC123XYZ",
    "balance": 150.50,
    "card_status": "active",
    "last4": "1234",
    "name_on_card": "JOHN DOE",
    "expiry": "12/2028",
    "currency": "USD"
  },
  "message": "Card details fetched successfully"
}
```

### POST `/api/customer`

Créer un client Strowallet.

**Body:**
```json
{
  "customer_email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890"
}
```

### POST `/api/fund`

Recharger une carte.

**Body:**
```json
{
  "card_id": "card_ABC123XYZ",
  "amount": 50.00
}
```

---

## Exemples de requêtes

### cURL

```bash
# Login
curl -X POST https://your-domain.com/api/auth?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123"}'

# Admin stats
curl -X GET https://your-domain.com/api/admin?action=stats \
  -H "Authorization: Bearer <TOKEN>"

# User dashboard
curl -X GET https://your-domain.com/api/user?action=dashboard \
  -H "Authorization: Bearer <TOKEN>"

# Manage wallet (admin)
curl -X POST https://your-domain.com/api/admin?action=manage_wallet \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"wallet_action":"add","user_id":123,"wallet_id":45,"amount":100.00,"description":"Bonus"}'

# Get wallets
curl -X GET https://your-domain.com/api/wallets \
  -H "Authorization: Bearer <TOKEN>"
```

### JavaScript (Fetch)

```javascript
// Login
const loginResponse = await fetch('https://your-domain.com/api/auth?action=login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'SecurePass123' })
});
const { token } = await loginResponse.json();

// Admin stats
const statsResponse = await fetch('https://your-domain.com/api/admin?action=stats', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const stats = await statsResponse.json();

// User dashboard
const dashboardResponse = await fetch('https://your-domain.com/api/user?action=dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const dashboard = await dashboardResponse.json();
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200  | Succès |
| 400  | Requête invalide (paramètres manquants ou invalides) |
| 401  | Non authentifié (token manquant ou invalide) |
| 403  | Accès refusé (droits insuffisants) |
| 404  | Ressource introuvable |
| 405  | Méthode HTTP non supportée |
| 429  | Trop de requêtes (rate limit dépassé) |
| 500  | Erreur serveur interne |

---

## Rate Limiting

Limites par défaut (configurable dans `bootstrap.php`):
- Auth endpoints: 40 requêtes/minute
- Admin endpoints: 10-30 requêtes/minute selon l'action
- User endpoints: 60 requêtes/minute
- Wallet endpoints: 60 requêtes/minute

---

## Notes de sécurité

1. **JWT Secret**: Utiliser un secret fort (32+ caractères) dans `secure/env.ini`
2. **HTTPS**: Obligatoire en production
3. **Rate Limiting**: Actif sur tous les endpoints
4. **Logging**: Toutes les requêtes sont loggées dans `api_logs`
5. **CORS**: Configuré dans `bootstrap.php` (ajuster `Access-Control-Allow-Origin` en production)

---

## Base de données

Tables créées automatiquement par `mysql_schema.sql`:
- `users` - Comptes utilisateurs
- `user_roles` - Rôles (admin, user)
- `wallets` - Portefeuilles multi-devises
- `wallet_transactions` - Historique transactions wallet
- `strowallet_customers` - Clients Strowallet
- `strowallet_cards` - Cartes virtuelles
- `card_transactions` - Historique transactions carte
- `fees_settings` - Paramètres de frais
- `kyc_documents` - Documents KYC
- `api_logs` - Logs API généraux
- `strowallet_api_logs` - Logs API Strowallet
- `webhook_events` - Événements webhook
- `api_rate_limiter` - Limitation de taux

---

## Prochaines étapes

1. Exécuter `/install.php?token=<INSTALL_SECRET>` pour créer les tables
2. Créer un compte admin manuel:
   ```sql
   INSERT INTO user_roles (user_id, role) VALUES (1, 'admin');
   ```
3. Tester les endpoints avec Postman ou cURL
4. Intégrer le frontend React avec ces endpoints
5. Configurer les webhooks Strowallet/Moneroo

---

**Documentation générée le:** 2025-11-22  
**Version API:** 1.0.0  
**Backend:** PHP 7.4+ / MySQL 5.7+
