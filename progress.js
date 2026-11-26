'use strict';

const STATE_KEY = 'hola_spanish_state';
const RECOVERY_KEY = 'hola_spanish_recovery';
const SYNC_KEY = 'hola_spanish_sync';
const GIST_FILE = 'hola_spanish_sync.json';

function initialState() {
  return {
    dailyGoal: 25, speechRate: 0.9, listenCount: 20, ttsEngine: 'auto',
    streak: 0, lastStudyDate: null, todayLearned: 0, todayDate: null,
    words: {}, listenHistory: {correct: 0, total: 0}, speakHistory: {correct: 0, total: 0}
  };
}

function newWordProgress() {
  return {status: 'new', ef: 2.5, interval: 0, reps: 0, nextReview: 0, lastStudied: 0};
}

let state = initialState();
let recoveryData = '';
let lastStorageWarning = 0;
let syncConfig = {token: '', gistId: '', autoSync: false, lastSync: '', baseline: ''};
let autoSyncTimer;
let syncBusy = false;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireData(valid) {
  if (!valid) throw new Error('文件中的学习记录格式不正确');
}

function readProgress(data) {
  requireData(isRecord(data) && isRecord(data.words));
  const clean = initialState();
  const words = Object.keys(data.words);
  requireData(words.length ? VOCAB.some(w => Object.hasOwn(data.words, w.es)) : 'dailyGoal' in data);
  for (const word of VOCAB) {
    if (!Object.hasOwn(data.words, word.es)) continue;
    const record = data.words[word.es];
    requireData(isRecord(record) && ['new', 'learning', 'review', 'mastered'].includes(record.status));
    const next = newWordProgress();
    next.status = record.status;
    for (const key of ['ef', 'interval', 'reps', 'nextReview', 'lastStudied']) {
      if (!Object.hasOwn(record, key)) continue;
      requireData(Number.isFinite(record[key]) && record[key] >= 0);
      next[key] = record[key];
    }
    clean.words[word.es] = next;
  }
  for (const key of ['dailyGoal', 'todayLearned', 'streak']) {
    if (!Object.hasOwn(data, key)) continue;
    requireData(Number.isSafeInteger(data[key]) && data[key] >= 0);
    clean[key] = data[key];
  }
  requireData(clean.dailyGoal >= 5 && clean.dailyGoal <= 100 && clean.dailyGoal % 5 === 0);
  if ('speechRate' in data) {
    requireData(Number.isFinite(data.speechRate) && data.speechRate >= 0.5 && data.speechRate <= 1.5);
    clean.speechRate = data.speechRate;
  }
  if ('listenCount' in data) {
    requireData([10, 20, 30, 50].includes(data.listenCount));
    clean.listenCount = data.listenCount;
  }
  if ('ttsEngine' in data) {
    requireData(['auto', 'online', 'local'].includes(data.ttsEngine));
    clean.ttsEngine = data.ttsEngine;
  }
  for (const key of ['todayDate', 'lastStudyDate']) {
    if (data[key] == null) continue;
    requireData(typeof data[key] === 'string' && Number.isFinite(Date.parse(data[key])));
    clean[key] = new Date(data[key]).toDateString();
  }
  for (const key of ['listenHistory', 'speakHistory']) {
    if (!Object.hasOwn(data, key)) continue;
    const h = data[key];
    requireData(isRecord(h) && Number.isSafeInteger(h.correct) && Number.isSafeInteger(h.total)
      && h.correct >= 0 && h.total >= h.correct);
    clean[key] = {correct: h.correct, total: h.total};
  }
  return clean;
}

function writeLocal(key, content) {
  try {
    localStorage.setItem(key, content);
    return true;
  } catch {
    if (Date.now() - lastStorageWarning > 5000) {
      showToast('浏览器无法保存数据，离开前请导出备份');
      lastStorageWarning = Date.now();
    }
    return false;
  }
}

function loadState() {
  let saved;
  try {
    saved = localStorage.getItem(STATE_KEY);
    recoveryData = localStorage.getItem(RECOVERY_KEY) || '';
    if (saved) state = readProgress(JSON.parse(saved));
  } catch {
    if (saved) {
      recoveryData = saved;
      writeLocal(RECOVERY_KEY, saved);
      showToast('旧进度读取失败，可在设置中下载原存档');
    } else {
      showToast('本机存储不可用，离开前请导出进度');
    }
  }
}

function saveState(autoUpload = true) {
  const saved = writeLocal(STATE_KEY, JSON.stringify(state));
  if (autoUpload) scheduleAutoSync();
  return saved;
}

// Date.UTC compares the local calendar dates even across daylight-saving changes.
function dayNumber(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
}

function checkNewDay(now = new Date()) {
  const today = now.toDateString();
  const gap = state.lastStudyDate ? dayNumber(now) - dayNumber(new Date(state.lastStudyDate)) : Infinity;
  if (gap > 1) state.streak = 0;
  if ((gap === 0 || gap === 1) && !state.streak) state.streak = 1;
  if (state.todayDate === today) return false;
  state.todayDate = today;
  state.todayLearned = 0;
  return true;
}

function refreshLocalDay() {
  if (document.hidden) return;
  if (checkNewDay()) {
    saveState(false);
    updateDashboard();
    updateBadges();
  }
}

function recordStudyDay() {
  const now = new Date();
  checkNewDay(now);
  if (state.lastStudyDate === state.todayDate) return;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  state.streak = state.lastStudyDate === yesterday.toDateString() ? state.streak + 1 : 1;
  state.lastStudyDate = state.todayDate;
  updateDashboard();
}

function initWords() {
  for (const word of VOCAB) {
    if (!Object.hasOwn(state.words, word.es)) state.words[word.es] = newWordProgress();
  }
}

function renderSettings() {
  document.getElementById('settingDailyGoal').value = state.dailyGoal;
  document.getElementById('settingDailyGoalVal').textContent = state.dailyGoal + ' 词';
  document.getElementById('settingSpeechRate').value = state.speechRate;
  document.getElementById('settingSpeechRateVal').textContent = state.speechRate + '×';
  document.getElementById('settingTtsEngine').value = state.ttsEngine;
  document.getElementById('settingListenCount').value = state.listenCount;
  document.getElementById('recoverBackup').hidden = !recoveryData;
}

function updateDailyGoal(value) {
  state.dailyGoal = Number(value);
  renderSettings();
  saveState();
  updateDashboard();
  updateBadges();
}

function updateSpeechRate(value) {
  state.speechRate = Number(value);
  renderSettings();
  saveState();
}

function updateListenCount(value) {
  state.listenCount = Number(value);
  saveState();
}

function updateTtsEngine(value) {
  state.ttsEngine = value;
  saveState();
}

function replaceProgress(data) {
  clearTimeout(autoSyncTimer);
  state = data;
  checkNewDay();
  initWords();
  resetPracticeSessions();
  renderSettings();
  updateDashboard();
  renderLessons();
  updateBadges();
  return saveState(false);
}

function pauseAutoUpload() {
  clearTimeout(autoSyncTimer);
  if (!syncConfig.autoSync) return;
  syncConfig.autoSync = false;
  document.getElementById('syncAuto').checked = false;
  persistSyncConfig();
}

function resetProgress() {
  if (syncBusy) return showToast('同步中，请稍后再重置');
  if (!confirm('清空本机学习进度？练习偏好将保留，自动上传将关闭。')) return;
  pauseAutoUpload();
  const {dailyGoal, speechRate, listenCount, ttsEngine} = state;
  if (replaceProgress({...initialState(), dailyGoal, speechRate, listenCount, ttsEngine})) showToast('本机学习进度已重置');
}

function downloadJson(content, filename) {
  const url = URL.createObjectURL(new Blob([content], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function exportData() {
  checkNewDay();
  const now = new Date();
  const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  downloadJson(JSON.stringify(state, null, 2), 'hola-spanish-' + stamp + '.json');
}

function exportRecovery() {
  if (recoveryData) downloadJson(recoveryData, 'hola-spanish-recovery.json');
}

function confirmRestore(data, source) {
  const count = Object.values(data.words).filter(w => w.status !== 'new').length;
  const message = source + '含 ' + count + ' 个已学词。替换本机进度及练习偏好？';
  return confirm(message + (source === '备份' && syncConfig.autoSync ? '自动上传将关闭。' : ''));
}

async function importData(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (syncBusy) return showToast('同步中，请稍后再导入');
  try {
    const data = readProgress(JSON.parse(await file.text()));
    if (syncBusy || !confirmRestore(data, '备份')) return;
    pauseAutoUpload();
    if (replaceProgress(data)) showToast('学习进度已导入');
  } catch (err) {
    showToast(err instanceof SyntaxError ? '导入失败，文件不是有效的 JSON' : '导入失败：' + err.message);
  }
}

function syncStatus(message) {
  document.getElementById('syncStatusText').textContent = message || (syncConfig.lastSync
    ? '上次同步 ' + syncConfig.lastSync : syncConfig.token ? '已填写令牌' : '未配置');
}

function loadSyncConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
    for (const key of ['token', 'gistId', 'lastSync', 'baseline']) {
      if (typeof saved?.[key] === 'string') syncConfig[key] = saved[key];
    }
    syncConfig.autoSync = saved?.autoSync === true;
  } catch {}
  document.getElementById('syncToken').value = syncConfig.token;
  document.getElementById('syncGistId').value = syncConfig.gistId;
  document.getElementById('syncAuto').checked = syncConfig.autoSync;
  document.getElementById('cloudSettings').open = Boolean(syncConfig.token);
  syncStatus();
}

function persistSyncConfig() {
  return writeLocal(SYNC_KEY, JSON.stringify(syncConfig));
}

function saveSyncConfig() {
  clearTimeout(autoSyncTimer);
  const token = document.getElementById('syncToken').value.trim();
  const gistId = document.getElementById('syncGistId').value.trim();
  if (gistId !== syncConfig.gistId || token !== syncConfig.token) {
    syncConfig.baseline = '';
    syncConfig.lastSync = '';
  }
  syncConfig.token = token;
  syncConfig.gistId = gistId;
  syncConfig.autoSync = document.getElementById('syncAuto').checked;
  persistSyncConfig();
  syncStatus();
}

function scheduleAutoSync() {
  clearTimeout(autoSyncTimer);
  if (syncConfig.autoSync && syncConfig.token && syncConfig.gistId) {
    autoSyncTimer = setTimeout(() => syncUpload(false), 8000);
  }
}

function syncReady(needsId) {
  if (!syncConfig.token) { showToast('请先填写 GitHub 令牌'); return false; }
  if (needsId && !syncConfig.gistId) { showToast('请填写另一台设备上的 Gist ID'); return false; }
  if (syncConfig.gistId && !/^[a-f\d]+$/i.test(syncConfig.gistId)) { showToast('请只填写 Gist ID'); return false; }
  return true;
}

function setSyncBusy(busy, message) {
  syncBusy = busy;
  document.getElementById('syncFields').disabled = busy;
  if (message) syncStatus(message);
}

async function gistRequest(method, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const url = 'https://api.github.com/gists' + (syncConfig.gistId ? '/' + syncConfig.gistId : '');
    const headers = {Authorization: 'Bearer ' + syncConfig.token, Accept: 'application/vnd.github+json'};
    if (payload) headers['Content-Type'] = 'application/json';
    const response = await fetch(url, {method, headers, cache: 'no-store', credentials: 'omit',
      signal: controller.signal, body: payload ? JSON.stringify(payload) : undefined});
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('请检查令牌与 gist 权限');
      if (response.status === 404) throw new Error('未找到 Gist，请检查 ID 和令牌');
      throw new Error('GitHub 返回 HTTP ' + response.status);
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('连接超时，请稍后重试');
    throw err;
  } finally { clearTimeout(timeout); }
}

function remoteContent(gist) {
  if (gist.public !== false) throw new Error('请选择秘密 Gist');
  const file = gist.files?.[GIST_FILE];
  if (!file || file.truncated || typeof file.content !== 'string') throw new Error('未找到完整的学习进度文件');
  return file.content;
}

// Remember exactly which remote content was last seen. The file is small
// enough to keep directly when Web Crypto is unavailable on local HTTP.
async function fingerprint(content) {
  if (!globalThis.crypto?.subtle) return content;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}

async function finishSync(content) {
  syncConfig.baseline = await fingerprint(content);
  syncConfig.lastSync = new Date().toLocaleString('zh-CN');
  persistSyncConfig();
  document.getElementById('syncGistId').value = syncConfig.gistId;
  syncStatus();
}

async function syncUpload(manual = true) {
  if (syncBusy) { if (!manual) scheduleAutoSync(); return; }
  if (!syncReady(false)) return;
  clearTimeout(autoSyncTimer);
  setSyncBusy(true, '正在检查云端进度…');
  try {
    let remote;
    if (syncConfig.gistId) remote = remoteContent(await gistRequest('GET'));
    const content = JSON.stringify(state);
    if (remote !== undefined && remote !== content && syncConfig.baseline !== await fingerprint(remote)) {
      if (!manual) {
        pauseAutoUpload();
        syncStatus('云端有其他进度，自动上传已暂停。请选择下载或上传。');
        showToast('云端有其他进度，已暂停自动上传');
        return;
      }
      if (!confirm('云端含另一份进度，确定用这台设备的进度覆盖吗？')) { syncStatus(); return; }
    }
    if (remote !== content) {
      syncStatus('正在上传…');
      const isNew = !syncConfig.gistId;
      const payload = {files: {[GIST_FILE]: {content}}};
      if (isNew) Object.assign(payload, {description: 'Hola Spanish Learner Progress Sync', public: false});
      const saved = await gistRequest(isNew ? 'POST' : 'PATCH', payload);
      if (isNew) {
        if (!saved.id) throw new Error('未收到新 Gist 的 ID');
        syncConfig.gistId = saved.id;
      }
    }
    await finishSync(content);
    if (manual) showToast('进度已上传');
  } catch (err) {
    syncStatus('上传失败：' + err.message);
    if (manual) showToast('上传失败：' + err.message);
  } finally { setSyncBusy(false); }
}

async function syncDownload() {
  if (syncBusy || !syncReady(true)) return;
  clearTimeout(autoSyncTimer);
  setSyncBusy(true, '正在下载…');
  try {
    const content = remoteContent(await gistRequest('GET'));
    const data = readProgress(JSON.parse(content));
    if (!confirmRestore(data, '云端')) { syncStatus(); return; }
    const saved = replaceProgress(data);
    await finishSync(content);
    if (saved) showToast('已恢复云端进度');
  } catch (err) {
    syncStatus('下载失败：' + err.message);
    showToast('下载失败：' + err.message);
  } finally { setSyncBusy(false); }
}

async function copyGistId() {
  if (!syncConfig.gistId) return showToast('首次上传后即可复制 Gist ID');
  try {
    await navigator.clipboard.writeText(syncConfig.gistId);
    showToast('已复制 Gist ID');
  } catch {
    prompt('复制以下 Gist ID，在另一台设备填写。', syncConfig.gistId);
  }
}
