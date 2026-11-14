// admin/assets/sortable.js — drag-and-drop перестановка строк таблиц.
// Подключайте на страницах с <tbody data-sortable data-reorder-table="news" data-lang="ru">.
// Каждая строка должна иметь data-id и ручку [data-drag-handle].
(function () {
  var csrfMeta = document.querySelector('meta[name="csrf-token"]');
  var csrf = csrfMeta ? csrfMeta.getAttribute("content") : "";

  document.querySelectorAll("tbody[data-sortable]").forEach(function (tbody) {
    var table = tbody.getAttribute("data-reorder-table");
    var lang = tbody.getAttribute("data-lang") || "";
    var dragged = null;

    function rows() {
      return Array.prototype.slice.call(tbody.querySelectorAll("tr[data-id]"));
    }

    function saveOrder(statusEl) {
      var ids = rows().map(function (tr) { return +tr.getAttribute("data-id"); });
      if (statusEl) { statusEl.textContent = "Сохраняем порядок…"; statusEl.style.color = "#6b7280"; }
      fetch("reorder.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ table: table, lang: lang, ids: ids })
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (statusEl) {
            statusEl.textContent = j.ok ? "Порядок сохранён." : "Ошибка: " + (j.error || "?");
            statusEl.style.color = j.ok ? "#166534" : "#b91c1c";
          }
        })
        .catch(function () {
          if (statusEl) { statusEl.textContent = "Сеть недоступна — порядок не сохранён."; statusEl.style.color = "#b91c1c"; }
        });
    }

    tbody.addEventListener("dragstart", function (e) {
      var handle = e.target.closest ? e.target.closest("[data-drag-handle]") : null;
      var tr = e.target.closest ? e.target.closest("tr[data-id]") : null;
      if (!handle || !tr) { e.preventDefault(); return; }
      dragged = tr;
      tr.classList.add("row-dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", tr.getAttribute("data-id")); } catch (_) {}
    });

    tbody.addEventListener("dragend", function () {
      if (dragged) dragged.classList.remove("row-dragging");
      dragged = null;
    });

    tbody.addEventListener("dragover", function (e) {
      if (!dragged) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      var target = e.target.closest ? e.target.closest("tr[data-id]") : null;
      if (!target || target === dragged) return;
      var rect = target.getBoundingClientRect();
      var before = (e.clientY - rect.top) < rect.height / 2;
      tbody.insertBefore(dragged, before ? target : target.nextSibling);
    });

    tbody.addEventListener("drop", function (e) {
      e.preventDefault();
      if (!dragged) return;
      var statusEl = document.querySelector("[data-reorder-status]");
      saveOrder(statusEl);
      dragged = null;
    });
  });
})();
