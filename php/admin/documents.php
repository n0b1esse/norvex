<?php
// admin/documents.php — CRUD документов
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();

// Перестановка документов (кнопки ↑/↓ в списке)
if (isset($_GET['move'])) {
    $id   = (int)($_GET['id'] ?? 0);
    $dir  = $_GET['move'] === 'up' ? -1 : 1;
    $lang = $_GET['lang'] ?? 'ru';
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

    $stmt = $pdo->prepare("SELECT id, category, sort_order FROM documents WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if ($row) {
        $cmp = $dir < 0 ? '<' : '>';
        $ord = $dir < 0 ? 'DESC' : 'ASC';
        $stmt = $pdo->prepare(
            "SELECT id, sort_order FROM documents
             WHERE lang = ? AND category = ? AND sort_order $cmp ?
             ORDER BY sort_order $ord, id $ord LIMIT 1"
        );
        $stmt->execute([$lang, $row['category'], (int)$row['sort_order']]);
        $other = $stmt->fetch();

        if ($other) {
            $pdo->beginTransaction();
            $s1 = $pdo->prepare("UPDATE documents SET sort_order = ? WHERE id = ?");
            $s1->execute([(int)$other['sort_order'], (int)$row['id']]);
            $s2 = $pdo->prepare("UPDATE documents SET sort_order = ? WHERE id = ?");
            $s2->execute([(int)$row['sort_order'], (int)$other['id']]);
            $pdo->commit();
        }
    }
    header('Location: documents.php?lang=' . urlencode($lang));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id          = (int)($_POST['id'] ?? 0);
    $title       = trim($_POST['title'] ?? '');
    $category    = trim($_POST['category'] ?? '');
    $fileUrl     = trim($_POST['file_url'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $sort        = (int)($_POST['sort_order'] ?? 0);
    $lang        = $_POST['lang'] ?? 'ru';
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

    $error = null;
    if ($title === '') {
        $error = 'Не заполнено название';
    } else {
        try {
            if ($id > 0) {
                // При редактировании сортировку оставляем как есть, если поле не изменено вручную
                $stmt = $pdo->prepare("SELECT sort_order FROM documents WHERE id = ?");
                $stmt->execute([$id]);
                $cur = $stmt->fetch();
                $sort = (int)($cur['sort_order'] ?? $sort);

                $stmt = $pdo->prepare("UPDATE documents SET title=?,category=?,file_url=?,description=?,sort_order=?,lang=? WHERE id=?");
                $stmt->execute([$title, $category, $fileUrl, $description, $sort, $lang, $id]);
            } else {
                // Новый документ — автоматически ставим в конец своей категории
                $sort = next_sort_order($pdo, 'documents', $lang, ['category' => $category]);
                $stmt = $pdo->prepare("INSERT INTO documents (title,category,file_url,description,sort_order,lang) VALUES (?,?,?,?,?,?)");
                $stmt->execute([$title, $category, $fileUrl, $description, $sort, $lang]);
            }
        } catch (Throwable $e) {
            error_log('NORVEX documents save error: ' . $e->getMessage());
            $error = $e->getMessage();
        }
    }
    if ($error === null) {
        header('Location: documents.php?lang=' . urlencode($lang) . '&saved=1');
        exit;
    }
    $_SESSION['norvex_flash_error'] = $error;
    header('Location: documents.php?lang=' . urlencode($lang) . '&err=1');
    exit;
    header('Location: documents.php?lang=' . urlencode($lang));
    exit;
}

if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ?");
    $stmt->execute([(int)$_GET['delete']]);
    header('Location: documents.php');
    exit;
}

$lang = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

$stmt = $pdo->prepare("SELECT * FROM documents WHERE lang = ? ORDER BY category ASC, sort_order ASC, id ASC");
$stmt->execute([$lang]);
$docs = $stmt->fetchAll();

$editItem = null;
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM documents WHERE id = ?");
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
<h1>Документы</h1>
<div class="small lang-tabs">Язык:
    <?php foreach ($allLangs as $l => $name): ?>
        <a href="documents.php?lang=<?= $l ?>" class="<?= $l === $lang ? '' : 'btn btn-sm' ?>" style="<?= $l === $lang ? 'color:#1a3a5c;font-weight:700' : '' ?>"><?= htmlspecialchars($name) ?></a>
    <?php endforeach; ?>
</div>

<div class="form-card">
    <h2><?= $editItem ? 'Редактировать' : 'Добавить' ?> документ</h2>
    <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
        <input type="hidden" name="id" value="<?= $editItem ? (int)$editItem['id'] : 0 ?>">
        <input type="hidden" name="lang" value="<?= htmlspecialchars($lang) ?>">
        <label>Название</label>
        <input type="text" name="title" required value="<?= $editItem ? htmlspecialchars($editItem['title']) : '' ?>">
        <label>Категория</label>
        <select name="category">
            <?php foreach (['Политики', 'Процедуры', 'Чек-листы'] as $cat): ?>
                <option value="<?= $cat ?>" <?= ($editItem['category'] ?? '') === $cat ? 'selected' : '' ?>><?= $cat ?></option>
            <?php endforeach; ?>
        </select>
        <label>Файл документа</label>
        <div data-upload-field="documents">
            <input type="file" accept="application/pdf,.pdf" data-upload-input hidden>
            <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
                <button type="button" class="btn btn-sm" data-upload-pick>Выбрать PDF с компьютера</button>
                <button type="button" class="btn btn-sm btn-gray" data-upload-clear>Убрать</button>
            </div>
            <p class="small" data-upload-status style="margin:0 0 0.5rem"></p>
            <input type="text" name="file_url" data-upload-url placeholder="/uploads/documents/… или URL"
                   value="<?= $editItem ? htmlspecialchars($editItem['file_url']) : '' ?>">
        </div>
        <label>Описание</label>
        <textarea name="description" rows="3"><?= $editItem ? htmlspecialchars($editItem['description']) : '' ?></textarea>
        <label>Сортировка</label>
        <input type="number" name="sort_order" value="<?= $editItem ? (int)$editItem['sort_order'] : next_sort_order($pdo, 'documents', $lang, ['category' => $editItem['category'] ?? '']) ?>" readonly>
        <p class="small" style="margin:-0.7rem 0 1rem">Проставляется автоматически: новый документ встаёт в конец своей категории.</p>
        <button type="submit" class="btn"><?= $editItem ? 'Сохранить' : 'Добавить' ?></button>
        <?php if ($editItem): ?>
            <a href="documents.php?lang=<?= htmlspecialchars($lang) ?>" class="btn btn-gray" style="margin-left:0.5rem">Отмена</a>
        <?php endif; ?>
    </form>
</div>

<h2>Список документов</h2>
<table>
    <thead><tr><th>Название</th><th>Категория</th><th>Файл</th><th>Язык</th><th>Сортировка</th><th>Действия</th></tr></thead>
    <tbody>
    <?php foreach ($docs as $d): ?>
    <tr>
        <td><?= htmlspecialchars($d['title']) ?></td>
        <td><?= htmlspecialchars($d['category'] ?? '') ?></td>
        <td><a href="<?= htmlspecialchars($d['file_url']) ?>" target="_blank"><?= htmlspecialchars($d['file_url']) ?></a></td>
        <td><?= htmlspecialchars($d['lang']) ?></td>
        <td><?= (int)$d['sort_order'] ?></td>
        <td style="white-space:nowrap">
            <a href="documents.php?lang=<?= htmlspecialchars($lang) ?>&move=up&id=<?= (int)$d['id'] ?>" class="btn btn-sm" title="Поднять выше">↑</a>
            <a href="documents.php?lang=<?= htmlspecialchars($lang) ?>&move=down&id=<?= (int)$d['id'] ?>" class="btn btn-sm" title="Опустить ниже">↓</a>
            <a href="documents.php?lang=<?= htmlspecialchars($lang) ?>&edit=<?= (int)$d['id'] ?>" class="btn btn-sm">Редактировать</a>
            <a href="documents.php?delete=<?= (int)$d['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Удалить документ?')">Удалить</a>
        </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if (empty($docs)): ?>
    <p class="small">В этом разделе пока пусто.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
