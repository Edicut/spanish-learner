const pageTitles = {
  dashboard: '学习总览', learn: '学习新词', review: '间隔复习',
  listening: '听力练习', speaking: '口语练习', sentences: '句子练习',
  grammar: '语法课堂', wordbank: '词库', settings: '设置'
};
let showAllTopics = false;

function uiIcon(name) {
  return `<svg class="ui-icon" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
}

function sectionFromLocation() {
  const name = location.hash.slice(1);
  return Object.hasOwn(pageTitles, name) ? name : 'dashboard';
}

function setupNavigation() {
  const dialog = document.getElementById('moreDialog');
  const more = document.getElementById('openMore');
  more.addEventListener('click', () => {
    dialog.showModal();
    more.setAttribute('aria-expanded', 'true');
  });
  document.getElementById('closeMore').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog && !event.target.closest('button')) {
      const box = dialog.getBoundingClientRect();
      if (event.clientY < box.top || event.clientX < box.left || event.clientX > box.right) dialog.close();
    }
  });
  dialog.addEventListener('close', () => more.setAttribute('aria-expanded', 'false'));
  matchMedia('(min-width: 769px)').addEventListener('change', event => {
    if (event.matches && dialog.open) dialog.close();
  });
  document.querySelectorAll('[data-section], [data-go]').forEach(button => {
    button.addEventListener('click', () => switchSection(button.dataset.section || button.dataset.go));
  });
  document.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    switchSection('dashboard');
  });
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('pageTitle').focus();
  });
  document.getElementById('toggleTopics').addEventListener('click', () => {
    showAllTopics = !showAllTopics;
    renderLessons();
  });
  document.getElementById('lessonGrid').addEventListener('click', event => {
    if (event.target.closest('[data-photo-course]')) {
      startPhotoCourse();
      return;
    }
    const button = event.target.closest('[data-topic]');
    if (button) startLessonCategory(button.dataset.topic);
  });
  document.getElementById('heroAction').addEventListener('click', () => {
    const section = document.getElementById('heroAction').dataset.target;
    switchSection(section, {extra: section === 'learn' && state.todayLearned >= state.dailyGoal});
  });
  window.addEventListener('hashchange', () => switchSection(sectionFromLocation(), {fromHistory: true}));
  switchSection(sectionFromLocation(), {fromHistory: true, initial: true});
}

function switchSection(name, options = {}) {
  if (!Object.hasOwn(pageTitles, name)) return;
  const dialog = document.getElementById('moreDialog');
  if (dialog.open) dialog.close();
  if (currentSection !== name || options.queue || options.extra) leavePracticeSection();
  if (!options.fromHistory && sectionFromLocation() !== name) {
    history.pushState(null, '', '#' + name);
  }
  currentSection = name;
  document.querySelectorAll('.section').forEach(section => {
    section.classList.toggle('active', section.id === 'sec-' + name);
  });
  document.querySelectorAll('[data-section]').forEach(button => {
    const active = button.dataset.section === name;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const inMore = !!dialog.querySelector('[aria-current="page"]');
  const more = document.getElementById('openMore');
  more.classList.toggle('active', inMore);
  more.setAttribute('aria-label', inMore ? '更多，当前位于' + pageTitles[name] : '更多');
  const heading = document.getElementById('pageTitle');
  heading.textContent = pageTitles[name];
  document.title = pageTitles[name] + ' · ¡Hola! 西班牙语学习助手';
  if (name === 'learn') openLearn(options.queue, options.extra);
  else if (name === 'review') openReview(options.queue);
  else if (name === 'listening') openListening();
  else if (name === 'speaking') openSpeaking();
  else if (name === 'sentences') openSentences();
  else if (name === 'grammar') initGrammar();
  else if (name === 'wordbank') renderWordBank();
  else if (name === 'dashboard') {
    updateDashboard();
    renderLessons();
  }
  updateBadges();
  if (!options.initial) {
    window.scrollTo(0, 0);
    heading.focus({preventScroll: true});
  }
}

function updateDashboard() {
  const counts = getCounts();
  const total = UNIQUE_VOCAB.length;
  const learned = total - counts.new;
  const due = getReviewDue().length;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 || hour >= 20 ? '¡Buenas noches!' : hour < 13 ? '¡Buenos días!' : '¡Buenas tardes!';
  document.getElementById('heroGreeting').textContent = greeting;
  document.getElementById('dDateDisplay').textContent = now.toLocaleDateString('zh-CN', {month:'long',day:'numeric',weekday:'long'});
  document.getElementById('streakDisplay').textContent = state.streak;
  document.getElementById('dTodayLearned').textContent = state.todayLearned;
  document.getElementById('dTotalLearned').textContent = learned;
  document.getElementById('dMastered').textContent = counts.mastered;
  document.getElementById('dReviewDue').textContent = due;
  document.getElementById('goalTarget').textContent = state.dailyGoal;
  const dailyProgress = document.getElementById('dailyProgress');
  dailyProgress.max = state.dailyGoal;
  dailyProgress.value = state.todayLearned;
  document.getElementById('sideProgress').value = learned / total * 100;
  document.getElementById('sidePercent').textContent = Math.round(learned / total * 100) + '%';

  const remaining = Math.min(counts.new, Math.max(0, state.dailyGoal - state.todayLearned));
  let section = 'learn';
  let action = '开始学新词';
  let summary = `今天还有 ${remaining} 个新词待学。`;
  if (hasActiveLearnSession()) {
    action = '继续学新词';
    summary = '接着上次停下的那张词卡，继续这一轮。';
  } else if (hasActiveReviewSession() || due > 0) {
    section = 'review';
    action = hasActiveReviewSession() ? '继续复习' : '开始复习';
    summary = due ? `有 ${due} 个词到了复习时间。` : '继续刚才的复习。';
  } else if (!counts.new) {
    section = 'listening';
    action = '开始听力练习';
    summary = '词库里的新词已全部学过，练练听力吧。';
  } else if (remaining === 0) {
    action = '再学一组';
    summary = '今天的新词目标已完成。';
  }
  document.getElementById('heroSummary').textContent = summary;
  const button = document.getElementById('heroAction');
  button.dataset.target = section;
  button.querySelector('span').textContent = action;
}

function updateBadges() {
  const remaining = Math.max(0, Math.min(getCounts().new, state.dailyGoal - state.todayLearned));
  const due = getReviewDue().length;
  for (const [id, value] of [['newWordsBadge', remaining], ['reviewBadge', due]]) {
    const badge = document.getElementById(id);
    badge.textContent = value;
    badge.hidden = !value;
  }
}

const topicOrder = ['问候', '旅行', '食物', '日常', '时间', '家庭'];
const topicIllustrations = {'问候':'👋', '旅行':'🧳', '食物':'🥘', '日常':'🏡', '时间':'⏰', '家庭':'🏠'};
function renderLessons() {
  const groups = new Map();
  for (const word of VOCAB) {
    if (!groups.has(word.cat)) groups.set(word.cat, new Set());
    groups.get(word.cat).add(word.es);
  }
  const topics = [...new Set([...topicOrder, ...groups.keys()])].filter(cat => groups.has(cat));
  const visible = showAllTopics ? topics : topics.slice(0, topicOrder.length);
  const photoCount = new Set(VOCAB.filter(wordPhoto).map(w => w.es)).size;
  const photoCourse = photoCount ? `<button type="button" class="topic-card photo-course" data-photo-course>
    <span class="topic-emoji" aria-hidden="true">${uiIcon('cards')}</span>
    <span class="topic-copy"><strong>看图记词</strong><small>${photoCount} 个配图词</small></span>
    ${uiIcon('chevron')}</button>` : '';
  document.getElementById('lessonGrid').innerHTML = photoCourse + visible.map((cat, index) => {
    const words = [...groups.get(cat)];
    const learned = words.filter(es => state.words[es] && state.words[es].status !== 'new').length;
    return `<button type="button" class="topic-card tint-${index % 6}" data-topic="${cat}">
      <span class="topic-emoji" aria-hidden="true">${topicIllustrations[cat] || CAT_ICONS[cat] || '📖'}</span>
      <span class="topic-copy"><strong>${cat}</strong><small>已学 ${learned} / ${words.length} 词</small></span>
      ${uiIcon('chevron')}</button>`;
  }).join('');
  const toggle = document.getElementById('toggleTopics');
  toggle.setAttribute('aria-expanded', String(showAllTopics));
  toggle.querySelector('span').textContent = showAllTopics ? '收起课程' : `全部 ${topics.length} 门`;
}
