<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/utils/strowallet.php';
$pdo = db();
if (!rate_limit('customer:create', 30, 60)) json(['success'=>false,'error'=>'Too Many Requests'],429);
$user = bearerUser();
if (!$user) json(['success'=>false,'error'=>'Unauthorized'],401);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json(['success'=>false,'error'=>'Method not allowed'],405);
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$first = trim($input['first_name'] ?? '');
$last = trim($input['last_name'] ?? '');
$email = trim($input['customer_email'] ?? '');
if (!$first || !$last || !$email) json(['success'=>false,'error'=>'Missing fields'],400);

try {
    $payload = [
        'firstName' => $first,
        'lastName' => $last,
        'customerEmail' => $email,
        'phoneNumber' => $input['phone'] ?? '',
        'dateOfBirth' => $input['date_of_birth'] ?? '',
        'line1' => $input['address'] ?? '',
        'state' => $input['state'] ?? '',
        'zipCode' => $input['zip_code'] ?? '',
        'city' => $input['city'] ?? '',
        'country' => $input['country'] ?? '',
        'idType' => $input['id_type'] ?? 'PASSPORT',
        'idNumber' => $input['id_number'] ?? (string)random_int(100000,999999),
        'idImage' => $input['id_image'] ?? '',
        'userPhoto' => $input['user_photo'] ?? '',
        'houseNumber' => $input['house_number'] ?? '1'
    ];
    $resp = strowallet_request('create-user', $payload, 'POST');
    if (!$resp['ok']) {
        log_api('customer:create','POST',400,$user['userId'],'strowallet fail');
        json(['success'=>false,'error'=>'Provider error: '.$resp['error']],400);
    }
    $provider = $resp['data'];
    $customerId = $provider['customerId'] ?? ('cust_' . bin2hex(random_bytes(6)));
    $stmt = $pdo->prepare('INSERT INTO strowallet_customers (user_id, customer_id, customer_email, first_name, last_name, phone_number, data) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([$user['userId'],$customerId,$email,$first,$last,$input['phone'] ?? null,json_encode($provider)]);
    log_api('customer:create','POST',200,$user['userId'],'created real');
    json(['success'=>true,'customer_id'=>$customerId,'provider'=>$provider]);
} catch (Throwable $e) {
    log_api('customer:create','POST',500,$user['userId'],$e->getMessage());
    json(['success'=>false,'error'=>$e->getMessage()],500);
}
