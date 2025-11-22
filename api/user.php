<?php
/**
 * User Dashboard & Wallets Endpoints
 * Actions: dashboard, profile, wallets, transactions
 */
require_once __DIR__ . '/bootstrap.php';

$user = bearerUser();
if (!$user) {
    log_api('/api/user', $_SERVER['REQUEST_METHOD'], 401, null, 'Unauthorized');
    json(['error' => 'Non authentifié'], 401);
}

$action = $_GET['action'] ?? 'dashboard';
$method = $_SERVER['REQUEST_METHOD'];
$pdo = db();

// ============================================================
// ACTION: dashboard - Stats utilisateur
// ============================================================
if ($action === 'dashboard' && $method === 'GET') {
    if (!rate_limit('/api/user/dashboard', 60)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    // Soldes wallets
    $stmt = $pdo->prepare('SELECT id, currency, balance FROM wallets WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $wallets = $stmt->fetchAll();
    
    // Cartes actives
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM strowallet_cards WHERE user_id = ? AND status = 'active'");
    $stmt->execute([$user['id']]);
    $activeCards = $stmt->fetch()['cnt'];
    
    // Total cartes
    $stmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM strowallet_cards WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $totalCards = $stmt->fetch()['cnt'];
    
    // Transactions récentes (10 dernières)
    $stmt = $pdo->prepare("
        SELECT wt.id, wt.amount, wt.type, wt.description, wt.reference, wt.created_at,
               w.currency
        FROM wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        WHERE w.user_id = ?
        ORDER BY wt.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$user['id']]);
    $recentTransactions = $stmt->fetchAll();
    
    // Balance totale cartes
    $stmt = $pdo->prepare('SELECT currency, SUM(balance) as total FROM strowallet_cards WHERE user_id = ? GROUP BY currency');
    $stmt->execute([$user['id']]);
    $cardBalances = [];
    while ($row = $stmt->fetch()) {
        $cardBalances[$row['currency']] = (float)$row['total'];
    }
    
    log_api('/api/user/dashboard', 'GET', 200, $user['id'], 'Dashboard retrieved');
    json([
        'success' => true,
        'dashboard' => [
            'wallets' => $wallets,
            'cards' => [
                'total' => (int)$totalCards,
                'active' => (int)$activeCards,
                'balances' => $cardBalances
            ],
            'recent_transactions' => $recentTransactions
        ]
    ]);
}

// ============================================================
// ACTION: profile - Profil utilisateur
// ============================================================
if ($action === 'profile') {
    if (!rate_limit('/api/user/profile', 60)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    // GET: Récupérer profil
    if ($method === 'GET') {
        $stmt = $pdo->prepare('
            SELECT id, email, first_name, last_name, phone, address, kyc_status, created_at, updated_at
            FROM users WHERE id = ?
        ');
        $stmt->execute([$user['id']]);
        $profile = $stmt->fetch();
        
        if (!$profile) {
            json(['error' => 'Profil introuvable'], 404);
        }
        
        // Récupérer rôles
        $stmt = $pdo->prepare('SELECT role FROM user_roles WHERE user_id = ?');
        $stmt->execute([$user['id']]);
        $roles = [];
        while ($row = $stmt->fetch()) {
            $roles[] = $row['role'];
        }
        $profile['roles'] = $roles;
        
        json(['success' => true, 'profile' => $profile]);
    }
    
    // PUT: Mettre à jour profil
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $firstName = $input['first_name'] ?? null;
        $lastName = $input['last_name'] ?? null;
        $phone = $input['phone'] ?? null;
        $address = $input['address'] ?? null;
        
        $updates = [];
        $params = [];
        
        if ($firstName !== null) {
            $updates[] = 'first_name = ?';
            $params[] = $firstName;
        }
        if ($lastName !== null) {
            $updates[] = 'last_name = ?';
            $params[] = $lastName;
        }
        if ($phone !== null) {
            $updates[] = 'phone = ?';
            $params[] = $phone;
        }
        if ($address !== null) {
            $updates[] = 'address = ?';
            $params[] = $address;
        }
        
        if (empty($updates)) {
            json(['error' => 'Aucune mise à jour fournie'], 400);
        }
        
        $updates[] = 'updated_at = NOW()';
        $params[] = $user['id'];
        
        $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        log_api('/api/user/profile', 'PUT', 200, $user['id'], 'Profile updated');
        json(['success' => true, 'message' => 'Profil mis à jour']);
    }
    
    json(['error' => 'Méthode non supportée'], 405);
}

// ============================================================
// ACTION: wallets - Portefeuilles multi-devises
// ============================================================
if ($action === 'wallets' && $method === 'GET') {
    if (!rate_limit('/api/user/wallets', 60)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    $stmt = $pdo->prepare('SELECT id, currency, balance, created_at, updated_at FROM wallets WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $wallets = $stmt->fetchAll();
    
    log_api('/api/user/wallets', 'GET', 200, $user['id'], 'Wallets retrieved');
    json(['success' => true, 'wallets' => $wallets]);
}

// ============================================================
// ACTION: transactions - Historique transactions wallet
// ============================================================
if ($action === 'transactions' && $method === 'GET') {
    if (!rate_limit('/api/user/transactions', 60)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;
    $walletId = $_GET['wallet_id'] ?? null;
    
    $where = 'WHERE w.user_id = ?';
    $params = [$user['id']];
    
    if ($walletId) {
        $where .= ' AND wt.wallet_id = ?';
        $params[] = $walletId;
    }
    
    $stmt = $pdo->prepare("
        SELECT wt.id, wt.wallet_id, wt.amount, wt.type, wt.description, wt.reference, wt.created_at,
               w.currency
        FROM wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        $where
        ORDER BY wt.created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();
    
    $countStmt = $pdo->prepare("
        SELECT COUNT(*) as cnt 
        FROM wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        $where
    ");
    $countStmt->execute($params);
    $total = $countStmt->fetch()['cnt'];
    
    log_api('/api/user/transactions', 'GET', 200, $user['id'], "Fetched $limit transactions");
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

// ============================================================
// ACTION: card_transactions - Historique transactions carte
// ============================================================
if ($action === 'card_transactions' && $method === 'GET') {
    if (!rate_limit('/api/user/card_transactions', 60)) {
        json(['error' => 'Trop de requêtes'], 429);
    }

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;
    $cardId = $_GET['card_id'] ?? null;
    
    $where = 'WHERE ct.user_id = ?';
    $params = [$user['id']];
    
    if ($cardId) {
        $where .= ' AND ct.card_id = ?';
        $params[] = $cardId;
    }
    
    $stmt = $pdo->prepare("
        SELECT ct.id, ct.card_id, ct.transaction_id, ct.amount, ct.type, ct.status,
               ct.description, ct.merchant_name, ct.merchant_category, ct.currency, ct.created_at
        FROM card_transactions ct
        $where
        ORDER BY ct.created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();
    
    $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM card_transactions ct $where");
    $countStmt->execute($params);
    $total = $countStmt->fetch()['cnt'];
    
    log_api('/api/user/card_transactions', 'GET', 200, $user['id'], "Fetched $limit card transactions");
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

// Action inconnue
log_api('/api/user', $method, 404, $user['id'], "Unknown action: $action");
json(['error' => 'Action inconnue: ' . $action], 404);
