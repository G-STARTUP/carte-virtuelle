<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/utils/strowallet.php';
$pdo = db();
if (!rate_limit('cards:get', 120, 60)) {
    log_api('cards:get', $_SERVER['REQUEST_METHOD'],429,null,'rate limit');
    json(['success'=>false,'error'=>'Too Many Requests'],429);
}
$user = bearerUser();
if (!$user) { log_api('cards:get',$_SERVER['REQUEST_METHOD'],401,null,'unauthorized'); json(['success'=>false,'error'=>'Unauthorized'],401); }

$path = $_GET['path'] ?? ''; // e.g. cards.php?path=123
$cardId = $path;
if (!$cardId) { log_api('cards:get',$_SERVER['REQUEST_METHOD'],400,$user['userId'] ?? null,'missing card id'); json(['success'=>false,'error'=>'Missing card id'],400); }

try {
    $stmt = $pdo->prepare('SELECT * FROM strowallet_cards WHERE card_id = ? AND user_id = ?');
    $stmt->execute([$cardId, $user['userId']]);
    $card = $stmt->fetch();
    if (!$card) { log_api('cards:get',$_SERVER['REQUEST_METHOD'],404,$user['userId'],'card not found'); json(['success'=>false,'error'=>'Card not found'],404); }

    // External API call
    $resp = strowallet_request('fetch-card-detail/', [
        'card_id' => $cardId,
    ], 'POST');
    if ($resp['ok']) {
        $details = $resp['data']['card_detail'] ?? $resp['data'];
        // Update selective fields if present
        try {
            $upd = $pdo->prepare('UPDATE strowallet_cards SET balance = COALESCE(?, balance), status = COALESCE(?, status), card_number = COALESCE(?, card_number), name_on_card = COALESCE(?, name_on_card), expiry_month = COALESCE(?, expiry_month), expiry_year = COALESCE(?, expiry_year), raw_response = ? WHERE card_id = ?');
            $expiryParts = isset($details['expiry']) ? explode('/', $details['expiry']) : [null,null];
            $upd->execute([
                $details['balance'] ?? null,
                $details['card_status'] ?? null,
                $details['last4'] ?? null,
                $details['name_on_card'] ?? null,
                $expiryParts[0] ?? null,
                $expiryParts[1] ?? null,
                json_encode($details),
                $cardId
            ]);
            // Refresh card row
            $stmt2 = $pdo->prepare('SELECT * FROM strowallet_cards WHERE card_id = ? AND user_id = ?');
            $stmt2->execute([$cardId, $user['userId']]);
            $card = $stmt2->fetch();
        } catch (Throwable $e2) {
            log_api('cards:get',$_SERVER['REQUEST_METHOD'],200,$user['userId'],'update fail');
        }
        log_api('cards:get',$_SERVER['REQUEST_METHOD'],200,$user['userId'],'ok provider');
        json(['success'=>true,'card'=>$card,'provider'=>$details]);
    }
    log_api('cards:get',$_SERVER['REQUEST_METHOD'],200,$user['userId'],'ok no provider');
    json(['success'=>true,'card'=>$card,'provider_error'=>$resp['error'] ?? null]);
} catch (Throwable $e) {
    log_api('cards:get',$_SERVER['REQUEST_METHOD'],500,$user['userId'] ?? null,$e->getMessage());
    json(['success'=>false,'error'=>$e->getMessage()],500);
}
