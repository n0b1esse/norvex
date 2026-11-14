<?php
// admin/faq.php — FAQ (вопросы-ответы). Хранятся в таблице faq, показываются на сайте через live-оверлей.
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();
$allLangs = ['ru' => 'Русский', 'en' => 'English', 'ky' => 'Kyrgyz'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id    = (int)($_POST['id'] ?? 0);
    $page  = trim($_POST['page'] ?? 'home');
    $group = trim($_POST['group_name'] ?? '');
    $q     = trim($_POST['question'] ?? '');
    $a     = trim($_POST['answer'] ?? '');
    $active = isset($_POST['is_active']) ? 1 : 0;
    $lang  = $_POST['lang'] ?? 'ru';
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

    $error = null;
    if ($q === '' || $a === '') {
        $error = 'Вопрос и ответ обязательны';
    } else {
        try {
            if ($id > 0) {
                $stmt = $pdo->prepare(
                    "UPDATE faq SET page_key=?, group_name=?, question=?, answer=?, is_active=?, lang=? WHERE id=?"
                );
                $stmt->execute([$page ?: 'home', $group, $q, $a, $active, $lang, $id]);
            } else {
                $stmt = $pdo->prepare(
                    "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM faq WHERE lang = ? AND page_key = ?"
                );
                $stmt->execute([$lang, $page ?: 'home']);
                $sort = (int)$stmt->fetchColumn();
                $stmt = $pdo->prepare(
                    "INSERT INTO faq (page_key, lang, group_name, question, answer, sort_order, is_active)
                     VALUES (?, ?, ?, ?, ?, ?, ?)"
                );
                $stmt->execute([$page ?: 'home', $lang, $group, $q, $a, $sort, $active]);
            }
        } catch (Throwable $e) {
            error_log('NORVEX faq save error: ' . $e->getMessage());
            $error = $e->getMessage();
        }
    }

    if ($error === null) {
        header('Location: faq.php?lang=' . urlencode($lang) . '&saved=1');
        exit;
    }
    $_SESSION['norvex_flash_error'] = $error;
    header('Location: faq.php?lang=' . urlencode($lang) . '&err=1');
    exit;
}

if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare("DELETE FROM faq WHERE id = ?");
    $stmt->execute([(int)$_GET['delete']]);
    header('Location: faq.php');
    exit;
}

$lang = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

$stmt = $pdo->prepare("SELECT * FROM faq WHERE lang = ? ORDER BY page_key, group_name, sort_order, id");
$stmt->execute([$lang]);
$faqs = $stmt->fetchAll();

$editItem = null;
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM faq WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $editItem = $stmt->fetch() ?: null;
}

require __DIR__ . '/header.php';
?>
<?php if (isset($_GET['saved'])): ?>
    <div class="alert alert-ok">Сохранено. Изменения сразу на сайте.</div>
<?php endif; ?>
<?php if (!empty($_SESSION['norvex_flash_error'])): ?>
    <div class="alert alert-err">Ошибка сохранения: <?= htmlspecialchars($_SESSION['norvex_flash_error']) ?></div>
    <?php unset($_SESSION['norvex_flash_error']); ?>
<?php endif; ?>

<h1>FAQ — вопросы и ответы</h1>
<div class="small lang-tabs">Язык:
    <?php foreach ($allLangs as $l => $name): ?>
        <a href="faq.php?lang=<?= $l ?>" class="<?= $l === $lang ? '' : 'btn btn-sm' ?>" style="<?= $l === $lang ? 'color:#1a3a5c;font-weight:700' : '' ?>"><?= htmlspecialchars($name) ?></a>
    <?php endforeach; ?>
</div>

<div class="form-card" style="max-width:760px">
    <h2><?= $editItem ? 'Редактировать вопрос' : 'Добавить вопрос' ?></h2>
    <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
        <input type="hidden" name="id" value="<?= $editItem ? (int)$editItem['id'] : 0 ?>">
        <input type="hidden" name="lang" value="<?= htmlspecialchars($lang) ?>">

        <label>Страница</label>
        <input type="text" name="page" value="<?= htmlspecialchars($editItem ? $editItem['page_key'] : 'home') ?>" placeholder="home">

        <label>Группа (подзаголовок секции)</label>
        <input type="text" name="group_name" value="<?= $editItem ? htmlspecialchars($editItem['group_name']) : '' ?>" placeholder="Базовые понятия">

        <label>Вопрос</label>
        <input type="text" name="question" required value="<?= $editItem ? htmlspecialchars($editItem['question']) : '' ?>">

        <label>Ответ (HTML разрешён: списки, выделения)</label>
        <textarea name="answer" rows="6" required><?= $editItem ? htmlspecialchars($editItem['answer']) : '' ?></textarea>

        <label><input type="checkbox" name="is_active" <?= (!$editItem || !empty($editItem['is_active'])) ? 'checked' : '' ?> style="width:auto;margin-right:0.4rem"> Активен</label>

        <button type="submit" class="btn"><?= $editItem ? 'Сохранить' : 'Добавить' ?></button>
        <?php if ($editItem): ?>
            <a href="faq.php?lang=<?= htmlspecialchars($lang) ?>" class="btn btn-gray" style="margin-left:0.5rem">Отмена</a>
        <?php endif; ?>
    </form>
</div>

<h2>Все вопросы (<?= count($faqs) ?>) <span class="small" data-reorder-status></span></h2>
<table>
    <thead><tr><th>Сорт.</th><th>Страница</th><th>Группа</th><th>Вопрос</th><th>Активен</th><th>Действия</th></tr></thead>
    <tbody data-sortable data-reorder-table="faq" data-lang="<?= htmlspecialchars($lang) ?>">
    <?php foreach ($faqs as $f): ?>
    <tr data-id="<?= (int)$f['id'] ?>">
        <td><span class="drag-handle" draggable="true" data-drag-handle title="Потяните для перестановки">⠿</span> <?= (int)$f['sort_order'] ?></td>
        <td><?= htmlspecialchars($f['page_key']) ?></td>
        <td><?= htmlspecialchars($f['group_name']) ?></td>
        <td><?= htmlspecialchars(mb_strimwidth($f['question'], 0, 90, '…', 'UTF-8')) ?></td>
        <td><?= !empty($f['is_active']) ? 'Да' : 'Нет' ?></td>
        <td style="white-space:nowrap">
            <a href="faq.php?lang=<?= htmlspecialchars($lang) ?>&edit=<?= (int)$f['id'] ?>" class="btn btn-sm">Редактировать</a>
            <a href="faq.php?lang=<?= htmlspecialchars($lang) ?>&delete=<?= (int)$f['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Удалить вопрос?')">Удалить</a>
        </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if (empty($faqs)): ?>
    <p class="small">В этом языке пока пусто.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
