<?php
// admin/bootstrap.php — общая инициализация админки (сессия, авторизация, диагностика ошибок)
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
require_once __DIR__ . '/../config.php';

// CSRF: токен в сессии, проверяется на всех POST (кроме login.php, которая своего bootstrap не грузит)
if (empty($_SESSION['norvex_csrf'])) {
    $_SESSION['norvex_csrf'] = bin2hex(random_bytes(32));
}

/** Токен для форм админки: <input type="hidden" name="csrf" value="<?= norvex_csrf_token() ?>"> */
function norvex_csrf_token(): string {
    return (string)($_SESSION['norvex_csrf'] ?? '');
}

$__script = basename($_SERVER['SCRIPT_NAME'] ?? '');
if ($__script !== 'login.php' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $sent = $_POST['csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals(norvex_csrf_token(), (string)$sent)) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        exit('CSRF-токен не совпал. Обновите страницу и повторите.');
    }
}

// Диагностика: ошибки не показываем пользователю, но фатальные выводим (для диагностики 500)
ini_set('display_errors', '0');
error_reporting(E_ALL);

if (!norvex_is_admin()) {
    header('Location: login.php');
    exit;
}

/** Следующий номер сортировки для новой записи.
 *  Для documents считает отдельно по каждой категории, для остальных — по языку.
 *  Новая запись автоматически встаёт в конец своего списка. */
function next_sort_order(PDO $pdo, string $table, string $lang, array $where = []): int {
    $sql = "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM `$table` WHERE lang = ?";
    $params = [$lang];
    foreach ($where as $col => $val) {
        if ($val === '' || $val === null) continue;
        $sql .= " AND `$col` = ?";
        $params[] = $val;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return (int)$stmt->fetchColumn();
}

set_exception_handler(function ($e) {
    error_log('NORVEX admin exception: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
    }
    echo "Ошибка: " . $e->getMessage() . " (" . basename($e->getFile()) . ':' . $e->getLine() . ")";
    exit;
});

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        error_log('NORVEX admin fatal: ' . $err['message'] . ' @ ' . $err['file'] . ':' . $err['line']);
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: text/plain; charset=utf-8');
        }
        echo "Фатальная ошибка: " . $err['message'] . " (" . basename($err['file']) . ':' . $err['line'] . ")";
    }
});
