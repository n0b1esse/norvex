// admin/assets/inline-content.js — инлайн-редактирование текстов сайта (страница «Тексты»).
// Ячейки таблицы — всегда редактируемые <textarea class="cell">. Кнопка «Сохранить»
// отправляет только изменённые ячейки (dirty) в content-save.php.
(function () {
  var grid = document.querySelector("[data-inline-grid]");
  if (!grid) return;

  var saveBtn = document.querySelector("[data-save-cells]");
  var counter = document.querySelector("[data-save-count]");
  var statusEl = document.querySelector("[data-save-status]");
  var csrfMeta = document.querySelector('meta[name="csrf-token"]');
  var csrf = csrfMeta ? csrfMeta.getAttribute("content") : "";

  function cells() {
    return Array.prototype.slice.call(grid.querySelectorAll("textarea.cell"));
  }
  function dirty() {
    return cells().filter(function (t) { return t.value !== t.dataset.orig; });
  }
  function refresh() {
    var n = dirty().length;
    if (counter) counter.textContent = String(n);
    if (saveBtn) saveBtn.disabled = n === 0;
    cells().forEach(function (t) {
      t.classList.toggle("is-dirty", t.value !== t.dataset.orig);
    });
  }

  grid.addEventListener("input", function (e) {
    if (e.target.matches("textarea.cell")) refresh();
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      var changed = dirty();
      if (!changed.length) return;
      saveBtn.disabled = true;
      if (statusEl) statusEl.textContent = "Сохраняем…";

      var payload = {
        changes: changed.map(function (t) {
          return {
            page: t.dataset.page,
            block: t.dataset.block,
            slot: t.dataset.slot,
            lang: t.dataset.lang,
            value: t.value
          };
        })
      };

      fetch("content-save.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.ok) {
            changed.forEach(function (t) { t.dataset.orig = t.value; });
            refresh();
            if (statusEl) {
              statusEl.textContent = "Сохранено: " + j.saved + " слот(ов). Изменения уже на сайте.";
              statusEl.style.color = "var(--green-700, #166534)";
            }
          } else {
            if (statusEl) {
              statusEl.textContent = "Ошибка сохранения: " + (j.error || "неизвестно");
              statusEl.style.color = "var(--red-700, #b91c1c)";
            }
            saveBtn.disabled = false;
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = "Сеть недоступна — изменения не сохранены.";
            statusEl.style.color = "var(--red-700, #b91c1c)";
          }
          saveBtn.disabled = false;
        });
    });
  }

  // Ctrl/Cmd+S — сохранить
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      if (saveBtn && !saveBtn.disabled) saveBtn.click();
    }
  });

  refresh();
})();
