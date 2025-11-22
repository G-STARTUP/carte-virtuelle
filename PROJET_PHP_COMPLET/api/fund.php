<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/utils/strowallet.php';
$pdo = db();
if (!rate_limit('card:fund', 20, 60)) json(['success'=>false,'error'=>'Too Many Requests'],429);
$user = bearerUser();
if (!$user) json(['success'=>false,'error'=>'Unauthorized'],401);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json(['success'=>false,'error'=>'Method not allowed'],405);
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$cardId = $input['card_id'] ?? '';
$amount = (float)($input['amount'] ?? 0);
if (!$cardId || $amount <= 0) json(['success'=>false,'error'=>'Invalid payload'],400);

try {
    $stmt = $pdo->prepare('SELECT id, balance FROM strowallet_cards WHERE card_id=? AND user_id=?');
    $stmt->execute([$cardId,$user['userId']]);
    $card = $stmt->fetch();
    if (!$card) json(['success'=>false,'error'=>'Card not found'],404);

    $resp = strowallet_request('fund-card', [
        'card_id' => $cardId,
        'amount' => $amount,
    ], 'POST');
    if (!$resp['ok']) {
        log_api('card:fund','POST',400,$user['userId'],'provider error');
        json(['success'=>false,'error'=>'Provider error: '.$resp['error']],400);
    }
    $provider = $resp['data'];
    $reportedBalance = $provider['balance'] ?? ($card['balance'] + $amount);
    $upd = $pdo->prepare('UPDATE strowallet_cards SET balance=?, raw_response=? WHERE card_id=?');
    $upd->execute([$reportedBalance, json_encode($provider), $cardId]);
    log_api('card:fund','POST',200,$user['userId'],'funded real');
    json(['success'=>true,'card_id'=>$cardId,'balance'=>$reportedBalance,'provider'=>$provider]);
} catch (Throwable $e) {
    log_api('card:fund','POST',500,$user['userId'],$e->getMessage());
    json(['success'=>false,'error'=>$e->getMessage()],500);
}
