// admin/assets/upload-field.js — виджет загрузки файла (фото/документ)
// Использование в форме:
//   <div data-upload-field="team" data-upload-target="photo">
//     <input type="file" accept="image/*" data-upload-input hidden>
//     <input type="text" name="photo" data-upload-url placeholder="URL или загрузите файл">
//     <button type="button" data-upload-pick>Выбрать файл</button>
//     <img data-upload-preview hidden>
//   </div>
(function () {
  function init() {
    document.querySelectorAll("[data-upload-field]").forEach(function (root) {
      if (root.dataset.uploadReady) return;
      root.dataset.uploadReady = "1";

      var kind = root.getAttribute("data-upload-field");
      var input = root.querySelector("[data-upload-input]");
      var urlField = root.querySelector("[data-upload-url]");
      var pickBtn = root.querySelector("[data-upload-pick]");
      var clearBtn = root.querySelector("[data-upload-clear]");
      var preview = root.querySelector("[data-upload-preview]");
      var status = root.querySelector("[data-upload-status]");
      var isDoc = kind === "documents";

      function say(text, isError) {
        if (!status) return;
        status.textContent = text || "";
        status.style.color = isError ? "var(--red-700)" : "var(--green-700)";
      }

      function showPreview(url) {
        if (!preview) return;
        if (!url) { preview.hidden = true; preview.removeAttribute("src"); return; }
        if (isDoc) {
          preview.hidden = true;
          return;
        }
        preview.src = url;
        preview.hidden = false;
      }

      if (pickBtn) {
        pickBtn.addEventListener("click", function () { input.click(); });
      }
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (input) input.value = "";
          if (urlField) urlField.value = "";
          showPreview("");
          say("");
        });
      }

      if (input) {
        input.addEventListener("change", function () {
          var f = input.files && input.files[0];
          if (!f) return;
          say("Загружаю " + f.name + "…");

          var fd = new FormData();
          fd.append("file", f);
          fd.append("kind", kind);

          var csrfMeta = document.querySelector('meta[name="csrf-token"]');
          fetch("upload.php", { method: "POST", body: fd, credentials: "same-origin", headers: csrfMeta ? { "X-CSRF-Token": csrfMeta.getAttribute("content") } : {} })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (!data.ok) { say(data.error || "Ошибка загрузки", true); return; }
              if (urlField) urlField.value = data.url;
              showPreview(data.url);
              say("Загружено: " + data.url);
            })
            .catch(function () { say("Ошибка сети при загрузке", true); });
        });
      }

      if (urlField) {
        urlField.addEventListener("input", function () {
          showPreview(urlField.value.trim());
        });
        if (urlField.value) showPreview(urlField.value.trim());
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
