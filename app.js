(() => {
  const tg = window.Telegram?.WebApp;

  // TODO: подставишь URL YC Function после деплоя
  const BACKEND_URL = "https://functions.yandexcloud.net/d4e6jlephfevuu8t4etf";

  const form = document.getElementById("survey-form");
  const errorEl = document.getElementById("error");
  const resultEl = document.getElementById("result");
  const whoami = document.getElementById("whoami");
  const submitBtn = document.getElementById("submit-btn");

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
  if (tgId) {
    whoami.textContent = `Пользователь определён: tg_id=${tgId}`;
  } else {
    whoami.textContent =
      "Не удалось определить tg_id. Откройте миниапп внутри Telegram или добавьте ?tg_id=123 для теста.";
  }

  try {
    tg?.ready();
    tg?.expand();
  } catch (_) {}

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    resultEl.style.display = "none";

    if (!tgId) {
      showError("Нет tg_id: откройте миниапп внутри Telegram.");
      return;
    }

    const resumeFile = document.getElementById("resume").files?.[0];
    if (!resumeFile) {
      showError("Прикрепите резюме (файл обязателен).");
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
        setTimeout(() => tg?.close(), 900);
      } catch (_) {}
    } catch (err) {
      showError(err?.message || "Неизвестная ошибка при отправке.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить";
    }
  });
})();
