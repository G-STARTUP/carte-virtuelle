<?php
/**
 * Wallets Management Endpoint
 * GET /api/wallets - Liste wallets utilisateur
 * GET /api/wallets/:id/transactions - Transactions d'un wallet
 */
require_once __DIR__ . '/bootstrap.php';

$user = bearerUser();
if (!$user) {
    log_api('/api/wallets', $_SERVER['REQUEST_METHOD'], 401, null, 'Unauthorized');
    json(['error' => 'Non authentifié'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = db();

// GET: Liste wallets ou transactions
if ($method === 'GET') {
    if (!rate_limit('/api/wallets', 60)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    $path = $_GET['path'] ?? '';
    
    // GET /api/wallets - Liste wallets
    if (empty($path)) {
        $stmt = $pdo->prepare('
            SELECT id, currency, balance, created_at, updated_at 
            FROM wallets 
            WHERE user_id = ?
            ORDER BY currency
        ');
        $stmt->execute([$user['id']]);
        $wallets = $stmt->fetchAll();
        
        // Ajouter statistiques par wallet
        foreach ($wallets as &$wallet) {
            $stmt = $pdo->prepare('
                SELECT 
                    COUNT(*) as transaction_count,
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits
                FROM wallet_transactions
                WHERE wallet_id = ?
            ');
            $stmt->execute([$wallet['id']]);
            $stats = $stmt->fetch();
            $wallet['stats'] = [
                'transaction_count' => (int)$stats['transaction_count'],
                'total_credits' => (float)$stats['total_credits'],
                'total_debits' => (float)$stats['total_debits']
            ];
        }
        
        log_api('/api/wallets', 'GET', 200, $user['id'], 'Wallets retrieved');
        json(['success' => true, 'wallets' => $wallets]);
    }
    
    // GET /api/wallets/:id/transactions - Transactions d'un wallet
    if (preg_match('#^(\d+)/transactions$#', $path, $matches)) {
        $walletId = (int)$matches[1];
        
        // Vérifier ownership
        $stmt = $pdo->prepare('SELECT id FROM wallets WHERE id = ? AND user_id = ?');
        $stmt->execute([$walletId, $user['id']]);
        if (!$stmt->fetch()) {
            json(['error' => 'Wallet introuvable'], 404);
        }
        
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        
        $stmt = $pdo->prepare("
            SELECT id, amount, type, description, reference, created_at
            FROM wallet_transactions
            WHERE wallet_id = ?
            ORDER BY created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute([$walletId]);
        $transactions = $stmt->fetchAll();
        
        $countStmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM wallet_transactions WHERE wallet_id = ?');
        $countStmt->execute([$walletId]);
        $total = $countStmt->fetch()['cnt'];
        
        log_api("/api/wallets/$walletId/transactions", 'GET', 200, $user['id'], "Fetched $limit transactions");
        json([
            'success' => true,
            'transactions' => $transactions,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    json(['error' => 'Route invalide'], 404);
}

// Méthode non supportée
log_api('/api/wallets', $method, 405, $user['id'], 'Method not allowed');
json(['error' => 'Méthode non supportée'], 405);
