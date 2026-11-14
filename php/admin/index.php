<?php
// admin/index.php — дашборд
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();

$totalInquiries = (int)$pdo->query("SELECT COUNT(*) FROM inquiries")->fetchColumn();
$newInquiries   = (int)$pdo->query("SELECT COUNT(*) FROM inquiries WHERE status='new'")->fetchColumn();
$totalServices  = (int)$pdo->query("SELECT COUNT(*) FROM services")->fetchColumn();
$totalTeam      = (int)$pdo->query("SELECT COUNT(*) FROM team")->fetchColumn();
$totalDocuments = (int)$pdo->query("SELECT COUNT(*) FROM documents")->fetchColumn();
try { $totalSlots = (int)$pdo->query("SELECT COUNT(DISTINCT page_key, block_key, slot_key) FROM content")->fetchColumn(); } catch (Throwable $e) { $totalSlots = 0; }
try { $totalFaq = (int)$pdo->query("SELECT COUNT(*) FROM faq")->fetchColumn(); } catch (Throwable $e) { $totalFaq = 0; }
$recent = $pdo->query("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 5")->fetchAll();

require __DIR__ . '/header.php';
?>
<h1>Дашборд</h1>
<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
    <div style="background:#fff;padding:1rem;border-radius:8px;min-width:140px;">
        <div class="small">Всего заявок</div><div style="font-size:1.5rem;font-weight:700"><?= $totalInquiries ?></div>
    </div>
    <div style="background:#fff;padding:1rem;border-radius:8px;min-width:140px;">
        <div class="small">Новых заявок</div><div style="font-size:1.5rem;font-weight:700;color:#92400e"><?= $newInquiries ?></div>
    </div>
    <div style="background:#fff;padding:1rem;border-radius:8px;min-width:140px;">
        <div class="small">Услуг</div><div style="font-size:1.5rem;font-weight:700"><?= $totalServices ?></div>
    </div>
    <div style="background:#fff;padding:1rem;border-radius:8px;min-width:140px;">
        <div class="small">Команда</div><div style="font-size:1.5rem;font-weight:700"><?= $totalTeam ?></div>
    </div>
    <div style="background:#fff;padding:1rem;border-radius:8px;min-width:140px;">
        <div class="small">Документов</div><div style="font-size:1.5rem;font-weight:700"><?= $totalDocuments ?></div>
    </div>
    <div style="background:#fff;padding:1rem;border-radius:8px;min-width:140px;">
        <div class="small">Текстовых слотов</div><div style="font-size:1.5rem;font-weight:700"><?= $totalSlots ?></div>
    </div>
    <div style="background:#fff;padding:1rem;border-radius:8px;min-width:140px;">
        <div class="small">FAQ-записей</div><div style="font-size:1.5rem;font-weight:700"><?= $totalFaq ?></div>
    </div>
</div>

<h2>Последние заявки</h2>
<table>
    <thead><tr><th>Дата</th><th>Имя</th><th>Телефон</th><th>Email</th><th>Статус</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($recent as $r): ?>
    <tr>
        <td><?= htmlspecialchars(date('d.m.Y H:i', strtotime($r['created_at']))) ?></td>
        <td><?= htmlspecialchars($r['name']) ?></td>
        <td><?= htmlspecialchars($r['phone']) ?></td>
        <td><?= htmlspecialchars($r['email']) ?></td>
        <td><span class="badge badge-<?= $r['status'] === 'new' ? 'new' : 'done' ?>"><?= $r['status'] === 'new' ? 'Новая' : 'Обработано' ?></span></td>
        <td><a href="inquiries.php" class="btn btn-sm">Все заявки</a></td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if (empty($recent)): ?>
    <p class="small">Заявок пока нет.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
