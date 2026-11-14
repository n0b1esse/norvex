<?php
// admin/upload.php — приём файлов из админки (фото сотрудников, документы)
// Файлы складываются в /uploads/<kind>/ и возвращается публичный путь.
//
// POST multipart/form-data:
//   file    — сам файл
//   kind   — team | documents
//
// Ответ: { "ok": true, "url": "/uploads/team/photo-1730000000-ab12.jpg", "size": 12345 }

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/bootstrap.php';   // требует авторизацию

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

$kind = $_POST['kind'] ?? 'team';
$allowedKinds = ['team', 'documents', 'news', 'clients', 'hero'];
if (!in_array($kind, $allowedKinds, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'unknown kind']);
    exit;
}

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $err = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'upload failed, code=' . $err]);
    exit;
}

$file = $_FILES['file'];
$maxSize = 10 * 1024 * 1024; // 10 МБ
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Файл больше 10 МБ']);
    exit;
}

// --- Проверка типа по содержимому, а не по расширению ---
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string)$finfo->file($file['tmp_name']);

$imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
$docMimes   = ['application/pdf'];

if ($kind === 'team' || $kind === 'news') {
    if (!in_array($mime, $imageMimes, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Только изображения (jpg, png, webp, avif, gif, svg)']);
        exit;
    }
} elseif ($kind === 'hero') {
    // Фоновые изображения: только растровые (SVG в фоне не нужен)
    if (!in_array($mime, $imageMimes, true) || $mime === 'image/svg+xml') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Только изображения (jpg, png, webp, avif, gif)']);
        exit;
    }
} elseif ($kind === 'clients') {
    // Логотипы клиентов: картинки + SVG
    if (!in_array($mime, $imageMimes, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Только изображения или SVG']);
        exit;
    }
} else {
    if (!in_array($mime, $docMimes, true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Только PDF-файлы']);
        exit;
    }
}

// --- Расширение из MIME (не из имени файла) ---
$extMap = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/avif' => 'avif',
    'image/gif'  => 'gif',
    'image/svg+xml' => 'svg',
    'application/pdf' => 'pdf',
];
$ext = $extMap[$mime] ?? 'bin';

// --- Каталог назначения ---
$uploadRoot = dirname(__DIR__) . '/uploads';
$dir = $uploadRoot . '/' . $kind;
if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Не удалось создать каталог uploads']);
    exit;
}

// --- Имя файла: случайное, чтобы не было коллизий и не подставлялись чужие имена ---
$base = pathinfo((string)$file['name'], PATHINFO_FILENAME);
$slug = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $base);
$slug = trim((string)$slug, '-');
if ($slug === '') $slug = 'file';
$slug = mb_substr($slug, 0, 40);
$name = $slug . '-' . time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;

$target = $dir . '/' . $name;
$ok = is_uploaded_file($file['tmp_name']) && @move_uploaded_file($file['tmp_name'], $target);

if (!$ok) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Не удалось сохранить файл']);
    exit;
}

@chmod($target, 0644);

echo json_encode([
    'ok' => true,
    'url' => '/uploads/' . $kind . '/' . $name,
    'size' => (int)$file['size'],
    'mime' => $mime,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
