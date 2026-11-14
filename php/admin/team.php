<?php

// admin/team.php — CRUD команды

require_once __DIR__ . '/bootstrap.php';



$pdo = norvex_db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id       = (int)($_POST['id'] ?? 0);
    $name     = trim($_POST['name'] ?? '');
    $position = trim($_POST['position'] ?? '');
    $experience = trim($_POST['experience'] ?? '');
    $photo    = trim($_POST['photo'] ?? '');
    $bio      = trim($_POST['bio'] ?? '');
    $sort     = (int)($_POST['sort_order'] ?? 0);
    $active   = isset($_POST['is_active']) ? 1 : 0;
    $lang     = $_POST['lang'] ?? 'ru';
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

    $error = null;
    if ($name === '') {
        $error = 'Не заполнено имя';
    } else {
        try {
            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE team SET name=?,position=?,experience=?,photo=?,bio=?,sort_order=?,is_active=?,lang=? WHERE id=?");
                $stmt->execute([$name, $position, $experience, $photo, $bio, $sort, $active, $lang, $id]);
            } else {
                // Новый участник — автоматически в конец списка
                $sort = next_sort_order($pdo, 'team', $lang);
                $stmt = $pdo->prepare("INSERT INTO team (name,position,experience,photo,bio,sort_order,is_active,lang) VALUES (?,?,?,?,?,?,?,?)");
                $stmt->execute([$name, $position, $experience, $photo, $bio, $sort, $active, $lang]);
            }
        } catch (Throwable $e) {
            error_log('NORVEX team save error: ' . $e->getMessage());
            $error = $e->getMessage();
        }
    }

    if ($error === null) {
        header('Location: team.php?lang=' . urlencode($lang) . '&saved=1');
        exit;
    }
    // Ошибку показываем на странице, а не роняем её
    $_SESSION['norvex_flash_error'] = $error;
    header('Location: team.php?lang=' . urlencode($lang) . '&err=1');
    exit;
}

if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare("DELETE FROM team WHERE id = ?");
    $stmt->execute([(int)$_GET['delete']]);
    header('Location: team.php');
    exit;
}

$lang = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

$stmt = $pdo->prepare("SELECT * FROM team WHERE lang = ? ORDER BY sort_order ASC, id DESC");
$stmt->execute([$lang]);
$team = $stmt->fetchAll();

$editItem = null;
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM team WHERE id = ?");
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
<h1>Команда</h1>
<div class="small lang-tabs">Язык:
    <?php foreach ($allLangs as $l => $name): ?>
        <a href="team.php?lang=<?= $l ?>" class="<?= $l === $lang ? '' : 'btn btn-sm' ?>" style="<?= $l === $lang ? 'color:#1a3a5c;font-weight:700' : '' ?>"><?= htmlspecialchars($name) ?></a>
    <?php endforeach; ?>
</div>

<div class="form-card">
    <h2><?= $editItem ? 'Редактировать' : 'Добавить' ?> участника</h2>
    <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
        <input type="hidden" name="id" value="<?= $editItem ? (int)$editItem['id'] : 0 ?>">
        <input type="hidden" name="lang" value="<?= htmlspecialchars($lang) ?>">
        <label>Имя</label>
        <input type="text" name="name" required value="<?= $editItem ? htmlspecialchars($editItem['name']) : '' ?>">
        <label>Должность</label>
        <input type="text" name="position" value="<?= $editItem ? htmlspecialchars($editItem['position']) : '' ?>">
        <label>Опыт</label>
        <input type="text" name="experience" placeholder="Например: 10 лет" value="<?= $editItem ? htmlspecialchars($editItem['experience'] ?? '') : '' ?>">
        <label>Фото</label>
        <div data-upload-field="team">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" data-upload-input hidden>
            <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
                <button type="button" class="btn btn-sm" data-upload-pick>Выбрать файл с компьютера</button>
                <button type="button" class="btn btn-sm btn-gray" data-upload-clear>Убрать</button>
            </div>
            <img data-upload-preview hidden alt="Предпросмотр" style="max-width:160px;border-radius:8px;margin-bottom:0.5rem;display:block">
            <p class="small" data-upload-status style="margin:0 0 0.5rem"></p>
            <input type="text" name="photo" data-upload-url placeholder="/uploads/team/… или URL"
                   value="<?= $editItem ? htmlspecialchars($editItem['photo']) : '' ?>">
        </div>
        <label>Описание</label>
        <textarea name="bio" rows="3"><?= $editItem ? htmlspecialchars($editItem['bio']) : '' ?></textarea>
        <label>Сортировка</label>
        <input type="number" name="sort_order" value="<?= $editItem ? (int)$editItem['sort_order'] : next_sort_order($pdo, 'team', $lang) ?>" readonly>
        <p class="small" style="margin:-0.7rem 0 1rem">Проставляется автоматически: новый участник встаёт в конец списка.</p>
        <label><input type="checkbox" name="is_active" <?= (!$editItem || !empty($editItem['is_active'])) ? 'checked' : '' ?> style="width:auto;margin-right:0.4rem"> Активен</label>
        <button type="submit" class="btn"><?= $editItem ? 'Сохранить' : 'Добавить' ?></button>
        <?php if ($editItem): ?>
            <a href="team.php?lang=<?= htmlspecialchars($lang) ?>" class="btn btn-gray" style="margin-left:0.5rem">Отмена</a>
        <?php endif; ?>
    </form>
</div>

<h2>Список команды <span class="small" data-reorder-status></span></h2>
<table>
    <thead><tr><th></th><th>Имя</th><th>Должность</th><th>Опыт</th><th>Язык</th><th>Фото</th><th>Активен</th><th>Действия</th></tr></thead>
    <tbody data-sortable data-reorder-table="team" data-lang="<?= htmlspecialchars($lang) ?>">
    <?php foreach ($team as $t): ?>
    <tr data-id="<?= (int)$t['id'] ?>">
        <td><span class="drag-handle" draggable="true" data-drag-handle title="Потяните для перестановки">⠿</span></td>
        <td><?= htmlspecialchars($t['name']) ?></td>
        <td><?= htmlspecialchars($t['position']) ?></td>
        <td><?= htmlspecialchars($t['experience'] ?? '') ?></td>
        <td><?= htmlspecialchars($t['lang']) ?></td>
        <td><?= htmlspecialchars($t['photo']) ?></td>
        <td><?= $t['is_active'] ? 'Да' : 'Нет' ?></td>
        <td style="white-space:nowrap">
            <a href="team.php?lang=<?= htmlspecialchars($lang) ?>&edit=<?= (int)$t['id'] ?>" class="btn btn-sm">Редактировать</a>
            <a href="team.php?delete=<?= (int)$t['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Удалить участника?')">Удалить</a>
        </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if (empty($team)): ?>
    <p class="small">В этом разделе пока пусто.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
