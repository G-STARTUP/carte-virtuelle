<?php
/**
 * Payment endpoints for Moneroo and NowPayments
 * 
 * Endpoints:
 * - POST /api/payment?action=moneroo - Initialize Moneroo payment
 * - POST /api/payment?action=nowpayments - Initialize NowPayments deposit
 */

require_once __DIR__ . '/bootstrap.php';

// Verify authentication
$user = bearerUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit;
}

$action = $_GET['action'] ?? '';

// Rate limiting
rate_limit($user['id'], 30); // 30 requests per minute

// Log API request
log_api('/api/payment', $action, $user['id'], json_encode($_POST));

switch ($action) {
    case 'moneroo':
        initializeMonerooPayment($user);
        break;
        
    case 'nowpayments':
        initializeNowPaymentsDeposit($user);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
        break;
}

/**
 * Initialize Moneroo payment
 */
function initializeMonerooPayment($user) {
    $db = db();
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true);
    $amount = floatval($input['amount'] ?? 0);
    $currency = $input['currency'] ?? 'XOF';
    $wallet_id = $input['wallet_id'] ?? null;
    
    // Validate
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid amount']);
        return;
    }
    
    if (!$wallet_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Wallet ID required']);
        return;
    }
    
    // Verify wallet belongs to user
    $stmt = $db->prepare("SELECT * FROM wallets WHERE id = ? AND user_id = ?");
    $stmt->execute([$wallet_id, $user['id']]);
    $wallet = $stmt->fetch();
    
    if (!$wallet) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Wallet not found']);
        return;
    }
    
    // Get Moneroo API key from environment
    $moneroo_api_key = $_ENV['MONEROO_API_KEY'] ?? '';
    
    if (!$moneroo_api_key) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Moneroo API not configured']);
        return;
    }
    
    // Create payment intent with Moneroo
    $moneroo_url = 'https://api.moneroo.io/v1/payment-intents';
    
    $payload = [
        'amount' => $amount,
        'currency' => $currency,
        'description' => "Deposit to wallet {$wallet['currency']}",
        'customer' => [
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name']
        ],
        'return_url' => $_ENV['APP_URL'] . '/deposit?payment=success&paymentId={PAYMENT_ID}',
        'cancel_url' => $_ENV['APP_URL'] . '/deposit?payment=failed',
        'metadata' => [
            'user_id' => $user['id'],
            'wallet_id' => $wallet_id,
            'type' => 'deposit'
        ]
    ];
    
    $ch = curl_init($moneroo_url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $moneroo_api_key
        ]
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200 && $http_code !== 201) {
        error_log("Moneroo API error: HTTP {$http_code} - {$response}");
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create payment intent']);
        return;
    }
    
    $result = json_decode($response, true);
    
    if (!$result || !isset($result['payment_url'])) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Invalid response from payment provider']);
        return;
    }
    
    // Store payment record in database
    $stmt = $db->prepare("
        INSERT INTO moneroo_payments (user_id, wallet_id, payment_id, amount, currency, status, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
    ");
    
    $payment_id = $result['id'] ?? uniqid('mon_');
    $metadata = json_encode($result);
    
    $stmt->execute([
        $user['id'],
        $wallet_id,
        $payment_id,
        $amount,
        $currency,
        $metadata
    ]);
    
    // Return payment URL
    echo json_encode([
        'success' => true,
        'data' => [
            'payment_url' => $result['payment_url'],
            'payment_id' => $payment_id,
            'amount' => $amount,
            'currency' => $currency
        ]
    ]);
}

/**
 * Initialize NowPayments deposit (cryptocurrency)
 */
function initializeNowPaymentsDeposit($user) {
    $db = db();
    
    // Get input
    $input = json_decode(file_get_contents('php://input'), true);
    $amount = floatval($input['amount'] ?? 0);
    $currency = $input['currency'] ?? 'USD';
    $wallet_id = $input['wallet_id'] ?? null;
    $crypto_currency = $input['crypto_currency'] ?? 'USDT';
    
    // Validate
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid amount']);
        return;
    }
    
    if (!$wallet_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Wallet ID required']);
        return;
    }
    
    // Verify wallet belongs to user
    $stmt = $db->prepare("SELECT * FROM wallets WHERE id = ? AND user_id = ?");
    $stmt->execute([$wallet_id, $user['id']]);
    $wallet = $stmt->fetch();
    
    if (!$wallet) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Wallet not found']);
        return;
    }
    
    // Get NowPayments API key
    $nowpayments_api_key = $_ENV['NOWPAYMENTS_API_KEY'] ?? '';
    
    if (!$nowpayments_api_key) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'NowPayments API not configured']);
        return;
    }
    
    // Create payment with NowPayments
    $nowpayments_url = 'https://api.nowpayments.io/v1/payment';
    
    $payload = [
        'price_amount' => $amount,
        'price_currency' => $currency,
        'pay_currency' => $crypto_currency,
        'ipn_callback_url' => $_ENV['APP_URL'] . '/api/webhook?type=nowpayments',
        'success_url' => $_ENV['APP_URL'] . '/deposit?payment=success',
        'cancel_url' => $_ENV['APP_URL'] . '/deposit?payment=failed',
        'order_id' => uniqid('deposit_'),
        'order_description' => "Wallet deposit - {$wallet['currency']}",
        'is_fixed_rate' => true,
        'is_fee_paid_by_user' => false
    ];
    
    $ch = curl_init($nowpayments_url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . $nowpayments_api_key
        ]
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200 && $http_code !== 201) {
        error_log("NowPayments API error: HTTP {$http_code} - {$response}");
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create payment']);
        return;
    }
    
    $result = json_decode($response, true);
    
    if (!$result || !isset($result['payment_id'])) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Invalid response from payment provider']);
        return;
    }
    
    // Store payment record
    $stmt = $db->prepare("
        INSERT INTO nowpayments_transactions (user_id, wallet_id, payment_id, amount, currency, crypto_currency, status, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, NOW(), NOW())
    ");
    
    $payment_id = $result['payment_id'];
    $metadata = json_encode($result);
    
    $stmt->execute([
        $user['id'],
        $wallet_id,
        $payment_id,
        $amount,
        $currency,
        $crypto_currency,
        $metadata
    ]);
    
    // Return payment details
    echo json_encode([
        'success' => true,
        'data' => [
            'payment_id' => $payment_id,
            'payment_url' => $result['invoice_url'] ?? null,
            'pay_address' => $result['pay_address'] ?? null,
            'pay_amount' => $result['pay_amount'] ?? $amount,
            'pay_currency' => $crypto_currency,
            'amount' => $amount,
            'currency' => $currency
        ]
    ]);
}
