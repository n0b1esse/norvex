<?php
// admin/inquiries.php — список заявок
require_once __DIR__ . '/bootstrap.php';

$pdo = norvex_db();

if (isset($_POST['set_status']) && isset($_POST['id'])) {
    $status = (isset($_POST['status']) && $_POST['status'] === 'processed') ? 'processed' : 'new';
    $stmt = $pdo->prepare("UPDATE inquiries SET status = ? WHERE id = ?");
    $stmt->execute([$status, (int)$_POST['id']]);
    header('Location: inquiries.php');
    exit;
}

if (isset($_POST['delete']) && isset($_POST['id'])) {
    $stmt = $pdo->prepare("DELETE FROM inquiries WHERE id = ?");
    $stmt->execute([(int)$_POST['id']]);
    header('Location: inquiries.php');
    exit;
}

$inquiries = $pdo->query("SELECT * FROM inquiries ORDER BY created_at DESC")->fetchAll();

require __DIR__ . '/header.php';
?>
<h1>Заявки с сайта</h1>
<p class="small">Заявки приходят на email <code><?= htmlspecialchars(norvex_inquiry_recipient()) ?></code> и дублируются здесь.</p>

<table>
    <thead>
    <tr>
        <th>ID</th><th>Дата</th><th>Имя</th><th>Компания</th><th>Телефон</th><th>Email</th><th>Язык</th><th>Статус</th><th>Сообщение</th><th>Действия</th>
    </tr>
    </thead>
    <tbody>
    <?php foreach ($inquiries as $r): ?>
    <tr>
        <td><?= (int)$r['id'] ?></td>
        <td><?= htmlspecialchars(date('d.m.Y H:i', strtotime($r['created_at']))) ?></td>
        <td><?= htmlspecialchars($r['name']) ?></td>
        <td><?= htmlspecialchars($r['company']) ?></td>
        <td><?= htmlspecialchars($r['phone']) ?></td>
        <td><?= htmlspecialchars($r['email']) ?></td>
        <td><?= htmlspecialchars($r['lang']) ?></td>
        <td>
            <form method="post" style="display:inline"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
                <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
                <input type="hidden" name="set_status" value="1">
                <input type="hidden" name="status" value="<?= $r['status'] === 'new' ? 'processed' : 'new' ?>">
                <button type="submit" class="btn btn-sm <?= $r['status'] === 'new' ? 'btn-success' : 'btn-gray' ?>">
                    <?= $r['status'] === 'new' ? 'Обработано' : 'В новую' ?>
                </button>
            </form>
        </td>
        <td style="max-width:300px"><?= nl2br(htmlspecialchars((string)substr((string)$r['message'], 0, 150))) ?><?= strlen((string)$r['message']) > 150 ? '…' : '' ?></td>
        <td>
            <form method="post" style="display:inline" onsubmit="return confirm('Удалить заявку?')"><input type="hidden" name="csrf" value="<?= htmlspecialchars(norvex_csrf_token()) ?>">
                <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
                <input type="hidden" name="delete" value="1">
                <button type="submit" class="btn btn-sm btn-danger">Удалить</button>
            </form>
        </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>

<?php if (empty($inquiries)): ?>
    <p class="small">Заявок пока нет.</p>
<?php endif; ?>

<?php require __DIR__ . '/footer.php'; ?>
