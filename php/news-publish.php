<?php
// news-publish.php — публикация/снятие статьи из админки.
// НЕ веб-страница: подключается только admin/news.php. Прямой запрос маршрутом не нужен.
if (basename($_SERVER['SCRIPT_NAME'] ?? '') === 'news-publish.php' && php_sapi_name() !== 'cli') {
    http_response_code(404);
    exit;
}

/** Корень сайта (файлы админских/сайтовых PHP лежат в корне домена). */
function norvex_site_root(): string {
    return dirname(__DIR__);
}

function norvex_news_months(string $lang): array {
    $map = [
        'ru' => ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
        'en' => ['January','February','March','April','May','June','July','August','September','October','November','December'],
        'ky' => ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],
    ];
    return $map[$lang] ?? $map['ru'];
}

function norvex_format_date(string $iso, string $lang): string {
    $ts = strtotime($iso);
    if (!$ts) $ts = time();
    $d = (int)date('j', $ts);
    $m = (int)date('n', $ts);
    $y = (int)date('Y', $ts);
    $months = norvex_news_months($lang);
    if ($lang === 'en') return sprintf('%s %d, %d', $months[$m - 1], $d, $y);
    if ($lang === 'ky') return sprintf('%d-%s %d', $d, $months[$m - 1], $y);
    return sprintf('%d %s %d г.', $d, $months[$m - 1], $y);
}

function norvex_news_category_label(string $lang, string $category): string {
    $map = [
        'ru' => ['Законодательство' => 'Законодательство', 'Компания' => 'Компания', 'Экспертиза' => 'Экспертиза', 'События' => 'События'],
        'en' => ['Законодательство' => 'Legislation', 'Компания' => 'Company', 'Экспертиза' => 'Expertise', 'События' => 'Events'],
        'ky' => ['Законодательство' => 'Законодательство', 'Компания' => 'Компания', 'Экспертиза' => 'Экспертиза', 'События' => 'События'],
    ];
    return $map[$lang][$category] ?? $category;
}

function norvex_news_template(string $lang): string {
    $file = norvex_site_root() . '/' . $lang . '/news-template/index.html';
    if (!is_readable($file)) {
        throw new RuntimeException('Не найден шаблон статьи (' . $lang . '). Пересоберите и задеплойте сайт.');
    }
    return file_get_contents($file);
}

/** Опубликовать статью во всех трёх языках. Возвращает список языков. */
function norvex_publish_news(array $news): array {
    $slug = (string)($news['slug'] ?? '');
    if ($slug === '' || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
        throw new RuntimeException('Недопустимый slug (только строчные латинские буквы, цифры и дефисы)');
    }
    $root  = norvex_site_root();
    $title = (string)($news['title'] ?? '');
    $body  = (string)($news['content'] ?? '');
    $image = trim((string)($news['image'] ?? ''));
    if ($image === '') $image = '/assets/hero-bg.jpg';
    $excerpt = trim(strip_tags((string)($news['excerpt'] ?? '')));
    $excerpt = preg_replace('/\s+/u', ' ', $excerpt);
    $category = (string)($news['category'] ?? '');
    $date = (string)($news['news_date'] ?? '');

    $esc = function ($v) {
        return htmlspecialchars((string)$v, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    };

    // og:image/twitter:image в шаблоне — абсолютный URL с префиксом сайта;
    // сначала чиним их (без двойного слэша), потом одиночный %%IMAGE%% для src
    $imageAbs = preg_match('#^https?://#i', $image) ? $image : ('https://norvexhse.com/' . ltrim($image, '/'));

    $published = [];
    foreach (['ru', 'en', 'ky'] as $lang) {
        $html = norvex_news_template($lang);
        $replacements = [
            'https://norvexhse.com/%%IMAGE%%'  => $imageAbs,
            '%%TITLE%%'        => $esc($title),
            '%%EXCERPT_TEXT%%' => $esc($excerpt),
            '%%BODY%%'         => $body, // доверяем админу (HTML)
            '%%IMAGE%%'        => $esc($image),
            '%%DATE%%'         => $esc(norvex_format_date($date !== '' ? $date : 'now', $lang)),
            '%%CATEGORY_LABEL%%' => $esc(norvex_news_category_label($lang, $category)),
            '%%SLUG%%'         => $esc($slug),
        ];
        $html = str_replace(array_keys($replacements), array_values($replacements), $html);
        if (strpos($html, '%%') !== false) {
            // частично необработанные плейсхолдеры — не публикуем битую страницу
            throw new RuntimeException('Шаблон не раскрылся полностью для ' . $lang . ' (остался плейсхолдер)');
        }
        $dir = $root . '/' . $lang . '/news/' . $slug;
        if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
            throw new RuntimeException('Не удалось создать каталог: ' . $dir);
        }
        if (@file_put_contents($dir . '/index.html', $html) === false) {
            throw new RuntimeException('Не удалось записать: ' . $dir . '/index.html');
        }
        $published[] = $lang;
    }
    return $published;
}

/** Снять статью с публикации (удалить файлы страницы). */
function norvex_unpublish_news(array $news): array {
    $slug = (string)($news['slug'] ?? '');
    if ($slug === '' || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
        throw new RuntimeException('Недопустимый slug');
    }
    $root = norvex_site_root();
    $removed = [];
    foreach (['ru', 'en', 'ky'] as $lang) {
        $file = $root . '/' . $lang . '/news/' . $slug . '/index.html';
        if (is_file($file)) {
            @unlink($file);
            @rmdir(dirname($file));
            $removed[] = $lang;
        }
    }
    return $removed;
}
