/**
 * 이사체크 | js/app.js
 * localStorage 기반 체크리스트 + 상황별 필터 기능
 *
 * 개인정보 수집 없음. 모든 데이터는 사용자 브라우저 내 localStorage에만 저장됩니다.
 */

/* ─────────────────────────────────────────
   상수
   ───────────────────────────────────────── */
const STORAGE_CHECKS_KEY  = 'move-check-items';
const STORAGE_FILTERS_KEY = 'move-check-filters';
const CHECKLIST_DATA_URL  = './data/checklist.json';

/** 단계(phase) 메타데이터 – phaseOrder 순서 기준 */
const PHASE_META = {
  '이사 7~3일 전':    { title: '사전 준비 및 예약',      urgent: false },
  '이사 당일':        { title: '정산 및 시설 확인',      urgent: false },
  '이사 후 1~3일':    { title: '행정 신고 및 주소 변경', urgent: false },
  '이사 후 14·30일 내': { title: '기한 확인 및 서류 보관', urgent: true  },
};

/* ─────────────────────────────────────────
   상태 변수
   ───────────────────────────────────────── */
/** @type {object[]} 체크리스트 데이터 전체 */
let checklistData = [];

/** @type {Set<string>} 현재 선택된 필터 값 집합 */
let activeFilters = new Set();

/* ─────────────────────────────────────────
   체크리스트 데이터 로드 & 렌더링
   ───────────────────────────────────────── */

/**
 * JSON에서 체크리스트 데이터를 불러와 화면에 렌더링한다.
 */
async function loadChecklist() {
  const container = document.getElementById('checklist-container');
  if (!container) return;

  try {
    const res = await fetch(CHECKLIST_DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    checklistData = await res.json();

    renderChecklist(container);
    loadAndApplyChecks();
    loadAndApplyFilters();
    updateProgress();
  } catch (err) {
    console.error('[이사체크] 체크리스트 로딩 오류:', err);
    container.innerHTML =
      '<p class="error-msg">체크리스트를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>';
  }
}

/**
 * 체크리스트 데이터를 단계별로 그룹화하여 타임라인 DOM을 생성한다.
 * @param {HTMLElement} container
 */
function renderChecklist(container) {
  container.innerHTML = '';

  // 단계별 그룹화 (phaseOrder 오름차순 유지)
  const phaseMap = new Map();
  checklistData.forEach(item => {
    if (!phaseMap.has(item.phaseOrder)) {
      phaseMap.set(item.phaseOrder, { phase: item.phase, items: [] });
    }
    phaseMap.get(item.phaseOrder).items.push(item);
  });

  const sortedEntries = [...phaseMap.entries()].sort((a, b) => a[0] - b[0]);

  sortedEntries.forEach(([, group], idx) => {
    const isLast = idx === sortedEntries.length - 1;
    const timelineItem = buildPhaseGroup(group.phase, group.items, isLast);
    container.appendChild(timelineItem);
  });
}

/**
 * 단계 그룹 DOM(timeline-item)을 생성한다.
 * @param {string}   phase   단계 이름
 * @param {object[]} items   해당 단계 체크리스트 항목 배열
 * @param {boolean}  isLast  마지막 그룹 여부 (연결선 숨김)
 * @returns {HTMLElement}
 */
function buildPhaseGroup(phase, items, isLast) {
  const meta = PHASE_META[phase] || { title: phase, urgent: false };

  // 외부 래퍼
  const wrapper = document.createElement('div');
  wrapper.className = 'timeline-item';

  // 왼쪽: 점 + 선
  const dotCol = document.createElement('div');
  dotCol.className = 'timeline-dot-col';
  dotCol.setAttribute('aria-hidden', 'true');

  const dot = document.createElement('div');
  dot.className = 'timeline-dot';

  const line = document.createElement('div');
  line.className = 'timeline-line';
  if (isLast) line.style.display = 'none';

  dotCol.appendChild(dot);
  dotCol.appendChild(line);

  // 오른쪽: 내용
  const content = document.createElement('div');
  content.className = 'timeline-content';

  // 헤더
  const header = document.createElement('div');
  header.className = 'timeline-header';

  const badge = document.createElement('span');
  badge.className = meta.urgent ? 'timeline-badge urgent' : 'timeline-badge';
  badge.textContent = phase;

  const phaseTitle = document.createElement('span');
  phaseTitle.className = 'timeline-phase-title';
  phaseTitle.textContent = meta.title;

  header.appendChild(badge);
  header.appendChild(phaseTitle);

  // 체크 목록
  const list = document.createElement('ul');
  list.className = 'check-list';
  list.setAttribute('role', 'list');

  items.forEach(item => {
    list.appendChild(buildCheckItem(item));
  });

  content.appendChild(header);
  content.appendChild(list);

  wrapper.appendChild(dotCol);
  wrapper.appendChild(content);

  return wrapper;
}

/**
 * 개별 체크 항목 li 요소를 생성한다.
 * @param {object} item  checklist.json의 항목 객체
 * @returns {HTMLElement}
 */
function buildCheckItem(item) {
  const li = document.createElement('li');
  li.className = 'check-item';
  li.dataset.id   = item.id;
  li.dataset.tags = Array.isArray(item.tags) ? item.tags.join(',') : '';

  // 체크박스
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id   = item.id;
  checkbox.setAttribute('aria-describedby', `desc-${item.id}`);

  checkbox.addEventListener('change', () => {
    saveChecks();
    updateProgress();
    updateCompletedClass(li, checkbox.checked);
  });

  // 레이블
  const label = document.createElement('label');
  label.htmlFor = item.id;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'check-title';
  titleSpan.textContent = item.title;
  label.appendChild(titleSpan);

  if (item.description) {
    const desc = document.createElement('span');
    desc.className = 'check-desc';
    desc.id = `desc-${item.id}`;
    desc.textContent = item.description;
    label.appendChild(desc);
  }

  if (item.officialNote) {
    const note = document.createElement('span');
    note.className = 'check-note';
    note.textContent = item.officialNote;
    label.appendChild(note);
  }

  if (item.link) {
    const link = document.createElement('a');
    link.href   = item.link;
    link.target = '_blank';
    link.rel    = 'noopener noreferrer';
    link.className   = 'check-link';
    link.textContent = '공식 사이트 확인 →';
    link.setAttribute('aria-label', `${item.title} 관련 공식 사이트 새 창으로 열기`);
    label.appendChild(link);
  }

  // 추천 배지
  const recBadge = document.createElement('span');
  recBadge.className = 'recommended-badge';
  recBadge.textContent = '추천';
  recBadge.setAttribute('aria-label', '선택한 상황에 해당하는 항목');

  li.appendChild(checkbox);
  li.appendChild(label);
  li.appendChild(recBadge);

  return li;
}

/* ─────────────────────────────────────────
   체크 상태 저장 / 불러오기
   ───────────────────────────────────────── */

/**
 * 현재 모든 체크박스 상태를 localStorage에 저장한다.
 * 저장 값은 { [id]: boolean } 형태의 JSON 문자열.
 */
function saveChecks() {
  const state = {};
  document.querySelectorAll('.check-item input[type="checkbox"]').forEach(cb => {
    state[cb.id] = cb.checked;
  });
  localStorage.setItem(STORAGE_CHECKS_KEY, JSON.stringify(state));
}

/**
 * localStorage에서 체크 상태를 읽어 체크박스에 반영한다.
 */
function loadAndApplyChecks() {
  const raw = localStorage.getItem(STORAGE_CHECKS_KEY);
  if (!raw) return;

  let state;
  try { state = JSON.parse(raw); } catch { return; }

  Object.entries(state).forEach(([id, checked]) => {
    const cb = document.getElementById(id);
    if (!cb) return;
    cb.checked = checked;
    const li = cb.closest('.check-item');
    if (li) updateCompletedClass(li, checked);
  });
}

/**
 * 완료 CSS 클래스를 추가/제거한다.
 * @param {HTMLElement} li
 * @param {boolean}     checked
 */
function updateCompletedClass(li, checked) {
  li.classList.toggle('completed', checked);
}

/* ─────────────────────────────────────────
   진행률 업데이트
   ───────────────────────────────────────── */

/**
 * 진행 카운터 텍스트와 진행률 바를 최신 체크 상태로 갱신한다.
 */
function updateProgress() {
  const allCbs   = document.querySelectorAll('.check-item input[type="checkbox"]');
  const checkedCbs = document.querySelectorAll('.check-item input[type="checkbox"]:checked');
  const total   = allCbs.length;
  const done    = checkedCbs.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const counter = document.getElementById('progress-counter');
  const fill    = document.getElementById('progress-bar-fill');
  const bar     = document.getElementById('progress-bar');

  if (counter) {
    counter.textContent = `${done} / ${total} 항목 완료`;
    const pct = counter.querySelector('.progress-percent');
    if (pct) pct.textContent = `(${percent}%)`;
  }
  if (fill) fill.style.width = `${percent}%`;
  if (bar)  bar.setAttribute('aria-valuenow', percent);
}

/* ─────────────────────────────────────────
   전체 초기화
   ───────────────────────────────────────── */

/**
 * 모든 체크박스를 해제하고 localStorage 체크 데이터를 삭제한다.
 */
function resetAll() {
  if (!window.confirm('모든 체크 항목을 초기화하시겠습니까?')) return;

  document.querySelectorAll('.check-item input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    const li = cb.closest('.check-item');
    if (li) updateCompletedClass(li, false);
  });

  localStorage.removeItem(STORAGE_CHECKS_KEY);
  updateProgress();
}

/* ─────────────────────────────────────────
   필터 저장 / 불러오기 / 적용
   ───────────────────────────────────────── */

/**
 * 현재 activeFilters Set을 localStorage에 저장한다.
 */
function saveFilters() {
  localStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify([...activeFilters]));
}

/**
 * localStorage에서 필터 상태를 읽어 칩 UI 및 추천 배지에 반영한다.
 */
function loadAndApplyFilters() {
  const raw = localStorage.getItem(STORAGE_FILTERS_KEY);
  if (!raw) return;

  let saved;
  try { saved = JSON.parse(raw); } catch { return; }
  if (!Array.isArray(saved)) return;

  saved.forEach(filterVal => {
    activeFilters.add(filterVal);
    const chip = document.querySelector(`.filter-chip[data-filter="${CSS.escape(filterVal)}"]`);
    if (chip) {
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
    }
  });

  applyFilters();
}

/**
 * activeFilters에 기반해 체크리스트 항목에 추천 배지를 표시/숨긴다.
 * 실제 법적 판단을 하지 않으며, 단순 강조 표시만 수행한다.
 */
function applyFilters() {
  const hasFilter = activeFilters.size > 0;

  document.querySelectorAll('.check-item').forEach(li => {
    const rawTags = li.dataset.tags || '';
    const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];

    let isRecommended = false;
    if (hasFilter && tags.length > 0) {
      // 선택된 필터 중 하나라도 항목 태그와 일치하면 추천
      isRecommended = tags.some(tag => activeFilters.has(tag));
    }

    li.classList.toggle('recommended', isRecommended);
  });
}

/**
 * 필터 칩 토글 처리.
 * @param {string} filterVal  data-filter 속성값
 * @param {HTMLButtonElement} chip
 */
function toggleFilter(filterVal, chip) {
  if (activeFilters.has(filterVal)) {
    activeFilters.delete(filterVal);
    chip.classList.remove('active');
    chip.setAttribute('aria-pressed', 'false');
  } else {
    activeFilters.add(filterVal);
    chip.classList.add('active');
    chip.setAttribute('aria-pressed', 'true');
  }
  saveFilters();
  applyFilters();
}

/* ─────────────────────────────────────────
   내비게이션
   ───────────────────────────────────────── */

/**
 * 모바일 메뉴 열기/닫기 이벤트를 설정한다.
 */
function initNavigation() {
  const toggle  = document.getElementById('mobile-menu-toggle');
  const close   = document.getElementById('mobile-menu-close');
  const overlay = document.getElementById('mobile-menu-overlay');
  const header  = document.getElementById('site-header');

  if (!toggle || !overlay) return;

  function openMenu() {
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', openMenu);
  if (close) close.addEventListener('click', closeMenu);

  // ESC 키로 닫기
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
      closeMenu();
      toggle.focus();
    }
  });

  // 내부 링크 클릭 시 메뉴 닫기
  overlay.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // 스크롤 시 헤더 숨김/표시
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const current = window.scrollY;
      if (current <= 0) {
        header.style.transform   = 'translateY(0)';
        header.style.boxShadow   = 'none';
        lastScroll = current;
        return;
      }
      if (current > lastScroll && current > 80) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
        header.style.boxShadow = 'var(--shadow-md)';
      }
      lastScroll = current;
    }, { passive: true });
  }
}

/* ─────────────────────────────────────────
   필터 칩 이벤트 초기화
   ───────────────────────────────────────── */

/**
 * 필터 칩 버튼들에 클릭/키보드 이벤트를 등록한다.
 */
function initFilterChips() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const filterVal = chip.dataset.filter;
    if (!filterVal) return;

    chip.addEventListener('click', () => toggleFilter(filterVal, chip));

    // 키보드 접근성: Space/Enter로 토글
    chip.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFilter(filterVal, chip);
      }
    });
  });
}

/* ─────────────────────────────────────────
   초기화 진입점
   ───────────────────────────────────────── */

/**
 * DOMContentLoaded 후 실행되는 메인 초기화 함수.
 */
async function init() {
  initNavigation();
  initFilterChips();

  // 전체 초기화 버튼
  const resetBtn = document.getElementById('reset-all-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetAll);

  // 체크리스트 로드 (비동기)
  await loadChecklist();
}

document.addEventListener('DOMContentLoaded', init);
