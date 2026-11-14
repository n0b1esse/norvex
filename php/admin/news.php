<?php
// admin/news.php — CRUD новостей
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();

// Опубликовать / снять с публикации (статьи пишутся в статические файлы, сайт индексирует их без пересборки)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['publish_action'])) {
    $id     = (int)($_POST['publish_id'] ?? 0);
    $action = $_POST['publish_action'] === 'publish' ? 'publish' : 'unpublish';

    $stmt = $pdo->prepare("SELECT * FROM news WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        $_SESSION['norvex_flash_error'] = 'Новость не найдена';
        header('Location: news.php?err=1');
        exit;
    }
    try {
        require_once __DIR__ . '/../news-publish.php';
        if ($action === 'publish') {
            $langs = norvex_publish_news($row);
            $pdo->prepare("UPDATE news SET is_published = 1 WHERE slug = ?")->execute([$row['slug']]);
            header('Location: news.php?lang=' . urlencode($row['lang']) . '&published=' . urlencode(implode(',', $langs)));
        } else {
            norvex_unpublish_news($row);
            $pdo->prepare("UPDATE news SET is_published = 0 WHERE slug = ?")->execute([$row['slug']]);
            header('Location: news.php?lang=' . urlencode($row['lang']) . '&unpublished=1');
        }
    } catch (Throwable $e) {
        error_log('NORVEX publish error: ' . $e->getMessage());
        $_SESSION['norvex_flash_error'] = $e->getMessage();
        header('Location: news.php?lang=' . urlencode($row['lang']) . '&err=1');
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id      = (int)($_POST['id'] ?? 0);
    $slug    = trim($_POST['slug'] ?? '');
    $date    = trim($_POST['news_date'] ?? '');
    $cat     = trim($_POST['category'] ?? '');
    $title   = trim($_POST['title'] ?? '');
    $excerpt = trim($_POST['excerpt'] ?? '');
    $content = trim($_POST['content'] ?? '');
    $image   = trim($_POST['image'] ?? '');
    $featured = isset($_POST['is_featured']) ? 1 : 0;
    $active  = isset($_POST['is_active']) ? 1 : 0;
    $sort    = (int)($_POST['sort_order'] ?? 0);
    $lang    = $_POST['lang'] ?? 'ru';
    if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

    // Slug: латиница, дефисы
    if ($slug === '') {
        $slug = trim(preg_replace('/[^a-zA-Z0-9\-]+/', '-', $title), '-');
    }
    $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9\-]+/', '-', $slug), '-'));
    if ($slug === '') $slug = 'news-' . time();

    $error = null;
    if ($title === '') {
        $error = 'Не заполнено название';
    } else {
        try {
            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE news SET slug=?,news_date=?,category=?,title=?,excerpt=?,content=?,image=?,is_featured=?,is_active=?,sort_order=?,lang=? WHERE id=?");
                $stmt->execute([$slug, $date ?: null, $cat, $title, $excerpt, $content, $image, $featured, $active, $sort, $lang, $id]);
            } else {
                // Новая новость — автоматически в конец списка
                $sort = next_sort_order($pdo, 'news', $lang);
                $stmt = $pdo->prepare("INSERT INTO news (slug,news_date,category,title,excerpt,content,image,is_featured,is_active,sort_order,lang,is_published) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)");
                $stmt->execute([$slug, $date ?: null, $cat, $title, $excerpt, $content, $image, $featured, $active, $sort, $lang]);
            }
        } catch (Throwable $e) {
            error_log('NORVEX news save error: ' . $e->getMessage());
            $error = $e->getMessage();
        }
    }

    if ($error === null) {
        header('Location: news.php?lang=' . urlencode($lang) . '&saved=1');
        exit;
    }
    $_SESSION['norvex_flash_error'] = $error;
    header('Location: news.php?lang=' . urlencode($lang) . '&err=1');
    exit;
}

if (isset($_GET['delete'])) {
    $stmt = $pdo->prepare("DELETE FROM news WHERE id = ?");
    $stmt->execute([(int)$_GET['delete']]);
    header('Location: news.php');
    exit;
}

$lang = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

$stmt = $pdo->prepare("SELECT * FROM news WHERE lang = ? ORDER BY news_date DESC, sort_order ASC, id DESC");
$stmt->execute([$lang]);
$news = $stmt->fetchAll();

$editItem = null;
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare("SELECT * FROM news WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $editItem = $stmt->fetch() ?: null;
}

$allLangs = ['ru' => 'Русский', 'en' => 'English', 'ky' => 'Kyrgyz'];

require __DIR__ . '/header.php';
?>
<?php if (isset($_GET['saved'])): ?>
    <div class="alert alert-ok">Сохранено.</div>
<?php endif; ?>
<?php if (isset($_GET['published'])): ?>
    <div class="alert alert-ok">Статья опубликована (языки: <?= htmlspecialchars($_GET['published']) ?>). Страница доступна по адресу /&lt;lang&gt;/news/&lt;slug&gt;/.</div>
<?php endif; ?>
<?php if (isset($_GET['unpublished'])): ?>
    <div class="alert alert-ok">Статья снята с публикации (файлы удалены).</div>
<?php endif; ?>
<?php if (!empty($_SESSION['norvex_flash_error'])): ?>
    <div class="alert alert-err">Ошибка сохранения: <?= htmlspecialchars($_SESSION['norvex_flash_error']) ?></div>
    <?php unset($_SESSION['norvex_flash_error']); ?>
<?php endif; ?>
<h1>Новости</h1>
<div class="small lang-tabs">Язык:
    <?php foreach ($allLangs as $l => $name): ?>
        <a href="news.php?lang=<?= $l ?>" class="<?= $l === $lang ? '' : 'btn btn-sm' ?>" style="<?= $l === $lang ? 'color:#1a3a5c;font-weight:700' : '' ?>"><?= htmlspecialchars($name) ?></a>
    <?php endforeach; ?>
</div>

<div class="form-card">
    <h2><?= $editItem ? 'Редактировать' : 'Добавить' ?> новость</h2>
    <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
        <input type="hidden" name="id" value="<?= $editItem ? (int)$editItem['id'] : 0 ?>">
        <input type="hidden" name="lang" value="<?= htmlspecialchars($lang) ?>">

        <label>Заголовок</label>
        <input type="text" name="title" required value="<?= $editItem ? htmlspecialchars($editItem['title']) : '' ?>">

        <label>Slug (латиницей, для URL)</label>
        <input type="text" name="slug" placeholder="my-news-2026" value="<?= $editItem ? htmlspecialchars($editItem['slug']) : '' ?>">

        <label>Дата</label>
        <input type="date" name="news_date" value="<?= $editItem ? htmlspecialchars((string)$editItem['news_date']) : '' ?>">

        <label>Категория</label>
        <input type="text" name="category" placeholder="Законодательство" value="<?= $editItem ? htmlspecialchars($editItem['category']) : '' ?>">

        <label>Краткое описание</label>
        <textarea name="excerpt" rows="2"><?= $editItem ? htmlspecialchars($editItem['excerpt']) : '' ?></textarea>

        <label>Текст новости (HTML разрешён)</label>
        <textarea name="content" rows="8"><?= $editItem ? htmlspecialchars($editItem['content']) : '' ?></textarea>

        <label>Картинка</label>
        <div data-upload-field="news">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" data-upload-input hidden>
            <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem">
                <button type="button" class="btn btn-sm" data-upload-pick>Выбрать файл с компьютера</button>
                <button type="button" class="btn btn-sm btn-gray" data-upload-clear>Убрать</button>
            </div>
            <img data-upload-preview hidden alt="Предпросмотр" style="max-width:160px;border-radius:8px;margin-bottom:0.5rem;display:block">
            <p class="small" data-upload-status style="margin:0 0 0.5rem"></p>
            <input type="text" name="image" data-upload-url placeholder="/uploads/news/… или URL"
                   value="<?= $editItem ? htmlspecialchars($editItem['image']) : '' ?>">
        </div>

        <label>Сортировка</label>
        <input type="number" name="sort_order" value="<?= $editItem ? (int)$editItem['sort_order'] : next_sort_order($pdo, 'news', $lang) ?>" readonly>
        <p class="small" style="margin:-0.7rem 0 1rem">Проставляется автоматически: новая новость встаёт в конец списка.</p>

        <label><input type="checkbox" name="is_active" <?= (!$editItem || !empty($editItem['is_active'])) ? 'checked' : '' ?> style="width:auto;margin-right:0.4rem"> Активна</label>
        <label><input type="checkbox" name="is_featured" <?= (!empty($editItem['is_featured'] ?? 0)) ? 'checked' : '' ?> style="width:auto;margin-right:0.4rem"> Показывать на главной</label>

        <button type="submit" class="btn"><?= $editItem ? 'Сохранить' : 'Добавить' ?></button>
        <?php if ($editItem): ?>
            <a href="news.php?lang=<?= htmlspecialchars($lang) ?>" class="btn btn-gray" style="margin-left:0.5rem">Отмена</a>
        <?php endif; ?>
    </form>
</div>

<h2>Список новостей <span class="small" data-reorder-status></span></h2>
<table>
    <thead><tr><th></th><th>Дата</th><th>Заголовок</th><th>Категория</th><th>На главной</th><th>Публикация</th><th>Действия</th></tr></thead>
    <tbody data-sortable data-reorder-table="news" data-lang="<?= htmlspecialchars($lang) ?>">
    <?php foreach ($news as $n): ?>
    <tr data-id="<?= (int)$n['id'] ?>">
        <td><span class="drag-handle" draggable="true" data-drag-handle title="Потяните для перестановки">⠿</span></td>
        <td><?= htmlspecialchars((string)$n['news_date']) ?></td>
        <td><?= htmlspecialchars($n['title']) ?><br><span class="small"><?= htmlspecialchars($n['slug']) ?></span></td>
        <td><?= htmlspecialchars($n['category']) ?></td>
        <td><?= !empty($n['is_featured']) ? 'Да' : 'Нет' ?></td>
        <td><?= !empty($n['is_published']) ? '<span class="badge badge-done">Опубликована</span>' : '<span class="badge badge-new">Черновик</span>' ?></td>
        <td style="white-space:nowrap">
            <a href="news.php?lang=<?= htmlspecialchars($lang) ?>&edit=<?= (int)$n['id'] ?>" class="btn btn-sm">Редактировать</a>
            <form method="post" style="display:inline"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>"><input type="hidden" name="publish_action" value="<?= !empty($n['is_published']) ? 'unpublish' : 'publish' ?>"><input type="hidden" name="publish_id" value="<?= (int)$n['id'] ?>"><button type="submit" class="btn btn-sm <?= !empty($n['is_published']) ? 'btn-gray' : 'btn-success' ?>"><?= !empty($n['is_published']) ? 'Снять' : 'Опубликовать' ?></button></form>
            <a href="news.php?delete=<?= (int)$n['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('Удалить новость?')">Удалить</a>
        </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if (empty($news)): ?>
    <p class="small">В этом разделе пока пусто.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
