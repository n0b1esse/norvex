<?php
// config.example.php — шаблон конфигурации. Скопируйте в config.php и заполните своими значениями.
// config.php НЕ коммитится в git (см. .gitignore) и не попадает в архив проекта.
// На сервере файл лежит в корне домена (/www/norvexhse.com/config.php).

if (!defined('NORVEX_DB_HOST'))  define('NORVEX_DB_HOST',  '127.0.0.1');
if (!defined('NORVEX_DB_NAME'))  define('NORVEX_DB_NAME',  'db_name');
if (!defined('NORVEX_DB_USER'))  define('NORVEX_DB_USER',  'db_user');
if (!defined('NORVEX_DB_PASS'))  define('NORVEX_DB_PASS',  'CHANGE_ME');

// Почта владельца сайта — на неё приходят заявки
if (!defined('NORVEX_MAIL_TO'))   define('NORVEX_MAIL_TO',   'owner@example.com');
if (!defined('NORVEX_MAIL_FROM')) define('NORVEX_MAIL_FROM', 'noreply@example.com');

// Соль для служебных нужд (поменять на случайную строку при первом деплое)
if (!defined('NORVEX_SALT'))     define('NORVEX_SALT',      'change-me-to-random-string');

// Получатель заявок: значение из админки (settings) имеет приоритет над константой
function norvex_inquiry_recipient() {
    try {
        $pdo = norvex_db();
        $stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = 'inquiry_email' ORDER BY updated_at DESC LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row && !empty(trim($row['value']))) {
            return trim($row['value']);
        }
    } catch (Throwable $e) {
        // fallback на константу
    }
    return NORVEX_MAIL_TO;
}

// PDO подключение
function norvex_db() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . NORVEX_DB_HOST . ";dbname=" . NORVEX_DB_NAME . ";charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, NORVEX_DB_USER, NORVEX_DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['ok' => false, 'error' => 'DB connect failed']));
        }
    }
    return $pdo;
}

// Проверка сессии админа
function norvex_is_admin() {
    return !empty($_SESSION['norvex_admin']);
}

function norvex_require_admin() {
    if (!norvex_is_admin()) {
        header('Location: /admin/login.php');
        exit;
    }
}
