<?php
// news-sitemap.php — XML-карта сайта со всеми опубликованными статьями новостей
// (новые из админки попадают сюда без пересборки). Подключается в robots.txt.
require_once __DIR__ . '/config.php';

header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex');

$site = 'https://norvexhse.com';

try {
    $pdo = norvex_db();
    $rows = $pdo->query(
        "SELECT slug, lang, MAX(news_date) AS d, MAX(created_at) AS c
           FROM news
          WHERE is_active = 1 AND is_published = 1
          GROUP BY slug, lang
          ORDER BY d DESC"
    )->fetchAll();
} catch (Throwable $e) {
    $rows = []; // таблица ещё не мигрирована — отдаём пустой, но валидный urlset
}

$byLang = [];
$dates  = [];
foreach ($rows as $r) {
    $s = (string)$r['slug'];
    $byLang[$s][] = (string)$r['lang'];
    $d = (string)($r['d'] ?? '');
    if ($d !== '' && (empty($dates[$s]) || $d > $dates[$s])) $dates[$s] = $d;
}

$esc = function ($v) {
    return htmlspecialchars((string)$v, ENT_XML1 | ENT_QUOTES, 'UTF-8');
};

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";
foreach ($byLang as $slug => $langs) {
    foreach ($langs as $lang) {
        $loc = $site . '/' . $lang . '/news/' . $slug . '/';
        $lastmod = $dates[$slug] !== '' ? date('Y-m-d', strtotime($dates[$slug])) : '';
        echo "  <url>\n";
        echo "    <loc>" . $esc($loc) . "</loc>\n";
        if ($lastmod !== '') echo "    <lastmod>" . $lastmod . "</lastmod>\n";
        foreach (['ru', 'en', 'ky'] as $alt) {
            echo '    <xhtml:link rel="alternate" hreflang="' . $alt . '" href="' . $esc($site . '/' . $alt . '/news/' . $slug . '/') . '"/>' . "\n";
        }
        echo '    <xhtml:link rel="alternate" hreflang="x-default" href="' . $esc($site . '/ru/news/' . $slug . '/') . '"/>' . "\n";
        echo "  </url>\n";
    }
}
echo "</urlset>\n";
