<?php
// admin/content.php — редактор текстов сайта (таблица content).
// Инлайн-режим: правки прямо в таблице, сохранение — кнопкой «Сохранить изменения» (Ctrl+S).
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();
$pages = ['home', 'about', 'team', 'services', 'contacts', 'documents', 'news', 'privacy', 'cooperation', 'global'];
$allLangs = ['ru' => 'Русский', 'en' => 'English', 'ky' => 'Kyrgyz'];

$page = $_GET['page'] ?? 'home';
if (!in_array($page, $pages, true) && $page !== 'all') {
    $page = 'home';
}
$q = trim($_GET['q'] ?? '');

$where = [];
$params = [];
if ($page !== 'all') {
    $where[] = 'page_key = ?';
    $params[] = $page;
}
if ($q !== '') {
    $where[] = '(block_key LIKE ? OR slot_key LIKE ? OR `value` LIKE ?)';
    $like = '%' . $q . '%';
    $params[] = $like; $params[] = $like; $params[] = $like;
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
$stmt = $pdo->prepare(
    "SELECT page_key, block_key, slot_key,
            MAX(CASE WHEN lang = 'ru' THEN `value` END) AS v_ru,
            MAX(CASE WHEN lang = 'en' THEN `value` END) AS v_en,
            MAX(CASE WHEN lang = 'ky' THEN `value` END) AS v_ky
     FROM content $whereSql
     GROUP BY page_key, block_key, slot_key
     ORDER BY page_key, block_key, slot_key"
);
$stmt->execute($params);
$slots = $stmt->fetchAll();

require __DIR__ . '/header.php';
?>
<style>
  .cell-grid td { vertical-align: top; padding: 0.4rem 0.6rem; }
  textarea.cell { width: 100%; box-sizing: border-box; font-family: inherit; font-size: 0.85rem; margin: 0; padding: 0.35rem; min-height: 2.6em; border: 1px solid #e5e7eb; background: #fafafa; border-radius: 6px; }
  textarea.cell:focus { outline: none; border-color: #1a3a5c; background: #fff; }
  textarea.cell.is-dirty { border-color: #d97706; background: #fffbeb; }
  .cell-grid code { font-size: 0.72rem; word-break: break-all; }
  .save-bar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; background: #fff; padding: 0.6rem 0.75rem; border-radius: 8px; margin-bottom: 0.75rem; position: sticky; top: 0.5rem; z-index: 5; border: 1px solid #e5e7eb; }
</style>

<h1>Тексты сайта</h1>
<p class="small">Все правки применяются на сайте сразу после сохранения — пересборка не нужна. Подсвеченные жёлтым ячейки ещё не сохранены. HTML в слотах, где он был изначально (заголовки с выделением), разрешён.</p>

<div class="save-bar">
    <button class="btn btn-success" data-save-cells disabled>Сохранить изменения (<span data-save-count>0</span>)</button>
    <span class="small" data-save-status>Ctrl+S — сохранить.</span>
</div>

<form method="get" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:0.75rem">
    <label style="margin:0">Страница:</label>
    <select name="page" style="width:auto;margin:0">
        <?php foreach (array_merge(['all' => 'Все страницы'], array_combine($pages, $pages)) as $p => $pname): ?>
            <option value="<?= htmlspecialchars($p) ?>" <?= $p === $page ? 'selected' : '' ?>><?= htmlspecialchars($pname) ?></option>
        <?php endforeach; ?>
    </select>
    <input type="text" name="q" value="<?= htmlspecialchars($q) ?>" placeholder="Поиск по слоту или тексту…" style="width:auto;margin:0;flex:1;min-width:180px">
    <button type="submit" class="btn btn-sm">Найти</button>
</form>

<table class="cell-grid" data-inline-grid>
    <thead><tr><th style="width:26%">Слот</th><th>Русский</th><th>English</th><th>Кыргызча</th></tr></thead>
    <tbody>
    <?php foreach ($slots as $s): $key = $s['page_key'] . '.' . $s['block_key'] . '.' . $s['slot_key']; ?>
    <tr>
        <td><code><?= htmlspecialchars($key) ?></code></td>
        <?php foreach (['ru', 'en', 'ky'] as $l): $val = (string)($s['v_' . $l] ?? ''); ?>
            <td><textarea class="cell" rows="2" data-page="<?= htmlspecialchars($s['page_key']) ?>" data-block="<?= htmlspecialchars($s['block_key']) ?>" data-slot="<?= htmlspecialchars($s['slot_key']) ?>" data-lang="<?= $l ?>" data-orig="<?= htmlspecialchars($val, ENT_QUOTES) ?>"><?= htmlspecialchars($val) ?></textarea></td>
        <?php endforeach; ?>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<p class="small">Слотов: <?= count($slots) ?>. Пустые значения означают, что на сайте показывается встроенный текст (фолбэк).</p>

<?php require __DIR__ . '/footer.php'; ?>
