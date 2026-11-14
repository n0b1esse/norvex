<?php
// send-inquiry.php — обработчик формы контактов: запись в MySQL + email владельцу
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

// Получаем поля формы
$name    = trim($_POST['name']    ?? '');
$company = trim($_POST['company'] ?? '');
$phone   = trim($_POST['phone']   ?? '');
$email   = trim($_POST['email']   ?? '');
$message = trim($_POST['message'] ?? '');

// Валидация必填 полей
if ($name === '' || $phone === '') {
    echo json_encode(['ok' => false, 'error' => 'Имя и телефон обязательны']);
    exit;
}

// Простая защита от спама (хотя бы одно поле должно быть заполнено)
if ($name === '' && $email === '' && $phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty submission']);
    exit;
}

try {
    $pdo = norvex_db();

    $stmt = $pdo->prepare("
        INSERT INTO inquiries (name, company, phone, email, message, lang, ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $lang = strtolower(trim($_POST['lang'] ?? ''));
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) {
        // запасной вариант — язык из адреса страницы, откуда отправлена форма
        $ref = $_SERVER['HTTP_REFERER'] ?? '';
        if (preg_match('#/(ru|en|ky)/#', $ref, $m)) {
            $lang = $m[1];
        } else {
            $lang = 'ru';
        }
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $stmt->execute([$name, $company, $phone, $email, $message, $lang, $ip]);
    $inquiryId = (int)$pdo->lastInsertId();

    // Отправляем email владельцу
    $subject = "Новая заявка с сайта norvexhse.com (#$inquiryId)";
    $body = "Поступила новая заявка с контактной формы сайта.\n\n";
    $body .= "Заявка №: $inquiryId\n";
    $body .= "Имя: $name\n";
    $body .= "Компания: $company\n";
    $body .= "Телефон: $phone\n";
    $body .= "Email: $email\n";
    $body .= "Язык: $lang\n";
    $body .= "Сообщение:\n$message\n";
    $body .= "\nIP: $ip\n";
    $body .= "Время: " . date('d.m.Y H:i:s') . "\n";

    $headers = "From: " . NORVEX_MAIL_FROM . "\r\n";
    $headers .= "Reply-To: " . ($email !== '' ? $email : NORVEX_MAIL_FROM) . "\r\n";
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    $recipient = norvex_inquiry_recipient();
    $mailSent = @mail($recipient, $subject, $body, $headers);

    echo json_encode([
        'ok' => true,
        'msg' => 'Заявка принята. Мы свяжемся с вами в ближайшее время.',
        'id' => $inquiryId,
        'mail_sent' => $mailSent,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
