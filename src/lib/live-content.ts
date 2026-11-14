// src/lib/live-content.ts — runtime-оверлей: подтягивает свежий контент из /api.php,
// чтобы правки из админки появлялись на сайте сразу, без пересборки.
//
// Разметка (на любой странице):
//   <h1 data-c="about.hero.title">статический фолбэк</h1>       — текст
//   <div data-c-html="home.faq.0.answer">…</div>                 — HTML
//   <img data-c-img="team.hero.image" src="/newOffice.png">        — картинка
//   <ul data-live-type="team|news|documents|services|clients|faq"> — коллекция
//
// Язык берётся из <html data-lang>, страница — из data-live-page у коллекции.

export interface LiveItem {
  id?: number;
  name?: string;
  title?: string;
  position?: string;
  experience?: string;
  description?: string;
  excerpt?: string;
  photo?: string | null;
  image?: string | null;
  logo?: string | null;
  category?: string | null;
  group_name?: string | null;
  question?: string;
  answer?: string;
  news_date?: string | null;
  file_url?: string;
  url?: string;
  slug?: string;
  icon?: string;
  [k: string]: unknown;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Ключ сопоставления: имя (команда/клиенты), slug (новости), заголовок (документы). */
const itemKey = (it: LiveItem) => norm(String(it.name ?? it.slug ?? it.title ?? it.question ?? ""));

/** Класс для <img> внутри слота-логотипа (по контексту). */
function imgClassOf(el: HTMLElement): string {
  const slot = el.querySelector<HTMLElement>("[data-live-logo]");
  if (slot?.classList.contains("article-media")) return "article-img";
  return "cms-img photo";
}

/** Создаёт <img> внутри слота фото (или плейсхолдер, если фото нет). */
function setPhoto(slot: HTMLElement, item: LiveItem, width: number, height: number): void {
  const photo = typeof item.photo === "string" ? item.photo : "";
  const alt = item.name || item.title || "Фото сотрудника";

  const existingImg = slot.querySelector<HTMLImageElement>("img");
  const existingPh = slot.querySelector<HTMLElement>(".placeholder");

  if (photo) {
    if (existingPh) existingPh.remove();
    let img = existingImg;
    if (!img) {
      img = document.createElement("img");
      img.className = "cms-img photo";
      img.width = width;
      img.height = height;
      slot.appendChild(img);
    }
    img.src = photo;
    img.alt = alt;
    img.hidden = false;
  } else {
    if (existingImg) existingImg.remove();
    if (!existingPh) {
      const ph = document.createElement("div");
      ph.className = "placeholder photo";
      ph.setAttribute("role", "img");
      ph.setAttribute("aria-label", "Фото сотрудника");
      ph.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg><span>Фото сотрудника</span>';
      slot.appendChild(ph);
    }
    existingPh?.removeAttribute("hidden");
  }
  slot.hidden = false;
}

/** Применяет значения записи к карточке. */
function applyItem(el: HTMLElement, item: LiveItem): void {
  const slot = el.querySelector<HTMLElement>("[data-live-photo]");
  if (slot) {
    const w = Number(el.getAttribute("data-live-w") || 420);
    const h = Number(el.getAttribute("data-live-h") || 330);
    setPhoto(slot, item, w, h);
  }

  // Логотип (клиенты, новости)
  const logoSlot = el.querySelector<HTMLElement>("[data-live-logo]");
  if (logoSlot) {
    const src = item.logo || item.image || item.photo || "";
    if (src) {
      const img = logoSlot.querySelector<HTMLImageElement>("img");
      if (img) {
        img.src = src;
        img.hidden = false;
      } else {
        const newImg = document.createElement("img");
        newImg.className = imgClassOf(el);
        newImg.src = src;
        newImg.alt = item.name || item.title || "";
        newImg.loading = "lazy";
        newImg.setAttribute("data-live-logo", "");
        logoSlot.appendChild(newImg);
      }
      logoSlot.hidden = false;
    }
  }

  const catEl = el.querySelector("[data-live-category]");
  if (catEl && item.category !== undefined) catEl.textContent = item.category || "";

  const grpEl = el.querySelector("[data-live-group]");
  if (grpEl && item.group_name !== undefined) grpEl.textContent = item.group_name || "";

  const urlEl = el.querySelector<HTMLAnchorElement>("[data-live-url]");
  if (urlEl) {
    const slug = String(item.slug ?? "");
    const urlLang = document.documentElement.lang || "ru";
    if (slug) urlEl.setAttribute("href", `/${urlLang}/news/${slug}`);
  }

  const dateEl = el.querySelector("[data-live-date]");
  if (dateEl && item.news_date) {
    const d = new Date(item.news_date);
    if (!isNaN(d.getTime())) {
      dateEl.textContent = d.toLocaleDateString(
        document.documentElement.lang || "ru-RU",
        { year: "numeric", month: "long", day: "numeric" },
      );
    }
  }

  // Файл документа — кликабельность
  const fileUrl = String(item.file_url ?? "");
  const row = (el.querySelector<HTMLElement>(".doc-row") || el) as HTMLElement;
  if (fileUrl) {
    el.classList.add("has-file");
    row.classList.add("has-file");
    let link = row.querySelector<HTMLAnchorElement>(".doc-download");
    if (!link) {
      link = document.createElement("a");
      link.className = "doc-download";
      link.setAttribute("download", "");
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", "Скачать");
      link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>';
      row.appendChild(link);
    }
    link.setAttribute("href", fileUrl);
  } else {
    el.classList.remove("has-file");
    row.classList.remove("has-file");
  }

  const nameEl = el.querySelector("[data-live-name]");
  if (nameEl && (item.name || item.title || item.question)) {
    nameEl.textContent = item.name || item.title || item.question || "";
  }
  const posEl = el.querySelector("[data-live-position]");
  if (posEl && item.position !== undefined) posEl.textContent = item.position || "";
  const expEl = el.querySelector("[data-live-experience]");
  if (expEl && item.experience !== undefined) {
    expEl.textContent = item.experience || "";
    expEl.hidden = !item.experience;
  }
  const descEl = el.querySelector("[data-live-desc]");
  if (descEl && (item.excerpt ?? item.description ?? item.answer) !== undefined) {
    descEl.innerHTML = item.excerpt ?? item.description ?? item.answer ?? "";
  }
  const qEl = el.querySelector("[data-live-question]");
  if (qEl && item.question !== undefined) qEl.textContent = item.question || "";
  const aEl = el.querySelector("[data-live-answer]");
  if (aEl && item.answer !== undefined) aEl.innerHTML = item.answer || "";
}

/** Синхронизирует одну группу карточек с массивом записей. */
function syncGroup(group: HTMLElement, items: LiveItem[], slots?: Record<string, string | null>): void {
  const cards = Array.from(group.querySelectorAll<HTMLElement>("[data-live-key]"));
  const template = group.getAttribute("data-live-template");
  const templateEl = template ? document.querySelector<HTMLElement>(template) : null;

  const byKey = new Map<string, LiveItem>();
  items.forEach((it) => {
    const k = itemKey(it);
    if (k) byKey.set(k, it);
  });

  // 1. Обновляем существующие, удаляем те, которых больше нет в БД
  const seen = new Set<string>();
  cards.forEach((card) => {
    const k = norm(card.getAttribute("data-live-key") || "");
    const item = byKey.get(k);
    if (!item) {
      card.remove();
      return;
    }
    seen.add(k);
    applyItem(card, item);
  });

  // 2. Создаём недостающие карточки по шаблону
  const created: HTMLElement[] = [];
  const isSpecialists = group.dataset.liveRole === "specialists";
  const groupRevealed = isSpecialists && !group.classList.contains("hidden");
  const isDocList = group.dataset.liveType === "documents";

  items.forEach((item) => {
    const k = itemKey(item);
    if (!k || seen.has(k)) return;
    if (!templateEl) return;
    let clone: HTMLElement;
    if (templateEl instanceof HTMLTemplateElement) {
      const first = templateEl.content.firstElementChild;
      if (!first) return;
      clone = first.cloneNode(true) as HTMLElement;
    } else {
      clone = templateEl.cloneNode(true) as HTMLElement;
    }
    clone.setAttribute("data-live-key", String(item.name ?? item.slug ?? item.title ?? item.question ?? ""));
    clone.setAttribute("data-live-w", isSpecialists ? "300" : "420");
    clone.setAttribute("data-live-h", isSpecialists ? "240" : "330");
    if (isSpecialists && !groupRevealed) clone.classList.add("is-hidden");
    applyItem(clone, item);
    if (slots) {
      applySlots(slots, clone);
      applyLists(slots, clone);
    }
    group.appendChild(clone);
    seen.add(k);
    created.push(clone);
  });

  // 3. Счётчик документов в заголовке панели
  if (isDocList) {
    const panel = group.closest<HTMLElement>("[data-catpanel]");
    const counter = panel?.querySelector<HTMLElement>(".docs-count");
    if (counter) counter.textContent = String(items.length);
  }
}

/** Замена токенов в значении слота (например, © {year}). */
const applyTokens = (val: string): string =>
  val.replace(/\{year\}/g, String(new Date().getFullYear()));

/** Применяет текстовые слоты: data-c / data-c-html / data-c-img / data-c-attr. */
function applySlots(slots: Record<string, string | null>, root: ParentNode = document): void {
  Object.entries(slots).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const val = applyTokens(String(value));

    root.querySelectorAll<HTMLElement>(`[data-c="${cssEscape(key)}"]`).forEach((el) => {
      if (el.textContent !== val) el.textContent = val;
    });
    root.querySelectorAll<HTMLElement>(`[data-c-html="${cssEscape(key)}"]`).forEach((el) => {
      if (el.innerHTML !== val) el.innerHTML = val;
    });
    root.querySelectorAll<HTMLElement>(`[data-c-img="${cssEscape(key)}"]`).forEach((el) => {
      if (el.getAttribute("src") !== val) el.setAttribute("src", val);
    });
  });

  // Атрибуты: data-c-attr="placeholder:global.form.name" (можно несколько через запятую)
  root.querySelectorAll<HTMLElement>("[data-c-attr]").forEach((el) => {
    (el.getAttribute("data-c-attr") || "").split(",").forEach((part) => {
      const idx = part.indexOf(":");
      if (idx < 0) return;
      const attr = part.slice(0, idx).trim();
      const key = part.slice(idx + 1).trim();
      const raw = slots[key];
      if (raw === null || raw === undefined) return;
      const val = applyTokens(String(raw));
      if (el.getAttribute(attr) !== val) el.setAttribute(attr, val);
    });
  });
}

/** Применяет значения к спискам: data-c-list / data-c-item / data-c-field.
 *  Ключ слота строится из пути списка: <list>.item_<N>[.<field>].
 *  Вложенный список (data-c-list внутри data-c-item) получает путь
 *  <путь-родительского-элемента>.<имя-вложенного-списка>. */
function applyLists(slots: Record<string, string | null>, root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-c-list]").forEach((top) => {
    if (top.parentElement && top.parentElement.closest("[data-c-list]")) return; // вложенные — из родителя
    fillList(top, top.getAttribute("data-c-list") || "", slots);
  });
}

function fillList(listEl: HTMLElement, path: string, slots: Record<string, string | null>): void {
  const items = Array.from(listEl.querySelectorAll<HTMLElement>("[data-c-item]"))
    .filter((el) => (el.parentElement ? el.parentElement.closest("[data-c-list]") : null) === listEl);

  items.forEach((item, j) => {
    const itemPath = `${path}.item_${j}`;

    // Поля, принадлежащие именно этому элементу (не вложенным)
    const ownFields = Array.from(item.querySelectorAll<HTMLElement>("[data-c-field]"))
      .filter((f) => f.closest("[data-c-item]") === item);

    ownFields.forEach((fEl) => {
      const f = fEl.getAttribute("data-c-field") || "";
      let val = slots[`${itemPath}.${f}`];
      // Фолбэк: голый текст элемента хранится в самом слоте item_<N>
      if (val === null || val === undefined) {
        if (f === "text" || f === "title" || f === "label") val = slots[itemPath];
      }
      if (val === null || val === undefined) return;
      const text = applyTokens(String(val));
      if (fEl.textContent !== text) fEl.textContent = text;
    });

    // Голый элемент без собственных полей и вложенных списков — текст сам по себе слот
    const hasNested = Array.from(item.querySelectorAll<HTMLElement>("[data-c-list]"))
      .some((n) => n.closest("[data-c-item]") === item);
    if (ownFields.length === 0 && !hasNested) {
      const raw = slots[itemPath];
      if (raw !== null && raw !== undefined) {
        const text = applyTokens(String(raw));
        if (item.textContent !== text) item.textContent = text;
      }
    }

    // Вложенный список на том же теге, что и элемент (data-c-item + data-c-list)
    if (item.matches("[data-c-list]")) {
      const name = item.getAttribute("data-c-list") || "";
      if (name) fillList(item, `${itemPath}.${name}`, slots);
    }

    // Вложенные списки-потомки
    item.querySelectorAll<HTMLElement>("[data-c-list]").forEach((nested) => {
      if (nested.closest("[data-c-item]") !== item) return;
      const name = nested.getAttribute("data-c-list") || "";
      if (name) fillList(nested, `${itemPath}.${name}`, slots);
    });
  });
}

/** Экранирование для CSS-селектора (в ключах есть точки). */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}

/** Подтягивает данные и обновляет разметку. Безопасна при недоступном API. */
export function mountLiveContent(lang: string): void {
  const params = new URLSearchParams({ action: "all", lang });

  fetch(`/api.php?${params.toString()}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (!json || !json.data) return;
      const data = json.data as Record<string, unknown>;

      // 1. Текстовые слоты (любая страница, любой блок)
      const slots = (data.slots ?? {}) as Record<string, string | null>;
      // Доступ для инлайн-скриптов (строки статуса формы в contacts)
      (window as unknown as { __liveTexts?: Record<string, string | null> }).__liveTexts = slots ?? {};
      if (slots && Object.keys(slots).length) {
        applySlots(slots);
        applyLists(slots);
        // Сообщаем инлайн-скриптам (count-up статистики в about и т.п.),
        // что контент применён — они могут безопасно читать DOM.
        window.dispatchEvent(new CustomEvent("live:content"));
      }

      // 2. Hero-фото страницы: фон главной берётся из settings.hero_image,
      //    внутренних страниц — из settings.about_image (они же правятся в админке)
      const pageKey = document.body.getAttribute("data-live-page") || "";
      if (pageKey) {
        const settings = (data.site_settings ?? {}) as Record<string, string | null>;
        const hero = pageKey === "home" ? settings.hero_image : settings.about_image;
        if (hero) {
          document.querySelectorAll<HTMLElement>("[data-live-hero]").forEach((el) => {
            if (el.getAttribute("src") !== hero) el.setAttribute("src", hero);
          });
        }
      }

      // 3. Коллекции
      const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-live-type]"));
      const types = Array.from(new Set(groups.map((g) => g.dataset.liveType || "")));
      if (!types.length) return;

      groups.forEach((group) => {
        const type = group.dataset.liveType || "";
        const role = group.dataset.liveRole || "";
        const page = group.getAttribute("data-live-page") || "";
        group.setAttribute("data-live-lang", lang);

        let items: LiveItem[] = [];

        if (type === "team") {
          const teamItems = Array.isArray(data.team)
            ? (data.team as LiveItem[]).slice().sort((a, b) => {
                const sa = Number(a.sort_order ?? a.id ?? 0);
                const sb = Number(b.sort_order ?? b.id ?? 0);
                if (sa !== sb) return sa - sb;
                return Number(a.id ?? 0) - Number(b.id ?? 0);
              })
            : [];
          items = role === "leaders" ? teamItems.slice(0, 2) : teamItems.slice(2);
        } else if (type === "faq") {
          const faqAll = Array.isArray(data.faq) ? (data.faq as LiveItem[]) : [];
          items = page ? faqAll.filter((f) => String(f.page_key ?? "home") === page) : faqAll;
        } else {
          const raw = data[type];
          items = Array.isArray(raw) ? (raw as LiveItem[]) : [];
          const cat = type === "documents" ? group.getAttribute("data-live-category") : null;
          if (cat) items = items.filter((d) => String(d.category_slug ?? "") === cat);
        }

        if (!items.length) return; // пусто (или сбой БД) — оставляем статичный фолбэк
        syncGroup(group, items, slots);
      });
    })
    .catch((err) => {
      // API недоступен или ошибка оверлея — остаётся статичная вёрстка, но логируем
      console.error("[live-content]", err);
    });
}
