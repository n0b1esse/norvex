<?php

// admin/clients.php — CRUD клиентов (блок «Нам доверяют»)

require_once __DIR__ . '/bootstrap.php';



$pdo = norvex_db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id     = (int)($_POST['id'] ?? 0);
    $name   = trim($_POST['name'] ?? '');
    $logo   = trim($_POST['logo'] ?? '');
    $cat    = trim($_POST['category'] ?? '');
    $url    = trim($_POST['url'] ?? '');
    $sort   = (int)($_POST['sort_order'] ?? 0);
    $active = isset($_POST['is_active']) ? 1 : 0;
    $lang   = $_POST['lang'] ?? 'ru';
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

    $error = null;
    if ($name === '') {
        $error = 'Не заполнено название компании';
    } else {
        try {
            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE clients SET name=?,logo=?,category=?,url=?,sort_order=?,is_active=?,lang=? WHERE id=?");
                $stmt->execute([$name, $logo, $cat, $url, $sort, $active, $lang, $id]);
            } else {
                // Новый клиент — автоматически в конец списка
                $sort = next_sort_order($pdo, 'clients', $lang);
                $stmt = $pdo->prepare("INSERT INTO clients (name,logo,category,url,sort_order,is_active,lang) VALUES (?,?,?,?,?,?,?)");
                $stmt->execute([$name, $logo, $cat, $url, $sort, $active, $lang]);
            }
        } catch (Throwable $e) {
            error_log('NORVEX clients save error: ' . $e->getMessage());
            $error = $e->getMessage();
        }
    }

    if ($error === null) {
        header('Location: clients.php?lang=' . urlencode($lang) . '&saved=1');
        exit;
    }
    $_SESSION['norvex_flash_error'] = $error;
    header('Location: clients.php?lang=' . urlencode($lang) . '&err=1');
    exit;
}

if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
    $stmt->execute([(int)$_GET['delete']]);
    header('Location: clients.php');
    exit;
}

$lang = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

$stmt = $pdo->prepare("SELECT * FROM clients WHERE lang = ? ORDER BY sort_order ASC, id ASC");
$stmt->execute([$lang]);
$clients = $stmt->fetchAll();

$editItem = null;
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $editItem = $stmt->fetch() ?: null;
}

$allLangs = ['ru' => 'Русский', 'en' => 'English', 'ky' => 'Kyrgyz'];

require __DIR__ . '/header.php';
?>
<?php if (isset($_GET['saved'])): ?>
    <div class="alert alert-ok">Сохранено.</div>
<?php endif; ?>
<?php if (!empty($_SESSION['norvex_flash_error'])): ?>
    <div class="alert alert-err">Ошибка сохранения: <?= htmlspecialchars($_SESSION['norvex_flash_error']) ?></div>
    <?php unset($_SESSION['norvex_flash_error']); ?>
<?php endif; ?>
<h1>Клиенты («Нам доверяют»)</h1>
<div class="small lang-tabs">Язык:
    <?php foreach ($allLangs as $l => $name): ?>
        <a href="clients.php?lang=<?= $l ?>" class="<?= $l === $lang ? '' : 'btn btn-sm' ?>" style="<?= $l === $lang ? 'color:#1a3a5c;font-weight:700' : '' ?>"><?= htmlspecialchars($name) ?></a>
    <?php endforeach; ?>
</div>

<div class="form-card">
    <h2><?= $editItem ? 'Редактировать' : 'Добавить' ?> клиента</h2>
    <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
        <input type="hidden" name="id" value="<?= $editItem ? (int)$editItem['id'] : 0 ?>">
        <input type="hidden" name="lang" value="<?= htmlspecialchars($lang) ?>">

        <label>Название компании</label>
        <input type="text" name="name" required value="<?= $editItem ? htmlspecialchars($editItem['name']) : '' ?>">

        <label>Логотип</label>
        <div data-upload-field="clients">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml" data-upload-input hidden>
            <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
                <button type="button" class="btn btn-sm" data-upload-pick>Выбрать файл с компьютера</button>
                <button type="button" class="btn btn-sm btn-gray" data-upload-clear>Убрать</button>
            </div>
            <img data-upload-preview hidden alt="Предпросмотр" style="max-width:120px;max-height:80px;object-fit:contain;border-radius:8px;margin-bottom:0.5rem;display:block">
            <p class="small" data-upload-status style="margin:0 0 0.5rem"></p>
            <input type="text" name="logo" data-upload-url placeholder="/uploads/clients/… или /assets/logos/…"
                   value="<?= $editItem ? htmlspecialchars($editItem['logo']) : '' ?>">
        </div>

        <label>Категория (например: Горнодобыча)</label>
        <input type="text" name="category" value="<?= $editItem ? htmlspecialchars($editItem['category']) : '' ?>">

        <label>Ссылка на сайт компании</label>
        <input type="text" name="url" placeholder="https://…" value="<?= $editItem ? htmlspecialchars($editItem['url']) : '' ?>">

        <label>Сортировка</label>
        <input type="number" name="sort_order" value="<?= $editItem ? (int)$editItem['sort_order'] : next_sort_order($pdo, 'clients', $lang) ?>" readonly>
        <p class="small" style="margin:-0.7rem 0 1rem">Проставляется автоматически: новый клиент встаёт в конец списка.</p>

        <label><input type="checkbox" name="is_active" <?= (!$editItem || !empty($editItem['is_active'])) ? 'checked' : '' ?> style="width:auto;margin-right:0.4rem"> Активен</label>

        <button type="submit" class="btn"><?= $editItem ? 'Сохранить' : 'Добавить' ?></button>
        <?php if ($editItem): ?>
            <a href="clients.php?lang=<?= htmlspecialchars($lang) ?>" class="btn btn-gray" style="margin-left:0.5rem">Отмена</a>
        <?php endif; ?>
    </form>
</div>

<h2>Список клиентов <span class="small" data-reorder-status></span></h2>
<table>
    <thead><tr><th></th><th>Название</th><th>Категория</th><th>Логотип</th><th>Ссылка</th><th>Сорт.</th><th>Активен</th><th>Действия</th></tr></thead>
    <tbody data-sortable data-reorder-table="clients" data-lang="<?= htmlspecialchars($lang) ?>">
    <?php foreach ($clients as $c): ?>
    <tr data-id="<?= (int)$c['id'] ?>">
        <td><span class="drag-handle" draggable="true" data-drag-handle title="Потяните для перестановки">⠿</span></td>
        <td><?= htmlspecialchars($c['name']) ?></td>
        <td><?= htmlspecialchars($c['category']) ?></td>
        <td><?= $c['logo'] ? '<a href="' . htmlspecialchars($c['logo']) . '" target="_blank">файл</a>' : '—' ?></td>
        <td><?= $c['url'] ? '<a href="' . htmlspecialchars($c['url']) . '" target="_blank">' . htmlspecialchars($c['url']) . '</a>' : '—' ?></td>
        <td><?= (int)$c['sort_order'] ?></td>
        <td><?= $c['is_active'] ? 'Да' : 'Нет' ?></td>
        <td style="white-space:nowrap">
            <a href="clients.php?lang=<?= htmlspecialchars($lang) ?>&edit=<?= (int)$c['id'] ?>" class="btn btn-sm">Редактировать</a>
            <a href="clients.php?delete=<?= (int)$c['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Удалить клиента?')">Удалить</a>
        </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if (empty($clients)): ?>
    <p class="small">В этом разделе пока пусто.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
