# Intégration Strowallet - Production Ready

## Vue d'ensemble

Les Edge Functions ont été mises à jour pour correspondre exactement aux spécifications de production de l'API Strowallet (https://strowallet.com/api/).

## Changements Implémentés

### 1. Edge Functions Mises à Jour

#### `create-strowallet-customer`
- ✅ Utilise l'endpoint production `/create-user/`
- ✅ Payload conforme aux spécifications
- ✅ Gestion d'erreurs améliorée avec error_code
- ✅ Logging structuré pour debugging

#### `create-strowallet-card`
- ✅ **Retiré le champ `mode` pour la production**
- ✅ Mapping correct des champs de réponse (`last4`, `expiry`, `balance`)
- ✅ Ne stocke jamais le CVV complet
- ✅ Gestion d'erreurs standardisée

#### `get-card-details`
- ✅ Utilise l'endpoint `/fetch-card-detail/`
- ✅ **Retiré le champ `mode`**
- ✅ Mise à jour automatique de la base de données locale
- ✅ Mapping correct du champ `card_detail` de la réponse

#### `fund-strowallet-card`
- ✅ Endpoint `/fund-card/` avec payload production
- ✅ Vérification du solde wallet avant funding
- ✅ Transaction atomique (débit wallet + crédit carte)
- ✅ Enregistrement des transactions dans `wallet_transactions` et `card_transactions`
- ✅ Gestion du `transaction_id` de l'API

#### `block-strowallet-card`
- ✅ Support des actions `block` et `unblock`
- ✅ Appel API avec fallback sur mise à jour locale
- ✅ Gestion du champ `reason` pour le blocage
- ✅ Enregistrement dans l'audit trail
- ✅ Validation de l'état actuel de la carte

### 2. Différences Sandbox vs Production

| Aspect | Sandbox | Production |
|--------|---------|-----------|
| Champ `mode` | `"mode": "sandbox"` requis | **Ne pas inclure** |
| URL Base | https://strowallet.com/api/ | https://strowallet.com/api/ |
| Public Key | `pk_test_xxx` | `pk_live_xxx` |
| Données | Données de test | Données réelles |

### 3. Format des Réponses API

#### Succès Standard
```json
{
  "success": true,
  "response": { /* données */ },
  "message": "Action réussie"
}
```

#### Erreur Standard
```json
{
  "success": false,
  "message": "Détail de l'erreur",
  "error_code": "CODE_INTERNE"
}
```

### 4. Gestion des Erreurs

Tous les endpoints retournent maintenant:
- `error_code`: Code d'erreur standardisé
- `message`: Message descriptif
- HTTP status approprié (400, 401, 404, 429, 500)

## Configuration Requise

### Secrets Supabase
Les secrets suivants doivent être configurés:
- `STROWALLET_PUBLIC_KEY`: Clé publique production (`pk_live_xxx`)
- `STROWALLET_SECRET_KEY`: Clé secrète (jamais exposée au client)
- `STROWALLET_WEBHOOK_SECRET`: Secret pour validation webhook

### Variables d'Environnement
- `SUPABASE_URL`: URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clé service role
- `SUPABASE_ANON_KEY`: Clé anonyme publique

## Endpoints Disponibles

| Endpoint | Méthode | Description | JWT Requis |
|----------|---------|-------------|------------|
| `/create-strowallet-customer` | POST | Créer un customer KYC | ✅ |
| `/create-strowallet-card` | POST | Créer une carte virtuelle | ✅ |
| `/get-card-details` | GET | Détails d'une carte | ✅ |
| `/fund-strowallet-card` | POST | Recharger une carte | ✅ |
| `/block-strowallet-card` | POST | Bloquer/débloquer carte | ✅ |
| `/strowallet-webhook` | POST | Recevoir webhooks | ❌ |

## Sécurité

### Masquage des Données Sensibles
- ✅ Numéros de carte: stockage uniquement `last4`
- ✅ CVV: **jamais stocké**
- ✅ PAN complet: jamais exposé au client
- ✅ Webhooks: validation HMAC SHA256

### Row Level Security (RLS)
Toutes les tables ont des politiques RLS:
- Users peuvent voir uniquement leurs propres données
- Isolation stricte par `user_id`

## Transactions et Audit

### Tables de Transactions
- `card_transactions`: Toutes les opérations sur cartes
- `wallet_transactions`: Mouvements de wallet
- `strowallet_webhook_events`: Historique webhooks

### Champs d'Audit
Chaque transaction enregistre:
- `transaction_id`: ID de l'API Strowallet
- `type`: Type d'opération (fund, block, debit, etc.)
- `status`: État (completed, pending, failed)
- `raw_data`: Payload complet de l'API
- `created_at`: Timestamp

## Tests et Validation

### Tests Recommandés

1. **Test de Création Customer**
```bash
# Vérifier que le customer est créé et stocké
curl -X POST /functions/v1/create-strowallet-customer \
  -H "Authorization: Bearer YOUR_JWT"
```

2. **Test de Création Carte**
```bash
# Vérifier payload sans mode + mapping correct
curl -X POST /functions/v1/create-strowallet-card
```

3. **Test de Funding**
```bash
# Vérifier déduction wallet + crédit carte
curl -X POST /functions/v1/fund-strowallet-card
```

4. **Test de Blocage**
```bash
# Vérifier changement de statut
curl -X POST /functions/v1/block-strowallet-card
```

### Vérifications Base de Données

```sql
-- Vérifier les cartes créées
SELECT card_id, status, balance, currency FROM strowallet_cards;

-- Vérifier les transactions
SELECT * FROM card_transactions ORDER BY created_at DESC LIMIT 10;

-- Vérifier les wallets
SELECT user_id, currency, balance FROM wallets;
```

## Réconciliation et Monitoring

### Tâche de Réconciliation (À Implémenter)
```typescript
// Cron job quotidien
async function reconcileCardBalances() {
  // 1. Récupérer toutes les cartes actives
  // 2. Appeler get-card-details pour chaque carte
  // 3. Comparer balance locale vs API
  // 4. Logger les divergences
  // 5. Optionnel: corriger automatiquement
}
```

### Métriques à Monitorer
- Taux de succès des API calls
- Latence moyenne par endpoint
- Nombre de cartes bloquées
- Volume de funding quotidien
- Divergences de solde détectées

## Migration depuis Laravel

Si vous migrez depuis Laravel:

1. **Export des données existantes**
```sql
SELECT card_id, user_id, balance, status, currency 
FROM strowallet_virtual_card;
```

2. **Import vers Supabase**
```sql
INSERT INTO strowallet_cards (...)
VALUES (...);
```

3. **Vérifier la cohérence**
```sql
SELECT COUNT(*) FROM strowallet_cards;
```

## Checklist Pré-Production

- [ ] Secrets production configurés
- [ ] Variables d'environnement vérifiées
- [ ] Index de base de données créés
- [ ] Tests d'intégration passés
- [ ] Monitoring configuré
- [ ] Alertes configurées
- [ ] Documentation opérationnelle à jour
- [ ] Politique de rétention KYC définie
- [ ] Backup automatique configuré
- [ ] Plan de rollback préparé

## Dépannage

### Erreur: "Customer not found"
- Vérifier que `create-strowallet-customer` a été appelé
- Vérifier le `customer_email` correspond

### Erreur: "Insufficient balance"
- Vérifier le solde du wallet
- Vérifier la devise (USD, NGN, XOF)

### Erreur: "Card not found"
- Vérifier que la carte appartient à l'utilisateur
- Vérifier le `card_id` est correct

### Erreur HTTP 401
- Vérifier la `public_key` est correcte
- Vérifier l'environnement (sandbox vs production)

### Erreur HTTP 429
- Rate limit atteint
- Implémenter backoff exponentiel
- Contacter Strowallet pour augmenter les limites

## Support

Pour toute question sur l'intégration Strowallet:
- Documentation officielle: [À ajouter]
- Support technique: [À ajouter]

## Prochaines Étapes

1. Tester tous les endpoints en production
2. Implémenter la réconciliation automatique
3. Ajouter des métriques et dashboards
4. Configurer les alertes
5. Documenter les runbooks opérationnels
