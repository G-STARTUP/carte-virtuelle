<?php
// ===== DÉSACTIVER L'AFFICHAGE DES ERREURS PHP =====
// Empêche PHP d'afficher les erreurs HTML qui cassent le JSON
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Gestionnaire d'erreurs global pour renvoyer du JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // Log l'erreur (optionnel)
    error_log("PHP Error [$errno]: $errstr in $errfile:$errline");
    
    // Retourner une réponse JSON propre
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'error' => 'Internal Server Error',
        'details' => $_ENV['APP_ENV'] === 'development' ? $errstr : null
    ]);
    exit;
});

// Gestionnaire d'exceptions global
set_exception_handler(function($exception) {
    error_log("PHP Exception: " . $exception->getMessage());
    
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'error' => 'Internal Server Error',
        'details' => $_ENV['APP_ENV'] === 'development' ? $exception->getMessage() : null
    ]);
    exit;
});

// Gestionnaire d'arrêt fatal
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        error_log("PHP Fatal Error: " . $error['message']);
        
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
        }
        echo json_encode([
            'success' => false,
            'error' => 'Internal Server Error'
        ]);
    }
});

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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
        
        // Charger la configuration API depuis la base de données
        try {
            $stmt = $pdo->query('SELECT config_key, config_value FROM api_config WHERE config_value != ""');
            while ($row = $stmt->fetch()) {
                $_ENV[$row['config_key']] = $row['config_value'];
            }
        } catch (Throwable $e) {
            // Table api_config n'existe pas encore (première installation)
        }
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
