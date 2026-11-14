<?php
// api.php — публичный JSON-API контента (заменяет Directus для сборки и оверлея)
// Отдаёт данные из MySQL: настройки, команда, услуги, документы.
//
// GET /api.php?action=site_settings&lang=ru
// GET /api.php?action=team&lang=ru
// GET /api.php?action=services&lang=ru
// GET /api.php?action=documents&lang=ru
// GET /api.php?action=all&lang=ru   — всё сразу
//
// Ответ: { "ok": true, "action": "...", "lang": "ru", "data": ... }

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=60');

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? 'all';
$lang   = $_GET['lang'] ?? 'ru';
if (!in_array($lang, ['ru', 'en', 'ky'], true)) $lang = 'ru';

try {
    $pdo = norvex_db();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB unavailable'], JSON_UNESCAPED_UNICODE);
    exit;
}

function fetch_setting(PDO $pdo, string $key, string $lang): ?string {
    // Основной язык — точный; если перевода нет, откатываемся на ru, затем на любой
    $stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = ? AND lang = ? LIMIT 1");
    $stmt->execute([$key, $lang]);
    $row = $stmt->fetch();
    if ($row) return (string)$row['value'];

    if ($lang !== 'ru') {
        $stmt->execute([$key, 'ru']);
        $row = $stmt->fetch();
        if ($row) return (string)$row['value'];
    }

    $stmt = $pdo->prepare("SELECT `value` FROM settings WHERE `key` = ? LIMIT 1");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? (string)$row['value'] : null;
}

function fetch_rows(PDO $pdo, string $table, string $lang, bool $onlyActive = true): array {
    // Фильтр по is_active есть не во всех таблицах (у documents такой колонки нет),
    // поэтому проверяем наличие колонки перед добавлением условия.
    static $hasActive = [];
    if (!array_key_exists($table, $hasActive)) {
        $chk = $pdo->prepare(
            "SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'is_active'"
        );
        $chk->execute([NORVEX_DB_NAME, $table]);
        $hasActive[$table] = ((int)$chk->fetchColumn()) > 0;
    }

    // Для документов сортируем по категории, затем по sort_order — иначе
    // «Политики» и «Процедуры» смешиваются в одном списке.
    $order = ($table === 'documents')
        ? " ORDER BY category ASC, sort_order ASC, id ASC"
        : " ORDER BY sort_order ASC, id ASC";

    $sql = "SELECT * FROM `$table` WHERE lang = ?";
    if ($onlyActive && $hasActive[$table]) $sql .= " AND is_active = 1";
    $sql .= $order;
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$lang]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        // Таблица ещё не создана — отдаём пустой список, а не 500
        error_log("api.php: table `$table` unavailable: " . $e->getMessage());
        return [];
    }
}

/** Приводит записи команды к виду { position, experience }.
 *  Если колонка experience ещё пустая, а в position лежит склеенное
 *  «Должность · Опыт» — разделяем на два поля. */
function normalize_team(array $rows): array {
    foreach ($rows as &$m) {
        if (!isset($m['experience'])) $m['experience'] = '';
        if (trim((string)$m['experience']) === '' && !empty($m['position'])) {
            if (preg_match('/^(.*?)\s*[·•]\s*(.+)$/u', (string)$m['position'], $mm)) {
                $m['position'] = trim($mm[1]);
                $m['experience'] = trim($mm[2]);
            }
        }
    }
    unset($m);
    return $rows;
}

/** Новости языка. До миграции is_published колонки может не быть — тогда отдаём все активные. */
function fetch_news(PDO $pdo, string $lang): array {
    try {
        $stmt = $pdo->prepare(
            "SELECT * FROM `news` WHERE lang = ? AND is_active = 1 AND is_published = 1
             ORDER BY news_date DESC, sort_order ASC, id DESC"
        );
        $stmt->execute([$lang]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        $stmt = $pdo->prepare(
            "SELECT * FROM `news` WHERE lang = ? AND is_active = 1
             ORDER BY news_date DESC, sort_order ASC, id DESC"
        );
        $stmt->execute([$lang]);
        return $stmt->fetchAll();
    }
}

function site_settings(PDO $pdo, string $lang): array {
    return [
        'og_image'           => fetch_setting($pdo, 'og_image', $lang),
        'hero_image'         => fetch_setting($pdo, 'hero_image', $lang),
        'about_image'        => fetch_setting($pdo, 'about_image', $lang),
        'email'              => fetch_setting($pdo, 'site_email', $lang),
        'phone'              => fetch_setting($pdo, 'site_phone', $lang),
        'address'            => fetch_setting($pdo, 'site_address', $lang),
        'working_hours'      => fetch_setting($pdo, 'working_hours', $lang),
        'footer_tagline'     => fetch_setting($pdo, 'footer_tagline', $lang),
        'site_title'         => fetch_setting($pdo, 'site_title', $lang),
        'inquiry_email'      => fetch_setting($pdo, 'inquiry_email', $lang),
        'social_instagram'   => fetch_setting($pdo, 'social_instagram', $lang),
        'social_telegram'    => fetch_setting($pdo, 'social_telegram', $lang),
        'social_linkedin'    => fetch_setting($pdo, 'social_linkedin', $lang),
        'type_scale_hero'    => fetch_setting($pdo, 'type_scale_hero', $lang),
        'type_scale_heading' => fetch_setting($pdo, 'type_scale_heading', $lang),
        'type_scale_body'    => fetch_setting($pdo, 'type_scale_body', $lang),
    ];
}

/** Все текстовые слоты страницы для языка.
 *  Возвращает плоскую карту "page.block.slot" => значение. */
function content_slots(PDO $pdo, string $lang, ?string $page = null): array {
    try {
        $sql = "SELECT page_key, block_key, slot_key, `value` FROM content WHERE lang = ?";
        $params = [$lang];
        if ($page !== null && $page !== '') {
            $sql .= " AND page_key = ?";
            $params[] = $page;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[$row['page_key'] . '.' . $row['block_key'] . '.' . $row['slot_key']] = $row['value'];
        }
        return $out;
    } catch (Throwable $e) {
        // Таблица content ещё не создана (до импорта сида) — отдаём пусто
        error_log("api.php: content: " . $e->getMessage());
        return [];
    }
}

/** FAQ-записи страницы для языка. */
function faq_items(PDO $pdo, string $lang, ?string $page = null): array {
    try {
        $sql = "SELECT id, page_key, lang, group_name, question, answer, sort_order
                FROM faq WHERE lang = ? AND is_active = 1";
        $params = [$lang];
        if ($page !== null && $page !== '') {
            $sql .= " AND page_key = ?";
            $params[] = $page;
        }
        $sql .= " ORDER BY sort_order ASC, id ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    } catch (Throwable $e) {
        error_log("api.php: faq: " . $e->getMessage());
        return [];
    }
}

/** Соответствие названий категорий документов (из БД) к slug'ам страницы. */
function document_category_slug(?string $category): string {
    $map = [
        'политики' => 'policies', 'политика' => 'policies',
        'процедуры' => 'procedures', 'процедура' => 'procedures',
        'чек-листы' => 'checklists', 'чек-лист' => 'checklists',
        'policies' => 'policies', 'policy' => 'policies',
        'procedures' => 'procedures', 'procedure' => 'procedures',
        'checklists' => 'checklists', 'checklist' => 'checklists',
        'саясаттар' => 'policies', 'процедуралар' => 'procedures', 'чек-листтер' => 'checklists',
    ];
    $key = mb_strtolower(trim((string)$category));
    return $map[$key] ?? '';
}

switch ($action) {
    case 'site_settings':
        $data = site_settings($pdo, $lang);
        break;

    case 'content':
        $page = isset($_GET['page']) ? (string)$_GET['page'] : null;
        $data = [
            'slots' => content_slots($pdo, $lang, $page),
            'faq'   => faq_items($pdo, $lang, $page),
        ];
        break;

    case 'faq':
        $data = faq_items($pdo, $lang, isset($_GET['page']) ? (string)$_GET['page'] : null);
        break;

    case 'team':
        $data = normalize_team(fetch_rows($pdo, 'team', $lang));
        break;

    case 'services':
        $data = fetch_rows($pdo, 'services', $lang);
        break;

    case 'documents':
        $data = fetch_rows($pdo, 'documents', $lang);
        foreach ($data as &$d) {
            $d['category_slug'] = document_category_slug($d['category'] ?? '');
        }
        unset($d);
        break;

    case 'news':
        $data = fetch_news($pdo, $lang);
        break;

    case 'news_one':
        $slug = (string)($_GET['slug'] ?? '');
        try {
            $stmt = $pdo->prepare("SELECT * FROM `news` WHERE slug = ? AND lang = ? AND is_published = 1 LIMIT 1");
            $stmt->execute([$slug, $lang]);
            $row = $stmt->fetch();
        } catch (PDOException $e) {
            $stmt = $pdo->prepare("SELECT * FROM `news` WHERE slug = ? AND lang = ? LIMIT 1");
            $stmt->execute([$slug, $lang]);
            $row = $stmt->fetch();
        }
        $data = $row ?: null;
        break;

    case 'clients':
        $data = fetch_rows($pdo, 'clients', $lang);
        break;

    case 'all':
        $data = [
            'site_settings' => site_settings($pdo, $lang),
            'team'      => normalize_team(fetch_rows($pdo, 'team', $lang)),
            'services'  => fetch_rows($pdo, 'services', $lang),
            'documents' => array_map(function ($d) {
                $d['category_slug'] = document_category_slug($d['category'] ?? '');
                return $d;
            }, fetch_rows($pdo, 'documents', $lang)),
            'news'      => fetch_news($pdo, $lang),
            'clients'   => fetch_rows($pdo, 'clients', $lang),
            'slots'     => content_slots($pdo, $lang),
            'faq'       => faq_items($pdo, $lang),
        ];
        break;

    case 'tables':
        // Диагностика: список таблиц и наличие колонки is_active
        $out = [];
        foreach (['team', 'services', 'documents', 'inquiries', 'settings', 'admins'] as $t) {
            $chk = $pdo->prepare(
                "SELECT COUNT(*) FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?"
            );
            $chk->execute([NORVEX_DB_NAME, $t]);
            $exists = ((int)$chk->fetchColumn()) > 0;
            $hasActive = false;
            if ($exists) {
                $chk2 = $pdo->prepare(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'is_active'"
                );
                $chk2->execute([NORVEX_DB_NAME, $t]);
                $hasActive = ((int)$chk2->fetchColumn()) > 0;
            }
            $out[$t] = ['exists' => $exists, 'is_active' => $hasActive];
        }
        $data = $out;
        break;

    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'unknown action'], JSON_UNESCAPED_UNICODE);
        exit;
}

echo json_encode([
    'ok' => true,
    'action' => $action,
    'lang' => $lang,
    'data' => $data,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
