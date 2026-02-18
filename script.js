// ===== Utilities =====
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

function formatNumberKR(value) {
  const n = Number(String(value).replace(/[^\d]/g, ""));
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("ko-KR");
}

function toNumber(value) {
  const n = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toast(message) {
  const el = qs(".toast");
  const text = qs(".toast__text");
  if (!el || !text) return;

  text.textContent = message;
  el.hidden = false;

  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2200);
}

// ===== Header elevate on scroll =====
(function () {
  const header = qs(".header[data-elevate]");
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 6) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// ===== Mobile menu =====
(function () {
  const btn = qs("[data-menu-btn]");
  const menu = qs("[data-menu]");
  if (!btn || !menu) return;

  const close = () => menu.classList.remove("is-open");
  btn.addEventListener("click", () => menu.classList.toggle("is-open"));
  qsa("[data-menu-link]").forEach(a => a.addEventListener("click", close));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();

// ===== Segmented type switch =====
(function () {
  const typeInput = qs("#type");
  const segButtons = qsa(".seg__btn");
  if (!typeInput || segButtons.length === 0) return;

  segButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      segButtons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      typeInput.value = btn.dataset.type || "agency";
      toast(typeInput.value === "solution" ? "솔루션 데모로 설정했어요." : "대행 상담으로 설정했어요.");
    });
  });
})();

// ===== Scroll to form + set type =====
window.scrollToForm = function (type) {
  const formSection = qs("#formSection");
  const typeInput = qs("#type");
  const segButtons = qsa(".seg__btn");
  if (!formSection) return;

  if (typeInput) typeInput.value = type || "agency";

  // sync segmented UI
  if (segButtons.length) {
    segButtons.forEach(b => {
      b.classList.toggle("is-active", (b.dataset.type || "agency") === (type || "agency"));
    });
  }

  formSection.scrollIntoView({ behavior: "smooth", block: "start" });

  // focus first field after scroll
  setTimeout(() => {
    const first = qs("#company");
    if (first) first.focus({ preventScroll: true });
  }, 550);
};

// ===== Calculator =====
window.calculateCPA = function () {
  const adCostEl = qs("#adCost");
  const contractsEl = qs("#contracts");
  const resultEl = qs("#result");
  const heroCpaEl = qs("#heroCpa");
  if (!adCostEl || !contractsEl || !resultEl) return;

  const adCost = toNumber(adCostEl.value);
  const contracts = toNumber(contractsEl.value);

  if (!adCost || !contracts) {
    resultEl.textContent = "광고비와 계약 수를 입력해주세요.";
    toast("값을 입력해주세요.");
    return;
  }

  const cpa = Math.round(adCost / contracts);
  resultEl.textContent = `계약 CPA는 ₩ ${cpa.toLocaleString("ko-KR")} 입니다.`;
  if (heroCpaEl) heroCpaEl.textContent = `₩ ${cpa.toLocaleString("ko-KR")}`;
};

// live format
(function () {
  const moneyFields = ["#adCost", "#monthlyAdCost"];
  moneyFields.forEach(sel => {
    const el = qs(sel);
    if (!el) return;
    el.addEventListener("input", () => {
      const cursor = el.selectionStart;
      const before = el.value.length;
      el.value = formatNumberKR(el.value);
      const after = el.value.length;
      const diff = after - before;
      el.setSelectionRange(Math.max(0, cursor + diff), Math.max(0, cursor + diff));
    });
  });

  const contracts = qs("#contracts");
  if (contracts) {
    contracts.addEventListener("input", () => {
      contracts.value = formatNumberKR(contracts.value);
    });
  }
})();

// ===== Form submit (demo) =====
(function () {
  const form = qs("#leadForm");
  if (!form) return;

  const btn = form.querySelector("button[type='submit']");
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // basic validation
    const agree = qs("#agree");
    if (agree && !agree.checked) {
      toast("개인정보 처리 동의가 필요해요.");
      return;
    }

    if (btn) btn.classList.add("is-loading");

    // 여기는 실제 전송 endpoint 붙이면 됨.
    // 예: fetch("https://.../lead", {method:"POST", body:new FormData(form)})

    setTimeout(() => {
      if (btn) btn.classList.remove("is-loading");
      toast("신청이 접수됐어요. 곧 연락드릴게요!");
      form.reset();

      // reset to agency as default
      const type = qs("#type");
      if (type) type.value = "agency";
      qsa(".seg__btn").forEach(b => b.classList.toggle("is-active", b.dataset.type === "agency"));
    }, 900);
  });
})();
