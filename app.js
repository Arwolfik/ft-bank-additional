(() => {
  const tg = window.Telegram?.WebApp;

  // TODO: подставишь URL YC Function после деплоя
  const BACKEND_URL = "https://functions.yandexcloud.net/d4e6jlephfevuu8t4etf";

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 МБ

  const form = document.getElementById("survey-form");
  const errorEl = document.getElementById("error");
  const resultEl = document.getElementById("result");
  const submitBtn = document.getElementById("submit-btn");
  const resumeInput = document.getElementById("resume");

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  }
  function clearError() {
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }
  function showResult(msg) {
    resultEl.textContent = msg;
    resultEl.style.display = "block";
  }

  function getTgUserId() {
    const id = tg?.initDataUnsafe?.user?.id;
    if (id) return String(id);

    // Фолбэк для теста в браузере: ?tg_id=123
    const urlId = new URLSearchParams(location.search).get("tg_id");
    if (urlId) return String(urlId);

    return null;
  }

  const tgId = getTgUserId();

  try {
    tg?.ready();
    tg?.expand();
  } catch (_) {}

  // Проверка размера файла сразу при выборе
  resumeInput?.addEventListener("change", () => {
    clearError();

    const file = resumeInput.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showError("Размер файла резюме не должен превышать 15 МБ.");
      resumeInput.value = "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    resultEl.style.display = "none";

    if (!tgId) {
      showError("Нет tg_id: откройте миниапп внутри Telegram.");
      return;
    }

    const resumeFile = resumeInput?.files?.[0];
    if (!resumeFile) {
      showError("Прикрепите резюме (файл обязателен).");
      return;
    }

    // Дублируем проверку на submit (на случай обхода change)
    if (resumeFile.size > MAX_FILE_SIZE) {
      showError("Размер файла резюме не должен превышать 15 МБ.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляю…";

    try {
      const fd = new FormData();
      fd.append("tg_id", tgId);

      fd.append("salary", document.getElementById("salary").value);
      fd.append("citizenship", document.getElementById("citizenship").value);

      fd.append("excel", document.getElementById("excel").value);
      fd.append("sql", document.getElementById("sql").value);
      fd.append("stats", document.getElementById("stats").value);
      fd.append("python", document.getElementById("python").value);
      fd.append("bi", document.getElementById("bi").value);
      fd.append("figma", document.getElementById("figma").value);
      fd.append("genai", document.getElementById("genai").value);

      fd.append("resume", resumeFile, resumeFile.name);

      // опционально (на будущее, если захочешь проверять подпись):
      if (tg?.initData) fd.append("tg_init_data", tg.initData);

      const res = await fetch(BACKEND_URL, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data?.message || `Ошибка: ${res.status}`);
        return;
      }

      showResult(data?.message || "Готово!");
      try {
        tg?.HapticFeedback?.notificationOccurred("success");
        // ❗️ВАЖНО: миниапп больше НЕ закрываем автоматически
        // setTimeout(() => tg?.close(), 900);
      } catch (_) {}
    } catch (err) {
      showError(err?.message || "Неизвестная ошибка при отправке.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить";
    }
  });
})();
