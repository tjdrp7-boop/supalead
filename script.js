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
   Lead type state (persist)
========================= */
const LEAD_TYPE_KEY = 'supalead_lead_type';
function getLeadType() {
  const v = localStorage.getItem(LEAD_TYPE_KEY);
  return (v === 'solution' || v === 'agency') ? v : 'agency';
}
function setLeadType(v) {
  const type = (v === 'solution' || v === 'agency') ? v : 'agency';
  localStorage.setItem(LEAD_TYPE_KEY, type);

  const typeInput = $('#type');
  if (typeInput) typeInput.value = type;

  // 폼 세그먼트 버튼 UI 반영
  const segBtns = $$('.seg__btn');
  segBtns.forEach(b => {
    const active = (b.dataset.type === type);
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  // 외부 CTA들도 "auto"면 내부적으로 타입 사용
  // (텍스트 변경까지 하고 싶으면 여기서 버튼 text도 조정 가능)
}

/* =========================
   Smooth scroll with header offset
========================= */
function getHeaderOffset() {
  const header = $('.header');
  if (!header) return 0;
  return Math.ceil(header.getBoundingClientRect().height);
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
   Lead type segment (form)
========================= */
function initLeadTypeSegment() {
  const typeInput = $('#type');
  const segBtns = $$('.seg__btn');
  if (!typeInput || !segBtns.length) return;

  // init from storage
  setLeadType(getLeadType());

  segBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.type || 'agency';
      setLeadType(t);
      toast(t === 'solution' ? '솔루션 데모로 설정했어요.' : '대행 상담으로 설정했어요.');
    });
  });

  // expose
  window.__setLeadType = setLeadType;
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
    let type = t.dataset.type;

    // auto type => use persisted type
    if (!type || type === 'auto') type = getLeadType();

    if (id === 'form') {
      setLeadType(type);
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

    e.preventDefault();
    scrollToSection(id);
    Menu.close();
  });
}

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

/* =========================
   Calculator
========================= */
const CPA_RECOMMEND_THRESHOLD = 300000;
let calcComplexity = 'yes'; // default

function initCalcComplexity() {
  const btns = $$('.calcq__btn');
  if (!btns.length) return;

  const set = (v) => {
    calcComplexity = (v === 'no') ? 'no' : 'yes';
    btns.forEach(b => {
      const on = b.dataset.complex === calcComplexity;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  };

  btns.forEach(b => b.addEventListener('click', () => set(b.dataset.complex)));
  set(calcComplexity);
}

function setCalcRecommendation({ cpa }) {
  const resultEl = $('#result');
  const tipsEl = $('#calcTips');
  const actionsEl = $('#calcActions');
  const primaryBtn = $('#calcPrimary');

  if (!resultEl) return;

  // base: threshold 기준
  let recommend = (cpa >= CPA_RECOMMEND_THRESHOLD) ? 'solution' : 'agency';

  // 운영이 복잡하면 솔루션 쪽으로 강하게
  if (calcComplexity === 'yes') recommend = 'solution';

  const base = `계약 CPA는 ₩ ${cpa.toLocaleString('ko-KR')} 입니다.`;
  const rec = (recommend === 'solution')
    ? '운영 복잡도/자동화 관점에서 솔루션 데모를 추천합니다. 계약 신호 기반으로 타겟팅을 개선해보세요.'
    : '현재 값 기준으로 대행 최적화 여지가 있습니다. 무료 진단으로 개선 우선순위를 받아보세요.';

  resultEl.textContent = `${base} ${rec}`;

  if (primaryBtn) {
    primaryBtn.textContent = (recommend === 'solution') ? '솔루션 상담하러가기' : '대행 상담하러가기';
    primaryBtn.dataset.type = recommend;
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
    primaryBtn.dataset.type = 'auto';
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
  ['#adCost', '#monthlyAdCost'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => formatInputKeepCaret(el, formatNumberKR));
  });

  const contracts = $('#contracts');
  if (contracts) {
    contracts.addEventListener('input', () => formatInputKeepCaret(contracts, formatNumberKR));
  }
}

/* =========================
   Forms: demo submit + 완료 카드
========================= */
function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.classList.toggle('is-loading', !!loading);
  btn.disabled = !!loading;
}

function showSuccess(formEl, successEl, show) {
  if (!formEl || !successEl) return;
  formEl.hidden = !!show;
  successEl.hidden = !show;
}

async function initLeadForm() {
  const form = $('#leadForm');
  const success = $('#leadSuccess');
  const retry = $('#leadRetry');

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  if (!form || !success) return;

  const submitBtn = form.querySelector("button[type='submit']");

  // retry
  if (retry) {
    retry.addEventListener('click', () => {
      showSuccess(form, success, false);
      form.reset();
      setLeadType(getLeadType());
      const first = $('#company');
      if (first) first.focus({ preventScroll: true });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const agree = $('#agree');
    if (agree && !agree.checked) {
      toast('개인정보 처리 동의가 필요해요.');
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      // TODO: 실서버 연결 시 fetch로 교체
      await sleep(900);

      toast('신청이 접수됐어요. 곧 연락드릴게요!');
      showSuccess(form, success, true);
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
  const success = $('#caseSuccess');
  const retry = $('#caseRetry');
  if (!form || !success) return;

  const submitBtn = form.querySelector("button[type='submit']");

  if (retry) {
    retry.addEventListener('click', () => {
      showSuccess(form, success, false);
      form.reset();
      const first = $('#caseCompany');
      if (first) first.focus({ preventScroll: true });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const agree = $('#caseAgree');
    if (agree && !agree.checked) {
      toast('개인정보 처리 동의가 필요해요.');
      return;
    }

    setButtonLoading(submitBtn, true);

    try {
      // TODO: 실서버 연결 시 fetch로 교체
      await sleep(700);

      toast('사례 리포트를 이메일로 보내드릴게요.');
      showSuccess(form, success, true);
    } catch (err) {
      toast('오류가 발생했어요. 잠시 후 다시 시도해주세요.');
      console.error(err);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* =========================
   Sticky CTA (mobile) - show after 25% scroll
========================= */
function initStickyCTA() {
  const el = $('[data-sticky-cta]');
  if (!el) return;

  const mq = window.matchMedia('(max-width: 980px)');
  const onScroll = () => {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = window.scrollY / max;

    const shouldShow = mq.matches && progress > 0.25;
    el.hidden = !shouldShow;
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  mq.addEventListener?.('change', onScroll);
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

  initDashboardTabs();
  initFAQAccordion();

  initCalcComplexity();
  initCalculator();
  initLiveFormatting();

  initLeadForm();
  initCaseForm();

  initStickyCTA();
});
