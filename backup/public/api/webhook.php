<?php
require_once __DIR__ . '/bootstrap.php';
$pdo = db();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json(['success'=>false,'error'=>'Method not allowed'],405);
// Basic signature check placeholder; implement provider-specific verification
$provider = $_GET['provider'] ?? 'strowallet';
$eventType = $_SERVER['HTTP_X_EVENT_TYPE'] ?? 'unknown';
$payloadRaw = file_get_contents('php://input');
$payload = json_decode($payloadRaw, true);
if (!$payload) json(['success'=>false,'error'=>'Invalid JSON'],400);
try {
    $stmt = $pdo->prepare('INSERT INTO webhook_events (provider, event_type, payload) VALUES (?,?,JSON_OBJECT())');
    $stmt->execute([$provider,$eventType]);
    log_api('webhook:' . $provider,'POST',200,null,'event stored');
    // TODO: queue processing via cron scanning webhook_events.processed=0
    json(['success'=>true]);
} catch (Throwable $e) {
    log_api('webhook:' . $provider,'POST',500,null,$e->getMessage());
    json(['success'=>false,'error'=>$e->getMessage()],500);
}
