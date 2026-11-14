<?php
// admin/login.php — вход в админку
session_start();
require_once __DIR__ . '/../config.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    try {
        $pdo = norvex_db();
        $stmt = $pdo->prepare("SELECT id, password_hash FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $row = $stmt->fetch();
        if ($row && password_verify($password, $row['password_hash'])) {
            $_SESSION['norvex_admin'] = true;
            $_SESSION['norvex_admin_id'] = (int)$row['id'];
            header('Location: index.php');
            exit;
        } else {
            $error = 'Неверный логин или пароль';
        }
    } catch (Throwable $e) {
        $error = 'Ошибка входа: ' . $e->getMessage();
    }
}
if (norvex_is_admin()) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Вход в админку NORVEX</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#f3f4f6;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{background:#fff;padding:2rem;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);width:100%;max-width:400px}
h2{margin-top:0;color:#1a3a5c;font-size:1.25rem}
label{display:block;margin-bottom:0.4rem;font-weight:500;font-size:0.875rem;color:#374151}
input{width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.9rem;margin-bottom:1rem;box-sizing:border-box}
input:focus{outline:none;border-color:#1a3a5c}
.btn{width:100%;padding:0.6rem;background:#1a3a5c;color:#fff;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer}
.btn:hover{background:#16456b}
.alert{background:#fee2e2;color:#991b1b;padding:0.75rem;border-radius:6px;margin-bottom:1rem;font-size:0.9rem}
.small{display:block;margin-top:1rem;font-size:0.85rem;color:#6b7280;text-align:center}
</style>
</head>
<body>
<div class="card">
    <h2>Вход в админку</h2>
    <?php if ($error): echo '<div class="alert">' . htmlspecialchars($error) . '</div>'; endif; ?>
    <form method="post">
        <label for="username">Логин</label>
        <input type="text" name="username" id="username" required value="admin">
        <label for="password">Пароль</label>
        <input type="password" name="password" id="password" required placeholder="Пароль">
        <button type="submit" class="btn">Войти</button>
    </form>
    <div class="small">Первый вход: admin / admin123 — обязательно смените пароль в настройках.</div>
</div>
</body>
</html>
