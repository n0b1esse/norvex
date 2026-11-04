import { appendFileSync } from "node:fs";
const f = "C:\\Users\\user\\Documents\\Obsidian\\01_Projects\\NorvexHSE-site\\00_Дашборд.md";
const lines = [
  "",
  "## Хронология 04.11.2026",
  "- Реконструкция статического клона: 24 страницы (ru/en/ky), 8 ассетов с temoor.uz переведены на локальные пути; трекер и форма контактов отключены для staging",
  "- vercel.json: security-заголовки + редирект / -> /ru; брендированная 404; README; .gitignore",
  "- Залито в GitHub: n0b1esse/norvex, commit 2b544c6, push OK",
  "- Локальная проверка: serve :8123 вернул 200 OK, 26 КБ за 17 мс",
  "- Ждём: создать staging-проект на Vercel (Import репо, Output Directory = site)",
  "- ВАЖНО: форма контактов на проде отправляет заявки в Directus на temoor.uz (contact_submissions) — прод-проект Vercel не трогать",
];
appendFileSync(f, lines.join("\r\n") + "\r\n", "utf8");
console.log("OK - Obsidian updated");
