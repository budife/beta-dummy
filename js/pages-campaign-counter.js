const campaignRegistryService = window.CampaignCounterLocalStore;

let username = localStorage.getItem('edm_username') || 'Local user';
let connected = true;
let generating = false;
let currentCampaignId = 0;
const GENERATED_FROM_POINTER_NOTE = 'Generated from active counter';
let scannedFolderIds = new Map();
let lastRenderedActivity = [];

function formatId(value) {
  return String(Number.parseInt(value, 10) || 0).padStart(4, '0');
}

function formatDatestamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function slugifyCampaignName(name) {
  return name
    .trim()
    .replace(/\s+/g, '') || 'nama-campaign';
}

function buildCopiedId(campaignId, campaignName, dateStamp) {
  const stamp = dateStamp || formatDatestamp(new Date());
  const slug = slugifyCampaignName(campaignName);
  return `${stamp}_${slug}_${formatId(campaignId)}`;
}

function parseFolderCampaignId(name) {
  const match = name.match(/\b(\d{4})\b/);
  return match ? match[1] : null;
}

function parseFolderInfo(name) {
  const trimmed = name.replace(/\s*-\s*Copy(\s*\(\d+\))?$/gi, '').trim();
  const pipeParts = trimmed.split(/\s*\|\s*/).map(p => p.trim()).filter(p => p);

  if (pipeParts.length >= 3) {
    const id = pipeParts[0].match(/\d{4}/)?.[0] || pipeParts[0];
    let campaignName = pipeParts[1];
    let date = '';
    let manager = '';
    if (pipeParts.length === 3) {
      const dateOrMgr = pipeParts[2];
      if (/\d{1,2}-\d{2,4}/.test(dateOrMgr)) date = dateOrMgr;
      else manager = dateOrMgr;
    } else {
      const f3 = pipeParts[2];
      const f4 = pipeParts[3];
      if (/\d{1,2}-\d{2,4}/.test(f3)) { date = f3; manager = f4; }
      else if (/\d{1,2}-\d{2,4}/.test(f4)) { date = f4; manager = f3; }
      else { manager = f3; }
    }
    return { id, name: campaignName, date, manager };
  }

  const idMatch = trimmed.match(/^(\d{4})/);
  const id = idMatch ? idMatch[1] : null;
  let rest = trimmed.replace(/^\d{4}\s*/, '').trim();
  const dateMatch = rest.match(/\b(\d{1,2}-\d{2,4})\b/);
  let date = '';
  let campaignName = rest;
  let manager = '';
  if (dateMatch) {
    date = dateMatch[1];
    const before = rest.slice(0, dateMatch.index).trim();
    const after = rest.slice(dateMatch.index + dateMatch[0].length).trim();
    const beforeWords = before.split(/\s+/);
    const afterWords = after.split(/\s+/).filter(w => w);
    if (afterWords.length) {
      campaignName = before;
      manager = afterWords.join(' ');
    } else if (beforeWords.length >= 2) {
      manager = beforeWords.pop();
      campaignName = beforeWords.join(' ');
    } else {
      campaignName = before;
    }
  }
  return { id, name: campaignName, date, manager };
}

function renderFolderList() {
  const container = document.getElementById('folder-items');
  const countEl = document.getElementById('folder-count');
  const listEl = document.getElementById('folder-list');
  const emptyEl = document.getElementById('folder-empty');
  if (!container || !countEl || !listEl) return;

  if (scannedFolderIds.size === 0) {
    listEl.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  listEl.hidden = false;
  if (emptyEl) emptyEl.hidden = true;
  countEl.textContent = `(${scannedFolderIds.size})`;
  container.innerHTML = '';

  const sorted = [...scannedFolderIds.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [id, entries] of sorted) {
    const chip = document.createElement('div');
    chip.className = 'counter-folder-chip';
    chip.dataset.folderId = id;
    chip.setAttribute('tabindex', '0');

    const campaignItems = entries.map(e => `
      <span class="tooltip-campaign-item">
        <span class="tooltip-date">${escapeHtml(e.date || '')}</span>
        <span class="tooltip-name">${escapeHtml(e.name || 'Unknown')}</span>
        <span class="tooltip-manager">${escapeHtml(e.manager || '')}</span>
      </span>`).join('');

    chip.innerHTML = `<code>${escapeHtml(id)}</code>`;

    // Create tooltip panel in portal
    const panel = document.createElement('div');
    panel.className = 'tooltip-panel';
    panel.dataset.folderId = id;
    panel.innerHTML = `
      <span class="tooltip-header">ID: ${escapeHtml(id)}</span>
      <span class="tooltip-campaign-list">${campaignItems}</span>`;
    document.getElementById('tooltip-portal').appendChild(panel);

    const showTooltip = () => {
      const rect = chip.getBoundingClientRect();
      panel.style.top = `${rect.top}px`;
      panel.style.left = `${rect.right + 8}px`;
      panel.classList.remove('flip-left');

      // Check if panel would overflow viewport on right
      const panelWidth = 280;
      const gap = 8;
      if (rect.right + gap + panelWidth > window.innerWidth - 12) {
        panel.classList.add('flip-left');
        panel.style.left = 'auto';
        panel.style.right = `${window.innerWidth - rect.left + gap}px`;
      } else {
        panel.style.left = `${rect.right + 8}px`;
        panel.style.right = 'auto';
      }

      // Check if panel would overflow viewport on bottom
      const maxHeight = window.innerHeight - 120;
      panel.style.maxHeight = `${maxHeight}px`;
      if (rect.top + panel.offsetHeight > window.innerHeight - 20) {
        panel.style.top = `${window.innerHeight - maxHeight - 20}px`;
      }

      panel.classList.add('visible');
    };

    const hideTooltip = () => {
      panel.classList.remove('visible', 'flip-left');
    };

    chip.addEventListener('mouseenter', showTooltip);
    chip.addEventListener('mouseleave', hideTooltip);
    chip.addEventListener('focus', showTooltip);
    chip.addEventListener('blur', hideTooltip);

    container.appendChild(chip);
  }
}

function markConflict(folderId) {
  const chip = document.querySelector(`.counter-folder-chip[data-folder-id="${folderId}"]`);
  if (chip) chip.classList.add('is-conflict');
}

function clearConflicts() {
  document.querySelectorAll('.counter-folder-chip.is-conflict').forEach(el => el.classList.remove('is-conflict'));
}

function updateConflictState() {
  const idEl = document.getElementById('counter-last-id');
  const currentId = formatId(currentCampaignId);
  if (scannedFolderIds.has(currentId)) {
    idEl.classList.add('is-conflict');
    const folders = scannedFolderIds.get(currentId);
    const details = folders.map(f => `${f.name || 'No name'} (${f.date || 'No date'})`).join(', ');
    idEl.title = `Campaign ID ${currentId} already exists: ${details}`;
  } else {
    idEl.classList.remove('is-conflict');
    idEl.title = '';
  }
}

async function scanFolder() {
  if (typeof window.showDirectoryPicker !== 'function') {
    setMessage('Folder access is not supported in this browser.', 'error');
    return;
  }
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    let newCount = 0;
    let skippedCount = 0;
    const newEntries = [];
    for await (const [name] of dirHandle.entries()) {
      const id = parseFolderCampaignId(name);
      if (id) {
        const info = parseFolderInfo(name);
        const entryKey = `${id}|${info.date}|${info.name}|${info.manager}`;
        if (scannedFolderIds.has(id)) {
          const existing = scannedFolderIds.get(id);
          const isDuplicate = existing.some(e => `${e.date}|${e.name}|${e.manager}` === `${info.date}|${info.name}|${info.manager}`);
          if (!isDuplicate) {
            existing.push(info);
            newCount += 1;
            newEntries.push({
              campaign_id: id,
              campaign_name: info.name || '',
              folder_date: info.date || '',
              manager: info.manager || ''
            });
          } else {
            skippedCount += 1;
          }
        } else {
          scannedFolderIds.set(id, [info]);
          newCount += 1;
          newEntries.push({
            campaign_id: id,
            campaign_name: info.name || '',
            folder_date: info.date || '',
            manager: info.manager || ''
          });
        }
      }
    }
    const btn = document.getElementById('pick-folder');
    const label = document.getElementById('folder-btn-label');
    if (btn) btn.classList.add('is-loaded');
    if (label) label.textContent = dirHandle.name;
    localStorage.setItem('edm_last_folder', dirHandle.name);
    renderFolderList();
    updateConflictState();
    renderActivity(lastRenderedActivity);

    if (newEntries.length) campaignRegistryService.saveFolderScans(dirHandle.name, newEntries);
    setMessage(`${newCount} unique campaign ID(s) found and saved locally.`, 'success');
  } catch (error) {
    if (error.name !== 'AbortError') {
      setMessage('Unable to read folder. Please try again.', 'error');
    }
  }
}

async function resetFolderScans() {
  if (!scannedFolderIds.size) {
    setMessage('No folder scans to reset.', 'info');
    return;
  }
  if (!confirm('Are you sure you want to clear all saved folder scans? This cannot be undone.')) {
    return;
  }
  try {
    campaignRegistryService.clearFolderScans();
    scannedFolderIds.clear();
    renderFolderList();
    updateConflictState();
    renderActivity(lastRenderedActivity);
    const btn = document.getElementById('pick-folder');
    const label = document.getElementById('folder-btn-label');
    if (btn) btn.classList.remove('is-loaded');
    if (label) label.textContent = 'Scan Folder';
    setMessage('Folder scans cleared.', 'success');
  } catch (error) {
    console.error('Unable to clear folder scans.', error);
    setMessage('Unable to clear folder scans. Please try again.', 'error');
  }
}

async function refreshFolderScans() {
  try {
    const scans = await campaignRegistryService.loadFolderScans();
    scannedFolderIds.clear();
    scans.forEach(row => {
      const id = row.campaign_id;
      if (!scannedFolderIds.has(id)) scannedFolderIds.set(id, []);
      scannedFolderIds.get(id).push({
        name: row.campaign_name,
        date: row.folder_date,
        manager: row.manager
      });
    });
    renderFolderList();
    updateConflictState();
    renderActivity(lastRenderedActivity);
    setMessage(`Refreshed — ${scans.length} campaign ID(s) loaded locally.`, 'success');
  } catch (error) {
    console.error('Unable to refresh folder scans.', error);
    setMessage('Unable to refresh. Please try again.', 'error');
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setMessage(message = '', type = '') {
  const element = document.getElementById('counter-message');
  if (!element) return;
  element.textContent = message;
  element.className = `counter-message${type ? ` is-${type}` : ''}`;
}

function getManualSetErrorMessage(error, candidateId) {
  console.error('Set Campaign ID failed', error);
  const message = String(error?.message || '').trim();
  if (/campaign id must be between|user name is required/i.test(message)) {
    return message;
  }
  return 'Unable to set the Campaign ID. Please try again.';
}

function setConnectionStatus(isConnected) {
  const element = document.getElementById('counter-connection-status');
  if (!element) return;
  element.textContent = isConnected ? 'Saved locally' : 'Unavailable';
  element.className = `counter-connection-status ${isConnected ? 'is-connected' : 'is-offline'}`;
}

function formatActivityDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'an unknown time';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}

function renderActivity(items) {
  const list = document.getElementById('activity-list');
  if (!list) return;
  lastRenderedActivity = items || [];
  const visible = lastRenderedActivity.slice(0, 20);
  if (!visible.length) {
    list.innerHTML = '<p class="activity-empty">No Campaign IDs have been generated yet.</p>';
    return;
  }
  const actionLabel = item => item.action === 'manual_set' && item.note !== GENERATED_FROM_POINTER_NOTE
    ? 'manually set'
    : 'generated';
  const displayId = item => item.full_id ? escapeHtml(item.full_id) : formatId(item.campaign_id);
  list.innerHTML = visible.map(item => {
    const id = item.campaign_id;
    const idStr = formatId(id);
    const isConflict = scannedFolderIds.has(idStr);
    const conflictClass = isConflict ? ' is-conflict' : '';
    const conflictAttr = isConflict ? ` title="Campaign ID ${idStr} already exists in scanned folders"` : '';
    const conflictBadge = isConflict ? '<span class="activity-conflict-badge" title="Campaign ID already exists">exists</span>' : '';
    return `
    <article class="activity-row${conflictClass}"${conflictAttr}>
      <div class="activity-id-wrap">
        <code>${displayId(item)}</code>
        ${conflictBadge}
        <button class="activity-copy" type="button" aria-label="Copy Campaign ID" title="Copy Campaign ID" data-id="${displayId(item)}">
          <i class="fa-regular fa-copy" aria-hidden="true"></i>
        </button>
      </div>
      <div class="activity-meta">
        ${actionLabel(item)} on ${escapeHtml(formatActivityDate(item.generated_at))} by ${escapeHtml(item.generated_by || 'Unknown')}
      </div>
    </article>`;
  }).join('');

  list.querySelectorAll('.activity-copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        await navigator.clipboard.writeText(id);
        const icon = btn.querySelector('i');
        const original = icon?.className;
        if (icon) {
          icon.className = 'fa-solid fa-check';
          setTimeout(() => { icon.className = original; }, 1200);
        }
      } catch (err) {
        console.warn('Copy failed', err);
      }
    });
  });
}

function updateGenerateButton() {
  const button = document.getElementById('generate-campaign');
  if (!button) return;
  button.disabled = generating;
  button.innerHTML = generating
    ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Generating...'
    : '<i class="fa-solid fa-plus" aria-hidden="true"></i> Generate Campaign ID';
}

function updateEditButton() {
  const button = document.getElementById('edit-last-campaign');
  if (button) button.disabled = generating;

  const stepBack = document.getElementById('step-back-campaign');
  if (stepBack) stepBack.disabled = generating || currentCampaignId <= 0;
}

let unsubscribeCounter = null;
let unsubscribeActivity = null;

async function refreshDashboard() {
  try {
    const [counterValue, activity] = await Promise.all([
      campaignRegistryService.loadCounter(),
      campaignRegistryService.loadRecentActivity()
    ]);
    currentCampaignId = Number(counterValue) || 0;
    const idEl = document.getElementById('counter-last-id');
    idEl.textContent = formatId(currentCampaignId);

    const scans = await campaignRegistryService.loadFolderScans();
    scannedFolderIds.clear();
    scans.forEach(row => {
      const id = row.campaign_id;
      if (!scannedFolderIds.has(id)) scannedFolderIds.set(id, []);
      scannedFolderIds.get(id).push({ name: row.campaign_name, date: row.folder_date, manager: row.manager });
    });
    renderFolderList();
    const lastFolder = campaignRegistryService.load().lastFolderName;
    if (lastFolder) {
      document.getElementById('pick-folder')?.classList.add('is-loaded');
      const label = document.getElementById('folder-btn-label');
      if (label) label.textContent = lastFolder;
    }

    updateConflictState();
    updateEditButton();
    renderActivity(activity);
    connected = true;
    setConnectionStatus(true);
    updateGenerateButton();
    setMessage('Campaign Counter data is saved locally.');
  } catch (error) {
    connected = false;
    currentCampaignId = 0;
    setConnectionStatus(false);
    updateGenerateButton();
    updateEditButton();
    renderActivity([]);
    setMessage('Unable to load local Campaign Counter data.', 'error');
  }
}

function openWelcomeDialog() {
  if (username) return;
  const dialog = document.getElementById('welcome-dialog');
  if (!dialog) return;
  dialog.showModal();
  dialog.querySelector('#username-input')?.focus();
}

function bindWelcomeDialog() {
  const dialog = document.getElementById('welcome-dialog');
  const form = document.getElementById('welcome-form');
  if (!dialog || !form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('username-input');
    const value = input.value.trim().replace(/\s+/g, ' ');
    if (!value) {
      input.setCustomValidity('Please enter your name.');
      input.reportValidity();
      return;
    }
    username = value;
    if (document.getElementById('remember-username').checked) localStorage.setItem('edm_username', username);
    dialog.close();
    updateGenerateButton();
    updateEditButton();
    setMessage('Ready to generate Campaign IDs.');
  });
}

function openManualDialog() {
  if (generating) return;
  const dialog = document.getElementById('manual-dialog');
  if (!dialog) return;
  document.getElementById('manual-current-id').textContent = formatId(currentCampaignId);
  const input = document.getElementById('manual-next-id');
  const reason = document.getElementById('manual-reason');
  const error = document.getElementById('manual-error');
  input.value = String(currentCampaignId + 1).padStart(4, '0');
  reason.value = '';
  error.textContent = '';
  dialog.showModal();
  input.focus();
  input.select();
}

function bindManualDialog() {
  const dialog = document.getElementById('manual-dialog');
  const form = document.getElementById('manual-form');
  if (!dialog || !form) return;
  document.getElementById('manual-cancel')?.addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (generating) return;
    const input = document.getElementById('manual-next-id');
    const error = document.getElementById('manual-error');
    const nextId = Number.parseInt(input.value.trim(), 10);
    if (!/^\d{1,4}$/.test(input.value.trim()) || !Number.isInteger(nextId)) {
      error.textContent = 'Enter a Campaign ID from 0001 to 9999.';
      input.focus();
      return;
    }
    generating = true;
    updateGenerateButton();
    updateEditButton();
    document.getElementById('manual-save').disabled = true;
try {
    const result = await campaignRegistryService.setNextCampaignId(
      nextId,
      username,
      document.getElementById('manual-reason').value.trim()
    );
    if (!result || !Number.isInteger(Number(result.campaign_id))) throw new Error('EMPTY_RESULT');
    dialog.close();
    currentCampaignId = Number(result.campaign_id) || 0;
    const idEl = document.getElementById('counter-last-id');
    idEl.textContent = formatId(currentCampaignId);
    updateConflictState();
    updateEditButton();
    setMessage(`${formatId(currentCampaignId)} manually set.`, 'success');
    // Refresh activity without changing the locally stored counter.
    const activity = await campaignRegistryService.loadRecentActivity();
    renderActivity(activity);
  } catch (serviceError) {
    error.textContent = getManualSetErrorMessage(serviceError, nextId);
  } finally {
    generating = false;
    document.getElementById('manual-save').disabled = false;
      updateGenerateButton();
      updateEditButton();
    }
  });
}

async function stepBackCampaign() {
  if (generating || currentCampaignId <= 0) return;
  generating = true;
  updateGenerateButton();
  updateEditButton();
  setMessage(`Setting Campaign ID to ${formatId(currentCampaignId - 1)}...`);
  try {
    const result = await campaignRegistryService.backCampaign(username);
    if (!result || !Number.isInteger(Number(result.campaign_id))) throw new Error('EMPTY_RESULT');
    currentCampaignId = Number(result.campaign_id) || 0;
    document.getElementById('counter-last-id').textContent = formatId(currentCampaignId);
    updateConflictState();
    updateEditButton();
    setMessage(`${formatId(currentCampaignId)} set.`, 'success');
  } catch (error) {
    setMessage('Unable to step back Campaign ID. Please try again.', 'error');
  } finally {
    generating = false;
    updateGenerateButton();
    updateEditButton();
  }
}

async function generateCampaign() {
  if (generating) return;
  const dateInput = document.getElementById('campaign-date-input');
  const nameInput = document.getElementById('campaign-name-input');
  const dateStamp = dateInput ? dateInput.value.trim() : '';
  const campaignName = nameInput ? nameInput.value : '';
  generating = true;
  clearConflicts();
  updateGenerateButton();
  setMessage('Generating Campaign ID...');
  try {
    const result = await campaignRegistryService.generateCampaign(username, dateStamp, campaignName);
    if (!result?.campaign_id) throw new Error('EMPTY_RESULT');
    currentCampaignId = Number(result.campaign_id) || 0;
    const newId = formatId(currentCampaignId);
    const copiedId = buildCopiedId(currentCampaignId, campaignName, dateStamp);
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copiedId);
        copied = true;
      }
    } catch (copyError) {
      console.warn('Campaign ID copy failed:', copyError);
    }
    document.getElementById('counter-last-id').textContent = newId;
    renderActivity(await campaignRegistryService.loadRecentActivity());
    updateConflictState();
    updateEditButton();
    if (scannedFolderIds.has(newId)) {
      markConflict(newId);
      setMessage(`${newId} generated${copied ? ' and copied' : ''} — conflict: folder already exists.`, 'error');
    } else {
      setMessage(`${copiedId} generated${copied ? ' and copied' : ''}.`, 'success');
    }
  } catch (error) {
    setMessage('Unable to generate a Campaign ID. Please try again.', 'error');
  } finally {
    generating = false;
    updateGenerateButton();
    updateEditButton();
  }
}

function exportBackup() {
  const payload = { ...campaignRegistryService.exportData(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `campaign-counter-backup-${formatDatestamp(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setMessage('Local backup exported as JSON.', 'success');
}

async function importBackup(file) {
  if (!file || file.size > 5 * 1024 * 1024) {
    setMessage('Backup file must be a JSON file smaller than 5 MB.', 'error');
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    if (!payload || payload.version !== campaignRegistryService.VERSION || !Array.isArray(payload.activity) || !Array.isArray(payload.folderScans)) {
      throw new Error('Invalid or unsupported backup file.');
    }
    const mode = confirm('Replace current local data? Choose Cancel to merge the backup instead.') ? 'replace' : 'merge';
    campaignRegistryService.importData(payload, mode);
    await refreshDashboard();
    setMessage(`Backup imported using ${mode} mode.`, 'success');
  } catch (error) {
    setMessage(error.message || 'Unable to import the JSON backup.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const dateInput = document.getElementById('campaign-date-input');
  const nameInput = document.getElementById('campaign-name-input');
  if (dateInput && !dateInput.value) dateInput.value = formatDatestamp(new Date());
  nameInput?.addEventListener('input', () => { nameInput.value = nameInput.value.replace(/\s/g, ''); });
  document.getElementById('pick-folder')?.addEventListener('click', scanFolder);
  document.getElementById('reset-folder')?.addEventListener('click', resetFolderScans);
  document.getElementById('refresh-folder')?.addEventListener('click', refreshFolderScans);
  document.getElementById('export-backup')?.addEventListener('click', exportBackup);
  document.getElementById('import-backup')?.addEventListener('click', () => document.getElementById('import-backup-input')?.click());
  document.getElementById('import-backup-input')?.addEventListener('change', event => {
    importBackup(event.target.files?.[0]);
    event.target.value = '';
  });

  bindWelcomeDialog();
  bindManualDialog();
  document.getElementById('generate-campaign')?.addEventListener('click', generateCampaign);
  document.getElementById('step-back-campaign')?.addEventListener('click', stepBackCampaign);
  document.getElementById('edit-last-campaign')?.addEventListener('click', openManualDialog);
  openWelcomeDialog();
  await refreshDashboard();
});
