<?php
function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/')); // padding not strictly needed
}
function jwt_sign(array $payload, string $secret, int $ttlSeconds = 43200): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $now = time();
    $payload['iat'] = $payload['iat'] ?? $now;
    $payload['exp'] = $payload['exp'] ?? ($now + $ttlSeconds);
    $h = base64url_encode(json_encode($header, JSON_UNESCAPED_SLASHES));
    $p = base64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES));
    $sig = hash_hmac('sha256', "$h.$p", $secret, true);
    $s = base64url_encode($sig);
    return "$h.$p.$s";
}
function jwt_verify(string $token, string $secret): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h,$p,$s] = $parts;
    $calc = base64url_encode(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($calc, $s)) return null;
    $payload = json_decode(base64url_decode($p), true);
    if (!is_array($payload)) return null;
    if (($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}
