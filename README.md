# NORVEX — staging-клон (reconstruction)

Это **рабочая копия сайта norvexhse.com**, собранная вручную с живого сайта (04.11.2026), потому что оригинальное репозитория недоступно. Используется как staging-окружение для доработок, пока у клиента не найдётся оригинальный код.

## Структура

```
ru|en|ky/<page>/index.html   # 24 страницы (8 × 3 языка) — в корне репо
_astro/Layout.BXn8tf-v.css   # основной CSS
assets/              # логотипы, hero, командные фото, cooperation-панели
flags/               # иконки переключателя языков
404.html             # брендированная 404
robots.txt, sitemap-*.xml
vercel.json          # редирект / → /ru + security-заголовки
recon/               # (не коммитится) исходные HTML с живого сайта
```

## Отличия от продакшена

- Лого и фото переведены с temoor.uz на собственные пути (в клоне нет зависимости от чужого домена).
- Трекер просмотров и **отправка формы отключены** (endpoint → `about:blank`), чтобы не писать мусор в прод-Directus.
- Добавлены security-заголовки и редирект `/` → `/ru/`.

## Деплой на Vercel (staging)

Репо — чистая статика, файлов сборки нет.

Vercel → Project → Settings → Build & Output Settings:
- Framework Preset: **Other**
- Build Command / Install Command / Output Directory: **все Override выключены (default)**

После правок в Settings → **Deployments → Redeploy** (без кэша не требуется).

## Дальше

- Правки: HTML правится напрямую; стили — в `_astro/Layout.BXn8tf-v.css` или inline `<style>` блоках страниц.
- Когда появится оригинальный репозиторий — переносим изменения в него (правки по списку: see dashboard in Obsidian).
