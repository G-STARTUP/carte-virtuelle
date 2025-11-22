<?php
require_once __DIR__ . '/bootstrap.php';
$pdo = db();
$action = $_GET['action'] ?? '';
if (!rate_limit('auth:' . $action, 40, 60)) {
    log_api('auth:' . $action, $_SERVER['REQUEST_METHOD'], 429, null, 'rate limit');
    json(['success'=>false,'error'=>'Too Many Requests'],429);
}

if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    if (!$email || !$password) json(['success'=>false,'error'=>'email and password required'],400);
    $hash = password_hash($password, PASSWORD_BCRYPT);
    try {
        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
        $stmt->execute([$email,$hash]);
        log_api('auth:register','POST',200,null,'user registered');
        json(['success'=>true]);
    } catch (Throwable $e) {
        log_api('auth:register','POST',500,null,$e->getMessage());
        json(['success'=>false,'error'=>$e->getMessage()],500);
    }
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    if (!$email || !$password) json(['success'=>false,'error'=>'email and password required'],400);
    $stmt = $pdo->prepare('SELECT id,password_hash FROM users WHERE email=?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        log_api('auth:login','POST',401,null,'invalid credentials');
        json(['success'=>false,'error'=>'Invalid credentials'],401);
    }
    $payload = ['userId'=>$row['id'],'email'=>$email];
    $secret = $_ENV['JWT_SECRET'] ?? 'dev';
    require_once __DIR__ . '/utils/jwt.php';
    $token = jwt_sign($payload, $secret, 43200);
    log_api('auth:login','POST',200,$row['id'],'login ok');
    json(['success'=>true,'token'=>$token]);
}

log_api('auth:unknown',$_SERVER['REQUEST_METHOD'],404,null,'unknown action');
json(['success'=>false,'error'=>'Unknown action'],404);
