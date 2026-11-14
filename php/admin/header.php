<?php
// admin/header.php — общий верх для страниц админки
require_once __DIR__ . '/bootstrap.php';

$currentPage = basename($_SERVER['SCRIPT_NAME'] ?? '');
$menu = [
    'index.php'     => 'Дашборд',
    'inquiries.php' => 'Заявки',
    'services.php'  => 'Услуги',
    'team.php'      => 'Команда',
    'documents.php' => 'Документы',
    'news.php'      => 'Новости',
    'clients.php'   => 'Клиенты',
    'content.php'   => 'Тексты',
    'faq.php'       => 'FAQ',
    'settings.php'  => 'Настройки',
];
?>
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="csrf-token" content="<?= htmlspecialchars(norvex_csrf_token()) ?>">
<title>Админка NORVEX</title>
<style>
* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #f3f4f6; color: #111827; }
.topbar { background: #1a3a5c; color: #fff; padding: 0.75rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
.topbar a { color: #cbd5e1; text-decoration: none; margin-left: 1rem; font-size: 0.9rem; }
.topbar a:hover { color: #fff; text-decoration: underline; }
.topbar a.active { color: #fff; font-weight: 700; border-bottom: 2px solid #60a5fa; }
.container { max-width: 1200px; margin: 1.5rem auto; padding: 0 1rem; }
h1 { font-size: 1.25rem; margin-bottom: 1rem; color: #1a3a5c; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 1.5rem; }
th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
th { background: #f9fafb; font-weight: 600; font-size: 0.875rem; color: #374151; }
tr:hover { background: #f9fafb; }
.btn { display: inline-block; padding: 0.5rem 1rem; background: #1a3a5c; color: #fff; text-decoration: none; border-radius: 6px; font-size: 0.875rem; border: none; cursor: pointer; }
.btn:hover { background: #16456b; }
.btn-sm { padding: 0.35rem 0.7rem; font-size: 0.8rem; }
.btn-danger { background: #dc2626; }
.btn-danger:hover { background: #b91c1c; }
.btn-success { background: #16a34a; }
.btn-success:hover { background: #15803d; }
.btn-gray { background: #6b7280; }
.form-card { background: #fff; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; max-width: 560px; }
label { display: block; margin-bottom: 0.4rem; font-weight: 500; font-size: 0.875rem; color: #374151; }
input, textarea, select { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; margin-bottom: 1rem; }
input:focus, textarea:focus, select:focus { outline: none; border-color: #1a3a5c; }
.alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
.alert-ok { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.alert-err { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
.badge-new { background: #fef3c7; color: #92400e; }
.badge-done { background: #d1fae5; color: #065f46; }
.page-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.small { font-size: 0.85rem; color: #6b7280; }
@media (max-width: 1100px) { .container { overflow-x: auto; } }
@media (max-width: 760px) {
  .topbar { flex-direction: column; align-items: stretch; padding: 0.6rem 1rem; gap: 0.15rem; }
  .topbar > div:last-child { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; }
  .topbar a { margin-left: 0; display: inline-block; padding: 0.4rem 0.2rem; font-size: 0.9rem; }
  .container { margin: 0.75rem auto; padding: 0 0.75rem; }
  h1 { font-size: 1.1rem; margin-bottom: 0.6rem; }
  table, thead, tbody, tr, td { display: block; width: 100%; }
  thead { display: none; }
  table { background: transparent; border-radius: 0; }
  tr { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 0.75rem; padding: 0.5rem 0.75rem; }
  td { border: 0; border-bottom: 1px dashed #eceff1; padding: 0.4rem 0; display: block; }
  td:last-child { border-bottom: 0; }
  tr:hover { background: #fff; }
  .btn { padding: 0.65rem 1rem; min-height: 42px; }
  .btn-sm { padding: 0.45rem 0.8rem; min-height: 38px; font-size: 0.85rem; }
  .form-card { max-width: none; padding: 1rem; border-radius: 10px; }
  input, textarea, select { font-size: 16px; /* iOS не зумит поля */ }
  .page-actions { flex-direction: column; gap: 0.5rem; align-items: stretch; }
  .lang-tabs { margin-bottom: 0.6rem; }
}
.lang-tabs { margin-bottom: 1rem; }
.lang-tabs a { margin-right: 0.5rem; }
</style>
</head>
<body>
<div class="topbar">
    <div><strong>Админка NORVEX</strong></div>
    <div>
        <?php foreach ($menu as $file => $label): ?>
            <a href="<?= $file ?>" class="<?= $currentPage === $file ? 'active' : '' ?>"><?= $label ?></a>
        <?php endforeach; ?>
        <a href="../" target="_blank">Открыть сайт</a>
        <a href="logout.php">Выйти</a>
    </div>
</div>
<div class="container">
