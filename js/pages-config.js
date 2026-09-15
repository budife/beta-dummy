document.addEventListener('DOMContentLoaded', () => {
  if (new URLSearchParams(window.location.search).get('embed') === '1') {
    document.body.classList.add('is-embedded');
  }
});

/* ===================================
   ORIGINAL CODE
   =================================== */

/** Ambil subject saat ini dari XML (kalau ada) */
function getXmlSubject() {
  if (!xmlDoc) return '';
  const mc = xmlDoc.querySelector('MessageContent');
  return mc ? (mc.getAttribute('subject') || '') : '';
}

function setTooltipsEnabled(enabled) {
  console.log('\ud83d\udd27 TOOLTIPS ENABLED:', enabled);
  document.body.classList.toggle('tooltips-disabled', !enabled);
}

function loadXmlFromText(xmlText, { suppressAlert = false, suppressTooltips = false } = {}) {
  const raw = (xmlText || '').trim();
  
  if (!raw) {
    xmlDoc = null; 
    setTooltipsEnabled(false);
    clearAllTooltips(); // Clear tooltips when empty content is loaded
    initializeFields(); 
    updateEditor(); 
    resetOriginalValues();
    return;
  }
  
  const parser = new DOMParser();
  const parsed = parser.parseFromString(raw, "application/xml");
  const hasError = parsed.getElementsByTagName('parsererror').length > 0;
  
  if (hasError) {
    if (!suppressAlert) console.warn('XML parse error on load; UI cleared.');
    xmlDoc = null; 
    setTooltipsEnabled(false);
    clearAllTooltips(); // Clear tooltips on XML parse error
    initializeFields(); 
    if (elements.editor) elements.editor.setValue(''); 
    resetOriginalValues();
    return;
  }
  
  // Clear all tooltips before loading new file
  clearAllTooltips();
  
  xmlDoc = parsed; 
  initializeFields(); 
  updateEditor(); 
  
  // Store original values after loading
  storeOriginalValues();

  // Reset indicator to default state when loading new file
  setCampaignIndicatorState('default');
  
  // Only enable tooltips if not suppressed (used during initialization)
  if (!suppressTooltips) {
    setTooltipsEnabled(true);
  }
}

/* Initialize form fields from XML */
function initializeFields() {
  if (!xmlDoc) {
    if (elements.campaignIdInput) elements.campaignIdInput.value = '';
    if (elements.subjectInput) elements.subjectInput.value = '';
    if (elements.linkInput) elements.linkInput.value = '';
    if (elements.conversationSelect) elements.conversationSelect.value = 'IMO Marketing';
    if (elements.conversationCustom) elements.conversationCustom.hidden = true;
    if (elements.conversationEnabled) {
      elements.conversationEnabled.checked = false;
      if (elements.conversationSelect) elements.conversationSelect.disabled = true;
      if (elements.conversationCustom) elements.conversationCustom.disabled = true;
    }
    updateCampaignCountIndicator('');
    currentCampaignId = ''; // Reset current campaign ID
    // Update character counts to 0 when no XML
    updateAllCharCounts();
    updateEnvironmentToggle();
    return;
  }
  
  // Get current campaign ID from XML
  let xmlCampaignId = '';
  const audienceModel = xmlDoc.querySelector('AudienceModel');
  if (audienceModel) {
    const audienceName = audienceModel.getAttribute('name');
    xmlCampaignId = audienceName || '';
  }
  if (!xmlCampaignId) {
    const campaign = xmlDoc.querySelector('Campaign');
    if (campaign) {
      const campaignName = campaign.getAttribute('name');
      xmlCampaignId = campaignName || '';
    }
  }
  
  // Update input field and currentCampaignId variable
  if (elements.campaignIdInput) elements.campaignIdInput.value = xmlCampaignId;
  currentCampaignId = xmlCampaignId; // Set current campaign ID
  updateCampaignCountIndicator(xmlCampaignId);

  const messageContent = xmlDoc.querySelector('MessageContent');
  const subject = messageContent ? messageContent.getAttribute('subject') : '';
  if (elements.subjectInput) elements.subjectInput.value = subject;

  const messageBody = xmlDoc.querySelector('MessageBody');
  const link = messageBody ? messageBody.getAttribute('content') : '';
  if (elements.linkInput) elements.linkInput.value = link;

  const conversation = xmlDoc.querySelector('Conversation');
  const conversationName = conversation ? conversation.getAttribute('name') : '';
  if (elements.conversationEnabled) {
    elements.conversationEnabled.checked = !!conversationName;
  }
  if (elements.conversationSelect) {
    elements.conversationSelect.disabled = !conversationName;
    if (elements.conversationCustom) elements.conversationCustom.disabled = !conversationName;
    const opts = Array.from(elements.conversationSelect.options);
    const match = opts.find(o => o.value === conversationName);
    if (match) {
      elements.conversationSelect.value = conversationName;
    } else if (conversationName) {
      elements.conversationSelect.value = '__custom__';
      if (elements.conversationCustom) {
        elements.conversationCustom.hidden = false;
        elements.conversationCustom.value = conversationName;
      }
    } else {
      elements.conversationSelect.value = 'IMO Marketing';
      if (elements.conversationCustom) elements.conversationCustom.hidden = true;
    }
  }
  if (elements.conversationCustom && elements.conversationSelect?.value !== '__custom__') {
    elements.conversationCustom.hidden = true;
  }

  updateEnvironmentToggle();
  
  // Update character counts after loading values
  updateAllCharCounts();
  
  // Validate and show tooltips after loading XML
  if (xmlCampaignId) {
    // Validate Campaign ID format
    const formatValidation = validateCampaignIdFormat(xmlCampaignId);
    const fieldContainer = document.querySelector('.field.campaign-id-field');
    
    // Don't show tooltips on initialization - only on user interaction
    if (!formatValidation.valid) {
      if (elements.campaignIdInput) {
        elements.campaignIdInput.title = formatValidation.error;
      }
    } else if (formatValidation.isPastDate) {
      if (elements.campaignIdInput) {
        elements.campaignIdInput.title = TOOLTIP_MESSAGES.warning.past;
      }
    } else if (formatValidation.isToday) {
      if (elements.campaignIdInput) {
        elements.campaignIdInput.title = TOOLTIP_MESSAGES.warning.today;
      }
    }
    // Note: No tooltips shown on load - only when user interacts
    
    // Campaign ID and Link validation removed
  }
}

// ---- State & element refs ----
let fileHandle;
let xmlDoc;
let currentDirfileHandle = null;
let currentDirHandle = null;
const CONFIG_FOLDER_STATE_KEY = 'configEdm';

function getShellToolState() {
  try {
    const host = window.parent && window.parent !== window ? window.parent : window;
    if (!host.__edmHelperToolState) host.__edmHelperToolState = {};
    return host.__edmHelperToolState;
  } catch (error) {
    return null;
  }
}

function saveConfigFolderState(dirHandle) {
  const registry = getShellToolState();
  if (!registry) return;
  registry[CONFIG_FOLDER_STATE_KEY] = { dirHandle };
}

async function restoreConfigFolderState() {
  const state = getShellToolState()?.[CONFIG_FOLDER_STATE_KEY];
  if (!state?.dirHandle) return;

  try {
    const permission = typeof state.dirHandle.queryPermission === 'function'
      ? await state.dirHandle.queryPermission({ mode: 'readwrite' })
      : 'granted';
    if (permission !== 'granted') return;

    currentDirHandle = state.dirHandle;
    updateBreadcrumb(state.dirHandle.name);
    if (elements.fileMetadata) elements.fileMetadata.textContent = 'Select an XML file';
    await loadFileTree(state.dirHandle);
  } catch (error) {
    console.warn('Unable to restore the previously opened Config eDM folder.', error);
  }
}
let isPageInitializing = true; // Flag to prevent tooltips during initialization

// Track original values when file is loaded
let originalValues = {
  campaignId: '',
  subject: '',
  link: '',
  xmlContent: ''
};

// Track if changes have been applied but not saved
let hasUnsavedChanges = false;

// Performance: Cache DOM elements
const elements = {
  saveFileBtn: null,
  editor: null,
  campaignIdInput: document.getElementById('campaignId'),
  setTodayBtn: document.getElementById('setTodayBtn'),
  toggleUatBtn: document.getElementById('toggleUatBtn'),
  subjectInput: document.getElementById('subject'),
  linkInput: document.getElementById('link'),
  conversationSelect: document.getElementById('conversation'),
  conversationCustom: document.getElementById('conversationCustom'),
  conversationEnabled: document.getElementById('conversationEnabled'),
  campaignCountIndicator: document.getElementById('campaignCountIndicator'),
  breadcrumb: document.getElementById('breadcrumb'),
  fileMetadata: document.getElementById('fileMetadata'),
  fileStatus: document.getElementById('fileStatus'),
  workspaceEmptyState: document.getElementById('workspaceEmptyState'),
  configControls: document.getElementById('configControls'),
  validationSummary: document.getElementById('validationSummary'),
  fileCountBadge: document.getElementById('fileCountBadge'),
  fileTreeFilter: document.getElementById('fileTreeFilter'),
  previousXmlBtn: document.getElementById('previousXmlBtn'),
  nextXmlBtn: document.getElementById('nextXmlBtn'),
  xmlWorkflow: document.getElementById('xmlWorkflow'),
  xmlWorkflowProgress: document.getElementById('xmlWorkflowProgress'),
  currentXmlName: document.getElementById('currentXmlName'),
  nextXmlName: null,
  overlay: document.getElementById('overlay'),
  spinner: document.querySelector('.spinner')
};

function getXmlFileItems() {
  return Array.from(document.querySelectorAll('#fileTree li.file[data-ext="xml"]'));
}

function updateXmlWorkflow() {
  const files = getXmlFileItems();
  const currentIndex = selectedFileItem ? files.indexOf(selectedFileItem) : -1;

  if (elements.xmlWorkflow) elements.xmlWorkflow.hidden = currentIndex < 0;
  if (elements.currentXmlName) {
    elements.currentXmlName.textContent = currentIndex >= 0
      ? selectedFileItem.querySelector('.label')?.textContent || 'Selected XML'
      : 'No XML selected';
  }
  if (elements.xmlWorkflowProgress) {
    elements.xmlWorkflowProgress.textContent = currentIndex >= 0
      ? `${currentIndex + 1} / ${files.length}`
      : `0 / ${files.length}`;
  }
  if (elements.nextXmlBtn) {
    const nextItem = currentIndex >= 0 ? files[currentIndex + 1] : null;
    elements.nextXmlBtn.disabled = !nextItem;
    elements.nextXmlBtn.title = nextItem ? 'Save pending changes and open the next XML file' : 'No next XML file';
  }
  if (elements.previousXmlBtn) {
    const previousItem = currentIndex > 0 ? files[currentIndex - 1] : null;
    elements.previousXmlBtn.disabled = !previousItem;
    elements.previousXmlBtn.title = previousItem ? 'Save pending changes and open the previous XML file' : 'No previous XML file';
  }

  const previewContent = document.getElementById('xmlPreviewContent');
  const lineNumbers = document.getElementById('xmlPreviewLineNumbers');
  if (previewContent) {
    if (currentIndex >= 0 && elements.editor && elements.editor.getValue) {
      const raw = elements.editor.getValue();
      let html = highlightXml(escapeHtml(raw));
      html = highlightFormValues(html);
      previewContent.innerHTML = html;
      if (lineNumbers) {
        const count = raw.split('\n').length;
        lineNumbers.innerHTML = Array.from({ length: count }, (_, i) => `<span>${i + 1}</span>`).join('');
      }
    } else {
      previewContent.textContent = '';
      if (lineNumbers) lineNumbers.innerHTML = '';
    }
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightXml(escaped) {
  return escaped
    .replace(/&lt;(\/?[\w:-]+)/g, '&lt;<span class="xml-tag">$1</span>')
    .replace(/([\w:-]+)=(&quot;[^&]*?&quot;)/g, '<span class="xml-attr">$1</span>=<span class="xml-val">$2</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>');
}

function getConversationDescription(name) {
  if (name === 'IMO Marketing') return 'For IMO Marketing messages process';
  if (name === 'IMO Non-Marketing EDM') return 'to bypass unsubscribed customer email';
  return '';
}

function highlightFormValues(html) {
  const convSelect = elements.conversationSelect;
  const convCustom = elements.conversationCustom;
  const convValue = convSelect?.value === '__custom__'
    ? convCustom?.value?.trim()
    : convSelect?.value;

  const values = [
    elements.campaignIdInput?.value?.trim(),
    elements.subjectInput?.value?.trim(),
    elements.linkInput?.value?.trim(),
    convValue
  ].filter(v => v && v.length > 2);

  let result = html;
  for (const val of values) {
    const escaped = escapeHtml(val);
    const re = new RegExp(escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(re, `<span class="xml-form-hl">${escaped}</span>`);
  }
  return result;
}

let xmlPreviewCollapsed = false;

function toggleXmlPreview() {
  xmlPreviewCollapsed = !xmlPreviewCollapsed;
  const body = document.getElementById('xmlPreviewBody');
  const icon = document.querySelector('#xmlPreviewToggle i');
  if (body) body.hidden = xmlPreviewCollapsed;
  if (icon) {
    icon.classList.toggle('fa-chevron-up', !xmlPreviewCollapsed);
    icon.classList.toggle('fa-chevron-down', xmlPreviewCollapsed);
  }
}

function setupXmlPreviewToggle() {
  const btn = document.getElementById('xmlPreviewToggle');
  if (btn) btn.addEventListener('click', toggleXmlPreview);
}

function setupXmlPreviewCopy() {
  const btn = document.getElementById('xmlPreviewCopyBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!elements.editor || !elements.editor.getValue) return;
    const raw = elements.editor.getValue();
    navigator.clipboard.writeText(raw).then(() => {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1200);
    });
  });
}

let xmlSearchMatches = [];
let xmlSearchIndex = -1;

function setupXmlPreviewSearch() {
  const toggleBtn = document.getElementById('xmlPreviewSearchToggle');
  const bar = document.getElementById('xmlPreviewSearchBar');
  const input = document.getElementById('xmlPreviewSearchInput');
  const status = document.getElementById('xmlPreviewSearchStatus');
  const prevBtn = document.getElementById('xmlPreviewSearchPrev');
  const nextBtn = document.getElementById('xmlPreviewSearchNext');
  const closeBtn = document.getElementById('xmlPreviewSearchClose');

  if (toggleBtn && bar) {
    toggleBtn.addEventListener('click', () => {
      bar.hidden = !bar.hidden;
      if (!bar.hidden && input) input.focus();
      if (bar.hidden) clearXmlSearch();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      bar.hidden = true;
      clearXmlSearch();
    });
  }

  if (input) {
    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => runXmlSearch(input.value), 150);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) navigateXmlSearch(-1);
        else navigateXmlSearch(1);
      }
      if (e.key === 'Escape') {
        bar.hidden = true;
        clearXmlSearch();
      }
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => navigateXmlSearch(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateXmlSearch(1));
}

function runXmlSearch(query) {
  const code = document.getElementById('xmlPreviewContent');
  const status = document.getElementById('xmlPreviewSearchStatus');
  xmlSearchMatches = [];
  xmlSearchIndex = -1;

  if (!code || !query) {
    if (code) code.innerHTML = highlightXml(escapeHtml(elements.editor?.getValue?.() || ''));
    if (status) status.textContent = '';
    return;
  }

  const raw = elements.editor?.getValue?.() || '';
  const highlighted = highlightXml(escapeHtml(raw));
  const lower = raw.toLowerCase();
  const q = query.toLowerCase();
  let result = '';
  let lastIdx = 0;

  while (true) {
    const idx = lower.indexOf(q, lastIdx);
    if (idx === -1) break;
    xmlSearchMatches.push(idx);
    const before = escapeHtml(raw.slice(lastIdx, idx));
    const match = escapeHtml(raw.slice(idx, idx + query.length));
    result += highlightXml(before) + `<span class="xml-search-hl">${match}</span>`;
    lastIdx = idx + query.length;
  }
  result += highlightXml(escapeHtml(raw.slice(lastIdx)));
  code.innerHTML = result;

  if (xmlSearchMatches.length > 0) {
    xmlSearchIndex = 0;
    updateXmlSearchStatus(status);
    scrollXmlSearchMatch();
  } else {
    if (status) status.textContent = 'No results';
  }
}

function navigateXmlSearch(dir) {
  if (xmlSearchMatches.length === 0) return;
  xmlSearchIndex = (xmlSearchIndex + dir + xmlSearchMatches.length) % xmlSearchMatches.length;
  const status = document.getElementById('xmlPreviewSearchStatus');
  updateXmlSearchStatus(status);
  scrollXmlSearchMatch();
}

function updateXmlSearchStatus(status) {
  if (status && xmlSearchMatches.length > 0) {
    status.textContent = `${xmlSearchIndex + 1} / ${xmlSearchMatches.length}`;
  }
}

function scrollXmlSearchMatch() {
  const highlights = document.querySelectorAll('.xml-search-hl');
  if (highlights[xmlSearchIndex]) {
    highlights[xmlSearchIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

function clearXmlSearch() {
  xmlSearchMatches = [];
  xmlSearchIndex = -1;
  const input = document.getElementById('xmlPreviewSearchInput');
  const status = document.getElementById('xmlPreviewSearchStatus');
  if (input) input.value = '';
  if (status) status.textContent = '';
  const code = document.getElementById('xmlPreviewContent');
  if (code && elements.editor?.getValue) {
    code.innerHTML = highlightXml(escapeHtml(elements.editor.getValue()));
  }
}

async function openAdjacentXml(offset) {
  const files = getXmlFileItems();
  const currentIndex = selectedFileItem ? files.indexOf(selectedFileItem) : -1;
  const targetItem = currentIndex >= 0 ? files[currentIndex + offset] : null;
  if (!targetItem) return;

  if (hasUnsavedChanges) {
    await performSave();
  }

  await selectFile(targetItem, targetItem._fileHandle);
  scrollFileItemInTree(targetItem);
}

function scrollFileItemInTree(item) {
  const scrollContainer = document.querySelector('.sidebar-body');
  if (!item || !scrollContainer) return;

  const itemTop = item.offsetTop;
  const itemBottom = itemTop + item.offsetHeight;
  const visibleTop = scrollContainer.scrollTop;
  const visibleBottom = visibleTop + scrollContainer.clientHeight;

  if (itemTop < visibleTop) {
    scrollContainer.scrollTop = itemTop;
  } else if (itemBottom > visibleBottom) {
    scrollContainer.scrollTop = itemBottom - scrollContainer.clientHeight;
  }
}

function setFileStatus(state, label) {
  if (!elements.fileStatus) return;
  elements.fileStatus.dataset.state = state;
  elements.fileStatus.textContent = label;
}

function setWorkspaceEnabled(enabled) {
  if (elements.workspaceEmptyState) elements.workspaceEmptyState.hidden = enabled;
  if (elements.configControls) elements.configControls.classList.toggle('is-disabled', !enabled);
  [elements.campaignIdInput, elements.subjectInput, elements.linkInput].forEach(input => {
    if (input) input.disabled = !enabled;
  });
  if (elements.setTodayBtn) elements.setTodayBtn.disabled = !enabled;
  if (elements.toggleUatBtn) elements.toggleUatBtn.disabled = !enabled;
}

const editableConfigFields = [
  elements.campaignIdInput,
  elements.subjectInput,
  elements.linkInput
].filter(Boolean);

function setFieldLocked(input, locked) {
  if (!input) return;
  input.readOnly = locked;
  input.classList.toggle('is-locked', locked);
  input.setAttribute('aria-readonly', String(locked));
  input.title = locked ? 'Double-click to edit this field.' : '';
}

function updateEnvironmentToggle() {
  if (!elements.toggleUatBtn || !elements.campaignIdInput) return;
  const campaignId = elements.campaignIdInput.value.trim();
  const isUat = /-UAT_\d{3,4}$/.test(campaignId);
  elements.toggleUatBtn.textContent = isUat ? 'UAT' : 'PROD';
  elements.toggleUatBtn.dataset.environment = isUat ? 'uat' : 'prod';
  elements.toggleUatBtn.title = isUat
    ? 'Current environment: UAT. Click to change to PROD.'
    : 'Current environment: PROD. Click to change to UAT.';
}

function lockAllConfigFields() {
  editableConfigFields.forEach(input => setFieldLocked(input, true));
}

function unlockAllConfigFields() {
  editableConfigFields.forEach(input => setFieldLocked(input, false));
}

function initializeFieldLocking() {
  editableConfigFields.forEach(input => {
    let preserveInitialSelection = false;
    input.addEventListener('mousedown', () => {
      preserveInitialSelection = document.activeElement !== input;
    });

    input.addEventListener('focus', () => {
      if (input.disabled) return;
      setFieldLocked(input, false);
      if (input.value) input.select();
    });

    input.addEventListener('mouseup', event => {
      if (preserveInitialSelection
        && document.activeElement === input
        && input.value
        && input.selectionStart === 0
        && input.selectionEnd === input.value.length) {
        event.preventDefault();
      }
      preserveInitialSelection = false;
    });

    input.addEventListener('dblclick', () => {
      if (input.disabled) return;
      setFieldLocked(input, false);
      input.focus();
    });

    input.addEventListener('blur', () => {
      if (!input.disabled && input.value.trim()) {
        setFieldLocked(input, true);
      }
    });

    input.addEventListener('paste', () => {
      setTimeout(() => {
        if (document.activeElement !== input && input.value.trim()) {
          setFieldLocked(input, true);
        }
      }, 0);
    });
  });

  if (elements.setTodayBtn) {
    elements.setTodayBtn.addEventListener('mousedown', event => {
      event.preventDefault();
    });
    elements.setTodayBtn.addEventListener('click', () => {
      if (!elements.campaignIdInput || elements.campaignIdInput.disabled) return;

      const currentValue = elements.campaignIdInput.value.trim();
      if (!/^\d{8}/.test(currentValue)) {
        setFieldLocked(elements.campaignIdInput, false);
        elements.campaignIdInput.focus();
        return;
      }

      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('');

      setFieldLocked(elements.campaignIdInput, false);
      elements.campaignIdInput.value = currentValue.replace(/^\d{8}/, today);
      elements.campaignIdInput.dispatchEvent(new Event('input', { bubbles: true }));
      setFieldLocked(elements.campaignIdInput, true);
    });
  }

  if (elements.toggleUatBtn) {
    elements.toggleUatBtn.addEventListener('mousedown', event => {
      event.preventDefault();
    });
    elements.toggleUatBtn.addEventListener('click', () => {
      if (!elements.campaignIdInput || elements.campaignIdInput.disabled) return;

      const currentValue = elements.campaignIdInput.value.trim();
      const match = currentValue.match(/^(\d{8}[A-Z]?_)(.+)(_\d{3,4})$/);
      if (!match) {
        elements.campaignIdInput.focus();
        return;
      }

      const campaignName = match[2].endsWith('-UAT')
        ? match[2].slice(0, -4)
        : `${match[2]}-UAT`;

      setFieldLocked(elements.campaignIdInput, false);
      elements.campaignIdInput.value = `${match[1]}${campaignName}${match[3]}`;
      elements.campaignIdInput.dispatchEvent(new Event('input', { bubbles: true }));
      updateEnvironmentToggle();
      setFieldLocked(elements.campaignIdInput, true);
    });
  }
}

function updateValidationSummary() {
  if (!elements.validationSummary) return;
  if (!window.fileHandle) {
    elements.validationSummary.dataset.state = 'empty';
    elements.validationSummary.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>Select an XML file to validate campaign fields.</span>';
    return;
  }

  const fields = [
    ['Campaign ID', elements.campaignIdInput],
    ['Subject', elements.subjectInput],
    ['Link', elements.linkInput]
  ];
  const invalid = fields
    .filter(([, input]) => input && (input.classList.contains('error') || !input.value.trim()))
    .map(([label]) => label);

  if (invalid.length) {
    elements.validationSummary.dataset.state = 'error';
    elements.validationSummary.innerHTML = `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>Check ${invalid.join(', ')}.</span>`;
  } else {
    elements.validationSummary.dataset.state = 'valid';
    elements.validationSummary.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>All 3 campaign fields are valid.</span>';
  }
}

function updateWorkspaceStatus() {
  if (!window.fileHandle) {
    setFileStatus('empty', 'No file selected');
    setWorkspaceEnabled(false);
  } else if (hasUnsavedChanges) {
    setFileStatus('modified', 'Modified');
    setWorkspaceEnabled(true);
  } else {
    const isSaved = typeof campaignIndicatorState !== 'undefined' && campaignIndicatorState === 'saved';
    setFileStatus(isSaved ? 'saved' : 'ready', isSaved ? 'Saved' : 'Ready');
    setWorkspaceEnabled(true);
  }
  updateValidationSummary();
}

function updateFileTreeStats() {
  const xmlFiles = Array.from(document.querySelectorAll('#fileTree li.file'))
    .filter(item => item.dataset.ext === 'xml');
  if (elements.fileCountBadge) {
    elements.fileCountBadge.textContent = String(xmlFiles.length);
    elements.fileCountBadge.title = `${xmlFiles.length} XML file${xmlFiles.length === 1 ? '' : 's'}`;
  }
}

function filterFileTree(query) {
  const normalized = query.trim().toLowerCase();
  document.querySelectorAll('#fileTree li.file').forEach(item => {
    item.hidden = Boolean(normalized) && !item.textContent.toLowerCase().includes(normalized);
  });
  document.querySelectorAll('#fileTree li.folder').forEach(folder => {
    const files = Array.from(folder.querySelectorAll('li.file'));
    folder.hidden = Boolean(normalized) && files.length > 0 && files.every(file => file.hidden);
    if (normalized && !folder.hidden) folder.classList.add('open');
  });
}

function confirmDiscardChanges() {
  return !hasUnsavedChanges || window.confirm('This file has unsaved changes. Discard them and continue?');
}

// Keep XML content available to the existing configuration workflow without
// rendering a source editor in the interface.
function initializeXmlStorage() {
  const textarea = document.getElementById('editor');
  if (!textarea) return;

  const changeListeners = [];
  elements.editor = {
    getValue: () => textarea.value,
    setValue: (value) => {
      textarea.value = value ?? '';
      changeListeners.forEach(listener => listener());
    },
    on: (eventName, listener) => {
      if (eventName === 'change' && typeof listener === 'function') {
        changeListeners.push(listener);
      }
    }
  };

  elements.editor.on('change', () => {
    debouncedSaveState();
  });
}

// Util: label tombol dengan ikon FA - Optimized
function setStatusIcon(id, status) {
  const el = document.getElementById(id);
  if (!el) return;
  let icon = el.querySelector('i');
  if (!icon) {
    icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    el.appendChild(icon);
  }
  // Use requestAnimationFrame for smooth updates
  requestAnimationFrame(() => {
    if (el.classList.contains('checkmark')) {
      icon.className = 'fa-solid fa-check';
      el.classList.add('show');
      const wrapper = el.closest('.input-wrapper');
      if (wrapper) wrapper.classList.add('checkmark-visible');
    } else {
      icon.className = (status === 'error')
      ? 'fa-solid fa-circle-xmark'
      : 'fa-solid fa-circle-check';
      el.style.display = 'inline';
    }
  });
}
function clearStatusIcon(id) {
  const el = document.getElementById(id);
  if (el) {
    if (el.classList.contains('checkmark')) {
      el.classList.remove('show');
      // Remove class from wrapper
      const wrapper = el.closest('.input-wrapper');
      if (wrapper) wrapper.classList.remove('checkmark-visible');
    } else {
      el.style.display = 'none';
    }
  }
}

/* Campaign ID vs Link Mismatch Validation */
function validateCampaignLinkMismatch(campaignId, link) {
  if (!campaignId || !link) {
    return { hasMismatch: false, expected: null, found: null };
  }
  
  // Extract 3-4 digit numbers from campaign ID (after underscore)
  const campaignMatch = campaignId.match(/_(\d{3,4})$/);
  if (!campaignMatch) {
    return { hasMismatch: false, expected: null, found: null };
  }
  
  const campaignDigits = campaignMatch[1];
  
  // Extract 3-4 digit numbers from link URL
  let linkDigits = null;
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const lastSegment = pathParts[pathParts.length - 1] || '';
    const linkMatch = lastSegment.match(/^(\d{3,4})/);
    if (linkMatch) {
      linkDigits = linkMatch[1];
    }
  } catch {
    // Fallback for malformed URLs
    const parts = link.split('/').filter(Boolean);
    const lastSegment = parts[parts.length - 1] || '';
    const linkMatch = lastSegment.match(/^(\d{3,4})/);
    if (linkMatch) {
      linkDigits = linkMatch[1];
    }
  }
  
  if (!linkDigits) {
    return { hasMismatch: false, expected: campaignDigits, found: null };
  }
  
  // Check for mismatch (prefer 4-digit match, fallback to 3-digit)
  const hasMismatch = campaignDigits !== linkDigits;
  
  return {
    hasMismatch,
    expected: campaignDigits,
    found: linkDigits
  };
}

/* Link Format Validation */
function validateLinkFormat(link) {
  if (!link || link.trim() === '') return { valid: false, error: '' };
  
  const trimmedLink = link.trim();
  const requiredPrefix = 'http://mail.hsbc.com.hk';
  const requiredSuffix = '.html';
  
  // Check if link starts with correct prefix
  if (!trimmedLink.startsWith(requiredPrefix)) {
    if (!trimmedLink.startsWith('http://')) {
      return { 
        valid: false, 
        error: 'Link harus dimulai dengan http://mail.hsbc.com.hk' 
      };
    } else if (trimmedLink.startsWith('http://mail.hsbc.com')) {
      return { 
        valid: false, 
        error: 'Link harus menggunakan domain lengkap: http://mail.hsbc.com.hk' 
      };
    } else {
      return { 
        valid: false, 
        error: 'Link harus dimulai dengan http://mail.hsbc.com.hk' 
      };
    }
  }
  
  // Check if link ends with .html
  if (!trimmedLink.endsWith(requiredSuffix)) {
    if (trimmedLink.includes('.html')) {
      return { 
        valid: false, 
        error: 'Link harus diakhiri dengan .html (pastikan tidak ada karakter setelah .html)' 
      };
    } else {
      return { 
        valid: false, 
        error: 'Link harus diakhiri dengan .html' 
      };
    }
  }
  
  // Check if link has content between prefix and suffix
  const middleContent = trimmedLink.slice(requiredPrefix.length, -requiredSuffix.length);
  if (middleContent.trim() === '') {
    return { 
      valid: false, 
      error: 'Link harus memiliki path setelah domain (contoh: http://mail.hsbc.com.hk/path/file.html)' 
    };
  }
  
  // Check if link has valid path structure
  if (!middleContent.startsWith('/')) {
    return { 
      valid: false, 
      error: 'Link harus memiliki path yang valid (contoh: http://mail.hsbc.com.hk/1450-campaign.html)' 
    };
  }
  
  return { valid: true };
}

/* KRHRED normalizer (toleran)
   ============================

   - Mendeteksi:
     krhred_XX, krhred-unit-XX, <krhred_XX>, <%[KRHRED_Unit_XX]|>, dst.
   - Mengoreksi OCR-like: Oâ†’0, l/Iâ†’1
   - Melengkapi bagian yang kurang â†’ <%[KRHRED_Unit_XX]|%>
*/
const KRHRED_FAST_RE = /(\s*)<?%?\s*\[?\s*KRHRED(?:_Unit)?[_\s-]*([0-9oOlLiI]{1,2})\s*\]?\s*\|?\s*%?>?/gi;

function normalizeKrhredTokens(text) {
  if (!text) return { text, missingDetected: false };
  if (!/krhred/i.test(text)) return { text, missingDetected: false };

  const toDigits2 = (raw) => {
    if (!raw) return null;
    const d = String(raw)
      .replace(/[oO]/g, '0')
      .replace(/[lI]/g, '1')
      .replace(/\D/g, '');
    return d ? d.padStart(2, '0').slice(-2) : null;
  };

  // Invalid jika ada "KRHRED" tanpa angka
  let missingDetected = /\bKRHRED\b(?![_\s-]*[0-9oOlLiI]{1,2})/i.test(text);

  // Ganti semua variasi menjadi format final, preserve space before
  const replaced = text.replace(KRHRED_FAST_RE, (m, spaceBefore, num) => {
    const d2 = toDigits2(num) || '00';
    
    // Preserve the original spacing before the token
    return spaceBefore + `<%[KRHRED_Unit_${d2}]|%>`;
  });

  // Lengkapi jadi format persis <%[KRHRED_Unit_XX]|%>
  const completed = replaced
    .replace(/<\s*KRHRED_Unit_(\d{2})\s*>/gi, '<%[KRHRED_Unit_$1]|%>')       // <KRHRED_Unit_39>
    .replace(/<%\s*\[?\s*KRHRED_Unit_(\d{2})\]?\s*\|?\s*%?>?/gi, '<%[KRHRED_Unit_$1]|%>'); // variasi kurang/salah

  return { text: completed, missingDetected };
}

/* CLEAR / RESET - Optimized with cached elements */
function clearAllUI(opts = { clearStorage: false }) {
  xmlDoc = null; filefileHandle = null;
  
  // Batch DOM updates with requestAnimationFrame
  requestAnimationFrame(() => {
    const inputs = [elements.campaignIdInput, elements.subjectInput, elements.linkInput];
    inputs.forEach(inp => {
      if (inp) {
        inp.value = '';
        inp.classList.remove('error');
        inp.style.borderColor = '';
      }
    });
    
    // Clear tooltip classes
    const campaignIdField = document.querySelector('.field.campaign-id-field');
    if (campaignIdField) {
      campaignIdField.classList.remove('validation-error', 'past-date-warning', 'mismatch-error', 'today-warning', 'future-date-warning');
      // Clear only the warning tooltip (now used for all messages)
      const tooltip = document.getElementById('campaignIdWarningTooltip');
      if (tooltip) {
        tooltip.textContent = '';
        tooltip.style.opacity = '0';
      }
    }
    const linkField = document.querySelector('.field.link-field');
    if (linkField) {
      linkField.classList.remove('mismatch-error');
    }
    
    updateCampaignCountIndicator('');
    
    const charCounts = ['campaignIdCharCount', 'subjectCharCount', 'linkCharCount'];
    charCounts.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0';
    });
    
    ['campaignIdCheckmark','subjectCheckmark','linkCheckmark'].forEach(clearStatusIcon);
    
    if (elements.saveFileBtn) {
      elements.saveFileBtn.style.borderColor = '';
      elements.saveFileBtn.style.backgroundColor = '';
    }
    
    if (opts.clearStorage) {
      localStorage.removeItem('config_state');
    }
  });
}


// Apply form field changes to XML before saving
async function applyFormChangesToXML() {
  console.log('=== applyFormChangesToXML START ===');
  
  if (!xmlDoc) {
    console.log('No xmlDoc, returning');
    return;
  }
  
  let hasChanges = false;
  let updateCount = 0;
  
  // Get current values from XML
  let currentCampaignId = xmlDoc.querySelector('AudienceModel')?.getAttribute('name') || '';
  const currentSubject = xmlDoc.querySelector('MessageContent')?.getAttribute('subject') || '';
  const currentLink = xmlDoc.querySelector('MessageBody')?.getAttribute('content') || '';
  
  console.log('Current XML values:', { currentCampaignId, currentSubject, currentLink });
  
  // Get input values
  const campaignIdValue = elements.campaignIdInput ? elements.campaignIdInput.value.trim() : '';
  const subjectValue = elements.subjectInput ? elements.subjectInput.value.trim() : '';
  const linkValue = elements.linkInput ? elements.linkInput.value.trim() : '';
  
  console.log('Input values:', { campaignIdValue, subjectValue, linkValue });
  
  // Check if Campaign ID has changes
  if (campaignIdValue && campaignIdValue !== currentCampaignId) {
    console.log('Campaign ID has changes, validating...');
    hasChanges = true;
    const hasSpace = /\s/.test(campaignIdValue);
    const formatValidation = validateCampaignIdFormat(campaignIdValue);
    
    console.log('Campaign ID validation:', { hasSpace, formatValidation });
    
    if (!hasSpace && formatValidation.valid) {
      // Update AudienceModel
      const audienceModel = xmlDoc.querySelector('AudienceModel');
      if (audienceModel) audienceModel.setAttribute('name', campaignIdValue);
      
      // Update Campaign
      const campaign = xmlDoc.querySelector('Campaign');
      if (campaign) {
        campaign.setAttribute('name', campaignIdValue);
        campaign.setAttribute('audience', campaignIdValue);
      }
      
      // Update Interaction elements
      xmlDoc.querySelectorAll('Interaction').forEach(el => {
        if (el.getAttribute('name') === currentCampaignId) {
          el.setAttribute('name', campaignIdValue);
        }
        if (el.getAttribute('message') === currentCampaignId) {
          el.setAttribute('message', campaignIdValue);
        }
      });
      
      // Update MessageContent elements
      xmlDoc.querySelectorAll('MessageContent').forEach(el => {
        if (el.getAttribute('name') === currentCampaignId) {
          el.setAttribute('name', campaignIdValue);
        }
      });
      
      // Update FilterValue elements
      xmlDoc.querySelectorAll('FilterValue').forEach(el => {
        if (el.getAttribute('value') === currentCampaignId) {
          el.setAttribute('value', campaignIdValue);
        }
      });
      
      currentCampaignId = campaignIdValue;
      updateCount++;
      console.log('Campaign ID updated successfully');
    } else {
      console.log('Campaign ID validation failed, not updating');
    }
  }
  
  // Check if Subject has changes
  if (subjectValue && subjectValue !== currentSubject) {
    console.log('Subject has changes, processing...');
    hasChanges = true;
    const result = normalizeKrhredTokens(subjectValue);
    const normalized = (result.text || '').trim();
    
    console.log('Subject normalization result:', result);
    
    if (!result.missingDetected && normalized !== '') {
      const messageContent = xmlDoc.querySelector('MessageContent');
      if (messageContent) {
        messageContent.setAttribute('subject', normalized);
        if (elements.subjectInput) elements.subjectInput.value = normalized;
        updateCount++;
        console.log('Subject updated successfully');
      }
    } else {
      console.log('Subject validation failed, not updating');
    }
  }
  
  // Check if Link has changes
  if (linkValue && linkValue !== currentLink) {
    console.log('Link has changes, validating...');
    hasChanges = true;
    
    // Validate link format
    const linkValidation = validateLinkFormat(linkValue);
    console.log('Link validation:', linkValidation);
    
    if (linkValidation.valid) {
      const urlPattern = /^(http:\/\/|https:\/\/).+/i;
      if (urlPattern.test(linkValue)) {
        let finalLink = linkValue;
        if (finalLink.startsWith('https://')) finalLink = 'http://' + finalLink.substring(8);
        
        const messageBody = xmlDoc.querySelector('MessageBody');
        if (messageBody) {
          messageBody.setAttribute('content', finalLink);
          if (elements.linkInput) elements.linkInput.value = finalLink;
          updateCount++;
          console.log('Link updated successfully');
        }
      }
    } else {
      console.log('Link validation failed, not updating');
    }
  }
  
  // Check if Conversation has changes (only if checkbox is enabled)
  if (elements.conversationEnabled?.checked && elements.conversationSelect) {
    const convValue = elements.conversationSelect.value === '__custom__'
      ? (elements.conversationCustom?.value?.trim() || '')
      : elements.conversationSelect.value;
    const currentConv = xmlDoc.querySelector('Conversation')?.getAttribute('name') || '';
    if (convValue && convValue !== currentConv) {
      hasChanges = true;
      const conversation = xmlDoc.querySelector('Conversation');
      if (conversation) {
        conversation.setAttribute('name', convValue);
        const desc = getConversationDescription(convValue);
        if (desc) conversation.setAttribute('Description', desc);
        else conversation.removeAttribute('Description');
        updateCount++;
      }
      const campaign = xmlDoc.querySelector('Campaign');
      if (campaign) {
        campaign.setAttribute('conversation', convValue);
      }
    }
  }
  
  console.log('Update summary:', { hasChanges, updateCount });
  
  // Update editor if there were changes
  if (hasChanges && updateCount > 0) {
    console.log('Updating editor with changes...');
    updateEditor();
    saveState();
    updateAllCharCounts();
    // Mark as having unsaved changes after applying changes
    hasUnsavedChanges = true;
    console.log('Editor updated successfully');
  } else {
    console.log('No changes to apply');
  }
  
  console.log('=== applyFormChangesToXML END ===');
}

/* Save / Load XML - Show modal first before saving */

// Actual save function called by modal
async function performSave() {
  // Use window.fileHandle instead of local fileHandle
  const currentFileHandle = window.fileHandle || fileHandle;
  
  if (!currentFileHandle) {
    console.log("No file opened");
    setFileStatus('empty', 'No file selected');
    return;
  }
  
  if (!elements.editor || !elements.editor.getValue) {
    console.log("Editor not available");
    return;
  }
  
  if (!elements.editor.getValue().trim()) {
    console.log("Editor is empty, cannot save");
    return;
  }

  try {
    console.log('=== performSave START ===');
    console.log('File handle:', currentFileHandle);
    console.log('Editor available:', !!elements.editor);
    console.log('Editor content length:', elements.editor.getValue().length);
    
    // First apply any pending form field changes to XML
    console.log('Calling applyFormChangesToXML...');
    await applyFormChangesToXML();
    console.log('applyFormChangesToXML completed');
    
    console.log('Parsing XML...');
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(elements.editor.getValue(), "application/xml");
    const hasError = parsedDoc.getElementsByTagName('parsererror').length > 0;
    
    console.log('XML parsing result:', { hasError, parserErrorCount: parsedDoc.getElementsByTagName('parsererror').length });
    
    if (hasError) {
      throw new Error('Invalid XML format');
    }

    xmlDoc = parsedDoc;
    console.log('XML document updated');

    console.log('Creating writable file...');
    // Performance: Write file with timeout
    const writable = await currentFileHandle.createWritable();
    await writable.write(elements.editor.getValue());
    await writable.close();
    console.log('File written successfully');

    console.log('File saved successfully');

    // Update original values after saving
    storeOriginalValues();
    
    // Disable buttons after successful save (no changes pending)
    updateSaveAndApplyButtons();

    // Set indicator to saved state
    setCampaignIndicatorState('saved');
    lockAllConfigFields();
  } catch (err) {
    console.error("Error saving file:", err);
    setFileStatus('error', 'Save failed');
    throw err; // Re-throw error to be handled by caller
  }
}

let currentCampaignId = '';

// Tooltip cache for performance
const tooltipCache = {
  campaignId: {
    warning: null,
    validation: null
  },
  link: {}
};

// Initialize tooltip cache
function initializeTooltipCache() {
  tooltipCache.campaignId.warning = document.getElementById('campaignIdWarningTooltip');
  tooltipCache.campaignId.validation = document.getElementById('campaignIdWarningTooltip'); // Use warning tooltip for all
  
  // Debug: Check for duplicate tooltips
  const warningTooltips = document.querySelectorAll('.warning-tooltip');
  const validationTooltips = document.querySelectorAll('.validation-tooltip');
  const mismatchTooltips = document.querySelectorAll('.mismatch-tooltip');
  
  console.log('=== TOOLTIP DUPLICATE CHECK ===');
  console.log('Warning tooltips found:', warningTooltips.length);
  warningTooltips.forEach((t, i) => console.log(`  Warning ${i}:`, t.id, t.textContent));
  console.log('Validation tooltips found:', validationTooltips.length);
  validationTooltips.forEach((t, i) => console.log(`  Validation ${i}:`, t.id, t.textContent));
  
  // Debug logging
  console.log('Tooltip cache initialized:', {
    warning: tooltipCache.campaignId.warning,
    validation: tooltipCache.campaignId.validation
  });
}

// Optimized tooltip management
function showTooltip(type, field, message) {
  // ...
  const tooltip = tooltipCache[field][type];
  if (tooltip) {
    tooltip.textContent = message;
    tooltip.style.opacity = '1';
  }
}

function hideTooltip(type, field) {
  const tooltip = tooltipCache[field][type];
  if (tooltip) {
    tooltip.style.opacity = '0';
    tooltip.textContent = '';
  }
}

function hideAllTooltips(field) {
  Object.keys(tooltipCache[field]).forEach(type => {
    hideTooltip(type, field);
  });
}

function clearAllTooltips() {
  // Clear campaign ID tooltip (now using only warning tooltip)
  const warningTooltip = document.getElementById('campaignIdWarningTooltip');
  if (warningTooltip) {
    warningTooltip.style.opacity = '0';
    warningTooltip.textContent = '';
  }
  
  // Clear mismatch tooltip separately
  const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
  if (mismatchTooltip) {
    mismatchTooltip.style.opacity = '0';
    mismatchTooltip.textContent = '';
  }
  
  // Clear link field tooltips
  const linkValidationTooltip = document.getElementById('linkValidationTooltip');
  if (linkValidationTooltip) {
    linkValidationTooltip.style.opacity = '0';
    linkValidationTooltip.textContent = '';
  }
  
  const linkMismatchTooltip = document.getElementById('linkMismatchTooltip');
  if (linkMismatchTooltip) {
    linkMismatchTooltip.style.opacity = '0';
    linkMismatchTooltip.textContent = '';
  }
  
  // Clear link tooltips
  if (tooltipCache.link) {
    Object.keys(tooltipCache.link).forEach(type => {
      hideTooltip(type, 'link');
    });
  }
  
  // Remove visual validation states from form fields
  const campaignField = document.querySelector('.field.campaign-id-field');
  const linkField = document.querySelector('.field.link-field');
  
  if (campaignField) {
    campaignField.classList.remove('validation-error', 'past-date-warning', 'today-warning', 'future-date-warning', 'mismatch-error');
  }
  
  if (linkField) {
    linkField.classList.remove('validation-error', 'mismatch-error');
  }
  
  // Clear input field titles and error states
  if (elements.campaignIdInput) {
    elements.campaignIdInput.classList.remove('error');
    elements.campaignIdInput.title = '';
  }
  
  if (elements.linkInput) {
    elements.linkInput.classList.remove('error');
    elements.linkInput.title = '';
  }
  
  console.log('All tooltips cleared');
}

// Performance: Debounced input handlers
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Track last shown past date warning to avoid spam
// Removed this line: let lastShownPastDateWarning = null;

// Performance: Optimized input event listeners
const debouncedSaveState = debounce(saveState, 300);
const debouncedUpdateCampaignCount = debounce(updateCampaignCountIndicator, 100);

// Single event listener for campaignIdInput
if (elements.campaignIdInput) {
  elements.campaignIdInput.addEventListener('input', (event) => {
    updateEnvironmentToggle();
    // DEBUG: Log input event
    console.log('\ud83d\udd25 CAMPAIGN ID INPUT EVENT:', {
      value: elements.campaignIdInput.value,
      isInitializing: isPageInitializing,
      isTrusted: event.isTrusted,
      eventConstructor: event.constructor.name
    });
    
    // Skip tooltip validation during page initialization
    if (isPageInitializing) return;
    
    // Clear checkmark when user starts editing
    clearStatusIcon('campaignIdCheckmark');
    
    const campaignId = elements.campaignIdInput.value.trim();
    const hasSpace = /\s/.test(campaignId);
    const isEmpty = campaignId.trim() === '';

    // Debug logging
    console.log('Input changed:', campaignId);
    console.log('Has space:', hasSpace);
    console.log('Is empty:', isEmpty);

    // Format validation
    const formatValidation = validateCampaignIdFormat(campaignId);
    console.log('Format validation result:', formatValidation);
    
    // Enhanced character count
    const cc = document.getElementById('campaignIdCharCount');
    
    if (cc) {
      const length = campaignId.length;
      cc.textContent = length;
    }
    
    if (hasSpace || isEmpty || (campaignId && !formatValidation.valid)) {
      console.log('Setting error state');
      elements.campaignIdInput.classList.add('error');
      // Show format error if applicable
      if (campaignId && !formatValidation.valid && formatValidation.error) {
        elements.campaignIdInput.title = formatValidation.error;
        
        // Add tooltip for validation error using the proper function
        let fieldContainer = document.querySelector('.field.campaign-id-field');
        if (fieldContainer) {
          // Clear ALL states first
          fieldContainer.classList.remove('past-date-warning', 'today-warning', 'future-date-warning', 'mismatch-error');
          fieldContainer.classList.add('validation-error');
        }
        showCampaignIdTooltip(formatValidation.error, 'validation', {
          autoHide: false
        });
        // Manage tooltip collision
        manageTooltipCollision(fieldContainer);
      } else if (hasSpace) {
        elements.campaignIdInput.title = TOOLTIP_MESSAGES.validation.space;
        
        fieldContainer = document.querySelector('.field.campaign-id-field');
        if (fieldContainer) {
          // Clear ALL states first
          fieldContainer.classList.remove('past-date-warning', 'today-warning', 'future-date-warning', 'mismatch-error');
          fieldContainer.classList.add('validation-error');
        }
        showCampaignIdTooltip(TOOLTIP_MESSAGES.validation.space, 'validation', {
          autoHide: false
        });
      }
    } else {
      console.log('Removing error state - input is valid');
      elements.campaignIdInput.classList.remove('error');
      elements.campaignIdInput.title = '';
      
      // Remove validation error tooltip
      let fieldContainer = document.querySelector('.field.campaign-id-field');
      if (fieldContainer) {
        fieldContainer.classList.remove('validation-error');
        fieldContainer.classList.remove('past-date-warning');
        fieldContainer.classList.remove('today-warning'); // Also remove today-warning
        fieldContainer.classList.remove('mismatch-error'); // Also remove mismatch
        
        // Clear ALL tooltip text using the proper function
        hideCampaignIdTooltip();
      }

      // Show warning if date is today, past date, OR future date - BUT NOT if there's a validation error
      if (campaignId && formatValidation.valid && !hasSpace && !isEmpty && (formatValidation.isToday || formatValidation.isPastDate || formatValidation.isFutureDate)) {
        console.log('Showing warning for date:', formatValidation.isToday ? 'today' : formatValidation.isPastDate ? 'past date' : 'future date');
        console.log('Field container classes before adding:', fieldContainer ? fieldContainer.className : 'null');
        
        // Build warning message
        let warningMessage;
        if (formatValidation.isToday) {
          warningMessage = TOOLTIP_MESSAGES.warning.today;
        } else if (formatValidation.isPastDate) {
          warningMessage = TOOLTIP_MESSAGES.warning.past;
        } else {
          warningMessage = TOOLTIP_MESSAGES.warning.future;
        }
        
        elements.campaignIdInput.title = warningMessage;
        
        // Update warning tooltip using the proper function
        showCampaignIdTooltip(warningMessage, formatValidation.isToday ? 'today' : formatValidation.isPastDate ? 'past' : 'future', {
          autoHide: false
        });
        
        let inputWrapper = document.querySelector('.input-wrapper.campaign-id-field');
        
        // Add visual warning indicator
        if (fieldContainer) {
          fieldContainer.classList.add('past-date-warning');
          // Add specific class for today's date to make it green
          if (formatValidation.isToday) {
            fieldContainer.classList.add('today-warning');
          } else {
            fieldContainer.classList.remove('today-warning');
          }
          // Add specific class for future date
          if (formatValidation.isFutureDate) {
            fieldContainer.classList.add('future-date-warning');
          } else {
            fieldContainer.classList.remove('future-date-warning');
          }
          console.log('Field container classes after adding:', fieldContainer.className);
        }
        if (inputWrapper) {
          inputWrapper.classList.add('past-date-warning');
        }
        // Manage tooltip collision - this will handle mismatch if present
        console.log('Calling manageTooltipCollision with fieldContainer:', fieldContainer);
        manageTooltipCollision(fieldContainer);
        console.log('manageTooltipCollision completed');
      } else {
        console.log('Removing warning indicator');
        // Remove visual warning indicator if not today, past, or future date
        inputWrapper = document.querySelector('.input-wrapper.campaign-id-field');
        if (fieldContainer) {
          fieldContainer.classList.remove('past-date-warning');
          fieldContainer.classList.remove('today-warning'); // Also remove today-warning class
          fieldContainer.classList.remove('future-date-warning'); // Also remove future-date-warning class
        }
        if (inputWrapper) {
          inputWrapper.classList.remove('past-date-warning');
        }
        
        // Clear ALL tooltips using the proper function
        hideCampaignIdTooltip();
      }
      
      // Perform mismatch validation if both campaign ID and link have values AND no validation error
      const linkValue = elements.linkInput ? elements.linkInput.value.trim() : '';
      if (campaignId && linkValue && !hasSpace && !isEmpty && formatValidation.valid) {
        console.log('Performing mismatch validation...');
        const mismatchResult = validateCampaignLinkMismatch(campaignId, linkValue);
        console.log('Mismatch result:', mismatchResult);
        
        const campaignFieldContainer = document.querySelector('.field.campaign-id-field');
        const linkFieldContainer = document.querySelector('.field.link-field');
        
        if (mismatchResult.hasMismatch) {
          console.log('MISMATCH DETECTED - showing mismatch tooltips');
            
          // Add mismatch error class to both fields
          if (campaignFieldContainer) {
            campaignFieldContainer.classList.add('mismatch-error');
            const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
            if (mismatchTooltip) {
              mismatchTooltip.textContent = TOOLTIP_MESSAGES.mismatch.details(mismatchResult.expected, mismatchResult.found);
              mismatchTooltip.style.opacity = '1';
              mismatchTooltip.style.background = '#eab308';
              mismatchTooltip.style.transform = 'translateY(0)';
            }
          }
            
          if (linkFieldContainer) {
            linkFieldContainer.classList.add('mismatch-error');
            const mismatchTooltip = linkFieldContainer.querySelector('.mismatch-tooltip');
            if (mismatchTooltip) {
              mismatchTooltip.textContent = TOOLTIP_MESSAGES.mismatch.details(mismatchResult.expected, mismatchResult.found);
              mismatchTooltip.style.opacity = '1';
              mismatchTooltip.style.background = '#eab308';
            }
          }
        } else {
          console.log('NO MISMATCH - clearing mismatch tooltips');
            
          // Remove mismatch error class and tooltips
          if (campaignFieldContainer) {
            campaignFieldContainer.classList.remove('mismatch-error');
            // Don't hide tooltip here, let validation/warning show if needed
          }
            
          if (linkFieldContainer) {
            linkFieldContainer.classList.remove('mismatch-error');
            const mismatchTooltip = linkFieldContainer.querySelector('.mismatch-tooltip');
            if (mismatchTooltip) {
              mismatchTooltip.style.opacity = '0';
            }
          }
        }
        
        // Manage tooltip collision for campaign field
        if (campaignFieldContainer) {
          manageTooltipCollision(campaignFieldContainer);
        }
      }
    }
  });
  
  // Add focus effects
  elements.campaignIdInput.addEventListener('focus', () => {
    const wrapper = document.querySelector('.input-wrapper.campaign-id-field');
    if (wrapper) {
      wrapper.classList.add('focused');
    }
  });

  elements.campaignIdInput.addEventListener('blur', () => {
    const wrapper = document.querySelector('.input-wrapper.campaign-id-field');
    if (wrapper) {
      wrapper.classList.remove('focused');
    }
    });
  }

  setupXmlPreviewToggle();
  setupXmlPreviewCopy();
  setupXmlPreviewSearch();
  

// Add saveState event listeners
if (elements.subjectInput) elements.subjectInput.addEventListener('input', saveState);
if (elements.linkInput) elements.linkInput.addEventListener('input', saveState);
if (elements.conversationSelect) {
  elements.conversationSelect.addEventListener('change', () => {
    if (elements.conversationCustom) {
      const isCustom = elements.conversationSelect.value === '__custom__';
      elements.conversationCustom.hidden = !isCustom;
      if (isCustom) {
        elements.conversationCustom.disabled = !elements.conversationEnabled?.checked;
        elements.conversationCustom.focus();
      }
    }
    saveState();
  });
}
if (elements.conversationCustom) elements.conversationCustom.addEventListener('input', saveState);
if (elements.conversationEnabled) {
  elements.conversationEnabled.addEventListener('change', () => {
    const enabled = elements.conversationEnabled.checked;
    if (elements.conversationSelect) elements.conversationSelect.disabled = !enabled;
    if (elements.conversationCustom) {
      elements.conversationCustom.disabled = !enabled;
      if (!enabled) elements.conversationCustom.hidden = true;
    }
    saveState();
  });
}

/* Campaign ID Format Validation */
function validateCampaignIdFormat(campaignId) {
  if (!campaignId || campaignId.trim() === '') return { valid: false, error: '' };
  
  // Regex for YYYYMMDD[X]_NAMA-CAMPAIGN_XXX or XXXX format
  // YYYYMMDD = 8 digits
  // [X] = optional single letter (A-Z)
  // _ = underscore
  // NAMA-CAMPAIGN = letters, numbers, hyphens, underscores (at least 1 char)
  // _XXX or _XXXX = underscore + 3 or 4 digits
  const formatRegex = /^\d{8}[A-Z]?_[A-Za-z0-9\-_]+_\d{3,4}$/;
  
  // Debug regex
  console.log('Testing regex for:', campaignId);
  console.log('Regex test result:', formatRegex.test(campaignId));
  
  if (!formatRegex.test(campaignId)) {
    return { 
      valid: false, 
      error: 'Format harus: YYYYMMDD[X]_NAMA-CAMPAIGN_XXX atau XXXX (3-4 digit)' 
    };
  }
  
  // Format is valid, no additional digit validation needed
  
  // Extract and validate date part (YYYYMMDD)
  const datePart = campaignId.substring(0, 8);
  const year = parseInt(datePart.substring(0, 4));
  const month = parseInt(datePart.substring(4, 6));
  const day = parseInt(datePart.substring(6, 8));
  
  if (year < 2020 || year > 2030 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { 
      valid: false, 
      error: 'Tanggal tidak valid (YYYYMMDD)' 
    };
  }
  
  // Check if date is before today (past date) or after today (future date)
  const campaignDate = new Date(year, month - 1, day);
  const today = new Date();
  
  // Normalize both dates to midnight to avoid timezone issues
  const campaignDateNormalized = new Date(campaignDate.getFullYear(), campaignDate.getMonth(), campaignDate.getDate());
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const isPastDate = campaignDateNormalized < todayNormalized;
  const isToday = campaignDateNormalized.getTime() === todayNormalized.getTime();
  const isFutureDate = campaignDateNormalized > todayNormalized;
  
  // Debug logging
  console.log('Campaign ID:', campaignId);
  console.log('Campaign Date:', campaignDateNormalized.toDateString());
  console.log('Today:', todayNormalized.toDateString());
  console.log('Is Past Date:', isPastDate);
  console.log('Is Today:', isToday);
  console.log('Is Future Date:', isFutureDate);
  
  // Past dates and future dates both show warnings
  if (isPastDate) {
    return { 
      valid: true,  
      error: '',
      isPastDate: true,  
      isToday: isToday,
      isFutureDate: false,
      campaignDate: campaignDate
    };
  }
  
  if (isFutureDate) {
    return { 
      valid: true,  
      error: '',
      isPastDate: false,  
      isToday: false,
      isFutureDate: true,
      campaignDate: campaignDate
    };
  }
  
  return { 
    valid: true, 
    error: '',
    isToday: isToday,
    campaignDate: campaignDate
  };
}

/* Live validation CampaignID → Link - Optimized */
function extractCountByCampaignId(campaignId) {
  if (!xmlDoc || !campaignId || campaignId.trim() === '') return 0;
  let count = 0;
  
  xmlDoc.querySelectorAll('AudienceModel').forEach((el) => {
    const name = el.getAttribute('name');
    if (name === campaignId) count++;
  });
  
  xmlDoc.querySelectorAll('Campaign').forEach((el) => {
    const name = el.getAttribute('name');
    const audience = el.getAttribute('audience');
    if (name === campaignId) count++;
    if (audience === campaignId) count++;
  });
  
  xmlDoc.querySelectorAll('Interaction').forEach((el) => {
    const name = el.getAttribute('name');
    const message = el.getAttribute('message');
    if (name === campaignId) count++;
    if (message === campaignId) count++;
  });
  
  xmlDoc.querySelectorAll('MessageContent').forEach((el) => {
    const name = el.getAttribute('name');
    if (name === campaignId) count++;
  });
  
  xmlDoc.querySelectorAll('FilterValue').forEach((el) => {
    const value = el.getAttribute('value');
    if (value === campaignId) count++;
  });
  
  return count;
}

function updateCampaignCountIndicator(campaignId) {
  const n = extractCountByCampaignId(campaignId);
  const indicator = elements.campaignCountIndicator;
  
  if (!indicator) return;
  
  // Remove all state classes
  indicator.classList.remove('low', 'complete');
  
  // Remove any inline styles that might interfere with CSS
  indicator.style.backgroundColor = '';
  indicator.style.color = '';
  
  // Also update all char count indicators
  const charCountIds = ['campaignIdCharCount', 'subjectCharCount', 'linkCharCount'];
  charCountIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.remove('applied', 'saved');
    }
  });
  
  // Determine state and class
  if (!campaignId || !xmlDoc) {
    // No campaign loaded - default state (no classes added)
    // CSS will handle default styling with :not(.low):not(.complete)
  } else {
    // Campaign loaded - use state-based colors
    switch (campaignIndicatorState) {
      case 'saved':
        indicator.classList.add('complete');
        charCountIds.forEach(id => {
          const element = document.getElementById(id);
          if (element) element.classList.add('saved');
        });
        break;
      case 'applied':
        indicator.classList.add('low');
        charCountIds.forEach(id => {
          const element = document.getElementById(id);
          if (element) element.classList.add('applied');
        });
        break;
      case 'default':
      default:
        // Default state - no special class
        break;
    }
  }
  
  // Update content and tooltip
  indicator.innerHTML = `<span>${n}/7</span>`;
  indicator.title = `${n}/7 - State: ${campaignIndicatorState}`;
}

if (elements.subjectInput) {
  elements.subjectInput.addEventListener('input', () => {
    // Sembunyikan ikon ketika user mengubah input
    clearStatusIcon('subjectCheckmark');
    const cc = document.getElementById('subjectCharCount');
    const wrapper = document.querySelector('.input-wrapper.subject-field');
    
    if (cc) {
      const length = (elements.subjectInput.value || '').length;
      cc.textContent = length;
    }
  });
  
  // Add focus effects
  elements.subjectInput.addEventListener('focus', () => {
    const wrapper = document.querySelector('.input-wrapper.subject-field');
    if (wrapper) {
      wrapper.classList.add('focused');
    }
  });
  
  elements.subjectInput.addEventListener('blur', () => {
    const wrapper = document.querySelector('.input-wrapper.subject-field');
    if (wrapper) {
      wrapper.classList.remove('focused');
    }
  });
}

if (elements.linkInput) {
  elements.linkInput.addEventListener('input', () => {
    // Skip tooltip validation during page initialization
    if (isPageInitializing) return;
    
    let linkValue = elements.linkInput.value.trim();
    const isEmpty = linkValue === '';
    
    // Auto-convert https to http while typing
    if (linkValue.startsWith('https://mail.hsbc.com.hk')) {
      linkValue = 'http://' + linkValue.substring(8);
      elements.linkInput.value = linkValue;
    }
    
    // Clear previous states
    elements.linkInput.classList.remove('error');
    elements.linkInput.title = '';
    
    // Clear link field validation states
    const linkFieldContainer = document.querySelector('.field.link-field');
    if (linkFieldContainer) {
      linkFieldContainer.classList.remove('validation-error', 'mismatch-error');
      const validationTooltip = linkFieldContainer.querySelector('.validation-tooltip');
      const mismatchTooltip = linkFieldContainer.querySelector('.mismatch-tooltip');
      if (validationTooltip) {
        validationTooltip.textContent = '';
        validationTooltip.style.opacity = '0';
      }
      if (mismatchTooltip) {
        mismatchTooltip.textContent = '';
        mismatchTooltip.style.opacity = '0';
      }
    }
    
    // Validate link format if not empty
    if (!isEmpty) {
      const linkValidation = validateLinkFormat(linkValue);
      if (!linkValidation.valid) {
        elements.linkInput.classList.add('error');
        elements.linkInput.title = linkValidation.error;
        
        // Show validation tooltip
        if (linkFieldContainer) {
          linkFieldContainer.classList.add('validation-error');
          const validationTooltip = linkFieldContainer.querySelector('.validation-tooltip');
          if (validationTooltip) {
            validationTooltip.textContent = linkValidation.error;
            validationTooltip.style.opacity = '1';
            
            // DEBUG: Log link validation tooltip
            console.log('\ud83d\udd17 LINK VALIDATION TOOLTIP SHOWN:', {
              error: linkValidation.error,
              isPageInitializing,
              bodyClasses: document.body.className
            });
          }
        }
      }
      
      // Perform mismatch validation if both campaign ID and link have values AND campaign ID is valid
      const campaignId = elements.campaignIdInput ? elements.campaignIdInput.value.trim() : '';
      const campaignValidation = campaignId ? validateCampaignIdFormat(campaignId) : null;
      if (campaignId && linkValue && campaignValidation && campaignValidation.valid) {
        console.log('Performing mismatch validation from link input...');
        const mismatchResult = validateCampaignLinkMismatch(campaignId, linkValue);
        console.log('Mismatch result:', mismatchResult);
        
        const campaignFieldContainer = document.querySelector('.field.campaign-id-field');
        
        if (mismatchResult.hasMismatch) {
          console.log('MISMATCH DETECTED - showing mismatch tooltips');
          
          // Add mismatch error class to both fields
          if (campaignFieldContainer) {
            campaignFieldContainer.classList.add('mismatch-error');
            const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
            if (mismatchTooltip) {
              mismatchTooltip.textContent = TOOLTIP_MESSAGES.mismatch.details(mismatchResult.expected, mismatchResult.found);
              mismatchTooltip.style.opacity = '1';
              mismatchTooltip.style.background = '#eab308';
              mismatchTooltip.style.transform = 'translateY(0)';
            }
          }
          
          if (linkFieldContainer) {
            linkFieldContainer.classList.add('mismatch-error');
            const mismatchTooltip = linkFieldContainer.querySelector('.mismatch-tooltip');
            if (mismatchTooltip) {
              mismatchTooltip.textContent = TOOLTIP_MESSAGES.mismatch.details(mismatchResult.expected, mismatchResult.found);
              mismatchTooltip.style.opacity = '1';
              mismatchTooltip.style.background = '#eab308';
            }
          }
          
          // Manage tooltip collision for campaign field
          if (campaignFieldContainer) {
            manageTooltipCollision(campaignFieldContainer);
          }
        } else {
          console.log('NO MISMATCH - clearing mismatch tooltips');
          
          // Remove mismatch error class and tooltips
          if (campaignFieldContainer) {
            campaignFieldContainer.classList.remove('mismatch-error');
            const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
            if (mismatchTooltip) {
              mismatchTooltip.style.opacity = '0';
            }
            manageTooltipCollision(campaignFieldContainer);
          }
          
          if (linkFieldContainer) {
            linkFieldContainer.classList.remove('mismatch-error');
            const mismatchTooltip = linkFieldContainer.querySelector('.mismatch-tooltip');
            if (mismatchTooltip) {
              mismatchTooltip.style.opacity = '0';
            }
          }
        }
      }
    } else {
      // Also clear mismatch from campaign field when link is empty
      const campaignFieldContainer = document.querySelector('.field.campaign-id-field');
      if (campaignFieldContainer) {
        campaignFieldContainer.classList.remove('mismatch-error');
        const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
        if (mismatchTooltip) {
          mismatchTooltip.style.opacity = '0';
        }
        manageTooltipCollision(campaignFieldContainer);
      }
    }
    
    // Update character count
    const cc = document.getElementById('linkCharCount');
    if (cc) {
      const length = elements.linkInput.value.length;
      cc.textContent = length;
    }
    
    // Update checkmark visibility
    const wrapper = document.querySelector('.input-wrapper.link-field');
    if (wrapper) {
      const length = elements.linkInput.value.length;
      if (length > 0) {
        wrapper.classList.add('checkmark-visible');
      } else {
        wrapper.classList.remove('checkmark-visible');
      }
    }
  });
  
  // Add focus effects
  elements.linkInput.addEventListener('focus', () => {
    const wrapper = document.querySelector('.input-wrapper.link-field');
    if (wrapper) {
      wrapper.classList.add('focused');
    }
  });
  
  // Add paste event to auto-convert https to http
  elements.linkInput.addEventListener('paste', (e) => {
    // Skip during page initialization
    if (isPageInitializing) return;
    
    // Use setTimeout to wait for the paste to complete
    setTimeout(() => {
      let linkValue = elements.linkInput.value.trim();
      
      // Auto-convert https to http
      if (linkValue.startsWith('https://mail.hsbc.com.hk')) {
        linkValue = 'http://' + linkValue.substring(8);
        elements.linkInput.value = linkValue;
        
        // Trigger input event to revalidate
        const event = new Event('input', { bubbles: true });
        elements.linkInput.dispatchEvent(event);
      }
    }, 10);
  });
  
  elements.linkInput.addEventListener('blur', () => {
    const wrapper = document.querySelector('.input-wrapper.link-field');
    if (wrapper) {
      wrapper.classList.remove('focused');
    }
  });
}

/* Editor helper */
function updateEditor() {
  if (!xmlDoc) { 
    if (elements.editor) elements.editor.setValue(''); 
    return; 
  }
  const serializer = new XMLSerializer();
  let updatedXmlStr = serializer.serializeToString(xmlDoc);
  updatedXmlStr = formatXml(updatedXmlStr);
  if (elements.editor) elements.editor.setValue(updatedXmlStr);
}

/* Pretty-print XML */
function formatXml(xml) {
  let formatted = '';
  xml = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3');
  let pad = 0;
  xml.split('\r\n').forEach((node) => {
    let indent = 0;
    if (/.+<\/\w[^>]*>$/.test(node)) indent = 0;
    else if (/^<\/\w/.test(node)) { if (pad !== 0) pad -= 1; }
    else if (/^<\w[^>]*[^\/]?>.*$/.test(node)) indent = 1;
    let padding = ''; for (let i = 0; i < pad; i++) padding += '  ';
    formatted += padding + node + '\r\n'; pad += indent;
  });
  return formatted.trim();
}

// Enhanced save/load state with search persistence
function saveState() {
  const state = {
    campaignId: elements.campaignIdInput ? elements.campaignIdInput.value : '',
    subject: elements.subjectInput ? elements.subjectInput.value : '',
    link: elements.linkInput ? elements.linkInput.value : '',
    xmlContent: elements.editor ? elements.editor.getValue() : '',
    folderOpened: typeof currentDirHandle !== 'undefined' && currentDirHandle !== null
  };
  localStorage.setItem('config_state', JSON.stringify(state));
}

function loadState() {
  console.log('\ud83d\udd04 LOAD STATE START:', { isPageInitializing });
  
  const saved = localStorage.getItem('config_state');
  if (!saved) { 
    if (typeof decorateButtons === 'function') decorateButtons(); 
    return; 
  }
  try {
    const state = JSON.parse(saved);
    if (state.xmlContent) loadXmlFromText(state.xmlContent, { suppressAlert: true, suppressTooltips: true });
    
    // Always load form values even without xmlDoc
    if (elements.campaignIdInput) {
      console.log('\ud83d\udcdd SETTING FORM VALUES:', {
        campaignId: state.campaignId,
        subject: state.subject,
        link: state.link,
        isPageInitializing
      });
      
      elements.campaignIdInput.value = state.campaignId || '';
      elements.subjectInput.value = state.subject || '';
      elements.linkInput.value = state.link || '';
      updateCampaignCountIndicator(elements.campaignIdInput.value);
      
      // Update character counts on load
      updateAllCharCounts();
      
      // Don't show tooltips on page load - only show on user interaction
      // Just validate the fields without showing tooltips
      const campaignId = state.campaignId || '';
      const link = state.link || '';
      
      if (campaignId) {
        // Validate Campaign ID format but don't show tooltips
        const formatValidation = validateCampaignIdFormat(campaignId);
        
        // Only set title if invalid, but don't show tooltip or add classes
        if (!formatValidation.valid) {
          if (elements.campaignIdInput) {
            elements.campaignIdInput.title = formatValidation.error;
          }
        }
      }
      
      // Validate Link format but don't show tooltips
      if (link) {
        const linkValidation = validateLinkFormat(link);
        
        // Only set title if invalid, but don't show tooltip or add classes
        if (!linkValidation.valid) {
          if (elements.linkInput) {
            elements.linkInput.title = linkValidation.error;
          }
        }
      }
    }
  } catch (e) {
    console.log('Error loading state', 'error');
  } finally {
    if (typeof decorateButtons === 'function') decorateButtons(); // ensure emojis added
  }
}

// Function to update all character counts
function updateAllCharCounts() {
  // Update Campaign ID count
  const campaignIdCC = document.getElementById('campaignIdCharCount');
  if (campaignIdCC && elements.campaignIdInput) {
    const length = elements.campaignIdInput.value.length;
    campaignIdCC.textContent = length;
  }
  
  // Update Subject count
  const subjectCC = document.getElementById('subjectCharCount');
  if (subjectCC && elements.subjectInput) {
    const length = elements.subjectInput.value.length;
    subjectCC.textContent = length;
  }
  
  // Update Link count
  const linkCC = document.getElementById('linkCharCount');
  if (linkCC && elements.linkInput) {
    const length = elements.linkInput.value.length;
    linkCC.textContent = length;
  }
}

// === Optimized Campaign ID Tooltip Management ===
let campaignIdTooltipTimeout = null;

function showCampaignIdTooltip(message, type = 'validation', options = {}) {
  // DEBUG: Log exactly when this is called
  console.log('\ud83d\udea8 TOOLTIP SHOW CALLED:', {
    message,
    type,
    isPageInitializing,
    bodyClasses: document.body.className,
    stackTrace: new Error().stack
  });
  
  // Use the warning tooltip for all campaign ID messages to combine them
  const tooltip = document.getElementById('campaignIdWarningTooltip');
  if (!tooltip) return;
  
  // Clear any existing timeout
  if (campaignIdTooltipTimeout) {
    clearTimeout(campaignIdTooltipTimeout);
    campaignIdTooltipTimeout = null;
  }
  
  // Set message with optional prefix
  let displayMessage = message;
  if (options.prefix) {
    displayMessage = `${options.prefix} ${message}`;
  }
  if (options.suffix) {
    displayMessage = `${message} ${options.suffix}`;
  }
  tooltip.textContent = displayMessage;
  
  // Set color based on type
  const colors = {
    error: { bg: '#dc2626', text: 'white' },
    validation: { bg: '#dc2626', text: 'white' },
    warning: { bg: '#eab308', text: '#000' },
    past: { bg: '#eab308', text: '#000' },
    future: { bg: '#eab308', text: '#000' },
    today: { bg: '#22c55e', text: '#fff' },
    mismatch: { bg: '#eab308', text: '#000' },
    info: { bg: '#3b82f6', text: 'white' },
    success: { bg: '#22c55e', text: 'white' }
  };
  
  const color = colors[type] || colors.error;
  tooltip.style.background = color.bg;
  tooltip.style.color = color.text;
  
  // Add icon if specified
  if (options.icon) {
    const iconHtml = `<i class="fa-solid ${options.icon}" style="margin-right: 4px;"></i>`;
    tooltip.innerHTML = iconHtml + tooltip.textContent;
  }
  
  // Position tooltip with better alignment
  const input = document.getElementById('campaignId');
  if (input && options.autoPosition !== false) {
    const inputRect = input.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Adjust horizontal position if needed
    if (inputRect.left + tooltipRect.width > window.innerWidth) {
      tooltip.style.right = '0';
      tooltip.style.left = 'auto';
    } else {
      tooltip.style.left = '0';
      tooltip.style.right = 'auto';
    }
  }
  
  // Show tooltip with smooth animation
  tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  tooltip.style.transform = 'translateY(0)';
  tooltip.style.opacity = '1';
  
  // DEBUG: Log when tooltip is actually shown
  console.log('\u2705 TOOLTIP ACTUALLY SHOWN:', {
    message,
    opacity: tooltip.style.opacity,
    display: window.getComputedStyle(tooltip).display,
    bodyClasses: document.body.className
  });
  
  // Auto-hide after specified duration
  if (options.autoHide && options.autoHide > 0) {
    campaignIdTooltipTimeout = setTimeout(() => {
      hideCampaignIdTooltip();
    }, options.autoHide);
  }
  
  // Add pulse animation for important messages
  if (options.pulse) {
    tooltip.style.animation = 'pulse 1s ease-in-out';
  }
}

function hideCampaignIdTooltip() {
  // Hide the warning tooltip (now used for all messages)
  const tooltip = document.getElementById('campaignIdWarningTooltip');
  
  // Also hide mismatch tooltip
  const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
  
  // Clear any existing timeout
  if (campaignIdTooltipTimeout) {
    clearTimeout(campaignIdTooltipTimeout);
    campaignIdTooltipTimeout = null;
  }
  
  // Hide tooltips with smooth animation
  [tooltip, mismatchTooltip].forEach(t => {
    if (t) {
      t.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      t.style.opacity = '0';
      t.style.transform = 'translateY(2px)';
      
      // Remove animation
      t.style.animation = '';
    }
  });
}

// Enhanced tooltip messages with context
const TOOLTIP_MESSAGES = {
  validation: {
    format: 'Format harus: YYYYMMDD_NAMA-CAMPAIGN_XXX atau XXXX (3-4 digit)',
    space: 'Campaign ID tidak boleh mengandung spasi',
    length: 'Campaign ID terlalu panjang (maks 50 karakter)',
    empty: 'Campaign ID tidak boleh kosong'
  },
  warning: {
    past: '⚠️ reminder: tanggal sudah jatuh tempo',
    future: 'ℹ️ info: campaign masa depan',
    today: '✅ Campaign tanggal hari ini'
  },
  mismatch: {
    simple: 'Campaign ID dan Link berbeda',
    details: (expected, found) => `❌ Mismatch: expected "${expected}" but found "${found}"`
  },
  success: {
    valid: '✓ Format Campaign ID valid',
    matched: '✓ Campaign ID dan Link cocok'
  }
};

// Quick show functions for common cases
function showValidationError(message) {
  showCampaignIdTooltip(message, 'validation', { icon: 'fa-exclamation-circle' });
}

function showWarning(message) {
  showCampaignIdTooltip(message, 'warning', { });
}

function showSuccess(message) {
  showCampaignIdTooltip(message, 'success', { icon: 'fa-check-circle', autoHide: 3000 });
}

function showMismatch(expected, found) {
  showCampaignIdTooltip(
    TOOLTIP_MESSAGES.mismatch.details(expected, found),
    'mismatch',
    { icon: 'fa-code-compare' }
  );
}

// === Tooltip Collision Management ===
function manageTooltipCollision(fieldContainer) {
  console.log('=== manageTooltipCollision START ===');
  if (!fieldContainer) {
    console.log('No fieldContainer, returning');
    return;
  }
  
  // For campaign ID field, handle collision between warning and mismatch tooltips
  if (fieldContainer.classList.contains('campaign-id-field')) {
    console.log('Managing tooltip collision for campaign ID field');
    
    const warningTooltip = document.getElementById('campaignIdWarningTooltip');
    const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
    
    // Check which tooltips should be visible
    const hasWarning = fieldContainer.classList.contains('past-date-warning') || 
                      fieldContainer.classList.contains('today-warning') ||
                      fieldContainer.classList.contains('future-date-warning') ||
                      fieldContainer.classList.contains('validation-error');
    const hasMismatch = fieldContainer.classList.contains('mismatch-error');
    
    console.log('Tooltip states:', { hasWarning, hasMismatch });
    
    // Position tooltips to avoid collision
    if (hasMismatch && hasWarning) {
      // Show both - stack them vertically
      if (warningTooltip) {
        warningTooltip.style.bottom = '100%';
        warningTooltip.style.marginBottom = '8px';
        warningTooltip.style.opacity = '1';
        warningTooltip.style.transform = 'translateY(0)';
      }
      if (mismatchTooltip) {
        mismatchTooltip.style.bottom = 'calc(100% + 30px)'; // Position above warning
        mismatchTooltip.style.marginBottom = '8px';
        mismatchTooltip.style.opacity = '1';
        mismatchTooltip.style.transform = 'translateY(0)';
      }
    } else if (hasMismatch && !hasWarning) {
      // Show only mismatch
      if (mismatchTooltip) {
        mismatchTooltip.style.bottom = '100%';
        mismatchTooltip.style.marginBottom = '8px';
        mismatchTooltip.style.opacity = '1';
        mismatchTooltip.style.transform = 'translateY(0)';
      }
      if (warningTooltip) warningTooltip.style.opacity = '0';
    } else if (hasWarning && !hasMismatch) {
      // Show only warning
      if (warningTooltip) {
        warningTooltip.style.bottom = '100%';
        warningTooltip.style.marginBottom = '8px';
        warningTooltip.style.opacity = '1';
        warningTooltip.style.transform = 'translateY(0)';
      }
      if (mismatchTooltip) mismatchTooltip.style.opacity = '0';
    } else {
      // Hide both
      if (warningTooltip) warningTooltip.style.opacity = '0';
      if (mismatchTooltip) mismatchTooltip.style.opacity = '0';
    }
  }
  
  console.log('=== manageTooltipCollision END ===');
}

// === Apply Update combo button ===
(function(){
  const applyUpdateBtn = document.getElementById('applyUpdateBtn');
  if (applyUpdateBtn) {
    applyUpdateBtn.addEventListener('click', async () => {
      // Check if button is disabled
      if (applyUpdateBtn.disabled) {
        console.log('Apply button is disabled, ignoring click');
        return;
      }
      
      // Check if XML is loaded before applying updates
      if (!xmlDoc) {
        console.log("No XML loaded");
        return;
      }
      
      // Disable button and show loading state
      applyUpdateBtn.disabled = true;
      const originalContent = applyUpdateBtn.innerHTML;
      applyUpdateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying & Saving...';
      
      let allValid = true;
      let updateCount = 0;
      let hasChanges = false;
      
      // Get current values from XML
      let currentCampaignId = xmlDoc.querySelector('AudienceModel')?.getAttribute('name') || '';
      const currentSubject = xmlDoc.querySelector('MessageContent')?.getAttribute('subject') || '';
      const currentLink = xmlDoc.querySelector('MessageBody')?.getAttribute('content') || '';
      
      // Get input values
      const campaignIdValue = elements.campaignIdInput ? elements.campaignIdInput.value.trim() : '';
      const subjectValue = elements.subjectInput ? elements.subjectInput.value.trim() : '';
      const linkValue = elements.linkInput ? elements.linkInput.value.trim() : '';
      const convValue = elements.conversationSelect?.value === '__custom__'
        ? (elements.conversationCustom?.value?.trim() || '')
        : (elements.conversationSelect?.value || '');
      
      // Check if Campaign ID has changes
      if (campaignIdValue && campaignIdValue !== currentCampaignId) {
        hasChanges = true;
        const hasSpace = /\s/.test(campaignIdValue);
        const formatValidation = validateCampaignIdFormat(campaignIdValue);
        
        if (!hasSpace && formatValidation.valid) {
          // Update AudienceModel
          const audienceModel = xmlDoc.querySelector('AudienceModel');
          if (audienceModel) audienceModel.setAttribute('name', campaignIdValue);
          
          // Update Campaign
          const campaign = xmlDoc.querySelector('Campaign');
          if (campaign) {
            campaign.setAttribute('name', campaignIdValue);
            campaign.setAttribute('audience', campaignIdValue);
          }
          
          // Update Interaction elements
          xmlDoc.querySelectorAll('Interaction').forEach(el => {
            if (el.getAttribute('name') === currentCampaignId) {
              el.setAttribute('name', campaignIdValue);
            }
            if (el.getAttribute('message') === currentCampaignId) {
              el.setAttribute('message', campaignIdValue);
            }
          });
          
          // Update MessageContent elements
          xmlDoc.querySelectorAll('MessageContent').forEach(el => {
            if (el.getAttribute('name') === currentCampaignId) {
              el.setAttribute('name', campaignIdValue);
            }
          });
          
          // Update FilterValue elements
          xmlDoc.querySelectorAll('FilterValue').forEach(el => {
            if (el.getAttribute('value') === currentCampaignId) {
              el.setAttribute('value', campaignIdValue);
            }
          });
          
          currentCampaignId = campaignIdValue;
          updateCampaignCountIndicator(campaignIdValue);
          setStatusIcon('campaignIdCheckmark', 'ok');
          updateCount++;
        } else {
          allValid = false;
          if (elements.campaignIdInput) elements.campaignIdInput.classList.add('error');
        }
      }
      
      // Check if Subject has changes
      if (subjectValue && subjectValue !== currentSubject) {
        hasChanges = true;
        const result = normalizeKrhredTokens(subjectValue);
        const normalized = (result.text || '').trim();
        
        if (!result.missingDetected && normalized !== '') {
          const messageContent = xmlDoc.querySelector('MessageContent');
          if (messageContent) {
            messageContent.setAttribute('subject', normalized);
            if (elements.subjectInput) elements.subjectInput.value = normalized;
            setStatusIcon('subjectCheckmark', 'ok');
            updateCount++;
          }
        } else {
          allValid = false;
          if (elements.subjectInput) elements.subjectInput.classList.add('error');
          setStatusIcon('subjectCheckmark', 'error');
        }
      }
      
      // Check if Link has changes
      if (linkValue && linkValue !== currentLink) {
        hasChanges = true;
        
        // Validate link format
        const linkValidation = validateLinkFormat(linkValue);
        if (!linkValidation.valid) {
          allValid = false;
          if (elements.linkInput) {
            elements.linkInput.classList.add('error');
            elements.linkInput.title = linkValidation.error;
          }
          // Show validation tooltip
          const linkFieldContainer = document.querySelector('.field.link-field');
          if (linkFieldContainer) {
            linkFieldContainer.classList.add('validation-error');
            const validationTooltip = linkFieldContainer.querySelector('.validation-tooltip');
            if (validationTooltip) {
              validationTooltip.textContent = linkValidation.error;
              validationTooltip.style.opacity = '1';
            }
          }
        } else {
          const urlPattern = /^(http:\/\/|https:\/\/).+/i;
          if (urlPattern.test(linkValue)) {
            let finalLink = linkValue;
            if (finalLink.startsWith('https://')) finalLink = 'http://' + finalLink.substring(8);
            
            const messageBody = xmlDoc.querySelector('MessageBody');
            if (messageBody) {
              messageBody.setAttribute('content', finalLink);
              if (elements.linkInput) elements.linkInput.value = finalLink;
              setStatusIcon('linkCheckmark', 'ok');
              updateCount++;
            }
          }
        }
      }
      
      // Check if Conversation has changes (only if checkbox is enabled)
      if (elements.conversationEnabled?.checked && convValue) {
        const currentConv = xmlDoc.querySelector('Conversation')?.getAttribute('name') || '';
        if (convValue !== currentConv) {
          hasChanges = true;
          const conversation = xmlDoc.querySelector('Conversation');
          if (conversation) {
            conversation.setAttribute('name', convValue);
            const desc = getConversationDescription(convValue);
            if (desc) conversation.setAttribute('Description', desc);
            else conversation.removeAttribute('Description');
            updateCount++;
          }
          const campaign = xmlDoc.querySelector('Campaign');
          if (campaign) {
            campaign.setAttribute('conversation', convValue);
          }
        }
      }
      
      // Update editor first, then show notification only if there were changes
      if (hasChanges) {
        if (updateCount > 0) {
          // Update xmlDoc and editor first
          updateEditor();
          
          // Update the xmlContent in saveState to reflect changes
          saveState();
          
          // Re-initialize fields to sync with updated XML
          initializeFields();
          
          // Refresh XML preview
          updateXmlWorkflow();
          
          // Update button states after re-initializing fields
          updateSaveAndApplyButtons();
          
          // Show notification after XML is updated
          console.log(`Successfully applied ${updateCount} update(s)!`);
          setCampaignIndicatorState('applied');
          
          // Update character counts after applying changes
          updateAllCharCounts();
          
          // Mark that we have unsaved changes (applied but not saved)
          hasUnsavedChanges = true;
          
          // Update original values to reflect the applied state
          storeOriginalValues();
          
          // Re-mark as unsaved since storeOriginalValues resets it
          hasUnsavedChanges = true;
          
          // Disable apply button after successful use
          updateSaveAndApplyButtons();
          lockAllConfigFields();
          try {
            await performSave();
            setFileStatus('saved', 'Applied & saved');
          } catch (saveError) {
            console.error('Failed to save applied XML:', saveError);
            setFileStatus('error', 'Save failed');
          }
        } else {
          console.log('No valid updates to apply');
        }
      } else {
        console.log('No changes detected');
      }
      
      // Re-enable button and restore original content only if there was an error
      if (!hasChanges || updateCount === 0) {
        setTimeout(() => {
          applyUpdateBtn.disabled = false;
          applyUpdateBtn.innerHTML = originalContent;
        }, 500);
      } else {
        // If successful, keep button disabled - updateSaveAndApplyButtons will handle it
        setTimeout(() => {
          applyUpdateBtn.innerHTML = originalContent;
          updateSaveAndApplyButtons(); // Ensure button stays disabled
        }, 500);
      }
    });
  }
})();

// === Auto Save with Toast ===
let autoSaveTimer = null;
const AUTO_SAVE_DELAY = 2000; // 2 seconds after change

// Track campaign count indicator state
let campaignIndicatorState = 'default'; // 'default' | 'applied' | 'saved'

function setCampaignIndicatorState(state) {
  campaignIndicatorState = state;
  
  // Update campaign count indicator
  if (elements.campaignIdInput && elements.campaignIdInput.value) {
    updateCampaignCountIndicator(elements.campaignIdInput.value);
  }
  
  // Update all char count indicators
  const charCountIds = ['campaignIdCharCount', 'subjectCharCount', 'linkCharCount'];
  charCountIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      // Remove all state classes
      element.classList.remove('applied', 'saved');
      
      // Add appropriate class based on state
      if (state === 'applied') {
        element.classList.add('applied');
      } else if (state === 'saved') {
        element.classList.add('saved');
      }
      // For 'default' state, no class is added
    }
  });
}

// Auto save function with toast notification
async function autoSave() {
  if (!window.fileHandle) {
    console.log('No file handle, skipping auto save');
    return;
  }
  
  try {
    console.log('Auto saving...');
    await performSave();
    
    setCampaignIndicatorState('saved');
  } catch (error) {
    console.error('Auto save failed:', error);
    setFileStatus('error', 'Save failed');
  }
}

// Trigger auto save with delay
function triggerAutoSave() {
  // Clear existing timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  // Set new timer
  autoSaveTimer = setTimeout(() => {
    autoSave();
  }, AUTO_SAVE_DELAY);
}

// === Button State Management ===
function updateSaveAndApplyButtons() {
  const saveBtn = document.getElementById('saveFileBtn');
  const applyBtn = document.getElementById('applyUpdateBtn');
  
  // Check if any field has validation errors
  const hasCampaignIdError = elements.campaignIdInput ? elements.campaignIdInput.classList.contains('error') : false;
  const hasSubjectError = elements.subjectInput ? elements.subjectInput.classList.contains('error') : false;
  const hasLinkError = elements.linkInput ? elements.linkInput.classList.contains('error') : false;
  
  // Check if fields are empty (optional - remove if you want to allow empty)
  const isCampaignIdEmpty = elements.campaignIdInput ? !elements.campaignIdInput.value.trim() : true;
  const isSubjectEmpty = elements.subjectInput ? !elements.subjectInput.value.trim() : true;
  const isLinkEmpty = elements.linkInput ? !elements.linkInput.value.trim() : true;
  
  // Check if there are any changes from original values
  const hasChanges = hasContentChanged();
  
  // Disable buttons if there are errors OR if all fields are empty
  const hasErrors = hasCampaignIdError || hasSubjectError || hasLinkError;
  const allEmpty = isCampaignIdEmpty && isSubjectEmpty && isLinkEmpty;
  
  // Apply button: disable if errors or all empty (allow applying current values even if no changes)
  const shouldDisableApply = hasErrors || allEmpty;
  
  // Save button: disable if errors, all empty, or no unsaved changes
  const shouldDisableSave = hasErrors || allEmpty || !hasUnsavedChanges;
  
  if (saveBtn) {
    saveBtn.disabled = shouldDisableSave;
    if (shouldDisableSave) {
      saveBtn.style.opacity = '0.5';
      saveBtn.style.cursor = 'not-allowed';
    } else {
      saveBtn.style.opacity = '1';
      saveBtn.style.cursor = 'pointer';
    }
  }
  
  if (applyBtn) {
    applyBtn.disabled = shouldDisableApply;
    if (shouldDisableApply) {
      applyBtn.style.opacity = '0.5';
      applyBtn.style.cursor = 'not-allowed';
    } else {
      applyBtn.style.opacity = '1';
      applyBtn.style.cursor = 'pointer';
    }
  }

  updateWorkspaceStatus();
}

// Store original values when file is loaded
function storeOriginalValues() {
  originalValues = {
    campaignId: elements.campaignIdInput ? elements.campaignIdInput.value : '',
    subject: elements.subjectInput ? elements.subjectInput.value : '',
    link: elements.linkInput ? elements.linkInput.value : '',
    xmlContent: elements.editor ? elements.editor.getValue() : ''
  };
  // Reset unsaved changes flag when storing original values
  hasUnsavedChanges = false;
  updateWorkspaceStatus();
}

// Reset original values when no file is loaded
function resetOriginalValues() {
  originalValues = {
    campaignId: '',
    subject: '',
    link: '',
    xmlContent: ''
  };
  hasUnsavedChanges = false;
  updateWorkspaceStatus();
}

// Check if content has changed from original
function hasContentChanged() {
  // If no original values stored, consider as no changes
  if (!originalValues.xmlContent && !originalValues.campaignId && !originalValues.subject && !originalValues.link) {
    return false;
  }
  
  const currentCampaignId = elements.campaignIdInput ? elements.campaignIdInput.value : '';
  const currentSubject = elements.subjectInput ? elements.subjectInput.value : '';
  const currentLink = elements.linkInput ? elements.linkInput.value : '';
  const currentXmlContent = elements.editor ? elements.editor.getValue() : '';
  
  // Check if any field has changed
  return currentCampaignId !== originalValues.campaignId ||
         currentSubject !== originalValues.subject ||
         currentLink !== originalValues.link ||
         currentXmlContent !== originalValues.xmlContent;
}

// Track changes on input - save state only
[elements.campaignIdInput, elements.subjectInput, elements.linkInput].forEach(inp => {
  if (inp) {
    inp.addEventListener('input', () => {
      // Mark as having unsaved changes when user edits
      hasUnsavedChanges = true;
      
      // Performance: Batch DOM updates
      requestAnimationFrame(() => {
        if (elements.saveFileBtn) {
          elements.saveFileBtn.style.borderColor = '';
          elements.saveFileBtn.style.backgroundColor = '';
        }
        debouncedSaveState();
        updateSaveAndApplyButtons(); // Update button states
      });
    });
  }
});

// Track editor changes - save state only
if (elements.editor) {
  elements.editor.on('change', () => {
    // Mark as having unsaved changes when editor content changes
    hasUnsavedChanges = true;
    
    debouncedSaveState();
    updateSaveAndApplyButtons(); // Update button states when editor content changes
  });
}

// Initialize on page load
window.addEventListener('load', () => {
  initializeXmlStorage();
  initializeFieldLocking();
  
  // Check if no folder is active
  if (typeof currentDirHandle === 'undefined' || currentDirHandle === null) {
    clearContentWhenNoFolder();
  }
  
  // Note: loadState() is already called in DOMContentLoaded, don't call it again
  updateSaveAndApplyButtons();
  initializeFileTree();
  restoreConfigFolderState();

  // CRITICAL: Clear tooltips again after all initialization is complete
  // This prevents any tooltips that might have appeared during input restoration
  setTimeout(() => {
    clearAllTooltips();
    
    // Force clear any remaining visual validation states
    const campaignField = document.querySelector('.field.campaign-id-field');
    const linkField = document.querySelector('.field.link-field');
    
    if (campaignField) {
      campaignField.classList.remove('validation-error', 'past-date-warning', 'today-warning', 'future-date-warning', 'mismatch-error');
    }
    
    if (linkField) {
      linkField.classList.remove('validation-error', 'mismatch-error');
    }
    
    // Remove initializing class from body but KEEP TOOLTIPS DISABLED
    document.body.classList.remove('initializing');
    isPageInitializing = false;
    
    // DO NOT ENABLE TOOLTIPS HERE - only enable when XML file is opened
    console.log('\ud83c\udfc1 WINDOW LOAD COMPLETE - TOOLTIPS STILL DISABLED');
  }, 150);

  // Add save button event listener after DOM is loaded
  const saveFileBtn = document.getElementById('saveFileBtn');
  if (saveFileBtn) {
    saveFileBtn.addEventListener('click', async () => {
      console.log('=== SAVE BUTTON CLICKED ===');
      
      // Check if button is disabled
      if (saveFileBtn.disabled) {
        console.log('Save button is disabled, ignoring click');
        return;
      }
      
      // Check if file is opened
      if (!window.fileHandle) {
        setFileStatus('empty', 'No file selected');
        return;
      }
      
      // Prevent double-click/double-save
      saveFileBtn.disabled = true;
      
      // Show loading state on save button AND overlay for visual feedback
      const originalContent = saveFileBtn.innerHTML;
      saveFileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
      if (elements.overlay) {
        elements.overlay.removeAttribute('hidden');
      }
      
      // Set minimum loading duration to ensure user can see the loading state
      const startTime = Date.now();
      const minLoadingDuration = 300; // milliseconds
      
      // Perform save immediately
      try {
        await performSave();
        
        // Ensure minimum loading duration for visual feedback
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadingDuration) {
          await new Promise(resolve => setTimeout(resolve, minLoadingDuration - elapsedTime));
        }
        
        setCampaignIndicatorState('saved');
      } catch (error) {
        console.error("Error saving file:", error);
        setFileStatus('error', 'Save failed');
        
        // Re-enable button on error since save failed
        updateSaveAndApplyButtons();
      } finally {
        // Always reset button appearance and hide overlay
        saveFileBtn.innerHTML = originalContent;
        if (elements.overlay) {
          elements.overlay.setAttribute('hidden', '');
        }
        // Re-enable button for future saves (or updateSaveAndApplyButtons will disable if no changes)
        updateSaveAndApplyButtons();
      }
    });
  }
});

// Clear content section when no folder/file is active
function clearContentWhenNoFolder() {
  console.log('\ud83d\udcc1 CLEAR CONTENT - DISABLING TOOLTIPS');
  setTooltipsEnabled(false);
  // Clear all tooltip states/classes first to avoid stale visible bars.
  clearAllTooltips();

  // Clear form inputs
  if (elements.campaignIdInput) elements.campaignIdInput.value = '';
  if (elements.subjectInput) elements.subjectInput.value = '';
  if (elements.linkInput) elements.linkInput.value = '';
  if (elements.editor) elements.editor.setValue('');
  
  // Update character counts to 0
  updateAllCharCounts();
  
  // Clear XML document
  xmlDoc = null;
  window.fileHandle = null;
  fileHandle = null;
  selectedFileItem = null;
  if (elements.fileMetadata) elements.fileMetadata.textContent = 'Open a folder to begin';
  updateXmlWorkflow();
  
  // Clear localStorage to prevent reload of old values
  localStorage.removeItem('config_state');
  
  // Update breadcrumb
  updateBreadcrumb('No folder');
  
  // Reset indicator
  setCampaignIndicatorState('default');

  // Re-evaluate button state after full reset
  updateSaveAndApplyButtons();
}

// === File Tree Functionality ===
let selectedFileItem = null;

// Initialize file tree
function initializeFileTree() {
  const openFolderBtn = document.getElementById('openFolderBtn');
  const refreshTreeBtn = document.getElementById('refreshTreeBtn');
  const resizeHandle = document.getElementById('resizeHandle');
  const fileTree = document.getElementById('fileTree');
  
  // Show empty state initially
  if (fileTree && !fileTree.hasChildNodes()) {
    fileTree.innerHTML = '<div class="file-tree-empty">No folder opened. Click "Open Folder" to begin.</div>';
  }
  
  if (openFolderBtn) {
    openFolderBtn.addEventListener('click', openFolder);
  }
  
  if (refreshTreeBtn) {
    refreshTreeBtn.addEventListener('click', refreshFileTree);
  }

  if (elements.fileTreeFilter) {
    elements.fileTreeFilter.addEventListener('input', event => {
      filterFileTree(event.target.value);
    });
  }

  if (elements.nextXmlBtn) {
    elements.nextXmlBtn.addEventListener('click', async () => {
      elements.nextXmlBtn.disabled = true;
      try {
        await openAdjacentXml(1);
      } catch (error) {
        console.error('Failed to open next XML:', error);
        setFileStatus('error', 'Next XML failed');
      } finally {
        updateXmlWorkflow();
      }
    });
  }

  if (elements.previousXmlBtn) {
    elements.previousXmlBtn.addEventListener('click', async () => {
      elements.previousXmlBtn.disabled = true;
      try {
        await openAdjacentXml(-1);
      } catch (error) {
        console.error('Failed to open previous XML:', error);
        setFileStatus('error', 'Back failed');
      } finally {
        updateXmlWorkflow();
      }
    });
  }
  
  // Initialize resizable sidebar
  if (resizeHandle) {
    initializeResizableSidebar();
  }

  // Simple event delegation that should work
  if (fileTree) {
    fileTree.addEventListener('click', function(e) {
      // Find the closest li element (could be nested)
      const li = e.target.closest('li');
      if (!li) {
        return;
      }
      
      if (li.classList.contains('folder')) {
        e.stopPropagation();
        e.preventDefault();
        toggleFolder(li);
      } else if (li.classList.contains('file')) {
        e.stopPropagation();
        e.preventDefault();
        selectFile(li, li._fileHandle);
      }
    });
  }
}

// Handle tree click events using event delegation
function handleTreeClick(e) {
  const target = e.target;
  const li = target.closest('li');
  
  if (!li) return;
  
  e.stopPropagation();
  
  if (li.classList.contains('folder')) {
    toggleFolder(li);
  } else if (li.classList.contains('file')) {
    selectFile(li, li._fileHandle);
  }
}

// Initialize resizable sidebar functionality
function initializeResizableSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const resizeHandle = document.getElementById('resizeHandle');
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;
    
    // Apply min and max width constraints
    if (newWidth >= 200 && newWidth <= 500) {
      sidebar.style.width = newWidth + 'px';
      sidebar.style.minWidth = newWidth + 'px';
      sidebar.style.maxWidth = newWidth + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// Open folder using File System Access API
async function openFolder() {
  if (!confirmDiscardChanges()) return;

  const openFolderBtn = document.getElementById('openFolderBtn');
  const setButtonState = (loading, label = 'Open Folder') => {
    if (!openFolderBtn) return;
    openFolderBtn.disabled = loading;
    openFolderBtn.setAttribute('aria-busy', String(loading));
    openFolderBtn.innerHTML = loading
      ? `<i class="fa-solid fa-spinner fa-spin"></i> ${label}`
      : '<i class="fa-solid fa-folder-open"></i> Open Folder';
  };

  setButtonState(true, 'Opening...');
  try {
    if ('showDirectoryPicker' in window) {
      const dirHandle = await window.showDirectoryPicker();
      setButtonState(true, 'Loading...');
      clearContentWhenNoFolder();
      currentDirHandle = dirHandle;
      saveConfigFolderState(dirHandle);
      updateBreadcrumb(dirHandle.name);
      if (elements.fileMetadata) elements.fileMetadata.textContent = 'Select an XML file';
      await loadFileTree(dirHandle);
      console.log(`Folder "${dirHandle.name}" opened successfully`);
    } else {
      console.log('File System Access API not supported in this browser');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.log('Failed to open folder');
    }
  } finally {
    setButtonState(false);
  }
}

// Refresh file tree
async function refreshFileTree() {
  if (currentDirHandle) {
    // Keep refresh behavior clean: do not leave stale tooltip states visible.
    clearAllTooltips();
    await loadFileTree(currentDirHandle);
    console.log('File tree refreshed');
  } else {
    console.log('No folder opened');
    // Clear content when refreshing with no folder
    clearContentWhenNoFolder();
  }
}

// Update breadcrumb
function updateBreadcrumb(folderName) {
  if (elements.breadcrumb) {
    elements.breadcrumb.textContent = folderName || 'No folder';
    elements.breadcrumb.title = folderName || 'No folder';
  }
}

// Load file tree from directory handle
async function loadFileTree(dirHandle) {
  const fileTree = document.getElementById('fileTree');
  if (!fileTree) return;
  
  fileTree.innerHTML = '';
  
  // Reset sidebar to auto-fit when loading new folder
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.style.width = 'auto';
    sidebar.style.minWidth = '200px';
    sidebar.style.maxWidth = '500px';
  }
  
  try {
    // Check if this is folder 'X' - if so, show its contents directly
    if (dirHandle.name.toLowerCase() === 'x') {
      const treeContainer = document.createElement('ul');
      treeContainer.className = 'tree';
      await loadDirectoryChildren(dirHandle, treeContainer);
      fileTree.appendChild(treeContainer);
      
      // Update breadcrumb to show 'X' instead of the actual folder name
      updateBreadcrumb('X');
      console.log(`Showing contents of folder "X"`);
    } else {
      // Normal folder - show folder and its contents
      const treeContainer = document.createElement('ul');
      treeContainer.className = 'tree';
      
      const rootItem = createTreeItem(dirHandle.name, 'folder', dirHandle, true);
      treeContainer.appendChild(rootItem);
      
      // Load children
      const childrenContainer = document.createElement('ul');
      await loadDirectoryChildren(dirHandle, childrenContainer);
      rootItem.appendChild(childrenContainer);
      
      // Auto-expand root folder
      rootItem.classList.add('open');
      
      fileTree.appendChild(treeContainer);
      
      // Update breadcrumb normally
      updateBreadcrumb(dirHandle.name);
    }

    // Removed event delegation setup since we're using direct onclick handlers
    updateFileTreeStats();
    updateXmlWorkflow();
    if (elements.fileTreeFilter) {
      filterFileTree(elements.fileTreeFilter.value);
    }

  } catch (error) {
    console.log('Failed to load file tree');
  }
} // Added closing brace here

// Setup event listeners for the tree after it's built
function setupTreeEventListeners() {
  // Add click handlers for folders
  document.querySelectorAll('.tree li.folder').forEach(li => {
    li.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleFolder(this);
    });
  });
  
  // Add click handlers for files
  document.querySelectorAll('.tree li.file').forEach(li => {
    li.addEventListener('click', function(e) {
      e.stopPropagation();
      selectFile(this, this._fileHandle);
    });
  });
}

// Load directory children recursively
async function loadDirectoryChildren(dirHandle, container) {
  try {
    const entries = [];
    for await (const [name, handle] of dirHandle.entries()) {
      entries.push({ name, handle });
    }

    // Sort: folders first, then files, both alphabetically
    entries.sort((a, b) => {
      const aIsDir = a.handle.kind === 'directory';
      const bIsDir = b.handle.kind === 'directory';
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      const item = createTreeItem(entry.name, entry.handle.kind, entry.handle, false, dirHandle);
      container.appendChild(item);

      if (entry.handle.kind === 'directory') {
        const childrenContainer = document.createElement('ul');
        await loadDirectoryChildren(entry.handle, childrenContainer);
        item.appendChild(childrenContainer);
      }
    }
  } catch (error) {
    console.error('Error loading directory children:', error);
  }
}

// Create tree item element
function createTreeItem(name, type, handle, isRoot = false, parentHandle = null) {
  const item = document.createElement('li');
  // Fix class name - use 'folder' instead of 'directory' for consistency
  item.className = type === 'directory' ? 'folder' : type;

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = name;

  // Add file extension as data attribute for styling
  if (type === 'file') {
    const ext = name.split('.').pop().toLowerCase();
    item.setAttribute('data-ext', ext);
  }

  item.appendChild(label);

  // Only root folder gets expanded by default
  if (type === 'directory' && isRoot) {
    item.classList.add('open');
  }

  // Store handle for files (used by event delegation)
  if (type === 'file') {
    item._fileHandle = handle;
    item._parentHandle = parentHandle;
  }

  return item;
}

// Toggle folder expansion
function toggleFolder(folderItem) {
  folderItem.classList.toggle('open');
}

// Select and load file
async function selectFile(fileItem, fileHandle) {
  if (fileItem !== selectedFileItem && !confirmDiscardChanges()) return;

  console.log('\ud83d\udcc2 SELECT FILE CALLED - ENABLING TOOLTIPS');

  setFileStatus('loading', 'Loading');

  // ENABLE TOOLTIPS when XML file is opened
  setTooltipsEnabled(true);

  // Remove previous selection
  if (selectedFileItem) {
    selectedFileItem.classList.remove('selected');
  }

  // Add selection to current file
  fileItem.classList.add('selected');
    selectedFileItem = fileItem;
    updateXmlWorkflow();

  // Load file content
  try {
    const file = await fileHandle.getFile();
    const content = await file.text();

    // Update global file handle
    window.fileHandle = fileHandle;

    // Load XML content
    loadXmlFromText(content);
    unlockAllConfigFields();

    // Update breadcrumb with file name - reset to folder + file instead of concatenating
    const folderName = elements.breadcrumb ? elements.breadcrumb.textContent.split('\\')[0] : 'No folder';
    updateBreadcrumb(`${folderName}\\${file.name}`);
    if (elements.fileMetadata) {
      const size = file.size < 1024
        ? `${file.size} B`
        : `${(file.size / 1024).toFixed(file.size < 10240 ? 1 : 0)} KB`;
      const modified = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(file.lastModified);
      elements.fileMetadata.textContent = `${size} · Modified ${modified}`;
    }
    updateWorkspaceStatus();
    
    // Validate immediately without flashing a page-level loading overlay.
    validateFormFields();
    updateValidationSummary();
    updateXmlWorkflow();
    updateWorkspaceStatus();

  } catch (error) {
    console.error('Error loading file:', error);
    console.log('Failed to load file: ' + error.message);
    setFileStatus('error', 'Load failed');
  }
}

// Validate form fields and show tooltips
function validateFormFields() {
  // Get current values from inputs
  const campaignId = elements.campaignIdInput ? elements.campaignIdInput.value.trim() : '';
  const subject = elements.subjectInput ? elements.subjectInput.value.trim() : '';
  const link = elements.linkInput ? elements.linkInput.value.trim() : '';

  // Nothing to validate: ensure no stale tooltip/state remains visible.
  if (!campaignId && !link) {
    clearAllTooltips();
    updateSaveAndApplyButtons();
    return;
  }
  
  console.log('=== validateFormFields START ===');
  console.log('Validating:', { campaignId, subject, link });
  
  // Validate Campaign ID
  let formatValidation = null;
  if (campaignId) {
    formatValidation = validateCampaignIdFormat(campaignId);
    const fieldContainer = document.querySelector('.field.campaign-id-field');
    
    // Clear previous states
    if (elements.campaignIdInput) {
      elements.campaignIdInput.classList.remove('error');
      elements.campaignIdInput.title = '';
    }
    if (fieldContainer) {
      fieldContainer.classList.remove('validation-error', 'past-date-warning', 'today-warning', 'mismatch-error');
    }
    
    if (!formatValidation.valid) {
      if (elements.campaignIdInput) {
        elements.campaignIdInput.classList.add('error');
        elements.campaignIdInput.title = formatValidation.error;
      }
      if (fieldContainer) {
        fieldContainer.classList.add('validation-error');
        showValidationError(formatValidation.error);
        // Clear mismatch when there's validation error
        fieldContainer.classList.remove('mismatch-error');
        const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
        if (mismatchTooltip) {
          mismatchTooltip.style.opacity = '0';
        }
      }
    } else if (formatValidation.isPastDate) {
      const campaignDateStr = formatValidation.campaignDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (elements.campaignIdInput) {
        elements.campaignIdInput.title = TOOLTIP_MESSAGES.warning.past;
      }
      if (fieldContainer) {
        fieldContainer.classList.add('past-date-warning');
        showWarning(TOOLTIP_MESSAGES.warning.past);
      }
    } else if (formatValidation.isFutureDate) {
      if (elements.campaignIdInput) {
        elements.campaignIdInput.title = TOOLTIP_MESSAGES.warning.future;
      }
      if (fieldContainer) {
        fieldContainer.classList.add('past-date-warning');
        fieldContainer.classList.add('future-date-warning');
        showWarning(TOOLTIP_MESSAGES.warning.future);
      }
    } else if (formatValidation.isToday) {
      if (elements.campaignIdInput) {
        elements.campaignIdInput.title = TOOLTIP_MESSAGES.warning.today;
      }
      if (fieldContainer) {
        fieldContainer.classList.add('past-date-warning');
        fieldContainer.classList.add('today-warning');
        showCampaignIdTooltip(TOOLTIP_MESSAGES.warning.today, 'today', { 
          autoHide: 4000
        });
      }
    } else {
      // Clear tooltip if valid
      hideCampaignIdTooltip();
    }
    
    // Manage tooltip collision for campaign field
    if (fieldContainer) {
      manageTooltipCollision(fieldContainer);
    }
  }
  
  // Validate Link
  if (link) {
    const linkValidation = validateLinkFormat(link);
    const linkFieldContainer = document.querySelector('.field.link-field');
    
    // Clear previous states
    if (elements.linkInput) {
      elements.linkInput.classList.remove('error');
      elements.linkInput.title = '';
    }
    if (linkFieldContainer) {
      linkFieldContainer.classList.remove('validation-error', 'mismatch-error');
    }
    
    if (!linkValidation.valid) {
      if (elements.linkInput) {
        elements.linkInput.classList.add('error');
        elements.linkInput.title = linkValidation.error;
      }
      if (linkFieldContainer) {
        linkFieldContainer.classList.add('validation-error');
        const validationTooltip = linkFieldContainer.querySelector('.validation-tooltip');
        if (validationTooltip) {
          validationTooltip.textContent = linkValidation.error;
          validationTooltip.style.opacity = '1';
        }
      }
    }
    
    // Manage tooltip collision for link field
    if (linkFieldContainer) {
      manageTooltipCollision(linkFieldContainer);
    }
  }
  
  // Validate mismatch if both have values AND campaign ID is valid
  if (campaignId && link && formatValidation && formatValidation.valid) {
    const mismatchResult = validateCampaignLinkMismatch(campaignId, link);
    const campaignFieldContainer = document.querySelector('.field.campaign-id-field');
    const linkFieldContainer = document.querySelector('.field.link-field');
    
    if (mismatchResult.hasMismatch) {
      if (campaignFieldContainer) {
        campaignFieldContainer.classList.add('mismatch-error');
        const mismatchTooltip = document.getElementById('campaignIdMismatchTooltip');
        if (mismatchTooltip) {
          mismatchTooltip.textContent = TOOLTIP_MESSAGES.mismatch.details(mismatchResult.expected, mismatchResult.found);
          mismatchTooltip.style.opacity = '1';
          mismatchTooltip.style.background = '#eab308';
          mismatchTooltip.style.transform = 'translateY(0)';
        }
      }
      
      if (linkFieldContainer) {
        linkFieldContainer.classList.add('mismatch-error');
        const mismatchTooltip = linkFieldContainer.querySelector('.mismatch-tooltip');
        if (mismatchTooltip) {
          mismatchTooltip.textContent = TOOLTIP_MESSAGES.mismatch.details(mismatchResult.expected, mismatchResult.found);
          mismatchTooltip.style.opacity = '1';
          mismatchTooltip.style.background = '#eab308';
        }
      }
      
      // Manage tooltip collision for both fields
      if (campaignFieldContainer) manageTooltipCollision(campaignFieldContainer);
      if (linkFieldContainer) manageTooltipCollision(linkFieldContainer);
    }
  }
  
  console.log('=== validateFormFields END ===');
  
  // Update button states after validation
  updateSaveAndApplyButtons();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Add initializing class to body for CSS guard
  document.body.classList.add('initializing');
  
  // TOOLTIPS DISABLED by default on page load
  setTooltipsEnabled(false);
  initializeTooltipCache(); // Initialize tooltip cache
  clearAllTooltips(); // Clear all tooltips on page load
  
  // Load state with tooltips disabled
  loadState();
  
  // Clear any tooltips that might have appeared during state loading
  clearAllTooltips();
  
  // Remove initializing class but KEEP TOOLTIPS DISABLED
  // They will only be enabled when XML file is opened
  document.body.classList.remove('initializing');
  isPageInitializing = false;
  
  console.log('\ud83c\udfc1 PAGE INITIALIZATION COMPLETE - TOOLTIPS REMAIN DISABLED');
  
  if (typeof decorateButtons === 'function') decorateButtons();
});

window.addEventListener('beforeunload', event => {
  if (!hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = '';
});
