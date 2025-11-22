<?php
/**
 * Admin Dashboard Endpoints
 * Actions: stats, users, cards, manage_wallet, logs, fees
 */
require_once __DIR__ . '/bootstrap.php';

$user = bearerUser();
if (!$user) {
    log_api('/api/admin', $_SERVER['REQUEST_METHOD'], 401, null, 'Unauthorized');
    json(['error' => 'Non authentifié'], 401);
}

// Vérifier rôle admin
$pdo = db();
$stmt = $pdo->prepare('SELECT role FROM user_roles WHERE user_id = ? AND role = ?');
$stmt->execute([$user['id'], 'admin']);
if (!$stmt->fetch()) {
    log_api('/api/admin', $_SERVER['REQUEST_METHOD'], 403, $user['id'], 'Forbidden: not admin');
    json(['error' => 'Accès refusé. Droits administrateur requis.'], 403);
}

$action = $_GET['action'] ?? 'stats';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// ACTION: stats - Dashboard overview
// ============================================================
if ($action === 'stats' && $method === 'GET') {
    if (!rate_limit('/api/admin/stats', 30)) {
        log_api('/api/admin/stats', 'GET', 429, $user['id'], 'Rate limit exceeded');
        json(['error' => 'Trop de requêtes'], 429);
    }

    // Total utilisateurs
    $totalUsers = $pdo->query('SELECT COUNT(*) as cnt FROM users')->fetch()['cnt'];
    
    // Utilisateurs KYC vérifiés
    $verifiedUsers = $pdo->query("SELECT COUNT(*) as cnt FROM users WHERE kyc_status = 'verified'")->fetch()['cnt'];
    
    // Total cartes actives
    $activeCards = $pdo->query("SELECT COUNT(*) as cnt FROM strowallet_cards WHERE status = 'active'")->fetch()['cnt'];
    
    // Total cartes (tous statuts)
    $totalCards = $pdo->query('SELECT COUNT(*) as cnt FROM strowallet_cards')->fetch()['cnt'];
    
    // Solde total par devise (wallet)
    $stmt = $pdo->query('SELECT currency, SUM(balance) as total FROM wallets GROUP BY currency');
    $balances = [];
    while ($row = $stmt->fetch()) {
        $balances[$row['currency']] = (float)$row['total'];
    }
    
    // Solde total cartes
    $stmt = $pdo->query('SELECT currency, SUM(balance) as total FROM strowallet_cards GROUP BY currency');
    $cardBalances = [];
    while ($row = $stmt->fetch()) {
        $cardBalances[$row['currency']] = (float)$row['total'];
    }
    
    // Transactions récentes (7 derniers jours)
    $recentTransactions = $pdo->query("
        SELECT COUNT(*) as cnt, SUM(ABS(amount)) as total 
        FROM wallet_transactions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ")->fetch();
    
    // Webhooks non traités
    $pendingWebhooks = $pdo->query("SELECT COUNT(*) as cnt FROM webhook_events WHERE processed = 0")->fetch()['cnt'];

    log_api('/api/admin/stats', 'GET', 200, $user['id'], 'Stats retrieved');
    json([
        'success' => true,
        'stats' => [
            'users' => [
                'total' => (int)$totalUsers,
                'verified' => (int)$verifiedUsers,
                'pending_kyc' => (int)($totalUsers - $verifiedUsers)
            ],
            'cards' => [
                'total' => (int)$totalCards,
                'active' => (int)$activeCards,
                'inactive' => (int)($totalCards - $activeCards)
            ],
            'wallets' => [
                'balances' => $balances,
                'card_balances' => $cardBalances
            ],
            'transactions' => [
                'last_7_days' => (int)$recentTransactions['cnt'],
                'volume_7_days' => (float)$recentTransactions['total']
            ],
            'webhooks' => [
                'pending' => (int)$pendingWebhooks
            ]
        ]
    ]);
}

// ============================================================
// ACTION: users - Gestion utilisateurs
// ============================================================
if ($action === 'users') {
    if (!rate_limit('/api/admin/users', 30)) {
        log_api('/api/admin/users', $method, 429, $user['id'], 'Rate limit exceeded');
        json(['error' => 'Trop de requêtes'], 429);
    }

    // GET: Liste utilisateurs
    if ($method === 'GET') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        
        $where = '';
        $params = [];
        if ($search) {
            $where = 'WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?';
            $like = '%' . $search . '%';
            $params = [$like, $like, $like];
        }
        
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.kyc_status, 
                   u.created_at, u.updated_at,
                   (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = u.id) as roles,
                   (SELECT COUNT(*) FROM strowallet_cards WHERE user_id = u.id) as card_count
            FROM users u
            $where
            ORDER BY u.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $users = $stmt->fetchAll();
        
        $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM users u $where");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['cnt'];
        
        log_api('/api/admin/users', 'GET', 200, $user['id'], "Fetched $limit users");
        json([
            'success' => true,
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // PUT: Mettre à jour utilisateur (KYC status, roles)
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? null;
        $kycStatus = $input['kyc_status'] ?? null;
        $roles = $input['roles'] ?? null;
        
        if (!$userId) {
            json(['error' => 'user_id requis'], 400);
        }
        
        // Vérifier utilisateur existe
        $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            json(['error' => 'Utilisateur introuvable'], 404);
        }
        
        // Mettre à jour KYC
        if ($kycStatus && in_array($kycStatus, ['not_verified', 'pending', 'verified', 'rejected'])) {
            $stmt = $pdo->prepare('UPDATE users SET kyc_status = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$kycStatus, $userId]);
        }
        
        // Mettre à jour rôles
        if (is_array($roles)) {
            $pdo->prepare('DELETE FROM user_roles WHERE user_id = ?')->execute([$userId]);
            $insertRole = $pdo->prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)');
            foreach ($roles as $role) {
                if (in_array($role, ['admin', 'user'])) {
                    $insertRole->execute([$userId, $role]);
                }
            }
        }
        
        log_api('/api/admin/users', 'PUT', 200, $user['id'], "Updated user $userId");
        json(['success' => true, 'message' => 'Utilisateur mis à jour']);
    }
    
    json(['error' => 'Méthode non supportée'], 405);
}

// ============================================================
// ACTION: cards - Liste cartes admin
// ============================================================
if ($action === 'cards' && $method === 'GET') {
    if (!rate_limit('/api/admin/cards', 30)) {
        log_api('/api/admin/cards', 'GET', 429, $user['id'], 'Rate limit exceeded');
        json(['error' => 'Trop de requêtes'], 429);
    }

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $status = $_GET['status'] ?? null;
    
    $where = '';
    $params = [];
    if ($status) {
        $where = 'WHERE c.status = ?';
        $params[] = $status;
    }
    
    $stmt = $pdo->prepare("
        SELECT c.id, c.card_id, c.user_id, c.name_on_card, c.balance, c.currency, c.status,
               c.card_number, c.created_at, c.updated_at,
               u.email, u.first_name, u.last_name
        FROM strowallet_cards c
        LEFT JOIN users u ON c.user_id = u.id
        $where
        ORDER BY c.created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $cards = $stmt->fetchAll();
    
    $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM strowallet_cards c $where");
    $countStmt->execute($params);
    $total = $countStmt->fetch()['cnt'];
    
    log_api('/api/admin/cards', 'GET', 200, $user['id'], "Fetched $limit cards");
    json([
        'success' => true,
        'cards' => $cards,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

// ============================================================
// ACTION: manage_wallet - Ajouter/retirer solde wallet
// ============================================================
if ($action === 'manage_wallet' && $method === 'POST') {
    if (!rate_limit('/api/admin/manage_wallet', 10)) {
        log_api('/api/admin/manage_wallet', 'POST', 429, $user['id'], 'Rate limit exceeded');
        json(['error' => 'Trop de requêtes'], 429);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $walletAction = $input['wallet_action'] ?? null; // 'add' ou 'subtract'
    $targetUserId = $input['user_id'] ?? null;
    $walletId = $input['wallet_id'] ?? null;
    $amount = $input['amount'] ?? null;
    $description = $input['description'] ?? '';
    
    if (!$walletAction || !$targetUserId || !$walletId || !$amount) {
        json(['error' => 'Paramètres manquants: wallet_action, user_id, wallet_id, amount'], 400);
    }
    
    if (!in_array($walletAction, ['add', 'subtract'])) {
        json(['error' => 'wallet_action doit être "add" ou "subtract"'], 400);
    }
    
    $amount = (float)$amount;
    if ($amount <= 0) {
        json(['error' => 'Le montant doit être supérieur à 0'], 400);
    }
    
    // Récupérer wallet
    $stmt = $pdo->prepare('SELECT * FROM wallets WHERE id = ? AND user_id = ?');
    $stmt->execute([$walletId, $targetUserId]);
    $wallet = $stmt->fetch();
    if (!$wallet) {
        json(['error' => 'Wallet introuvable'], 404);
    }
    
    $oldBalance = (float)$wallet['balance'];
    $newBalance = $walletAction === 'add' ? $oldBalance + $amount : $oldBalance - $amount;
    
    if ($newBalance < 0) {
        json(['error' => "Solde insuffisant. Solde actuel: $oldBalance {$wallet['currency']}"], 400);
    }
    
    $pdo->beginTransaction();
    try {
        // Mettre à jour solde
        $stmt = $pdo->prepare('UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$newBalance, $walletId]);
        
        // Enregistrer transaction
        $transactionType = $walletAction === 'add' ? 'credit' : 'debit';
        $transactionAmount = $walletAction === 'add' ? $amount : -$amount;
        $transactionDesc = $description ?: ($walletAction === 'add' ? "Ajout admin: +$amount {$wallet['currency']}" : "Retrait admin: -$amount {$wallet['currency']}");
        
        $stmt = $pdo->prepare('INSERT INTO wallet_transactions (wallet_id, amount, type, description, reference) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$walletId, $transactionAmount, $transactionType, $transactionDesc, 'admin-' . $walletAction . '-' . time()]);
        
        $pdo->commit();
        
        log_api('/api/admin/manage_wallet', 'POST', 200, $user['id'], "Admin $walletAction: $amount {$wallet['currency']} for user $targetUserId");
        json([
            'success' => true,
            'wallet' => [
                'id' => $walletId,
                'currency' => $wallet['currency'],
                'old_balance' => $oldBalance,
                'new_balance' => $newBalance,
                'amount_changed' => $amount
            ],
            'message' => $walletAction === 'add' 
                ? "Solde ajouté avec succès: +$amount {$wallet['currency']}"
                : "Solde retiré avec succès: -$amount {$wallet['currency']}"
        ]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        log_api('/api/admin/manage_wallet', 'POST', 500, $user['id'], 'Transaction failed: ' . $e->getMessage());
        json(['error' => 'Erreur lors de la mise à jour: ' . $e->getMessage()], 500);
    }
}

// ============================================================
// ACTION: logs - Logs API
// ============================================================
if ($action === 'logs' && $method === 'GET') {
    if (!rate_limit('/api/admin/logs', 20)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(200, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;
    
    $stmt = $pdo->prepare("
        SELECT id, route, method, status_code, user_id, ip_address, message, created_at
        FROM api_logs
        ORDER BY created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute();
    $logs = $stmt->fetchAll();
    
    json(['success' => true, 'logs' => $logs]);
}

// ============================================================
// ACTION: fees - Paramètres de frais
// ============================================================
if ($action === 'fees') {
    if (!rate_limit('/api/admin/fees', 20)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    // GET: Récupérer tous les frais
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM fees_settings ORDER BY setting_key');
        $fees = $stmt->fetchAll();
        json(['success' => true, 'fees' => $fees]);
    }
    
    // PUT: Mettre à jour un frais
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $settingKey = $input['setting_key'] ?? null;
        $settingValue = $input['setting_value'] ?? null;
        
        if (!$settingKey || $settingValue === null) {
            json(['error' => 'setting_key et setting_value requis'], 400);
        }
        
        $stmt = $pdo->prepare('UPDATE fees_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?');
        $stmt->execute([$settingValue, $settingKey]);
        
        if ($stmt->rowCount() === 0) {
            json(['error' => 'Paramètre introuvable'], 404);
        }
        
        log_api('/api/admin/fees', 'PUT', 200, $user['id'], "Updated fee $settingKey");
        json(['success' => true, 'message' => 'Frais mis à jour']);
    }
    
    json(['error' => 'Méthode non supportée'], 405);
}

// Action inconnue
log_api('/api/admin', $method, 404, $user['id'], "Unknown action: $action");
json(['error' => 'Action inconnue: ' . $action], 404);
