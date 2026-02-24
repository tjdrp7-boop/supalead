'use strict';

/* =========================
   Helpers
========================= */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

function toNumber(v) {
  const n = Number(String(v ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatNumberKR(v) {
  const n = toNumber(v);
  return n ? n.toLocaleString('ko-KR') : '';
}

/**
 * 커서 위치 최대한 유지하면서 숫자 포맷팅
 * - 현재 커서 앞 "숫자 개수"를 기준으로 포맷 후 위치 재배치
 */
function formatInputKeepCaret(el, formatter = formatNumberKR) {
  if (!el) return;
  const raw = String(el.value ?? '');
  const caret = el.selectionStart ?? raw.length;

  const digitsBeforeCaret = raw.slice(0, caret).replace(/[^\d]/g, '').length;
  const formatted = formatter(raw);

  el.value = formatted;

  // digitsBeforeCaret 번째 숫자 뒤 위치를 찾아 커서 이동
  if (digitsBeforeCaret === 0) {
    try { el.setSelectionRange(0, 0); } catch (_) {}
    return;
  }
  let seen = 0;
  let pos = formatted.length;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen++;
    if (seen >= digitsBeforeCaret) { pos = i + 1; break; }
  }
  try { el.setSelectionRange(pos, pos); } catch (_) {}
}

function toast(message) {
  const el = $('.toast');
  const text = $('.toast__text');
  if (!el || !text) return;

  text.textContent = message;
  el.hidden = false;

  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2200);
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/* =========================
   Smooth scroll with header offset
========================= */
function getHeaderOffset() {
  const header = $('.header');
  if (!header) return 0;
  const rect = header.getBoundingClientRect();
  return Math.ceil(rect.height);
}

function scrollToSection(id, { focusSel } = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  const offset = getHeaderOffset() + 12;
  const y = window.scrollY + el.getBoundingClientRect().top - offset;

  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

  if (focusSel) {
    setTimeout(() => {
      const focusEl = $(focusSel);
      if (focusEl) focusEl.focus({ preventScroll: true });
    }, 520);
  }
}

/* =========================
   Mobile menu: focus trap + body lock
========================= */
const Menu = (() => {
  let lastFocused = null;

  const btn = () => $('[data-menu-btn]');
  const menu = () => $('[data-menu]');

  function setExpanded(v) {
    const b = btn();
    if (b) b.setAttribute('aria-expanded', v ? 'true' : 'false');
  }

  function lockBody(v) {
    document.body.classList.toggle('is-locked', !!v);
  }

  function getFocusable(root) {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return $$(selectors, root).filter(el => el.offsetParent !== null);
  }

  function trapFocus(e) {
    const m = menu();
    if (!m || !m.classList.contains('is-open')) return;
    if (e.key !== 'Tab') return;

    const focusables = getFocusable(m);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function open() {
    const m = menu();
    const b = btn();
    if (!m || !b) return;

    lastFocused = document.activeElement;
    m.classList.add('is-open');
    setExpanded(true);
    lockBody(true);

    const focusables = getFocusable(m);
    if (focusables[0]) focusables[0].focus();
  }

  function close() {
    const m = menu();
    if (!m) return;

    m.classList.remove('is-open');
    setExpanded(false);
    lockBody(false);

    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function toggle() {
    const m = menu();
    if (!m) return;
    m.classList.contains('is-open') ? close() : open();
  }

  function init() {
    const b = btn();
    const m = menu();
    if (!b || !m) return;

    b.addEventListener('click', toggle);

    // menu links close
    $$('[data-menu-link]').forEach(el => {
      el.addEventListener('click', () => close());
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      trapFocus(e);
    });
  }

  return { init, close };
})();

/* =========================
   Header elevate
========================= */
function initHeaderElevate() {
  const header = $('.header[data-elevate]');
  if (!header) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 6);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* =========================
   Pipeline interactions
========================= */
function initPipelineTabs() {
  const items = $$('.pipe__item');
  if (!items.length) return;

  items.forEach(btn => {
    btn.addEventListener('click', () => {
      items.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
    });
  });
}

/* =========================
   Segmented control (lead type)
========================= */
function initLeadTypeSegment() {
  const typeInput = $('#type');
  const segBtns = $$('.seg__btn');
  if (!typeInput || !segBtns.length) return;

  function setType(t) {
    const type = t || 'agency';
    typeInput.value = type;

    segBtns.forEach(b => {
      const active = (b.dataset.type === type);
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  segBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setType(btn.dataset.type);
      toast(typeInput.value === 'solution' ? '솔루션 데모로 설정했어요.' : '대행 상담으로 설정했어요.');
    });
  });

  // expose for scroll CTA
  window.__setLeadType = setType;
}

/* =========================
   Scroll CTAs: data-scroll / data-type
========================= */
function initScrollCTAs() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-scroll]');
    if (!t) return;

    e.preventDefault();

    const id = t.dataset.scroll;
    const type = t.dataset.type;

    if (id === 'form' && window.__setLeadType) {
      window.__setLeadType(type || 'agency');
      scrollToSection('form', { focusSel: '#company' });
      Menu.close();
      return;
    }

    if (id === 'case') {
      scrollToSection('case', { focusSel: '#caseCompany' });
      Menu.close();
      return;
    }

    scrollToSection(id);
    Menu.close();
  });

  // anchor links (#how etc.) with offset handling
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const hash = a.getAttribute('href');
    if (!hash || hash === '#') return;

    const id = hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    // 기본 브라우저 점프 방지
    e.preventDefault();
    scrollToSection(id);
    Menu.close();
  });
}

/* =========================
   Calculator
========================= */
const CPA_RECOMMEND_THRESHOLD = 300000;

function setCalcRecommendation({ cpa }) {
  const resultEl = $('#result');
  const tipsEl = $('#calcTips');
  const actionsEl = $('#calcActions');
  const primaryBtn = $('#calcPrimary');

  if (!resultEl) return;

  const isSolution = cpa >= CPA_RECOMMEND_THRESHOLD;
  const base = `계약 CPA는 ₩ ${cpa.toLocaleString('ko-KR')} 입니다.`;
  const rec = isSolution
    ? '현재 값이 높아 보입니다. 솔루션 데모로 구조 개선 포인트를 빠르게 확인해보세요.'
    : '현재 값 기준으로 대행 최적화 여지가 있습니다. 무료 진단으로 개선 우선순위를 받아보세요.';

  resultEl.textContent = `${base} ${rec}`;

  if (primaryBtn) {
    primaryBtn.textContent = isSolution ? '솔루션 상담하러가기' : '대행 상담하러가기';
    primaryBtn.dataset.type = isSolution ? 'solution' : 'agency';
    primaryBtn.dataset.scroll = 'form';
  }

  if (tipsEl) tipsEl.hidden = true;
  if (actionsEl) actionsEl.hidden = false;
}

function resetCalculator() {
  const adCostEl = $('#adCost');
  const contractsEl = $('#contracts');
  const resultEl = $('#result');
  const tipsEl = $('#calcTips');
  const actionsEl = $('#calcActions');
  const primaryBtn = $('#calcPrimary');

  if (adCostEl) adCostEl.value = '';
  if (contractsEl) contractsEl.value = '';
  if (resultEl) resultEl.textContent = '값을 입력하면 계약 CPA가 표시됩니다.';
  if (tipsEl) tipsEl.hidden = false;
  if (actionsEl) actionsEl.hidden = true;

  if (primaryBtn) {
    primaryBtn.textContent = '상담하러가기';
    primaryBtn.dataset.type = 'agency';
    primaryBtn.dataset.scroll = 'form';
  }

  if (adCostEl) adCostEl.focus({ preventScroll: true });
}

function initCalculator() {
  const form = $('#calcForm');
  const adCostEl = $('#adCost');
  const contractsEl = $('#contracts');
  const resetBtn = $('#calcReset');
  const resultEl = $('#result');
  const tipsEl = $('#calcTips');
  const actionsEl = $('#calcActions');

  if (!form || !adCostEl || !contractsEl || !resultEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const adCost = toNumber(adCostEl.value);
    const contracts = toNumber(contractsEl.value);

    if (!adCost || !contracts) {
      resultEl.textContent = '월 광고비와 월 계약 수를 입력해주세요.';
      toast('값을 입력해주세요.');
      if (actionsEl) actionsEl.hidden = true;
      if (tipsEl) tipsEl.hidden = false;
      return;
    }

    const cpa = Math.round(adCost / contracts);
    setCalcRecommendation({ cpa });
  });

  if (resetBtn) resetBtn.addEventListener('click', resetCalculator);
}

/* =========================
   Live formatting
========================= */
function initLiveFormatting() {
  // money fields: keep caret
  ['#adCost', '#monthlyAdCost'].forEach(id => {
    const el = $(id);
    if (!el) return;

    el.addEventListener('input', () => formatInputKeepCaret(el, formatNumberKR));
  });

  // contracts: 숫자만(간단 포맷)
  const contracts = $('#contracts');
  if (contracts) {
    contracts.addEventListener('input', () => {
      // contracts는 쉼표가 의미 없을 수 있지만, 자리수 큰 경우 대비해 유지
      formatInputKeepCaret(contracts, formatNumberKR);
    });
  }
}

/* =========================
   Form submits (demo -> 실서버 교체 쉬운 구조)
========================= */
function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.classList.toggle('is-loading', !!loading);
  btn.disabled = !!loading;
}

async function initLeadForm() {
  const form = $('#leadForm');
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const agree = $('#agree');
    if (agree && !agree.checked) {
      toast('개인정보 처리 동의가 필요해요.');
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      // TODO: 실서버 연결 시 여기를 fetch로 교체
      // const payload = Object.fromEntries(new FormData(form));
      // await fetch('/api/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      await sleep(900);

      toast('신청이 접수됐어요. 곧 연락드릴게요!');
      form.reset();
      if (window.__setLeadType) window.__setLeadType('agency');
    } catch (err) {
      toast('오류가 발생했어요. 잠시 후 다시 시도해주세요.');
      console.error(err);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

async function initCaseForm() {
  const form = $('#caseForm');
  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const agree = $('#caseAgree');
    if (agree && !agree.checked) {
      toast('개인정보 처리 동의가 필요해요.');
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      // TODO: 실서버 연결 시 여기를 fetch로 교체
      await sleep(700);
      toast('사례 리포트를 이메일로 보내드릴게요.');
      form.reset();
    } catch (err) {
      toast('오류가 발생했어요. 잠시 후 다시 시도해주세요.');
      console.error(err);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* =========================
   Init
========================= */
document.addEventListener('DOMContentLoaded', () => {
  initHeaderElevate();
  Menu.init();
  initPipelineTabs();
  initLeadTypeSegment();
  initScrollCTAs();
  initCalculator();
  initLiveFormatting();
  initLeadForm();
  initCaseForm();
  initDashboardTabs();
  initFAQAccordion();
});
/* =========================
   Dashboard tabs
========================= */
function initDashboardTabs() {
  const root = document.getElementById('product');
  if (!root) return;

  const btns = Array.from(root.querySelectorAll('.tabs__btn'));
  const panels = Array.from(root.querySelectorAll('.tabs__panel'));
  if (!btns.length || !panels.length) return;

  const setActive = (id) => {
    btns.forEach(b => {
      const on = b.dataset.tab === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    panels.forEach(p => {
      const on = p.dataset.panel === id;
      p.hidden = !on;
    });
  };

  btns.forEach(b => b.addEventListener('click', () => setActive(b.dataset.tab)));

  const initial = btns.find(b => b.classList.contains('is-active'))?.dataset.tab || btns[0].dataset.tab;
  setActive(initial);
}

/* =========================
   FAQ accordion (single-open)
========================= */
function initFAQAccordion() {
  const root = document.getElementById('faq');
  if (!root) return;

  const items = Array.from(root.querySelectorAll('.faq__item'));
  if (!items.length) return;

  items.forEach(d => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      items.forEach(other => { if (other !== d) other.open = false; });
    });
  });
}
