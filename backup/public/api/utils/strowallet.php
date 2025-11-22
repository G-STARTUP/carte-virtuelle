<?php
/**
 * Strowallet API helper with fallback base URLs.
 * NOTE: Les chemins exacts peuvent varier; ajuster $endpoints si besoin.
 */

function strowallet_bases(): array {
    $configured = $_ENV['STROWALLET_BASES'] ?? '';
    if ($configured) {
        return array_filter(array_map('trim', explode(',', $configured)));
    }
    return [
        'https://strowallet.com/api/bitvcard',
        'https://strowallet.com/api'
    ];
}

function strowallet_public_key(): string {
    return $_ENV['STROWALLET_PUBLIC_KEY'] ?? '';
}

function strowallet_request(string $path, array $payload, string $method = 'POST'): array {
    $bases = strowallet_bases();
    $publicKey = strowallet_public_key();
    if ($publicKey && !isset($payload['public_key'])) {
        $payload['public_key'] = $publicKey;
    }
    $lastError = 'Unknown error';
    foreach ($bases as $base) {
        $url = rtrim($base, '/') . '/' . ltrim($path, '/');
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_POSTFIELDS => $method === 'POST' ? json_encode($payload) : null,
        ]);
        $raw = curl_exec($ch);
        $err = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($err) { $lastError = $err; continue; }
        $json = json_decode($raw, true);
        if ($status >= 200 && $status < 300 && is_array($json) && ($json['success'] ?? false)) {
            return ['ok' => true, 'data' => $json['response'] ?? $json, 'raw' => $json];
        }
        $lastError = is_array($json) ? ($json['message'] ?? 'API error status ' . $status) : 'Invalid JSON';
    }
    return ['ok' => false, 'error' => $lastError];
}
