(function () {
  'use strict';

  if (new URLSearchParams(window.location.search).get('embed') === '1') {
    document.body.classList.add('is-embedded');
  }

  const STORE_KEY = 'edm-helper-tnc-uploader-items-v1';
  const ACTIVITY_STORE_KEY = 'edm-helper-tnc-uploader-activity-v1';
  const MAX_ACTIVITY_ITEMS = 30;
  const DEFAULT_PUBLIC_BASE_URL = 'https://mail.dummy.example/id/emailblast';
  const DIRECT_LINK_CHECK_TIMEOUT_MS = 2500;
  const PROXY_LINK_CHECK_TIMEOUT_MS = 6500;
  const elements = {};
  const state = {
    items: [],
    directoryHandle: null,
    mode: 'normal',
    replaceInfo: null,
    baseUrl: DEFAULT_PUBLIC_BASE_URL,
    editingItemId: null,
    activity: [],
  };

  function $(id) {
    return document.getElementById(id);
  }

  function initElements() {
    [
      'supportBadge',
      'yearInput',
      'marketInput',
      'prefixInput',
      'destinationSummary',
      'targetPath',
      'normalModeBtn',
      'replaceModeBtn',
      'replaceFields',
      'replaceLinkInput',
      'replaceSummary',
      'chooseFolderBtn',
      'dropZone',
      'dropTitle',
      'dropHint',
      'droppedList',
      'fileInput',
      'clearBtn',
      'saveBtn',
      'statusText',
      'copyAllLinksBtn',
      'checkAllBtn',
      'clearHistoryBtn',
      'fileCount',
      'fileList',
      'clearActivityBtn',
      'activityList',
    ].forEach((id) => {
      elements[id] = $(id);
    });
  }

  function supportsDirectoryWrite() {
    return typeof window.showDirectoryPicker === 'function';
  }

  function normalizeSegment(value, fallback) {
    const clean = String(value || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return clean || fallback;
  }

  function stripPdfExtension(name) {
    return name.replace(/\.pdf$/i, '');
  }

  function sanitizePdfName(name, prefix = '') {
    const base = stripPdfExtension(name)
      .replace(/\s+-\s+/g, '-')
      .replace(/\s*\((?:copy|\d+)\)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/-+/g, '-')
      .replace(/^[_-]+|[_-]+$/g, '');
    const safeBase = base || 'tnc';
    const cleanPrefix = normalizeSegment(prefix, '').replace(/-/g, '_');
    const withPrefix = cleanPrefix && !safeBase.toLowerCase().startsWith(`${cleanPrefix.toLowerCase()}_`)
      ? `${cleanPrefix}_${safeBase}`
      : safeBase;
    return `${withPrefix}.pdf`;
  }

  function sanitizeExistingPdfName(name) {
    const cleanName = String(name || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/^[-\s]+|[-\s]+$/g, '');
    return /\.pdf$/i.test(cleanName) ? cleanName : `${cleanName || 'tnc'}.pdf`;
  }

  function formatBytes(size) {
    if (!Number.isFinite(size)) return 'Unknown size';
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getTodayParts() {
    const now = new Date();
    return {
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      day: String(now.getDate()).padStart(2, '0'),
    };
  }

  function getTodayPrefix() {
    const today = getTodayParts();
    return `TC${today.month}${today.day}`;
  }

  function getTargetParts() {
    if (state.mode === 'replace' && state.replaceInfo) {
      return [state.replaceInfo.market, state.replaceInfo.year, 'tnc'];
    }
    const year = normalizeSegment(elements.yearInput.value, String(new Date().getFullYear()));
    const market = normalizeSegment(elements.marketInput.value, 'MKT').toUpperCase();
    return [market, year, 'tnc'];
  }

  function getTargetPath() {
    return ['emailblast', ...getTargetParts()].join('/');
  }

  function getDirectoryParts() {
    return ['emailblast', ...getTargetParts()];
  }

  function getFolderPathForUrl() {
    return getTargetParts().join('/');
  }

  function getBaseUrl() {
    return String(state.baseUrl || DEFAULT_PUBLIC_BASE_URL)
      .trim()
      .replace(/\/+$/g, '');
  }

  function buildPublicUrl(fileName) {
    const pathParts = [getFolderPathForUrl(), fileName]
      .join('/')
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `${getBaseUrl()}/${pathParts}`;
  }

  function parseReplaceLink(value) {
    const source = String(value || '').trim();
    if (!source) return null;

    try {
      const parsed = new URL(source);
      const segments = parsed.pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));
      const emailblastIndex = segments.findIndex((segment) => segment.toLowerCase() === 'emailblast');
      const baseIndex = emailblastIndex >= 0 ? emailblastIndex : segments.length - 5;
      const market = segments[baseIndex + 1];
      const year = segments[baseIndex + 2];
      const folder = segments[baseIndex + 3];
      const fileName = segments[baseIndex + 4];

      if (!market || !year || !folder || !fileName || !/\.pdf$/i.test(fileName)) {
        throw new Error('Missing PDF path parts');
      }

      if (!/^\d{4}$/.test(year) || folder.toLowerCase() !== 'tnc') {
        throw new Error('Expected /MARKET/YYYY/tnc/file.pdf');
      }

      const basePath = emailblastIndex >= 0
        ? `/${segments.slice(0, emailblastIndex + 1).map(encodeURIComponent).join('/')}`
        : parsed.pathname.replace(/\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/i, '');

      return {
        baseUrl: `${parsed.origin}${basePath}`.replace(/\/+$/g, ''),
        market: normalizeSegment(market, 'MKT').toUpperCase(),
        year,
        fileName: sanitizeExistingPdfName(fileName),
        url: source,
      };
    } catch (error) {
      console.warn('Unable to parse replacement PDF link.', error);
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setStatus(message, type = '') {
    elements.statusText.textContent = message;
  }

  function setStatusHtml(html, type = '') {
    elements.statusText.innerHTML = html;
  }

  function getDirectToolUrl() {
    const basePath = window.location.pathname.replace(/\/tools\/tnc-uploader\.html$/i, '');
    return `${window.location.origin}${basePath}/tools/tnc-uploader.html`;
  }

  function createItemId(fileName, targetName) {
    return `${getTargetPath()}/${targetName || fileName}`.toLowerCase();
  }

  function findHistoricalTarget(targetName) {
    if (state.mode === 'replace') return null;
    return state.items.find((item) => !item.file
      && item.targetPath === getTargetPath()
      && item.targetName.toLowerCase() === targetName.toLowerCase());
  }

  function serializeItem(item) {
    const {
      id,
      originalName,
      targetName,
      targetPath,
      url,
      size,
      lastModified,
      status,
      httpStatus,
      verifiedVia,
      checkedAt,
      savedAt,
      downloadedAt,
      linkName,
    } = item;
    return {
      id,
      originalName,
      targetName,
      targetPath,
      url,
      size,
      lastModified,
      status,
      httpStatus,
      verifiedVia,
      checkedAt,
      savedAt,
      downloadedAt,
      linkName,
    };
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state.items.map(serializeItem)));
    } catch (error) {
      console.warn('Unable to persist TNC uploader history.', error);
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      state.items = parsed.map((item) => ({
        ...item,
        file: null,
        status: item.status || 'history',
      }));
    } catch (error) {
      console.warn('Unable to load TNC uploader history.', error);
    }
  }

  function saveActivity() {
    try {
      localStorage.setItem(ACTIVITY_STORE_KEY, JSON.stringify(state.activity));
    } catch (error) {
      console.warn('Unable to persist TNC uploader activity.', error);
    }
  }

  function loadActivity() {
    try {
      const raw = localStorage.getItem(ACTIVITY_STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      state.activity = Array.isArray(parsed) ? parsed.slice(0, MAX_ACTIVITY_ITEMS) : [];
    } catch (error) {
      console.warn('Unable to load TNC uploader activity.', error);
      state.activity = [];
    }
  }

  function addActivity(action, detail = '') {
    state.activity.unshift({ action, detail, at: new Date().toISOString() });
    state.activity = state.activity.slice(0, MAX_ACTIVITY_ITEMS);
    saveActivity();
    renderActivity();
  }

  function summarizeFileNames(files) {
    const names = files.map((file) => file.name).filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  }

  function getActivityTone(action) {
    const value = String(action || '').toLowerCase();
    if (value.includes('removed') || value.includes('cleared') || value.includes('failed')) return 'is-danger';
    if (value.includes('saved') || value.includes('selected') || value.includes('copied')) return 'is-success';
    if (value.includes('checked')) return 'is-info';
    return 'is-accent';
  }

  function renderActivity() {
    if (!state.activity.length) {
      elements.activityList.innerHTML = '<li class="tnc-activity-empty">No activity recorded yet.</li>';
      return;
    }
    const activityItems = state.activity.map((entry, index) => `
      <li class="tnc-activity-item ${getActivityTone(entry.action)}">
        <div class="tnc-activity-item-head">
          <div class="tnc-activity-item-label">
            ${index === 0 ? '<span class="tnc-new-badge">New</span>' : ''}
            <strong>${escapeHtml(entry.action)}</strong>
          </div>
          <time datetime="${escapeHtml(entry.at)}">${escapeHtml(formatTime(entry.at))}</time>
        </div>
        ${entry.detail ? `<span title="${escapeHtml(entry.detail)}">${escapeHtml(entry.detail)}</span>` : ''}
      </li>
    `).join('');
    elements.activityList.innerHTML = activityItems;
  }

  function isPdf(file) {
    return file
      && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
  }

  function getPdfExtension(name) {
    const match = String(name || '').match(/(\.[^.]+)$/);
    return match ? match[1] : '.pdf';
  }

  function getDefaultLinkName(fileName) {
    return stripPdfExtension(fileName)
      .replace(/\s+-\s+/g, '-')
      .replace(/\s*\((?:copy|\d+)\)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeLinkName(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getLinkNameError(value) {
    const clean = normalizeLinkName(value);
    if (!clean) return 'Link name is required.';
    if (/[<>:"/\\|?*]/.test(clean)) return 'Link name contains invalid filename characters.';
    if (/\.[a-z0-9]{1,8}$/i.test(clean)) return 'Do not include a file extension.';
    return '';
  }

  function buildNewUploadTargetName(item) {
    const rawName = normalizeLinkName(item.linkName || getDefaultLinkName(item.originalName || item.targetName));
    const error = getLinkNameError(rawName);
    const safeName = error ? getDefaultLinkName(item.originalName || item.targetName) || 'tnc' : rawName;
    return sanitizePdfName(`${safeName}.pdf`, elements.prefixInput.value.trim());
  }

  function createItemFromFile(file) {
    const linkName = state.mode === 'replace' ? '' : getDefaultLinkName(file.name);
    const targetName = state.mode === 'replace' && state.replaceInfo
      ? state.replaceInfo.fileName
      : sanitizePdfName(`${linkName || stripPdfExtension(file.name)}.pdf`, elements.prefixInput.value.trim());
    return {
      id: createItemId(file.name, targetName),
      file,
      originalName: file.name,
      linkName,
      targetName,
      targetPath: getTargetPath(),
      url: buildPublicUrl(targetName),
      size: file.size,
      lastModified: file.lastModified,
      status: 'queued',
      httpStatus: '',
      verifiedVia: '',
      checkedAt: '',
      savedAt: '',
      downloadedAt: '',
    };
  }

  function refreshItemTargets({ keepStatus = true } = {}) {
    state.items = state.items.map((item) => {
      if (!item.file) return item;

      const targetName = state.mode === 'replace' && state.replaceInfo
        ? state.replaceInfo.fileName
        : buildNewUploadTargetName(item);
      return {
        ...item,
        id: createItemId(item.originalName || targetName, targetName),
        targetName,
        targetPath: getTargetPath(),
        url: buildPublicUrl(targetName),
        status: keepStatus ? item.status : 'queued',
        httpStatus: keepStatus ? item.httpStatus : '',
        verifiedVia: keepStatus ? item.verifiedVia : '',
        checkedAt: keepStatus ? item.checkedAt : '',
      };
    });
    saveHistory();
  }

  function hasInvalidQueuedNames() {
    if (state.mode === 'replace') return false;
    return getFileBackedItems().some((item) => getLinkNameError(item.linkName || getDefaultLinkName(item.originalName)));
  }

  function addFiles(fileList) {
    if (state.mode === 'replace' && !state.replaceInfo) {
      setStatus('Paste a valid old PDF link before dropping the replacement file.', 'error');
      return;
    }

    let incoming = Array.from(fileList || []).filter(isPdf);
    let trimmedForReplace = false;
    if (state.mode === 'replace' && incoming.length > 1) {
      incoming = incoming.slice(0, 1);
      trimmedForReplace = true;
    }
    if (state.mode === 'replace' && incoming.length) {
      state.items = state.items.filter((item) => !item.file);
    }
    incoming.forEach((file) => {
      const item = createItemFromFile(file);
      const existingIndex = state.items.findIndex((current) => current.id === item.id);
      if (existingIndex >= 0) {
        state.items[existingIndex] = {
          ...state.items[existingIndex],
          ...item,
        };
      } else {
        state.items.unshift(item);
      }
    });

    const duplicate = incoming
      .map((file) => createItemFromFile(file))
      .map((item) => findHistoricalTarget(item.targetName))
      .find(Boolean);

    if (!incoming.length) {
      setStatus('No PDF found. Drop or choose .pdf files only.', 'error');
    } else if (trimmedForReplace) {
      setStatus('Replace mode uses one PDF at a time. Added the first PDF and cleared the active queue.', 'error');
    } else if (state.mode === 'replace') {
      setStatus('Replacement PDF added. Active queue is limited to this one file.', 'success');
    } else if (duplicate) {
      setStatus(`${duplicate.targetName} sudah pernah disimpan di folder tujuan ini. Pilih nama lain atau gunakan Replace PDF link.`, 'error');
    } else {
      setStatus(`${incoming.length} PDF file(s) added.`, 'success');
    }

    saveHistory();
    addActivity('Files added', `${incoming.length} PDF${incoming.length === 1 ? '' : 's'} queued: ${summarizeFileNames(incoming)}`);
    renderItems();
  }

  function renderDroppedList() {
    const droppedItems = getFileBackedItems();
    if (!droppedItems.length) {
      elements.droppedList.innerHTML = '<span>No dropped PDFs yet.</span>';
      return;
    }

    elements.droppedList.innerHTML = `
      <strong>${droppedItems.length} dropped PDF${droppedItems.length === 1 ? '' : 's'}</strong>
      <ul>
        ${droppedItems.map((item) => `
          <li title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName)}</li>
        `).join('')}
      </ul>
    `;
  }

  function getFileBackedItems() {
    return state.items.filter((item) => item.file);
  }

  function getLinkItems() {
    return state.items.filter((item) => item.url);
  }

  function updateButtons() {
    const fileBackedCount = getFileBackedItems().length;
    const linkCount = getLinkItems().length;
    const fileCountLabel = `${state.items.length} PDF${state.items.length === 1 ? '' : 's'}`;
    elements.fileCount.textContent = fileCountLabel;
    const hasInvalidNames = hasInvalidQueuedNames();
    elements.saveBtn.disabled = !fileBackedCount || !state.directoryHandle || hasInvalidNames;
    elements.copyAllLinksBtn.disabled = !linkCount;
    elements.checkAllBtn.disabled = !linkCount;
  }

  function getStatusLabel(item) {
    const labels = {
      queued: 'Queued',
      saved: 'Saved',
      downloaded: 'Downloaded',
      live: 'Live',
      checking: 'Checking',
      not_found: 'Not found',
      cannot_verify: 'Cannot verify',
      error: 'Error',
      history: 'History',
    };
    return labels[item.status] || 'Queued';
  }

  function getStatusClass(item) {
    if (item.status === 'saved' || item.status === 'live') return 'is-live';
    if (item.status === 'checking') return 'is-checking';
    if (item.status === 'not_found') return 'is-not-found';
    if (item.status === 'error' || item.status === 'cannot_verify') return 'is-error';
    return '';
  }

  function getItemNote(item) {
    if (item.status === 'live' && item.httpStatus) return `HTTP ${item.httpStatus} · checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'not_found') return `HTTP 404 · checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'cannot_verify') return `Browser could not verify · checked ${formatTime(item.checkedAt)}`;
    if (item.savedAt) return `Saved ${formatTime(item.savedAt)}`;
    if (item.downloadedAt) return `Downloaded ${formatTime(item.downloadedAt)}`;
    if (!item.file) return 'Stored history only. Drop the PDF again to save.';
    return 'Ready to save.';
  }

  function getItemNoteDisplay(item) {
    const via = item.verifiedVia ? ` via ${item.verifiedVia}` : '';
    if (item.status === 'live' && item.httpStatus) return `HTTP ${item.httpStatus}${via} - checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'not_found') return `HTTP 404${via} - checked ${formatTime(item.checkedAt)}`;
    if (item.status === 'cannot_verify') return `Could not verify automatically - checked ${formatTime(item.checkedAt)}`;
    return getItemNote(item);
  }

  function renderItems() {
    updateButtons();
    renderDroppedList();

    if (!state.items.length) {
      elements.fileList.innerHTML = `
        <div class="tnc-empty">
          <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
            <p>No PDF selected or saved yet.</p>
        </div>
      `;
      return;
    }

    // Keep active uploads visible first; saved history remains below the current queue.
    const displayItems = [...state.items].sort((left, right) => Number(Boolean(right.file)) - Number(Boolean(left.file)));
    elements.fileList.innerHTML = displayItems.map((item) => {
      const isRenameable = Boolean(item.file) && state.mode !== 'replace';
      const isEditing = isRenameable && state.editingItemId === item.id;
      const linkName = normalizeLinkName(item.linkName || getDefaultLinkName(item.originalName));
      const linkNameError = isRenameable ? getLinkNameError(linkName) : '';
      const extension = getPdfExtension(item.originalName);
      return `
      <article class="tnc-file-item ${linkNameError ? 'has-name-error' : ''}" data-item-id="${escapeHtml(item.id)}">
        <div class="tnc-file-details">
          <div class="tnc-file-row">
            <span>Original file</span>
            <strong class="tnc-file-name" title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName)}</strong>
          </div>
          ${isRenameable ? `
            <div class="tnc-file-row">
              <span>Final filename</span>
              <code class="tnc-file-target ${linkNameError ? 'is-invalid' : ''}" title="${escapeHtml(linkNameError || item.targetName)}">${escapeHtml(linkNameError || item.targetName)}</code>
            </div>
            <button class="tnc-edit-hint" type="button" data-action="rename-start" data-id="${escapeHtml(item.id)}">Double-click this item to rename before saving.</button>
            <div class="tnc-rename-grid ${isEditing ? 'is-open' : ''}">
              <label class="tnc-link-name-field">
                <span>Link name</span>
                <input type="text" value="${escapeHtml(linkName)}" data-action="rename" data-id="${escapeHtml(item.id)}" aria-invalid="${linkNameError ? 'true' : 'false'}">
              </label>
              <div class="tnc-extension-field">
                <span>Extension</span>
                <strong>${escapeHtml(extension)}</strong>
              </div>
            </div>
          ` : `
          <div class="tnc-file-row">
            <span>Current file</span>
            <code class="tnc-file-target" title="${escapeHtml(`${item.targetPath}/${item.targetName}`)}">${escapeHtml(item.targetName)}</code>
          </div>
          `}
          <div class="tnc-file-row">
            <span>Public link</span>
            <code class="tnc-file-link" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</code>
          </div>
        </div>
        <div class="tnc-file-bottom">
          <div class="tnc-file-meta">
            <span>${escapeHtml(formatBytes(item.size))}</span>
            <span class="tnc-status-badge ${getStatusClass(item)}">${escapeHtml(getStatusLabel(item))}</span>
            <span>${escapeHtml(getItemNoteDisplay(item))}</span>
          </div>
          <div class="tnc-file-actions">
            <button class="tnc-file-action" type="button" data-action="copy" data-id="${escapeHtml(item.id)}">Copy link</button>
            <button class="tnc-file-action" type="button" data-action="open" data-id="${escapeHtml(item.id)}">Open</button>
            <button class="tnc-file-action" type="button" data-action="check" data-id="${escapeHtml(item.id)}">Check</button>
            <button class="tnc-remove" type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.originalName)}">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    `;
    }).join('');
  }

  function renderDestination() {
    const rootName = state.directoryHandle?.name;
    const targetPath = getTargetPath();
    elements.targetPath.textContent = rootName ? `${rootName}/${targetPath}` : `/${targetPath}`;
    elements.destinationSummary.classList.toggle('is-selected', Boolean(rootName));
    elements.destinationSummary.querySelector('strong').textContent = rootName
      ? `Selected: ${rootName}`
      : 'No destination folder selected';
  }

  function findItem(id) {
    return state.items.find((item) => item.id === id);
  }

  function removeItem(id) {
    const item = findItem(id);
    state.items = state.items.filter((item) => item.id !== id);
    if (state.editingItemId === id) state.editingItemId = null;
    saveHistory();
    renderItems();
    addActivity('Item removed', item ? `${item.originalName} (${item.targetName})` : 'PDF item removed.');
    setStatus(state.items.length ? 'Item removed.' : 'Queue cleared.');
  }

  function startRenameItem(id) {
    const item = findItem(id);
    if (state.mode === 'replace' || !item?.file) return;
    state.editingItemId = id;
    renderItems();
    window.setTimeout(() => {
      const input = elements.fileList.querySelector(`[data-action="rename"][data-id="${CSS.escape(id)}"]`);
      input?.focus();
      input?.select();
    }, 0);
  }

  function renameQueuedItem(id, value) {
    if (state.mode === 'replace') return;
    const item = findItem(id);
    if (!item?.file) return;

    item.linkName = normalizeLinkName(value);
    const error = getLinkNameError(item.linkName);
    if (!error) {
      item.targetName = buildNewUploadTargetName(item);
      item.targetPath = getTargetPath();
      item.url = buildPublicUrl(item.targetName);
      item.status = 'queued';
      item.httpStatus = '';
      item.verifiedVia = '';
      item.checkedAt = '';
      addActivity('Filename updated', `${item.originalName} -> ${item.targetName}`);
      setStatus('Final filename updated.', 'success');
    } else {
      setStatus(error, 'error');
    }
    saveHistory();
    updateButtons();

    const row = elements.fileList.querySelector(`[data-item-id="${CSS.escape(id)}"]`);
    if (!row) return;
    row.classList.toggle('has-name-error', Boolean(error));
    const finalName = row.querySelector('.tnc-file-target');
    if (finalName) {
      finalName.textContent = error || item.targetName;
      finalName.title = error || item.targetName;
      finalName.classList.toggle('is-invalid', Boolean(error));
    }
    const publicLink = row.querySelector('.tnc-file-link');
    if (publicLink && !error) {
      publicLink.textContent = item.url;
      publicLink.title = item.url;
    }
  }

  async function findExistingTarget(targetDir, items) {
    if (state.mode === 'replace') return null;
    for (const item of items) {
      try {
        await targetDir.getFileHandle(item.targetName, { create: false });
        return item;
      } catch (error) {
        if (error?.name !== 'NotFoundError') throw error;
      }
    }
    return null;
  }

  async function chooseFolder() {
    if (!supportsDirectoryWrite()) {
      setStatusHtml(`Folder picker is blocked here. <a href="${escapeHtml(getDirectToolUrl())}" target="_blank" rel="noopener noreferrer">Open TNC Uploader in a new tab</a>, then pick folder again.`, 'error');
      return;
    }

    try {
      state.directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      renderItems();
      renderDestination();
      addActivity('Folder selected', `${state.directoryHandle.name}/${getTargetPath()}`);
      setStatus(`Destination folder selected: ${state.directoryHandle.name}.`, 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        setStatusHtml(`Unable to open folder picker here. <a href="${escapeHtml(getDirectToolUrl())}" target="_blank" rel="noopener noreferrer">Open TNC Uploader in a new tab</a>, then pick folder again.`, 'error');
      }
    }
  }

  async function ensureDirectory(rootHandle, parts) {
    let current = rootHandle;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
    return current;
  }

  async function saveFiles() {
    const fileBackedItems = getFileBackedItems();
    if (!state.directoryHandle) {
      setStatus('Pick a destination folder first.', 'error');
      return;
    }

    if (!fileBackedItems.length) {
      setStatus('Drop PDF files again before saving. History rows only keep metadata.', 'error');
      return;
    }

    if (hasInvalidQueuedNames()) {
      setStatus('Fix invalid Link Name fields before saving.', 'error');
      return;
    }

    elements.saveBtn.disabled = true;
    setStatus('Saving PDF files...');

    try {
      const targetDir = await ensureDirectory(state.directoryHandle, getDirectoryParts());
      const existingItem = await findExistingTarget(targetDir, fileBackedItems);
      if (existingItem) {
        setStatus(`${existingItem.targetName} already exists. Choose another Link Name or switch to Replace PDF link.`, 'error');
        return;
      }
      const now = new Date().toISOString();
      for (const item of fileBackedItems) {
        const fileHandle = await targetDir.getFileHandle(item.targetName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(item.file);
        await writable.close();
        item.status = 'saved';
        item.savedAt = now;
        item.file = null;
      }
      elements.fileInput.value = '';
      saveHistory();
      renderItems();
      addActivity('PDFs saved', `${fileBackedItems.length} PDF${fileBackedItems.length === 1 ? '' : 's'} saved to ${state.directoryHandle.name}/${getTargetPath()}`);
      setStatus(`${fileBackedItems.length} PDF file(s) saved. Queue cleared; saved links remain in history.`, 'success');
    } catch (error) {
      console.error(error);
      setStatus('Save failed. Check folder permission and try again.', 'error');
    } finally {
      renderItems();
    }
  }

  function clearQueue() {
    state.items = state.items.filter((item) => !item.file);
    elements.fileInput.value = '';
    saveHistory();
    renderItems();
    addActivity('Queue cleared', 'Active dropped files cleared.');
    setStatus(state.items.length ? 'Current file queue cleared. History remains.' : 'Queue cleared.');
  }

  function clearHistory() {
    state.items = [];
    elements.fileInput.value = '';
    saveHistory();
    renderItems();
    addActivity('File history cleared', 'Saved file records were removed.');
    setStatus('TNC uploader history cleared.');
  }

  window.getTncUploaderState = function () {
    return {
      hasQueuedFiles: state.items.some((item) => Boolean(item.file)),
      hasUploadedFiles: state.items.some((item) => item.status === 'saved' || Boolean(item.savedAt)),
    };
  };

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      addActivity('Link copied', text.split('\n').length > 1 ? `${text.split('\n').length} public links copied.` : 'Public link copied.');
      setStatus('Link copied.', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Unable to copy link. Select and copy it manually.', 'error');
    }
  }

  function copyAllLinks() {
    const links = getLinkItems().map((item) => item.url).join('\n');
    if (!links) return;
    copyText(links);
  }

  function openItemLink(id) {
    const item = findItem(id);
    if (!item?.url) return;
    window.open(item.url, '_blank', 'noopener,noreferrer');
  }

  function createTimeoutSignal(timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return { controller, timeoutId };
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = PROXY_LINK_CHECK_TIMEOUT_MS) {
    const { controller, timeoutId } = createTimeoutSignal(timeoutMs);
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: options.cache || 'no-store',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function getProxyAttempts(url) {
    return [];
  }

  async function verifyProxyAttempt(attempt) {
    const response = await fetchWithTimeout(attempt.url, { method: 'GET' });
    if (!response.ok && response.status !== 404) {
      throw new Error(`${attempt.via} returned HTTP ${response.status}`);
    }

    if (attempt.json) {
      const data = await response.json();
      const contents = String(data?.contents || '');
      if (response.ok && contents) {
        return { ok: true, status: response.status, via: attempt.via };
      }
      throw new Error(`${attempt.via} returned an empty response`);
    }

    return {
      ok: response.ok,
      status: response.status,
      via: attempt.via,
    };
  }

  async function verifyLink(url) {
    return {
      ok: false,
      status: '',
      via: '',
      cannotVerify: true,
      disabled: true,
    };
    /*
    if (window.EDM_PRIVACY?.get?.('externalChecks') === false) {
      return {
        ok: false,
        status: '',
        via: '',
        cannotVerify: true,
        disabled: true,
      };
    }

    try {
      const response = await fetchWithTimeout(url, {
        method: 'HEAD',
        cache: 'no-store',
      }, DIRECT_LINK_CHECK_TIMEOUT_MS);

      if (response.ok || response.status === 404) {
        return {
          ok: response.ok,
          status: response.status,
          via: 'Direct',
        };
      }
    } catch (error) {
      console.warn('Direct HEAD check failed.', error);
    }

    if (window.EDM_PRIVACY?.get?.('proxyFallbacks') === false) {
      return {
        ok: false,
        status: '',
        via: '',
        cannotVerify: true,
      };
    }

    try {
      return await Promise.any(getProxyAttempts(url).map(verifyProxyAttempt));
    } catch (error) {
      console.warn('Proxy link checks failed.', error);
    }

    return {
      ok: false,
      status: '',
      via: '',
      cannotVerify: true,
    };
    */
  }

  async function checkItemLink(id) {
    const item = findItem(id);
    if (!item?.url) return;

    item.status = 'checking';
    item.httpStatus = '';
    item.verifiedVia = '';
    renderItems();

    const result = await verifyLink(item.url);
    item.httpStatus = result.status ? String(result.status) : '';
    item.verifiedVia = result.via || '';
    item.checkedAt = new Date().toISOString();

    if (result.ok) {
      item.status = 'live';
      const via = result.via && result.via !== 'Direct' ? ` via ${result.via}` : '';
      setStatus(`${item.targetName} is live${via}.`, 'success');
    } else if (result.status === 404) {
      item.status = 'not_found';
      setStatus(`${item.targetName} was not found online.`, 'error');
    } else if (result.cannotVerify) {
      item.status = 'cannot_verify';
      setStatus(result.disabled
        ? 'External URL checks are disabled in Documentation privacy settings.'
        : 'Automatic check was blocked. Use Open to verify manually.', 'error');
    } else {
      item.status = 'error';
      setStatus(`${item.targetName} returned HTTP ${result.status || 'unknown'}.`, 'error');
    }

    saveHistory();
    renderItems();
    const httpDetail = item.httpStatus ? `HTTP ${item.httpStatus}` : getStatusLabel(item);
    const checker = item.verifiedVia ? ` via ${item.verifiedVia}` : '';
    addActivity('Link checked', `${item.targetName}: ${httpDetail}${checker}`);
  }

  async function checkAllLinks() {
    const items = getLinkItems();
    for (const item of items) {
      await checkItemLink(item.id);
    }
  }

  function renderReplaceMode() {
    const isReplace = state.mode === 'replace';
    elements.normalModeBtn.classList.toggle('is-active', !isReplace);
    elements.replaceModeBtn.classList.toggle('is-active', isReplace);
    elements.normalModeBtn.setAttribute('aria-selected', String(!isReplace));
    elements.replaceModeBtn.setAttribute('aria-selected', String(isReplace));
    elements.replaceFields.hidden = !isReplace;
    elements.prefixInput.disabled = isReplace;
    elements.fileInput.multiple = !isReplace;
    elements.dropTitle.textContent = isReplace ? 'Drop replacement PDF here' : 'Drop PDF here';
    elements.dropHint.textContent = isReplace
      ? 'or click to choose one replacement PDF'
      : 'or click to choose one or more PDFs';
    elements.dropZone.setAttribute(
      'aria-label',
      isReplace ? 'Drop one replacement PDF or choose one file' : 'Drop PDF files or choose files'
    );

    if (!isReplace) {
      elements.replaceSummary.textContent = 'Paste an existing PDF link to reuse its folder and file name.';
      elements.replaceSummary.className = 'tnc-replace-summary';
      state.replaceInfo = null;
      state.baseUrl = DEFAULT_PUBLIC_BASE_URL;
    }
  }

  function applyReplaceLink() {
    if (state.mode !== 'replace') return;
    const info = parseReplaceLink(elements.replaceLinkInput.value);
    state.replaceInfo = info;

    if (!elements.replaceLinkInput.value.trim()) {
      elements.replaceSummary.textContent = 'Paste an existing PDF link to reuse its folder and file name.';
      elements.replaceSummary.className = 'tnc-replace-summary';
      updateTargetPath();
      return;
    }

    if (!info) {
      elements.replaceSummary.textContent = 'Invalid PDF link. Expected /emailblast/MKT/YYYY/tnc/file.pdf.';
      elements.replaceSummary.className = 'tnc-replace-summary is-error';
      updateTargetPath();
      return;
    }

    state.baseUrl = info.baseUrl;
    elements.marketInput.value = info.market;
    elements.yearInput.value = info.year;
    elements.replaceSummary.textContent = `Replace mode: ${info.market} / ${info.year} / tnc / ${info.fileName}`;
    elements.replaceSummary.className = 'tnc-replace-summary is-ready';
    updateTargetPath();
  }

  function setUploadMode(mode) {
    state.mode = mode === 'replace' ? 'replace' : 'normal';
    if (state.mode === 'replace' && getFileBackedItems().length) {
      state.items = state.items.filter((item) => !item.file);
      elements.fileInput.value = '';
      saveHistory();
      setStatus('Replace mode is one PDF at a time. Active dropped files were cleared; saved history remains.');
    }
    renderReplaceMode();
    if (state.mode === 'replace') {
      applyReplaceLink();
    } else {
      updateTargetPath();
    }
  }

  function updateTargetPath() {
    elements.targetPath.textContent = getTargetPath();
    refreshItemTargets();
    renderItems();
    renderDestination();
  }

  function updateSupportBadge() {
    if (supportsDirectoryWrite()) {
      elements.supportBadge.textContent = 'Folder write supported';
      elements.supportBadge.className = 'tnc-support-badge is-ready';
      return;
    }
    elements.supportBadge.textContent = 'Folder write unavailable';
    elements.supportBadge.className = 'tnc-support-badge is-limited';
    elements.chooseFolderBtn.disabled = true;
    elements.saveBtn.title = 'This browser cannot write directly to a folder.';
  }

  function bindEvents() {
    elements.yearInput.value = getTodayParts().year;
    elements.prefixInput.placeholder = `Example: ${getTodayPrefix()}`;
    ['input', 'change'].forEach((eventName) => {
      elements.yearInput.addEventListener(eventName, updateTargetPath);
      elements.marketInput.addEventListener(eventName, updateTargetPath);
      elements.prefixInput.addEventListener(eventName, updateTargetPath);
    });

    elements.chooseFolderBtn.addEventListener('click', chooseFolder);
    elements.clearBtn.addEventListener('click', clearQueue);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.clearActivityBtn.addEventListener('click', () => {
      state.activity = [];
      saveActivity();
      renderActivity();
      setStatus('Activity log cleared.');
    });
    elements.saveBtn.addEventListener('click', saveFiles);
    elements.copyAllLinksBtn.addEventListener('click', copyAllLinks);
    elements.checkAllBtn.addEventListener('click', checkAllLinks);
    elements.normalModeBtn.addEventListener('click', () => setUploadMode('normal'));
    elements.replaceModeBtn.addEventListener('click', () => setUploadMode('replace'));
    elements.replaceLinkInput.addEventListener('input', applyReplaceLink);

    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        elements.fileInput.click();
      }
    });

    elements.fileInput.addEventListener('change', (event) => addFiles(event.target.files));

    ['dragenter', 'dragover'].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.dropZone.classList.add('is-dragging');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.dropZone.classList.remove('is-dragging');
      });
    });

    elements.dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));

    elements.fileList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const id = button.dataset.id;
      const action = button.dataset.action;
      if (action === 'rename-start') startRenameItem(id);
      if (action === 'copy') copyText(findItem(id)?.url || '');
      if (action === 'open') openItemLink(id);
      if (action === 'check') checkItemLink(id);
      if (action === 'remove') removeItem(id);
    });

    elements.fileList.addEventListener('dblclick', (event) => {
      const item = event.target.closest('.tnc-file-item');
      if (!item || event.target.closest('.tnc-file-actions')) return;
      startRenameItem(item.dataset.itemId);
    });

    elements.fileList.addEventListener('input', (event) => {
      const input = event.target.closest('[data-action="rename"]');
      if (!input) return;
      renameQueuedItem(input.dataset.id, input.value);
    });

    elements.fileList.addEventListener('blur', (event) => {
      const input = event.target.closest('[data-action="rename"]');
      if (!input) return;
      state.editingItemId = null;
      renderItems();
    }, true);

    elements.fileList.addEventListener('keydown', (event) => {
      const input = event.target.closest('[data-action="rename"]');
      if (!input) return;
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        state.editingItemId = null;
        renderItems();
      }
    });
  }

  function init() {
    initElements();
    loadHistory();
    loadActivity();
    updateSupportBadge();
    bindEvents();
    renderReplaceMode();
    renderDestination();
    renderItems();
    renderActivity();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
