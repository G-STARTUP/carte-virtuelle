<?php
/**
 * Installation script: executes mysql_schema.sql to create tables.
 * SECURITY: Requires token parameter matching INSTALL_SECRET in env.
 * Delete this file after successful run.
 */
require_once __DIR__ . '/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success'=>false,'error'=>'Method not allowed']);
    exit;
}

$token = $_GET['token'] ?? ($_POST['token'] ?? '');
$secret = $_ENV['INSTALL_SECRET'] ?? null;
if (!$secret) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'INSTALL_SECRET missing in env']);
    exit;
}
if (!hash_equals($secret, $token)) {
    http_response_code(403);
    echo json_encode(['success'=>false,'error'=>'Invalid token']);
    exit;
}

$schemaPath = __DIR__ . '/../mysql_schema.sql';
if (!file_exists($schemaPath)) {
    http_response_code(404);
    echo json_encode(['success'=>false,'error'=>'mysql_schema.sql not found']);
    exit;
}

try {
    $pdo = db();
    $sqlRaw = file_get_contents($schemaPath);
    // Basic statement splitter: split on semicolon followed by newline.
    $statements = preg_split('/;\s*\n/', $sqlRaw); // keep it simple
    $executed = [];
    foreach ($statements as $stmt) {
        $trim = trim($stmt);
        if ($trim === '' || str_starts_with($trim,'--')) continue;
        try {
            $pdo->exec($trim);
            $executed[] = substr($trim,0,60) . (strlen($trim)>60?'...':'');
        } catch (Throwable $e) {
            // Ignore duplicate / existing errors, capture message
            $executed[] = 'SKIP: ' . substr($trim,0,40) . ' => ' . $e->getMessage();
        }
    }

    // Simple verification list
    $tables = ['users','strowallet_customers','strowallet_cards','api_logs','webhook_events','api_rate_limiter'];
    $presence = [];
    foreach ($tables as $t) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$t]);
        $presence[$t] = $stmt->fetch() ? 'OK' : 'MISSING';
    }

    echo json_encode([
        'success'=>true,
        'executed_count'=>count($executed),
        'executed'=>$executed,
        'tables'=>$presence,
        'recommendation'=>'Remove install.php now.'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
