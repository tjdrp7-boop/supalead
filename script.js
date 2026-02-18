// ===== Helpers =====
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

function toNumber(v){
  const n = Number(String(v || "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function formatNumberKR(v){
  const n = toNumber(v);
  return n ? n.toLocaleString("ko-KR") : "";
}

function toast(message){
  const el = qs(".toast");
  const text = qs(".toast__text");
  if (!el || !text) return;
  text.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2200);
}

// ===== Header elevate =====
(() => {
  const header = qs(".header[data-elevate]");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 6);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// ===== Mobile menu =====
(() => {
  const btn = qs("[data-menu-btn]");
  const menu = qs("[data-menu]");
  if (!btn || !menu) return;

  const close = () => menu.classList.remove("is-open");
  btn.addEventListener("click", () => menu.classList.toggle("is-open"));
  qsa("[data-menu-link]").forEach(a => a.addEventListener("click", close));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();

// ===== Pipeline interactions (right card) =====
(() => {
  const items = qsa(".pipe__item");
  if (!items.length) return;

  items.forEach(btn => {
    btn.addEventListener("click", () => {
      items.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
})();

// ===== Segmented control (form type) =====
(() => {
  const typeInput = qs("#type");
  const segBtns = qsa(".seg__btn");
  if (!typeInput || !segBtns.length) return;

  const setType = (t) => {
    typeInput.value = t;
    segBtns.forEach(b => {
      const active = (b.dataset.type === t);
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  segBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setType(btn.dataset.type || "agency");
      toast((typeInput.value === "solution") ? "솔루션 데모로 설정했어요." : "대행 상담으로 설정했어요.");
    });
  });

  // expose for CTA buttons
  window.__setLeadType = setType;
})();

// ===== Scroll to form (CTA) =====
window.scrollToForm = function(type){
  const section = qs("#form");
  if (!section) return;

  if (window.__setLeadType) window.__setLeadType(type || "agency");

  section.scrollIntoView({ behavior: "smooth", block: "start" });

  setTimeout(() => {
    const first = qs("#company");
    if (first) first.focus({ preventScroll: true });
  }, 520);
};

// ===== Calculator =====
window.calculateCPA = function(){
  const adCostEl = qs("#adCost");
  const contractsEl = qs("#contracts");
  const resultEl = qs("#result");
  if (!adCostEl || !contractsEl || !resultEl) return;

  const adCost = toNumber(adCostEl.value);
  const contracts = toNumber(contractsEl.value);

  if (!adCost || !contracts) {
    resultEl.textContent = "월 광고비와 월 계약 수를 입력해주세요.";
    toast("값을 입력해주세요.");
    return;
  }

  const cpa = Math.round(adCost / contracts);
  resultEl.textContent = `계약 CPA는 ₩ ${cpa.toLocaleString("ko-KR")} 입니다.`;
};

// Live formatting for number fields
(() => {
  const moneyIds = ["#adCost", "#monthlyAdCost"];
  moneyIds.forEach(id => {
    const el = qs(id);
    if (!el) return;

    el.addEventListener("input", () => {
      const start = el.selectionStart ?? el.value.length;
      const before = el.value.length;
      el.value = formatNumberKR(el.value);
      const after = el.value.length;
      const diff = after - before;
      const pos = Math.max(0, start + diff);
      try { el.setSelectionRange(pos, pos); } catch (_) {}
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
(() => {
  const form = qs("#leadForm");
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const agree = qs("#agree");
    if (agree && !agree.checked) {
      toast("개인정보 처리 동의가 필요해요.");
      return;
    }

    if (submitBtn) submitBtn.classList.add("is-loading");

    // TODO: 실제 전송 엔드포인트 연결 시 아래로 교체
    // fetch("https://...", { method:"POST", body:new FormData(form) })

    setTimeout(() => {
      if (submitBtn) submitBtn.classList.remove("is-loading");
      toast("신청이 접수됐어요. 곧 연락드릴게요!");
      form.reset();

      // default back to agency
      if (window.__setLeadType) window.__setLeadType("agency");
    }, 900);
  });
})();
