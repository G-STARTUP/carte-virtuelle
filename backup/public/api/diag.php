<?php
// Diagnostic script: affiche environnement, extensions, base de données et configuration Strowallet.
// A SUPPRIMER ou PROTEGER (renommer) après analyse.

require_once __DIR__ . '/bootstrap.php';

// Écrase l'en-tête JSON posé par bootstrap
header('Content-Type: text/plain; charset=utf-8');

function line($label, $value) {
    echo str_pad($label, 35, ' ', STR_PAD_RIGHT) . ': ' . $value . "\n";
}

line('PHP Version', PHP_VERSION);
line('SAPI', php_sapi_name());
line('Document Root', $_SERVER['DOCUMENT_ROOT'] ?? '');
line('Current Script', __FILE__);

// Extensions clés
$exts = ['pdo','pdo_mysql','curl','json','openssl'];
foreach ($exts as $e) {
    line('Extension '.$e, extension_loaded($e) ? 'OK' : 'MISSING');
}

// Env variables essentielles
$envKeys = ['MYSQL_HOST','MYSQL_USER','MYSQL_DATABASE','JWT_SECRET','STROWALLET_PUBLIC_KEY','STROWALLET_BASES'];
foreach ($envKeys as $k) {
    line('Env '.$k, isset($_ENV[$k]) ? (strlen((string)$_ENV[$k]) ? 'SET' : 'EMPTY') : 'NOT SET');
}

// Connexion DB
try {
    $pdo = db();
    $ver = $pdo->query('SELECT VERSION() AS v')->fetch()['v'] ?? 'unknown';
    line('MySQL Connection', 'OK');
    line('MySQL Version', $ver);

    // Test JSON support
    try {
        $pdo->query("SELECT JSON_OBJECT('k','v') AS j");
        line('MySQL JSON_OBJECT', 'OK');
    } catch (Throwable $e) {
        line('MySQL JSON_OBJECT', 'ERROR: '.$e->getMessage());
    }

} catch (Throwable $e) {
    line('MySQL Connection', 'FAIL: '.$e->getMessage());
}

// Test requête simple sur table users (si existe)
try {
    $count = $pdo->query('SELECT COUNT(*) AS c FROM users')->fetch()['c'] ?? 'n/a';
    line('Users count', $count);
} catch (Throwable $e) {
    line('Users count', 'ERROR: '.$e->getMessage());
}

// Vérification écriture logs API
try {
    $stmt = $pdo->prepare('INSERT INTO api_logs (route, method, status_code, user_id, ip_address, message) VALUES (?,?,?,?,?,?)');
    $stmt->execute(['diag','GET',200,null,($_SERVER['REMOTE_ADDR'] ?? 'unknown'),'diag test']);
    line('api_logs insert', 'OK');
} catch (Throwable $e) {
    line('api_logs insert', 'ERROR: '.$e->getMessage());
}

// Test requête externe légère (HEAD) vers Strowallet
if (!empty($_ENV['STROWALLET_PUBLIC_KEY'])) {
    $ch = curl_init('https://strowallet.com');
    curl_setopt_array($ch,[CURLOPT_NOBODY=>true,CURLOPT_TIMEOUT=>5,CURLOPT_RETURNTRANSFER=>true]);
    $ok = curl_exec($ch);
    $err = curl_error($ch);
    $code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    curl_close($ch);
    line('Reach strowallet.com', $err ? 'ERROR: '.$err : 'HTTP '.$code);
} else {
    line('Reach strowallet.com', 'SKIPPED (no public key)');
}

line('Rate limit table present', (function(){
    try { global $pdo; $pdo->query('SELECT 1 FROM api_rate_limiter LIMIT 1'); return 'YES'; } catch (Throwable $e) { return 'NO'; }
})());

line('Webhook events table present', (function(){
    try { global $pdo; $pdo->query('SELECT 1 FROM webhook_events LIMIT 1'); return 'YES'; } catch (Throwable $e) { return 'NO'; }
})());

echo "\n--- END DIAG ---\n";
