<?php
// admin/content-save.php — сохранение правок текстов из инлайн-редактора (JSON).
require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || !isset($data['changes']) || !is_array($data['changes'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bad payload']);
    exit;
}

$langs = ['ru', 'en', 'ky'];
$saved = 0;

try {
    $pdo = norvex_db();
    $stmt = $pdo->prepare(
        "INSERT INTO content (page_key, block_key, slot_key, lang, `value`)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)"
    );
    $pdo->beginTransaction();
    foreach ($data['changes'] as $c) {
        $page  = trim((string)($c['page'] ?? ''));
        $block = trim((string)($c['block'] ?? ''));
        $slot  = trim((string)($c['slot'] ?? ''));
        $lang  = (string)($c['lang'] ?? '');
        $value = (string)($c['value'] ?? '');
        if ($page === '' || $block === '' || $slot === '' || !in_array($lang, $langs, true)) continue;
        $stmt->execute([$page, $block, $slot, $lang, $value]);
        $saved++;
    }
    $pdo->commit();
} catch (Throwable $e) {
    if (isset($pdo)) $pdo->rollBack();
    error_log('NORVEX content-save error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db error']);
    exit;
}

echo json_encode(['ok' => true, 'saved' => $saved], JSON_UNESCAPED_UNICODE);
