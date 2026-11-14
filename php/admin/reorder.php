<?php
// admin/reorder.php — перестановка записей drag-and-drop (JSON).
require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$table = (string)($data['table'] ?? '');
$lang  = (string)($data['lang'] ?? '');
$ids   = is_array($data['ids'] ?? null) ? $data['ids'] : [];
$ids   = array_values(array_filter(array_map('intval', $ids), function ($n) { return $n > 0; }));

// Белый список таблиц — только с sort_order и id
$allowed = ['faq', 'news', 'team', 'clients', 'services'];
if (!in_array($table, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'unknown table']);
    exit;
}
if ($lang !== '' && !in_array($lang, ['ru', 'en', 'ky'], true)) $lang = '';
if (!$ids) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty ids']);
    exit;
}
if (count($ids) > 1000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'too many ids']);
    exit;
}

try {
    $pdo = norvex_db();
    $sql = "UPDATE `$table` SET sort_order = ? WHERE id = ?";
    if ($lang !== '') $sql .= " AND lang = ?";
    $stmt = $pdo->prepare($sql);
    $pdo->beginTransaction();
    foreach ($ids as $i => $id) {
        if ($lang !== '') $stmt->execute([$i + 1, $id, $lang]);
        else $stmt->execute([$i + 1, $id]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    if (isset($pdo)) $pdo->rollBack();
    error_log('NORVEX reorder error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db error']);
    exit;
}

echo json_encode(['ok' => true, 'updated' => count($ids)], JSON_UNESCAPED_UNICODE);
