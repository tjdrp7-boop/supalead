/**
 * Supolead Website Template Script
 * ---------------------------------------------------------
 * [수정 포인트]
 * 1) CONTACT_RECIPIENT / NEWSLETTER_RECIPIENT 이메일 변경
 * 2) 폼 제출 방식을 mailto -> 실제 API fetch 로 교체 가능
 * 3) 필터 버튼, FAQ, 모바일 메뉴 동작은 그대로 사용 가능
 */

const CONTACT_RECIPIENT = 'hello@example.com'; // [수정 포인트] 실제 문의 수신 이메일
const NEWSLETTER_RECIPIENT = 'newsletter@example.com'; // [수정 포인트] 실제 뉴스레터 수신 이메일

const pageMap = {
  home: 'index.html',
  resources: 'resources.html',
  case: 'case-study.html'
};

document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  setCurrentNav();
  bindHeaderScroll();
  bindMobileMenu();
  bindFaq();
  bindResourceFilter();
  bindForms();
  applyFadeIn();
});

function setCurrentYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('#currentYear').forEach((el) => {
    el.textContent = String(year);
  });
}

function setCurrentNav() {
  const page = document.body.dataset.page;
  const currentFile = pageMap[page];
  const navLinks = document.querySelectorAll('.site-nav a');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const cleanHref = href.split('#')[0];

    if (page === 'home' && href === 'index.html#solution') {
      link.classList.add('is-current');
      return;
    }

    if (page !== 'home' && cleanHref === currentFile) {
      link.classList.add('is-current');
    }
  });
}

function bindHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const updateHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

function bindMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function bindFaq() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach((item) => {
    const button = item.querySelector('.faq-question');
    if (!button) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });
}

function bindResourceFilter() {
  const filterGroups = document.querySelectorAll('[data-filter-group]');
  if (!filterGroups.length) return;

  const cards = document.querySelectorAll('.js-filter-container .resource-card');
  if (!cards.length) return;

  filterGroups.forEach((group) => {
    group.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');

        group.querySelectorAll('[data-filter]').forEach((target) => {
          target.classList.remove('chip-active');
        });
        button.classList.add('chip-active');

        cards.forEach((card) => {
          const category = card.dataset.category;
          const shouldShow = filter === 'all' || category === filter;
          card.classList.toggle('is-hidden', !shouldShow);
        });
      });
    });
  });
}

function bindForms() {
  const contactForms = document.querySelectorAll('.js-contact-form');
  const newsletterForms = document.querySelectorAll('.js-newsletter-form');

  contactForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      if (!validateForm(form, status)) return;

      // [수정 포인트] 실제 전송 API가 있다면 아래 mailto 대신 fetch()로 교체하세요.
      const company = form.company?.value?.trim() || '';
      const name = form.name?.value?.trim() || '';
      const email = form.email?.value?.trim() || '';
      const message = form.message?.value?.trim() || '';
      const subject = encodeURIComponent(`[웹 문의] ${company || name}`);
      const body = encodeURIComponent(
        `회사명: ${company}
담당자명: ${name}
이메일: ${email}

문의 내용:
${message}`
      );

      setFormStatus(status, '이메일 앱으로 문의 내용을 전달합니다. 수신 이메일 주소는 scripts.js에서 수정할 수 있습니다.', 'success');
      window.location.href = `mailto:${CONTACT_RECIPIENT}?subject=${subject}&body=${body}`;
    });
  });

  newsletterForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      if (!validateForm(form, status)) return;

      // [수정 포인트] CRM, 메일러, 폼 서비스와 연동할 경우 아래 구간을 변경하세요.
      const email = form.email?.value?.trim() || '';
      const topic = form.topic?.value?.trim() || '';
      const subject = encodeURIComponent(`[뉴스레터/자료 신청] ${topic}`);
      const body = encodeURIComponent(`이메일: ${email}
관심 주제/신청 자료: ${topic}`);

      setFormStatus(status, '이메일 앱으로 신청 내용을 전달합니다. 실제 운영 시 CRM/API 연동을 권장합니다.', 'success');
      window.location.href = `mailto:${NEWSLETTER_RECIPIENT}?subject=${subject}&body=${body}`;
    });
  });
}

function validateForm(form, status) {
  const requiredFields = form.querySelectorAll('[required]');
  let firstInvalid = null;

  requiredFields.forEach((field) => {
    const hasValue = field.value.trim() !== '';
    field.setAttribute('aria-invalid', String(!hasValue));

    if (!hasValue && !firstInvalid) {
      firstInvalid = field;
    }
  });

  if (firstInvalid) {
    setFormStatus(status, '필수 항목을 모두 입력해주세요.', 'error');
    firstInvalid.focus();
    return false;
  }

  setFormStatus(status, '', '');
  return true;
}

function setFormStatus(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove('is-error', 'is-success');
  if (type === 'error') element.classList.add('is-error');
  if (type === 'success') element.classList.add('is-success');
}

function applyFadeIn() {
  const targets = document.querySelectorAll('.info-card, .resource-card, .media-card, .feature-copy, .case-feature, .newsletter-form, .contact-form, .sticky-card, .download-card');
  targets.forEach((target, index) => {
    target.classList.add('fade-in');
    target.style.animationDelay = `${Math.min(index * 0.04, 0.3)}s`;
  });
}
