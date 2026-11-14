<?php
// admin/settings.php — настройки сайта
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $lang = $_POST['lang'] ?? 'ru';
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

    foreach ($_POST as $key => $val) {
        if (in_array($key, ['lang', 'new_password', 'confirm_password'], true)) continue;
        if (strpos($key, 'setting_') === 0) {
            $settingKey = substr($key, 8);
            $stmt = $pdo->prepare("INSERT INTO settings (`key`, `value`, lang) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)");
            $stmt->execute([$settingKey, (string)$val, $lang]);
        }
    }

    $newPwd    = $_POST['new_password'] ?? '';
    $confirmPwd = $_POST['confirm_password'] ?? '';
    if ($newPwd !== '' && $newPwd === $confirmPwd) {
        $hash = password_hash($newPwd, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE admins SET password_hash = ? WHERE username = 'admin'");
        $stmt->execute([$hash]);
        header('Location: settings.php?lang=' . urlencode($lang) . '&saved=1&pwd=1');
        exit;
    }

    header('Location: settings.php?lang=' . urlencode($lang) . '&saved=1');
    exit;
}

$lang = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

$settings = [];
$stmt = $pdo->prepare("SELECT `key`, `value` FROM settings WHERE lang = ?");
$stmt->execute([$lang]);
foreach ($stmt->fetchAll() as $row) {
    $settings[$row['key']] = $row['value'];
}

require __DIR__ . '/header.php';
?>
<h1>Настройки сайта</h1>

<?php if (isset($_GET['saved'])): ?>
    <div class="alert alert-ok">Настройки сохранены.</div>
<?php endif; ?>
<?php if (isset($_GET['pwd'])): ?>
    <div class="alert alert-ok">Пароль администратора изменён.</div>
<?php endif; ?>

<form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
    <input type="hidden" name="lang" value="<?= htmlspecialchars($lang) ?>">

    <h3>Основные настройки</h3>
    <label>Название сайта</label>
    <input type="text" name="setting_site_title" value="<?= htmlspecialchars($settings['site_title'] ?? 'NORVEX') ?>">

    <h3>Фоновые изображения (hero)</h3>
    <label>Фон главной страницы</label>
    <div data-upload-field="hero">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" data-upload-input hidden>
        <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
            <button type="button" class="btn btn-sm" data-upload-pick>Выбрать файл с компьютера</button>
            <button type="button" class="btn btn-sm btn-gray" data-upload-clear>Убрать</button>
        </div>
        <img data-upload-preview hidden alt="Предпросмотр" style="max-width:100%;border-radius:8px;margin-bottom:0.5rem;display:block">
        <p class="small" data-upload-status style="margin:0 0 0.5rem"></p>
        <input type="text" name="setting_hero_image" data-upload-url placeholder="/uploads/hero/… или URL"
               value="<?= htmlspecialchars($settings['hero_image'] ?? '') ?>">
    </div>

    <label>Фон внутренних страниц (О компании, Команда, Услуги, Контакты)</label>
    <div data-upload-field="hero">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" data-upload-input hidden>
        <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
            <button type="button" class="btn btn-sm" data-upload-pick>Выбрать файл с компьютера</button>
            <button type="button" class="btn btn-sm btn-gray" data-upload-clear>Убрать</button>
        </div>
        <img data-upload-preview hidden alt="Предпросмотр" style="max-width:100%;border-radius:8px;margin-bottom:0.5rem;display:block">
        <p class="small" data-upload-status style="margin:0 0 0.5rem"></p>
        <input type="text" name="setting_about_image" data-upload-url placeholder="/uploads/hero/… или URL"
               value="<?= htmlspecialchars($settings['about_image'] ?? '') ?>">
    </div>

    <label>Картинка для соцсетей (OG-изображение)</label>
    <div data-upload-field="hero">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" data-upload-input hidden>
        <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
            <button type="button" class="btn btn-sm" data-upload-pick>Выбрать файл с компьютера</button>
            <button type="button" class="btn btn-sm btn-gray" data-upload-clear>Убрать</button>
        </div>
        <img data-upload-preview hidden alt="Предпросмотр" style="max-width:100%;border-radius:8px;margin-bottom:0.5rem;display:block">
        <p class="small" data-upload-status style="margin:0 0 0.5rem"></p>
        <input type="text" name="setting_og_image" data-upload-url placeholder="/uploads/hero/… или URL"
               value="<?= htmlspecialchars($settings['og_image'] ?? '') ?>">
    </div>

    <h3>Заявки</h3>
    <label>Email для заявок (куда приходят заявки с формы)</label>
    <input type="email" name="setting_inquiry_email" value="<?= htmlspecialchars($settings['inquiry_email'] ?? norvex_inquiry_recipient()) ?>">
    <p class="small">Если поле пустое — используется адрес по умолчанию из config.php. Сейчас получатель: <code><?= htmlspecialchars(norvex_inquiry_recipient()) ?></code></p>

    <label>Email компании (показывается на сайте)</label>
    <input type="email" name="setting_site_email" value="<?= htmlspecialchars($settings['site_email'] ?? 'info@norvex-hse.com') ?>">

    <label>Телефон</label>
    <input type="tel" name="setting_site_phone" value="<?= htmlspecialchars($settings['site_phone'] ?? '+996 550 209 209') ?>">

    <label>Адрес</label>
    <input type="text" name="setting_site_address" value="<?= htmlspecialchars($settings['site_address'] ?? '') ?>">

    <h3>Смена пароля администратора</h3>
    <label>Новый пароль</label>
    <input type="password" name="new_password" placeholder="Оставьте пустым, чтобы не менять">
    <label>Повторите пароль</label>
    <input type="password" name="confirm_password">
    <p class="small">Логин: <code>admin</code>. Пароль по умолчанию: <code>admin123</code> — обязательно смените.</p>

    <button type="submit" class="btn">Сохранить настройки</button>
    <a href="index.php" class="btn btn-gray" style="margin-left:0.5rem">На дашборд</a>
</form>

<?php require __DIR__ . '/footer.php'; ?>
