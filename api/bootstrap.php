<?php
// Chargement environnement mutualisé
// Cherche env.ini dans plusieurs emplacements (ordre de priorité)
$envPaths = [
    __DIR__ . '/../secure/env.ini',  // Idéal (hors public_html)
    __DIR__ . '/env.ini',             // Fallback (dans api/)
];

foreach ($envPaths as $envPath) {
    if (file_exists($envPath)) {
        $env = parse_ini_file($envPath, false, INI_SCANNER_TYPED);
        foreach ($env as $k => $v) {
            $_ENV[$k] = $v;
        }
        break; // Stopper à la première trouvée
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function db() : PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $_ENV['MYSQL_HOST'] ?? 'localhost', $_ENV['MYSQL_DATABASE'] ?? 'carte');
        $pdo = new PDO($dsn, $_ENV['MYSQL_USER'] ?? 'root', $_ENV['MYSQL_PASSWORD'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function json($data, int $code = 200) : void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

require_once __DIR__ . '/utils/jwt.php';

function bearerUser() : ?array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) return null;
    $token = substr($auth, 7);
    $secret = $_ENV['JWT_SECRET'] ?? 'dev';
    return jwt_verify($token, $secret);
}

function clientIp(): string {
    return $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? '0.0.0.0';
}

function log_api(string $route, string $method, int $status, ?int $userId, string $message=''): void {
    try {
        $pdo = db();
        $stmt = $pdo->prepare('INSERT INTO api_logs (route, method, status_code, user_id, ip_address, message) VALUES (?,?,?,?,?,?)');
        $stmt->execute([$route, $method, $status, $userId, clientIp(), substr($message,0,500)]);
    } catch (Throwable $e) {
        // swallow logging errors
    }
}

function rate_limit(string $route, int $maxHits = 60, int $windowSeconds = 60): bool {
    try {
        $pdo = db();
        $ip = clientIp();
        $windowStart = date('Y-m-d H:i:00'); // minute bucket
        $stmt = $pdo->prepare('SELECT hits FROM api_rate_limiter WHERE ip_address=? AND route=? AND window_start=?');
        $stmt->execute([$ip, $route, $windowStart]);
        $row = $stmt->fetch();
        if (!$row) {
            $ins = $pdo->prepare('INSERT INTO api_rate_limiter (ip_address, route, hits, window_start) VALUES (?,?,1,?)');
            $ins->execute([$ip,$route,$windowStart]);
            return true;
        }
        if ($row['hits'] >= $maxHits) return false;
        $upd = $pdo->prepare('UPDATE api_rate_limiter SET hits = hits + 1 WHERE ip_address=? AND route=? AND window_start=?');
        $upd->execute([$ip,$route,$windowStart]);
        return true;
    } catch (Throwable $e) {
        return true; // fail-open
    }
}
