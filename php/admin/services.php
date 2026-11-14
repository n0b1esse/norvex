<?php
// admin/services.php — CRUD услуг
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id          = (int)($_POST['id'] ?? 0);
    $title       = trim($_POST['title'] ?? '');
    $slug        = trim($_POST['slug'] ?? '');
    $desc        = trim($_POST['description'] ?? '');
    $icon        = trim($_POST['icon'] ?? '');
    $sort        = (int)($_POST['sort_order'] ?? 0);
    $active      = isset($_POST['is_active']) ? 1 : 0;
    $lang        = $_POST['lang'] ?? 'ru';

    if ($title !== '' && $slug !== '') {
        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE services SET title=?,slug=?,description=?,icon=?,sort_order=?,is_active=?,lang=? WHERE id=?");
            $stmt->execute([$title, $slug, $desc, $icon, $sort, $active, $lang, $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO services (title,slug,description,icon,sort_order,is_active,lang) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$title, $slug, $desc, $icon, $sort, $active, $lang]);
        }
    }
    header('Location: services.php?lang=' . urlencode($lang));
    exit;
}

if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare("DELETE FROM services WHERE id = ?");
    $stmt->execute([(int)$_GET['delete']]);
    header('Location: services.php');
    exit;
}

$lang = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

$stmt = $pdo->prepare("SELECT * FROM services WHERE lang = ? ORDER BY sort_order ASC, id DESC");
$stmt->execute([$lang]);
$services = $stmt->fetchAll();

$editItem = null;
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM services WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $editItem = $stmt->fetch() ?: null;
}

$allLangs = ['ru' => 'Русский', 'en' => 'English', 'ky' => 'Kyrgyz'];

require __DIR__ . '/header.php';
?>
<h1>Услуги</h1>
<div class="small lang-tabs">Язык:
    <?php foreach ($allLangs as $l => $name): ?>
        <a href="services.php?lang=<?= $l ?>" class="<?= $l === $lang ? '' : 'btn btn-sm' ?>" style="<?= $l === $lang ? 'color:#1a3a5c;font-weight:700' : '' ?>"><?= htmlspecialchars($name) ?></a>
    <?php endforeach; ?>
</div>

<div class="form-card">
    <h2><?= $editItem ? 'Редактировать' : 'Добавить' ?> услугу</h2>
    <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
        <input type="hidden" name="id" value="<?= $editItem ? (int)$editItem['id'] : 0 ?>">
        <input type="hidden" name="lang" value="<?= htmlspecialchars($lang) ?>">
        <label>Заголовок</label>
        <input type="text" name="title" required value="<?= $editItem ? htmlspecialchars($editItem['title']) : '' ?>">
        <label>SLUG (английский, для URL)</label>
        <input type="text" name="slug" required value="<?= $editItem ? htmlspecialchars($editItem['slug']) : '' ?>">
        <label>Описание</label>
        <textarea name="description" rows="3"><?= $editItem ? htmlspecialchars($editItem['description']) : '' ?></textarea>
        <label>Иконка (класс или emoji)</label>
        <input type="text" name="icon" value="<?= $editItem ? htmlspecialchars($editItem['icon']) : '' ?>">
        <label>Сортировка</label>
        <input type="number" name="sort_order" value="<?= $editItem ? (int)$editItem['sort_order'] : 0 ?>">
        <label><input type="checkbox" name="is_active" <?= (!$editItem || !empty($editItem['is_active'])) ? 'checked' : '' ?> style="width:auto;margin-right:0.4rem"> Активна</label>
        <button type="submit" class="btn"><?= $editItem ? 'Сохранить' : 'Добавить' ?></button>
        <?php if ($editItem): ?>
            <a href="services.php?lang=<?= htmlspecialchars($lang) ?>" class="btn btn-gray" style="margin-left:0.5rem">Отмена</a>
        <?php endif; ?>
    </form>
</div>

<h2>Список услуг <span class="small" data-reorder-status></span></h2>
<table>
    <thead><tr><th></th><th>Заголовок</th><th>SLUG</th><th>Язык</th><th>Сорт.</th><th>Активна</th><th>Действия</th></tr></thead>
    <tbody data-sortable data-reorder-table="services" data-lang="<?= htmlspecialchars($lang) ?>">
    <?php foreach ($services as $s): ?>
    <tr data-id="<?= (int)$s['id'] ?>">
        <td><span class="drag-handle" draggable="true" data-drag-handle title="Потяните для перестановки">⠿</span></td>
        <td><?= htmlspecialchars($s['title']) ?></td>
        <td><?= htmlspecialchars($s['slug']) ?></td>
        <td><?= htmlspecialchars($s['lang']) ?></td>
        <td><?= (int)$s['sort_order'] ?></td>
        <td><?= $s['is_active'] ? 'Да' : 'Нет' ?></td>
        <td>
            <a href="services.php?lang=<?= htmlspecialchars($lang) ?>&edit=<?= (int)$s['id'] ?>" class="btn btn-sm">Редактировать</a>
            <a href="services.php?delete=<?= (int)$s['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Удалить услугу?')">Удалить</a>
        </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if (empty($services)): ?>
    <p class="small">В этом разделе пока пусто.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
