import { appendFileSync } from "node:fs";
const f = "C:\\Users\\user\\Documents\\Obsidian\\01_Projects\\NorvexHSE-site\\00_Дашборд.md";
const lines = [
  "",
  "## Хронология 05.11.2026 — правки по задачам клиента (staging)",
  "- ГЛАВНАЯ hero: пэддинги 88/52 → 52/36, min-height 460 → 320, h1 clamp(34/5vw/56) → clamp(30/4.2vw/46), слоган 19px → 16px (inline-стили, 3 языка)",
  "- ВНУТРЕННИЕ страницы (.page-hero из Layout.css): пэтдинги 84/76 → 44/38, min-height 600 → 340, h1 clamp(32/4.5vw/50) → clamp(28/3.8vw/40), слоган 17px → 16px",
  "- HEADER меню: .nav-link font-size 14px → 16px, пэддинг 8/9 → 10/12px",
  "- ФУТЕР (все 24 страницы): колонка «Документы» — вместо 6 названий политик 3 категории: Политики / Процедуры / Чек-листы, ссылки-якоря на /<lang>/documents/#policies|#procedures|#checklists",
  "- СТРАНИЦА «Документы» (ru/en/ky): добавлена третья вкладка «Чек-листы» (кнопка в aside + панель с 4 карточками), id на кнопки табов, hash-скрипт: ссылка с якорем открывает нужную вкладку (+ scroll-margin-top 104px от sticky-хедра)",
  "- Коммиты: bc226fe (основные правки), 1cecb58+b63f991 (upgrade hash-скрипта —depend-ность от порядка слушателей убрана: классы ставятся напрямую)",
  "- Браузер-верификация: /ru/documents/#checklists → вкладка активна, 4 карточки, кнопка видна под хедером; computed: home hero pad 52/36, слоган 16px; about page-hero pad 44/38; консоль 0 ошибок; nav 16px",
  "- ⚠️ Названия чек-листов — мои placeholder-ы («PDF — по запросу»): заменить на реальные списки, когда клиент даст файлы",
  "",
];
appendFileSync(f, lines.join("\r\n") + "\r\n", "utf8");
console.log("OK - Obsidian updated");
