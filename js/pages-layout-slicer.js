(function () {
  const state = {
    file: null,
    image: null,
    imageUrl: '',
    sourceFileSize: 0,
    lines: [],
    draggingLine: null,
    slices: [],
    excluded: [],
    generated: null,
    templateDir: null,
    campaignParentDir: null,
    templateDirectories: [],
    templateFileCount: 0,
    templateHtmlFiles: [],
    copiedHtmlFiles: [],
    htmlRenameMap: new Map(),
    copiedCampaignDir: null,
    copiedCampaignRootDir: null,
    templateFiles: [],
    templateStructure: [],
    templateCampaignPrefix: '',
    campaignFolderManual: false,
    campaignFolderReady: false,
    zoom: 1,
    zoomMode: 'fit'
  };

  const els = {
    campaignAccordion: document.querySelector('[data-slicer-section="campaign"]'),
    slicerAccordion: document.querySelector('[data-slicer-section="slicer"]'),
    campaignAccordionPanel: document.getElementById('campaign-section-panel'),
    slicerAccordionPanel: document.getElementById('slicer-section-panel'),
    dropZone: document.getElementById('drop-zone'),
    imageInput: document.getElementById('image-input'),
    imageFormat: document.getElementById('image-format'),
    exportWidth: document.getElementById('export-width'),
    exportDpi: document.getElementById('export-dpi'),
    imageQuality: document.getElementById('image-quality'),
    filePrefix: document.getElementById('file-prefix'),
    duplicateFolderName: document.getElementById('duplicate-folder-name'),
    templateOriginalFolderName: document.getElementById('template-original-folder-name'),
    campaignPathPreview: document.getElementById('campaign-path-preview'),
    templateCopyStatus: document.getElementById('template-copy-status'),
    templateSourceName: document.getElementById('template-source-name'),
    templateOutputName: document.getElementById('template-output-name'),
    chooseTemplateFolder: document.getElementById('choose-template-folder'),
    chooseCampaignParent: document.getElementById('choose-campaign-parent'),
    copyTemplateFolder: document.getElementById('copy-template-folder'),
    workflowCards: Array.from(document.querySelectorAll('[data-slicer-workflow]')),
    templateStructure: document.getElementById('template-structure'),
    templatePathSegments: document.getElementById('template-path-segments'),
    templateChildFolders: document.getElementById('template-child-folders'),
    htmlRenameSection: document.getElementById('html-rename-section'),
    htmlRenameList: document.getElementById('html-rename-list'),
    copySuccessPanel: document.getElementById('copy-success-panel'),
    copySuccessPath: document.getElementById('copy-success-path'),
    openCopiedFolder: document.getElementById('open-copied-folder'),
    openCopiedParent: document.getElementById('open-copied-parent'),
    copyCopiedPath: document.getElementById('copy-copied-path'),
    duplicateAnother: document.getElementById('duplicate-another'),
    copyProgressPanel: document.getElementById('copy-progress-panel'),
    copyProgressStage: document.getElementById('copy-progress-stage'),
    copyProgressFile: document.getElementById('copy-progress-file'),
    copyProgressPercent: document.getElementById('copy-progress-percent'),
    copyProgressBar: document.getElementById('copy-progress-bar'),
    copyProgressCount: document.getElementById('copy-progress-count'),
    copyProgressDetail: document.getElementById('copy-progress-detail'),
    autoSlice: document.getElementById('auto-slice'),
    clearLines: document.getElementById('clear-lines'),
    generateOutput: document.getElementById('generate-output'),
    status: document.getElementById('slicer-status'),
    imageMeta: document.getElementById('image-meta'),
    sliceCount: document.getElementById('slice-count'),
    canvasWrap: document.getElementById('canvas-wrap'),
    rulerCorner: document.querySelector('.slicer-ruler-corner'),
    rulerTop: document.getElementById('ruler-top'),
    rulerLeft: document.getElementById('ruler-left'),
    stage: document.getElementById('slicer-stage'),
    canvas: document.getElementById('source-canvas'),
    guideLayer: document.getElementById('guide-layer'),
    sliceLabelLayer: document.getElementById('slice-label-layer'),
    canvasEmpty: document.getElementById('canvas-empty'),
    zoomOut: document.getElementById('zoom-out'),
    zoomIn: document.getElementById('zoom-in'),
    zoomLevel: document.getElementById('zoom-level'),
    sliceList: document.getElementById('slice-list'),
    saveFolder: document.getElementById('save-folder'),
    exportSummary: document.getElementById('export-summary'),
    exportSummaryText: document.getElementById('export-summary-text'),
    generateBtnLabel: document.querySelector('#generate-output .slicer-btn-label'),
    generateBtnLoading: document.querySelector('#generate-output .slicer-btn-loading')
  };

  const ctx = els.canvas.getContext('2d');
  const PUBLIC_LAYOUT_BASE_URL = 'http://mail.hsbc.com.hk/id';

  function setActiveAccordion(section) {
    const active = section === 'slicer' ? 'slicer' : 'campaign';
    [
      { key: 'campaign', item: els.campaignAccordion, panel: els.campaignAccordionPanel },
      { key: 'slicer', item: els.slicerAccordion, panel: els.slicerAccordionPanel }
    ].forEach(({ key, item, panel }) => {
      const isOpen = key === active;
      item?.classList.toggle('is-open', isOpen);
      if (panel) panel.hidden = !isOpen;
    });

    if (active === 'slicer' && state.image) {
      window.requestAnimationFrame(() => {
        if (state.zoomMode === 'fit') setZoom(getFitZoom(), 'fit');
      });
    }
  }

  function setWorkflow(workflow) {
    els.workflowCards.forEach((card) => {
      card.classList.toggle('is-active', card.dataset.slicerWorkflow === workflow);
    });
    setActiveAccordion(workflow === 'slice' ? 'slicer' : 'campaign');
  }

  function cleanFolderName(value, fallback = 'template copy') {
    return String(value || fallback)
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || fallback;
  }

  function getDuplicateFolderName() {
    return cleanFolderName(state.templateStructure[3]?.value || '', '');
  }

  function getCampaignProjectName() {
    return cleanFolderName(els.duplicateFolderName?.value || '', '');
  }

  function buildCampaignFolderName(name) {
    const source = String(name || '').trim();
    const campaignId = source.match(/^\s*(\d{4})\b/)?.[1] || 'XXXX';
    const dateMatch = source.match(/\b\d{2}-\d{2}\b/);
    const afterDate = dateMatch ? source.slice((dateMatch.index || 0) + dateMatch[0].length).trim() : '';
    const manager = afterDate.split(/\s+/).filter(Boolean)[0] || source.split(/\s+/).at(-1) || 'XX';
    const initials = manager.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase() || 'XX';
    const year = cleanFolderName(state.templateStructure[2]?.value || '', 'YYYY');
    const folderDate = dateMatch ? `${year}${dateMatch[0].replace('-', '')}` : `${year}MMDD`;
    return `${campaignId}-${folderDate}-${initials}`;
  }

  function syncCampaignFolderFromName() {
    if (state.campaignFolderManual || !state.templateStructure[3]) return;
    const name = els.duplicateFolderName?.value?.trim();
    state.templateStructure[3].value = name ? buildCampaignFolderName(name) : '';
    state.campaignFolderReady = Boolean(name);
  }

  function getStructureValues() {
    return state.templateStructure.map((segment, index) => cleanFolderName(segment.value, index === 3 ? '' : segment.original));
  }

  function getCampaignPath() {
    const pasteLocation = state.campaignParentDir?.name || '[choose output folder]';
    const segments = getStructureValues();
    const projectName = getCampaignProjectName() || '[new campaign folder name]';
    return `${pasteLocation}/${projectName}/${segments.length ? segments.join('/') : getDuplicateFolderName()}`;
  }

  function getPublicOutputUrls() {
    if (!state.campaignFolderReady) return [];
    const segments = getStructureValues();
    return state.templateHtmlFiles
      .filter((file) => String(state.htmlRenameMap.get(file.path) || '').trim())
      .map((file) => `${PUBLIC_LAYOUT_BASE_URL}/${[...segments, getRenamedHtmlFileName(file)].map(encodeURIComponent).join('/')}`);
  }

  function renderOutputPreview() {
    if (!els.campaignPathPreview) return;
    const urls = getPublicOutputUrls();
    els.campaignPathPreview.replaceChildren();
    if (!state.campaignFolderReady) {
      els.campaignPathPreview.textContent = 'Enter a new campaign folder name to generate the destination.';
      return;
    }
    if (!urls.length) {
      els.campaignPathPreview.textContent = 'Rename an HTML file to add its public URL preview.';
      return;
    }
    urls.forEach((url) => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = url;
      els.campaignPathPreview.appendChild(link);
    });
  }

  function setTemplateStatus(message, type = '') {
    if (!els.templateCopyStatus) return;
    els.templateCopyStatus.textContent = message;
    els.templateCopyStatus.className = type ? `is-${type}` : '';
  }

  function getCopyErrorMessage(error) {
    if (error?.name === 'NotAllowedError') return 'Permission was denied for this folder. Choose a folder you can write to.';
    if (error?.name === 'NotFoundError') return 'The selected folder is no longer available. Choose it again and retry.';
    if (error?.message?.startsWith('A folder with this campaign name')) return error.message;
    return 'Unable to copy the template. Check the destination folder and try again.';
  }

  function updateCampaignPathPreview() {
    renderOutputPreview();
    if (els.templateSourceName) {
      els.templateSourceName.textContent = state.templateDir?.name || 'Not selected';
    }
    if (els.templateOriginalFolderName) {
      els.templateOriginalFolderName.textContent = state.templateDir?.name || 'Not selected';
    }
    if (els.templateOutputName) {
      els.templateOutputName.textContent = state.campaignParentDir?.name || 'Not selected';
    }
    if (els.copyTemplateFolder) {
      els.copyTemplateFolder.disabled = !canProcessTemplate();
    }
    renderTemplateStructure();
  }

  function canProcessTemplate() {
    return Boolean(
      state.templateDir
      && state.campaignParentDir
      && state.campaignFolderReady
      && getCampaignProjectName()
      && getDuplicateFolderName()
    );
  }

  function renderLegacyTemplateContents() {
    if (!els.templateContents || !els.templateContentsList || !els.templateContentsSummary) return;
    const hasTemplate = Boolean(state.templateDir);
    els.templateContents.hidden = !hasTemplate;
    if (!hasTemplate) return;

    const fileLabel = `${state.templateFileCount} file${state.templateFileCount === 1 ? '' : 's'}`;
    const folderLabel = `${state.templateDirectories.length} subfolder${state.templateDirectories.length === 1 ? '' : 's'}`;
    els.templateContentsSummary.textContent = `${folderLabel} · ${fileLabel}`;
    els.templateContentsList.replaceChildren();

    const entries = state.templateDirectories.length
      ? state.templateDirectories
      : ['No subfolders found. Files at the template root will still be copied.'];
    entries.forEach((path) => {
      const item = document.createElement('li');
      item.textContent = path;
      els.templateContentsList.appendChild(item);
    });
  }

  function renderTemplateStructure() {
    if (!els.templateStructure || !els.templatePathSegments || !els.templateChildFolders) return;
    const hasTemplate = Boolean(state.templateDir);
    els.templateStructure.hidden = !hasTemplate;
    if (!hasTemplate) return;

    els.templatePathSegments.replaceChildren();
    state.templateStructure.forEach((segment, index) => {
      const field = document.createElement('label');
      field.className = 'slicer-path-segment';
      field.innerHTML = `<span>${escapeHtml(segment.label)}</span>`;
      const input = document.createElement('input');
      input.value = segment.value;
      input.autocomplete = 'off';
      input.addEventListener('input', () => {
        segment.value = input.value;
        if (index === 3) {
          state.campaignFolderManual = true;
          state.campaignFolderReady = Boolean(input.value.trim());
        }
        if (index === 2) syncCampaignFolderFromName();
        updateCampaignPathPreview();
      });
      field.appendChild(input);
      els.templatePathSegments.appendChild(field);
    });

    els.templateChildFolders.replaceChildren();
    const children = state.templateDirectories.length ? state.templateDirectories : ['No child folders'];
    children.forEach((name) => {
      const item = document.createElement('span');
      item.textContent = name;
      els.templateChildFolders.appendChild(item);
    });
  }

  function getRenamedHtmlFileName(file) {
    const requested = cleanFolderName(state.htmlRenameMap.get(file.path) || '', '');
    if (!requested) return file.name;
    const extension = file.name.match(/(\.html?)$/i)?.[1] || '.html';
    return `${requested.replace(/\.html?$/i, '').trim().replace(/\s+/g, '-')}${extension}`;
  }

  function renderHtmlRenameFields() {
    if (!els.htmlRenameSection || !els.htmlRenameList) return;
    els.htmlRenameSection.hidden = state.templateHtmlFiles.length === 0;
    els.htmlRenameList.replaceChildren();
    state.templateHtmlFiles.forEach((file) => {
      const row = document.createElement('div');
      row.className = 'slicer-html-rename-row';
      const extension = file.name.match(/(\.html?)$/i)?.[1] || '.html';
      const baseName = file.name.slice(0, -extension.length);
      row.innerHTML = `<code>${escapeHtml(file.path)}</code><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
      const field = document.createElement('label');
      field.innerHTML = '<span>Rename to</span>';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = baseName;
      input.value = state.htmlRenameMap.get(file.path) || '';
      input.autocomplete = 'off';
      input.addEventListener('input', () => {
        state.htmlRenameMap.set(file.path, input.value);
        updateCampaignPathPreview();
      });
      field.appendChild(input);
      const suffix = document.createElement('small');
      suffix.textContent = extension;
      row.append(field, suffix);
      els.htmlRenameList.appendChild(row);
    });
  }

  function setStatus(message, type = '') {
    els.status.textContent = message;
    els.status.className = `slicer-status${type ? ` is-${type}` : ''}`;
  }

  function getAutoSliceStep() {
    return 600;
  }

  function getAssetsFolder() {
    return 'images';
  }

  function getExtension() {
    return els.imageFormat.value === 'image/png' ? 'png' : 'jpg';
  }

  function getImageQuality() {
    const quality = Number.parseFloat(els.imageQuality?.value || '0.98');
    return Number.isFinite(quality) ? Math.min(1, Math.max(0.1, quality)) : 0.98;
  }

  function getExportWidth() {
    if (!state.image) return 1000;
    const width = Number.parseInt(els.exportWidth?.value, 10);
    if (!Number.isFinite(width) || width <= 0) return state.image.naturalWidth;
    return Math.min(3000, Math.max(320, width));
  }

  function getExportScale() {
    if (!state.image) return 1;
    return getExportWidth() / state.image.naturalWidth;
  }

  function getExportDpi() {
    const dpi = Number.parseInt(els.exportDpi?.value, 10);
    return Number.isFinite(dpi) ? Math.min(600, Math.max(72, dpi)) : 300;
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  function estimateSliceSize(slice) {
    if (!state.image) return '';
    const exportScale = getExportScale();
    const w = Math.max(1, Math.round(state.image.naturalWidth * exportScale));
    const h = Math.max(1, Math.round(slice.height * exportScale));
    const pixels = w * h;
    const isPng = els.imageFormat.value === 'image/png';
    const bytes = isPng ? pixels * 3 : Math.round(pixels * 0.15 * getImageQuality());
    return formatFileSize(bytes);
  }

  function getSliceSizeLabel(index) {
    const generated = state.generated?.slices?.[index];
    if (generated?.blob) return formatFileSize(generated.blob.size);
    const slice = state.slices[index];
    return slice ? `~${estimateSliceSize(slice)}` : '';
  }

  function getQualityLabel() {
    return els.imageQuality?.selectedOptions?.[0]?.text || 'Very high';
  }

  function renderImageMeta() {
    if (!els.imageMeta) return;
    if (!state.image) {
      els.imageMeta.textContent = 'No image';
      return;
    }

    const extension = getExtension().toUpperCase();
    const sourceSize = formatFileSize(state.sourceFileSize);
    els.imageMeta.innerHTML = `
      <span><strong>Source</strong> ${state.image.naturalWidth} × ${state.image.naturalHeight}px${sourceSize ? ` · ${sourceSize}` : ''}</span>
      <span><strong>Export</strong> ${getExportWidth()}px wide · ${extension} · ${getQualityLabel()}</span>
    `;
  }

  function formatFileName(index) {
    const prefix = (els.filePrefix?.value || 'img').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'img';
    return `${prefix}_${String(index + 1).padStart(2, '0')}.${getExtension()}`;
  }

  function getScale() {
    if (!state.image || !els.canvas.width) return 1;
    return els.canvas.clientWidth / els.canvas.width;
  }

  function getPreviewScaleFactor() {
    if (!state.image) return 1;
    return Math.min(1, getExportScale());
  }

  function getDisplayScale() {
    return state.zoom * getPreviewScaleFactor();
  }

  function getFitZoom() {
    if (!state.image) return 1;
    const available = Math.max(240, els.canvasWrap.clientWidth - 56);
    return Math.min(1, Math.max(0.1, available / (state.image.naturalWidth * getPreviewScaleFactor())));
  }

  function setZoom(value, mode = 'manual') {
    if (!state.image) return;
    state.zoomMode = mode;
    state.zoom = Math.min(3, Math.max(0.1, value));
    applyZoom();
    renderRulers();
    renderGuides();
  }

  function applyZoom() {
    if (!state.image) return;
    const zoom = state.zoomMode === 'fit' ? getFitZoom() : state.zoom;
    state.zoom = zoom;
    const displayScale = getDisplayScale();
    const scaledWidth = Math.max(1, Math.round(state.image.naturalWidth * displayScale));
    const scaledHeight = Math.max(1, Math.round(state.image.naturalHeight * displayScale));
    els.canvas.style.width = `${scaledWidth}px`;
    els.canvas.style.height = `${scaledHeight}px`;
    els.stage.style.width = `${scaledWidth}px`;
    els.stage.style.height = `${scaledHeight}px`;
    if (els.sliceLabelLayer) {
      els.sliceLabelLayer.style.width = `${scaledWidth}px`;
      els.sliceLabelLayer.style.height = `${scaledHeight}px`;
    }
    els.zoomLevel.value = state.zoomMode === 'fit' ? 'fit' : String(state.zoom);
  }

  function normalizeLines(lines) {
    if (!state.image) return [];
    const maxY = state.image.naturalHeight;
    return Array.from(new Set(lines
      .map((line) => Math.round(Number(line)))
      .filter((line) => Number.isFinite(line) && line > 0 && line < maxY)))
      .sort((a, b) => a - b);
  }

  function getSliceRanges() {
    if (!state.image) return [];
    const points = [0, ...state.lines, state.image.naturalHeight];
    return points.slice(0, -1).map((top, index) => ({
      index,
      top,
      bottom: points[index + 1],
      height: points[index + 1] - top,
      fileName: formatFileName(index),
      link: state.slices[index]?.link || ''
    }));
  }

  function preserveSliceLinks(ranges) {
    const oldLinks = state.slices.map((slice) => slice.link || '');
    const oldCta = state.slices.map((slice) => slice.cta || false);
    const oldUseAlt = state.slices.map((slice) => slice.useAlt || false);
    const oldAlt = state.slices.map((slice) => slice.alt || '');
    const oldExcluded = state.excluded;
    state.slices = ranges.map((range, index) => ({
      ...range,
      link: oldLinks[index] || range.link || '',
      cta: oldCta[index] || range.cta || false,
      useAlt: oldUseAlt[index] || range.useAlt || false,
      alt: oldAlt[index] || range.alt || `Image ${index + 1}`
    }));
    state.excluded = ranges.map((range, index) => Boolean(oldExcluded[index]));
  }

  function drawCanvas() {
    if (!state.image) {
      els.canvas.width = 0;
      els.canvas.height = 0;
      els.canvasEmpty.hidden = false;
      return;
    }

    els.canvas.width = state.image.naturalWidth;
    els.canvas.height = state.image.naturalHeight;
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    ctx.drawImage(state.image, 0, 0);

    els.canvasEmpty.hidden = true;
  }

  function renderRulers() {
    if (!state.image) {
      els.rulerTop.innerHTML = '';
      els.rulerLeft.innerHTML = '';
      return;
    }

    applyZoom();
    els.rulerTop.style.width = '';
    els.rulerTop.style.height = '';
    els.rulerLeft.style.width = '';
    els.rulerLeft.style.height = '';
    const wrapRect = els.canvasWrap.getBoundingClientRect();
    const canvasRect = els.canvas.getBoundingClientRect();
    const xOffset = canvasRect.left - wrapRect.left;
    const yOffset = canvasRect.top - wrapRect.top;
    els.rulerTop.innerHTML = buildRulerTicks(state.image.naturalWidth, 'x', xOffset);
    els.rulerLeft.innerHTML = buildRulerTicks(state.image.naturalHeight, 'y', yOffset);
  }

  function getNiceRulerStep(rawStep) {
    const steps = [50, 100, 200, 250, 500, 1000, 2000];
    return steps.find((step) => step >= rawStep) || 5000;
  }

  function buildRulerTicks(length, axis, offset = 0) {
    const ticks = [];
    const displayScale = getDisplayScale();
    const majorStep = getNiceRulerStep(72 / Math.max(displayScale, 0.01));
    const minorStep = majorStep / 2;

    for (let position = 0; position <= length; position += minorStep) {
      const rounded = Math.round(position);
      const major = rounded % majorStep === 0;
      const label = major ? rounded : '';
      const style = axis === 'x'
        ? `left:${offset + rounded * displayScale}px;`
        : `top:${offset + rounded * displayScale}px;`;
      ticks.push(`<span class="slicer-ruler-tick${major ? ' is-major' : ''}" style="${style}">${label}</span>`);
    }
    return ticks.join('');
  }

  function renderGuides() {
    if (!state.image) {
      els.guideLayer.innerHTML = '';
      return;
    }
    const wrapRect = els.canvasWrap.getBoundingClientRect();
    const stageRect = els.stage.getBoundingClientRect();
    const offsetY = stageRect.top - wrapRect.top;
    els.guideLayer.innerHTML = state.lines.map((line, index) => (
      `<div class="slicer-guide" data-guide-index="${index}" data-y="${line}" style="top:${offsetY + line * getDisplayScale()}px"></div>`
    )).join('');
  }

  function renderSlices() {
    const ranges = getSliceRanges();
    preserveSliceLinks(ranges);
    els.sliceCount.textContent = `${state.slices.length} slice${state.slices.length === 1 ? '' : 's'}`;

    if (!state.image) {
      els.sliceList.innerHTML = '<p class="slicer-muted">Slices will appear after you load an image.</p>';
      return;
    }

    els.sliceList.innerHTML = state.slices.map((slice, index) => `
      <article class="slicer-slice-card">
        <div class="slicer-slice-head">
          <div>
            <div class="slicer-slice-title">${slice.fileName}</div>
            <div class="slicer-slice-meta">y ${slice.top}-${slice.bottom} · ${slice.height}px</div>
          </div>
          ${index < state.slices.length - 1 ? `<button class="slicer-line-remove" type="button" data-remove-line="${index}">Remove line</button>` : ''}
        </div>
        <label>
          <span>Link URL optional</span>
          <input type="url" data-slice-link="${index}" value="${escapeAttribute(slice.link)}" placeholder="http://example.com">
        </label>
      </article>
    `).join('');
  }

  function escapeAttribute(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderImageSlices() {
    const ranges = getSliceRanges();
    preserveSliceLinks(ranges);
    const excludedCount = state.excluded.filter(Boolean).length;
    els.sliceCount.textContent = `${state.slices.length} slice${state.slices.length === 1 ? '' : 's'}${excludedCount ? ` · ${excludedCount} excluded` : ''}`;

    if (!state.image) {
      els.sliceList.innerHTML = '<p class="slicer-muted">Slices will appear after you load an image.</p>';
      return;
    }

    let exportIndex = 0;
    els.sliceList.innerHTML = state.slices.map((slice, index) => {
      const excluded = state.excluded[index];
      const exportNumber = excluded ? null : (exportIndex += 1);
      const exportFileName = excluded ? slice.fileName : formatFileName(exportNumber - 1);
      const sizeLabel = getSliceSizeLabel(index);
      return `
      <article class="slicer-slice-card${excluded ? ' is-excluded' : ''}">
        <div class="slicer-slice-head">
          <label class="slicer-slice-include">
            <input type="checkbox" data-slice-include="${index}" ${excluded ? '' : 'checked'}>
            <span>${excluded ? `${index + 1}. ${slice.fileName} (excluded)` : `${exportNumber}. ${exportFileName}`}</span>
          </label>
          ${index < state.slices.length - 1 ? `<button class="slicer-line-remove" type="button" data-remove-line="${index}">Remove line</button>` : ''}
        </div>
        <div class="slicer-slice-meta">source y ${slice.top}-${slice.bottom} · ${slice.height}px · export ${getExportWidth()} × ${Math.max(1, Math.round(slice.height * getExportScale()))}px${sizeLabel ? ` · ${sizeLabel}` : ''}</div>
        <div class="slicer-slice-fields">
          <div class="slicer-slice-row">
            <input type="checkbox" data-slice-cta="${index}" ${slice.cta ? 'checked' : ''} ${excluded ? 'disabled' : ''} title="Enable CTA link">
            <input id="slice-link-${index}" type="url" data-slice-link="${index}" value="${escapeAttribute(slice.link)}" placeholder="CTA link" ${!slice.cta ? 'disabled' : ''} ${excluded ? 'disabled' : ''}>
          </div>
          <div class="slicer-slice-row">
            <input type="checkbox" data-slice-usealt="${index}" ${slice.useAlt ? 'checked' : ''} ${excluded ? 'disabled' : ''} title="Enable alt text">
            <input id="slice-alt-${index}" type="text" data-slice-alt="${index}" value="${escapeAttribute(slice.alt)}" placeholder="Alt text" ${!slice.useAlt ? 'disabled' : ''} ${excluded ? 'disabled' : ''}>
          </div>
        </div>
      </article>
    `;
    }).join('');
  }

  function renderSliceLabels() {
    if (!state.image || !els.sliceLabelLayer) {
      if (els.sliceLabelLayer) els.sliceLabelLayer.innerHTML = '';
      return;
    }
    const displayScale = getDisplayScale();
    els.sliceLabelLayer.innerHTML = state.slices.map((slice, index) => `
      <div class="slicer-slice-label${state.excluded[index] ? ' is-excluded' : ''}" data-slice-label="${index}"
           style="top:${(slice.top + slice.height / 2) * displayScale}px">
        ${index + 1}
      </div>
    `).join('');
  }

  function updateUi() {
    drawCanvas();
    renderRulers();
    renderGuides();
    renderImageSlices();
    renderSliceLabels();
    renderImageMeta();
    const hasImage = Boolean(state.image);
    els.autoSlice.disabled = !hasImage;
    els.clearLines.disabled = !hasImage || state.lines.length === 0;
    els.generateOutput.disabled = !hasImage;
    els.zoomOut.disabled = !hasImage;
    els.zoomIn.disabled = !hasImage;
    els.zoomLevel.disabled = !hasImage;
    const hasGenerated = Boolean(state.generated);
    if (els.saveFolder) els.saveFolder.disabled = !hasGenerated || typeof window.showDirectoryPicker !== 'function';
    const copyCodeBtn = document.getElementById('copy-code-btn');
    if (copyCodeBtn) copyCodeBtn.disabled = !state.generated || !state.generated.slices.length;
    updateCampaignPathPreview();
  }

  function loadRasterImage(file, sourceSize = file.size) {
    setActiveAccordion('slicer');
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.file = file;
    state.sourceFileSize = sourceSize;
    state.imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      state.image = image;
      state.lines = [];
      state.slices = [];
      state.generated = null;
      state.zoomMode = 'fit';
      state.zoom = getFitZoom();
      if (els.exportSummary) els.exportSummary.hidden = true;
      if (els.exportWidth) els.exportWidth.value = image.naturalWidth;
      setStatus(`Image loaded at ${image.naturalWidth}px wide. Click the preview to add slice lines.`, 'success');
      updateUi();
    };
    image.onerror = () => setStatus('Unable to read this image.', 'error');
    image.src = state.imageUrl;
  }

  async function loadPdfFile(file) {
    setActiveAccordion('slicer');
    setStatus('Rendering the first PDF page for slicing...', '');
    try {
      const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const imageBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to prepare the PDF page as an image.')), 'image/png');
      });
      loadRasterImage(new File([imageBlob], `${file.name.replace(/\.pdf$/i, '')}.png`, { type: 'image/png' }), file.size);
      setStatus('PDF first page loaded. Add guides, then generate slices.', 'success');
    } catch (error) {
      setStatus(error.message || 'Unable to render this PDF. Try a JPG or PNG instead.', 'error');
    }
  }

  async function loadImageFile(file) {
    if (!file) return;
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      await loadPdfFile(file);
      return;
    }
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setStatus('Please choose a PDF, JPG, JPEG, or PNG file.', 'error');
      return;
    }
    loadRasterImage(file);
  }

  function canvasToImageY(event) {
    const rect = els.canvas.getBoundingClientRect();
    const scale = getScale() || 1;
    return Math.round((event.clientY - rect.top) / scale);
  }

  function findNearestLine(y) {
    const threshold = Math.max(8, state.image.naturalHeight * 0.006);
    return state.lines.findIndex((line) => Math.abs(line - y) <= threshold);
  }

  function addLine(y) {
    state.lines = normalizeLines([...state.lines, y]);
    state.generated = null;
    if (els.exportSummary) els.exportSummary.hidden = true;
    updateUi();
  }

  function autoSlice() {
    if (!state.image) return;
    const step = Math.max(100, getAutoSliceStep());
    const lines = [];
    for (let y = step; y < state.image.naturalHeight; y += step) {
      lines.push(y);
    }
    state.lines = normalizeLines(lines);
    state.generated = null;
    if (els.exportSummary) els.exportSummary.hidden = true;
    setStatus(`Created ${state.lines.length} automatic slice line(s). Adjust if needed.`, 'success');
    updateUi();
  }

  function createSliceCanvas(slice) {
    const canvas = document.createElement('canvas');
    const exportScale = getExportScale();
    canvas.width = Math.max(1, Math.round(state.image.naturalWidth * exportScale));
    canvas.height = Math.max(1, Math.round(slice.height * exportScale));
    const sliceCtx = canvas.getContext('2d');
    sliceCtx.drawImage(
      state.image,
      0,
      slice.top,
      state.image.naturalWidth,
      slice.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas;
  }

  function canvasToBlob(canvas, type) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, type === 'image/jpeg' ? getImageQuality() : undefined);
    });
  }

  async function generateOutput() {
    if (!state.image) return;
    const type = els.imageFormat.value;

    if (els.generateBtnLabel) els.generateBtnLabel.hidden = true;
    if (els.generateBtnLoading) els.generateBtnLoading.hidden = false;
    els.generateOutput.disabled = true;

    await nextPaint();
    const generatedSlices = [];
    let skipped = 0;

    for (let index = 0; index < state.slices.length; index += 1) {
      const slice = state.slices[index];
      if (state.excluded[index]) {
        skipped += 1;
        continue;
      }
      const canvas = createSliceCanvas(slice);
      const blob = await canvasToBlob(canvas, type);
      generatedSlices.push({ ...slice, fileName: formatFileName(generatedSlices.length), blob });
    }

    state.generated = { slices: generatedSlices };
    if (els.generateBtnLabel) els.generateBtnLabel.hidden = false;
    if (els.generateBtnLoading) els.generateBtnLoading.hidden = true;
    els.generateOutput.disabled = false;

    const totalSize = generatedSlices.reduce((sum, s) => sum + (s.blob?.size || 0), 0);
    const sizeLabel = formatFileSize(totalSize);
    setStatus(`Generated ${generatedSlices.length} image slice(s) at ${getExportWidth()}px export width${skipped ? ` · ${skipped} excluded` : ''}.`, 'success');

    if (els.exportSummary && els.exportSummaryText) {
      const ext = getExtension().toUpperCase();
      els.exportSummaryText.textContent = `${generatedSlices.length} slice(s) ready · ${ext} · ${getExportWidth()}px wide · ${sizeLabel || 'done'}`;
      els.exportSummary.hidden = false;
    }

    updateUi();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadImages() {
    if (!state.generated) return;
    state.generated.slices.forEach((slice, index) => {
      window.setTimeout(() => downloadBlob(slice.blob, slice.fileName), index * 120);
    });
  }

  async function saveToFolder() {
    if (!state.generated || typeof window.showDirectoryPicker !== 'function') return;
    const count = state.generated.slices.length;
    const ext = getExtension().toUpperCase();
    const totalSize = state.generated.slices.reduce((sum, s) => sum + (s.blob?.size || 0), 0);
    const sizeLabel = formatFileSize(totalSize);
    const confirmed = window.confirm(
      `Save ${count} ${ext} slice(s) to a folder?${sizeLabel ? `\nEstimated total size: ${sizeLabel}` : ''}`
    );
    if (!confirmed) return;
    const root = await window.showDirectoryPicker({ mode: 'readwrite' });
    const assetDir = await root.getDirectoryHandle(getAssetsFolder(), { create: true });
    for (const slice of state.generated.slices) {
      await writeFile(assetDir, slice.fileName, slice.blob);
    }
    setStatus(`Saved ${count} image(s) to ${getAssetsFolder()}.`, 'success');
  }

  async function writeFile(dirHandle, name, content) {
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function copyDirectory(sourceDir, targetDir, skipName = '', basePath = '') {
    for await (const [name, handle] of sourceDir.entries()) {
      if (skipName && name === skipName) continue;
      const path = basePath ? `${basePath}/${name}` : name;
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        const templateEntry = state.templateHtmlFiles.find((entry) => entry.path === path);
        await writeFile(targetDir, templateEntry ? getRenamedHtmlFileName(templateEntry) : name, file);
        continue;
      }

      if (handle.kind === 'directory') {
        const nextTarget = await targetDir.getDirectoryHandle(name, { create: true });
        await copyDirectory(handle, nextTarget, '', path);
      }
    }
  }

  async function getDirectoryByParts(rootDir, parts) {
    let current = rootDir;
    for (const part of parts.filter(Boolean)) {
      current = await current.getDirectoryHandle(part);
    }
    return current;
  }

  async function ensureDirectoryByParts(rootDir, parts) {
    let current = rootDir;
    for (const part of parts.filter(Boolean)) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
    return current;
  }

  function getSelectedCampaignDirectoryParts(path = getSelectedTemplateHtmlPath()) {
    const parts = path ? path.split('/') : [];
    return parts.slice(0, -1);
  }

  function getTargetCampaignDirectoryParts() {
    const target = getDuplicateTarget();
    return [
      getEmailblastFolder(),
      getTemplateMarket(),
      target.year,
      target.campaignFolder
    ];
  }

  function pathsMatch(left, right) {
    return left.join('/') === right.join('/');
  }

  async function createDuplicateDirectory() {
    const segments = getStructureValues();
    const projectName = getCampaignProjectName();
    if (!segments.length) throw new Error('Template folder structure is not ready yet.');
    try {
      await getDirectoryByParts(state.campaignParentDir, [projectName]);
      throw new Error('A folder with this campaign name already exists. Choose a different name.');
    } catch (error) {
      if (error.name !== 'NotFoundError') throw error;
    }
    const projectDir = await ensureDirectoryByParts(state.campaignParentDir, [projectName]);
    const campaignDir = await ensureDirectoryByParts(projectDir, segments);
    return { projectDir, campaignDir };
  }

  function setCopyProgress(stage, currentFile, completed, total, detail = '') {
    const safeTotal = Math.max(1, total);
    const percentage = Math.round((completed / safeTotal) * 100);
    if (els.copyProgressPanel) els.copyProgressPanel.hidden = false;
    if (els.copyProgressStage) els.copyProgressStage.textContent = stage;
    if (els.copyProgressFile) els.copyProgressFile.textContent = currentFile || 'Preparing folder copy...';
    if (els.copyProgressPercent) els.copyProgressPercent.textContent = `${percentage}%`;
    if (els.copyProgressBar) els.copyProgressBar.value = percentage;
    if (els.copyProgressCount) els.copyProgressCount.textContent = `${completed} / ${total} files`;
    if (els.copyProgressDetail) els.copyProgressDetail.textContent = detail;
  }

  function nextPaint() {
    return new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  async function copyScannedTemplateFiles(targetDir) {
    const total = state.templateFiles.length;
    let completed = 0;
    setCopyProgress('Copying files', 'Preparing destination...', completed, total, 'Using the scanned template file list.');
    await nextPaint();

    for (const entry of state.templateFiles) {
      const relativePath = entry.path.slice(state.templateCampaignPrefix.length).replace(/^\//, '');
      const parts = relativePath.split('/').filter(Boolean);
      const fileName = parts.pop();
      const destination = await ensureDirectoryByParts(targetDir, parts);
      const sourceFile = await entry.handle.getFile();
      const renamed = state.templateHtmlFiles.find((file) => file.path === entry.path);
      await writeFile(destination, renamed ? getRenamedHtmlFileName(renamed) : fileName, sourceFile);
      completed += 1;
      setCopyProgress('Copying files', entry.path, completed, total, 'Copying directly to the final destination.');
      if (completed % 8 === 0 || completed === total) await nextPaint();
    }
  }

  async function listHtmlFiles(dirHandle, basePath = '', parentDir = dirHandle) {
    const files = [];
    for await (const [name, handle] of dirHandle.entries()) {
      const path = basePath ? `${basePath}/${name}` : name;
      if (handle.kind === 'file' && /\.html?$/i.test(name)) {
        files.push({ name, path, handle, parentDir });
        continue;
      }

      if (handle.kind === 'directory') {
        files.push(...await listHtmlFiles(handle, path, handle));
      }
    }
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }

  async function scanTemplateDirectory(dirHandle) {
    const files = [];
    const directories = [];
    async function visit(currentDir, basePath = '') {
      for await (const [name, handle] of currentDir.entries()) {
        const path = basePath ? `${basePath}/${name}` : name;
        if (handle.kind === 'file') {
          files.push({ name, path, handle, parentDir: currentDir });
          continue;
        }
        directories.push({ name, path, handle });
        await visit(handle, path);
      }
    }
    await visit(dirHandle);
    return { files, directories };
  }

  function configureTemplateStructure(scan) {
    const source = scan.files.find((file) => /\.html?$/i.test(file.name)) || scan.files[0];
    const sourceParts = source?.path.split('/').slice(0, -1) || [];
    const hasEmbeddedCampaignPath = sourceParts.length >= 4;
    const campaignParts = hasEmbeddedCampaignPath ? sourceParts.slice(0, 4) : [state.templateDir.name];
    const labels = ['Root', 'Team', 'Year', 'Campaign folder'];
    state.templateStructure = campaignParts.map((name, index) => ({
      label: labels[index] || `Folder ${index + 1}`,
      original: name,
      value: name
    }));
    state.templateCampaignPrefix = hasEmbeddedCampaignPath ? campaignParts.join('/') : '';
    const insideCampaign = (entry) => !state.templateCampaignPrefix
      || entry.path === state.templateCampaignPrefix
      || entry.path.startsWith(`${state.templateCampaignPrefix}/`);
    state.templateFiles = scan.files.filter(insideCampaign);
    state.templateHtmlFiles = state.templateFiles.filter((file) => /\.html?$/i.test(file.name));
    const childPrefix = state.templateCampaignPrefix ? `${state.templateCampaignPrefix}/` : '';
    state.templateDirectories = scan.directories
      .filter((directory) => directory.path.startsWith(childPrefix))
      .map((directory) => directory.path.slice(childPrefix.length))
      .filter((path) => path && !path.includes('/'))
      .sort((left, right) => left.localeCompare(right));
    state.templateFileCount = state.templateFiles.length;
  }

  async function listDirectories(dirHandle) {
    const directories = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind !== 'directory') continue;
      directories.push(name);
    }
    return directories.sort((a, b) => a.localeCompare(b));
  }

  function renderCopiedHtmlFiles() {
    if (!els.htmlTools || !els.htmlFileSelect) return;
    els.htmlTools.hidden = state.copiedHtmlFiles.length === 0;
    els.htmlFileSelect.innerHTML = state.copiedHtmlFiles.map((file) => (
      `<option value="${escapeAttribute(file.path)}">${escapeHtml(file.path)}</option>`
    )).join('');
    syncTemplateFieldsFromSelectedHtml(false);
    renderTemplateReview();
  }

  async function chooseTemplateFolder() {
    if (typeof window.showDirectoryPicker !== 'function') {
      setTemplateStatus('Folder access is not supported in this browser.', 'error');
      return;
    }
    state.templateDir = await window.showDirectoryPicker({ mode: 'read' });
    setTemplateStatus('Scanning template...', 'loading');
    const scan = await scanTemplateDirectory(state.templateDir);
    configureTemplateStructure(scan);
    state.copiedHtmlFiles = [];
    state.htmlRenameMap.clear();
    state.campaignFolderManual = false;
    state.campaignFolderReady = false;
    if (state.templateStructure[3]) state.templateStructure[3].value = '';
    if (els.duplicateFolderName) els.duplicateFolderName.value = '';
    syncCampaignFolderFromName();
    state.copiedCampaignDir = null;
    state.copiedCampaignRootDir = null;
    if (els.copySuccessPanel) els.copySuccessPanel.hidden = true;
    renderHtmlRenameFields();
    setTemplateStatus(`Template scanned: ${state.templateFileCount} file(s) - ${state.templateHtmlFiles.length} HTML file(s) found`, 'success');
    updateCampaignPathPreview();
  }

  async function chooseCampaignParent() {
    if (typeof window.showDirectoryPicker !== 'function') {
      setTemplateStatus('Folder access is not supported in this browser.', 'error');
      return;
    }
    state.campaignParentDir = await window.showDirectoryPicker({ mode: 'readwrite' });
    setTemplateStatus(`Paste location selected: ${state.campaignParentDir.name}`, 'success');
    updateCampaignPathPreview();
  }

  async function copyTemplateFolder() {
    if (!canProcessTemplate()) return;
    updateCampaignPathPreview();
    if (els.copySuccessPanel) els.copySuccessPanel.hidden = true;
    setTemplateStatus('Processing duplicate...', 'loading');
    setCopyProgress('Preparing', 'Checking destination...', 0, state.templateFiles.length, 'Template scan is already complete.');
    await nextPaint();
    const duplicate = await createDuplicateDirectory();
    await copyScannedTemplateFiles(duplicate.campaignDir);
    setCopyProgress('Renaming HTML files', 'Applying selected HTML names...', state.templateFiles.length, state.templateFiles.length, 'HTML names were applied during direct copy.');
    await nextPaint();
    setCopyProgress('Finalizing', 'Refreshing copied folder...', state.templateFiles.length, state.templateFiles.length, 'Copy complete.');
    state.copiedCampaignRootDir = duplicate.projectDir;
    state.copiedCampaignDir = duplicate.campaignDir;
    state.copiedHtmlFiles = await listHtmlFiles(duplicate.campaignDir);
    updateCampaignPathPreview();
    setCopyProgress('Completed', 'Campaign folder ready.', state.templateFiles.length, state.templateFiles.length, 'All scanned files were copied.');
    setTemplateStatus(`Duplicated: ${getCampaignPath()}`, 'success');
    if (els.copySuccessPanel && els.copySuccessPath) {
      els.copySuccessPath.textContent = getCampaignPath();
      els.copySuccessPanel.hidden = false;
    }
  }

  async function renameHtmlFileEntry(fileEntry, targetName) {
    const sourceFile = await fileEntry.handle.getFile();
    await writeFile(fileEntry.parentDir, targetName, sourceFile);
    if (targetName !== fileEntry.name) {
      await fileEntry.parentDir.removeEntry(fileEntry.name).catch(() => {});
    }
  }

  async function moveCampaignDirectoryAndRenameHtml(fileEntry, targetName) {
    const sourceDirParts = getSelectedCampaignDirectoryParts(fileEntry.path);
    const targetDirParts = getTargetCampaignDirectoryParts();
    const shouldMoveDirectory = sourceDirParts.length && !pathsMatch(sourceDirParts, targetDirParts);

    if (!shouldMoveDirectory) {
      await renameHtmlFileEntry(fileEntry, targetName);
      return;
    }

    const sourceDir = await getDirectoryByParts(state.copiedCampaignDir, sourceDirParts);
    const targetDir = await ensureDirectoryByParts(state.copiedCampaignDir, targetDirParts);
    await copyDirectory(sourceDir, targetDir);
    const movedFiles = await listHtmlFiles(targetDir);
    const movedEntry = movedFiles.find((file) => file.name === fileEntry.name) || movedFiles[0];
    if (movedEntry) await renameHtmlFileEntry(movedEntry, targetName);

    const sourceParent = await getDirectoryByParts(state.copiedCampaignDir, sourceDirParts.slice(0, -1));
    await sourceParent.removeEntry(sourceDirParts[sourceDirParts.length - 1], { recursive: true }).catch(() => {});
  }

  async function renameSelectedHtmlFile() {
    if (!state.copiedHtmlFiles.length) return;
    const currentPath = els.htmlFileSelect.value;
    const fileEntry = state.copiedHtmlFiles.find((file) => file.path === currentPath);
    if (!fileEntry) return;
    if (!state.copiedCampaignDir) {
      setTemplateStatus('Copy as campaign first, then rename the HTML in the copied folder.', 'error');
      return;
    }

    const targetName = getResolvedFinalHtmlName();
    await renameHtmlFileEntry(fileEntry, targetName);
    state.copiedHtmlFiles = await listHtmlFiles(state.copiedCampaignDir);
    renderCopiedHtmlFiles();
    els.htmlFileSelect.value = fileEntry.path.replace(/[^/]+$/, targetName);
    setTemplateStatus(`HTML ready: ${getCampaignPath().replace(/[^/]+$/, targetName)}`, 'success');
  }

  els.campaignAccordionTrigger?.addEventListener('click', () => setWorkflow('copy'));
  els.slicerAccordionTrigger?.addEventListener('click', () => setWorkflow('slice'));
  els.workflowCards.forEach((card) => {
    card.addEventListener('click', () => setWorkflow(card.dataset.slicerWorkflow));
  });
  els.dropZone.addEventListener('click', () => els.imageInput.click());
  els.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      els.imageInput.click();
    }
  });
  els.dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    els.dropZone.classList.add('is-dragover');
  });
  els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('is-dragover'));
  els.dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    els.dropZone.classList.remove('is-dragover');
    loadImageFile(event.dataTransfer.files[0]).catch((error) => setStatus(error.message || 'Unable to load this file.', 'error'));
  });
  els.imageInput.addEventListener('change', () => {
    loadImageFile(els.imageInput.files[0]).catch((error) => setStatus(error.message || 'Unable to load this file.', 'error'));
  });
  els.chooseTemplateFolder?.addEventListener('click', () => {
    chooseTemplateFolder().catch((error) => {
      if (error.name !== 'AbortError') setTemplateStatus(error.message || 'Unable to choose template folder.', 'error');
    });
  });
  els.chooseCampaignParent?.addEventListener('click', () => {
    chooseCampaignParent().catch((error) => {
      if (error.name !== 'AbortError') setTemplateStatus(error.message || 'Unable to choose destination folder.', 'error');
    });
  });
  els.copyTemplateFolder?.addEventListener('click', () => {
    copyTemplateFolder().catch((error) => setTemplateStatus(getCopyErrorMessage(error), 'error'));
  });
  els.copyCopiedPath?.addEventListener('click', async () => {
    await navigator.clipboard?.writeText(getCampaignPath());
    setTemplateStatus('Path copied.', 'success');
  });
  els.openCopiedFolder?.addEventListener('click', async () => {
    if (!state.copiedCampaignRootDir || typeof window.showDirectoryPicker !== 'function') return;
    try {
      await window.showDirectoryPicker({ mode: 'read', startIn: state.copiedCampaignRootDir });
    } catch (error) {
      if (error.name !== 'AbortError') setTemplateStatus('Unable to open the copied folder picker.', 'error');
    }
  });
  els.openCopiedParent?.addEventListener('click', async () => {
    if (!state.campaignParentDir || typeof window.showDirectoryPicker !== 'function') return;
    try {
      await window.showDirectoryPicker({ mode: 'read', startIn: state.campaignParentDir });
    } catch (error) {
      if (error.name !== 'AbortError') setTemplateStatus('Unable to open the parent folder picker.', 'error');
    }
  });
  els.duplicateAnother?.addEventListener('click', () => {
    els.duplicateFolderName.value = '';
    state.htmlRenameMap.clear();
    state.copiedCampaignDir = null;
    state.copiedCampaignRootDir = null;
    state.campaignFolderReady = false;
    state.campaignFolderManual = false;
    if (state.templateStructure[3]) state.templateStructure[3].value = '';
    if (els.copySuccessPanel) els.copySuccessPanel.hidden = true;
    renderHtmlRenameFields();
    updateCampaignPathPreview();
    setTemplateStatus('Ready for another campaign folder.', 'success');
  });
  els.copyCampaignPath?.addEventListener('click', async () => {
    await navigator.clipboard?.writeText(getCampaignPath());
    setTemplateStatus('Target path copied.', 'success');
  });
  els.renameHtmlFile?.addEventListener('click', () => {
    renameSelectedHtmlFile().catch((error) => setTemplateStatus(error.message || 'Unable to rename HTML file.', 'error'));
  });
  els.htmlFileSelect?.addEventListener('change', () => {
    state.finalHtmlNameManual = false;
    syncTemplateFieldsFromSelectedHtml(true);
    syncTemplateFieldsFromFolderName();
    updateCampaignPathPreview();
  });
  els.finalHtmlName?.addEventListener('blur', () => {
    normalizeFinalHtmlInput();
    updateCampaignPathPreview();
  });

  els.canvas.addEventListener('pointerdown', (event) => {
    if (!state.image) return;
    const y = canvasToImageY(event);
    addLine(y);
  });

  els.guideLayer.addEventListener('pointerdown', (event) => {
    const guide = event.target.closest('[data-guide-index]');
    if (!guide) return;
    event.preventDefault();
    state.draggingLine = Number(guide.dataset.guideIndex);
    guide.setPointerCapture(event.pointerId);
  });

  document.addEventListener('pointermove', (event) => {
    if (state.draggingLine === null || !state.image) return;
    const y = canvasToImageY(event);
    const nextLines = [...state.lines];
    nextLines[state.draggingLine] = y;
    const draggedValue = normalizeLines([y])[0];
    state.lines = normalizeLines(nextLines);
    state.draggingLine = draggedValue ? state.lines.findIndex((line) => line === draggedValue) : null;
    state.generated = null;
    updateUi();
  });

  document.addEventListener('pointerup', () => {
    state.draggingLine = null;
  });

  els.autoSlice.addEventListener('click', autoSlice);
  els.clearLines.addEventListener('click', () => {
    state.lines = [];
    state.generated = null;
    if (els.exportSummary) els.exportSummary.hidden = true;
    setStatus('Slice lines cleared.', 'success');
    updateUi();
  });
  els.generateOutput.addEventListener('click', generateOutput);
  els.zoomOut?.addEventListener('click', () => setZoom(state.zoom - 0.1));
  els.zoomIn?.addEventListener('click', () => setZoom(state.zoom + 0.1));
  els.zoomLevel?.addEventListener('change', () => {
    if (els.zoomLevel.value === 'fit') {
      setZoom(getFitZoom(), 'fit');
      return;
    }
    setZoom(Number.parseFloat(els.zoomLevel.value));
  });
  window.addEventListener('resize', () => {
    if (state.zoomMode === 'fit') setZoom(getFitZoom(), 'fit');
  });
  els.saveFolder?.addEventListener('click', () => {
    saveToFolder().catch((error) => {
      if (error.name !== 'AbortError') setStatus(error.message || 'Unable to save files.', 'error');
    });
  });
  els.sliceList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-line]');
    if (!button) return;
    const index = Number(button.dataset.removeLine);
    state.lines.splice(index, 1);
    state.lines = normalizeLines(state.lines);
    state.generated = null;
    updateUi();
  });
  els.sliceList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-slice-include]');
    if (!checkbox) return;
    const index = Number(checkbox.dataset.sliceInclude);
    if (state.excluded[index] === undefined) return;
    state.excluded[index] = !checkbox.checked;
    state.generated = null;
    updateUi();
  });

  // CTA checkbox
  els.sliceList.addEventListener('change', (event) => {
    const cb = event.target.closest('[data-slice-cta]');
    if (!cb) return;
    const index = Number(cb.dataset.sliceCta);
    state.slices[index].cta = cb.checked;
    state.generated = null;
    const linkInput = document.querySelector(`[data-slice-link="${index}"]`);
    if (linkInput) linkInput.disabled = !cb.checked;
    updateUi();
  });

  // Link URL input
  els.sliceList.addEventListener('input', (event) => {
    const linkInput = event.target.closest('[data-slice-link]');
    if (!linkInput) return;
    const index = Number(linkInput.dataset.sliceLink);
    if (linkInput.value.startsWith('https://')) {
      linkInput.value = linkInput.value.replace('https://', 'http://');
    }
    state.slices[index].link = linkInput.value;
    state.generated = null;
  });

  // Alt use checkbox
  els.sliceList.addEventListener('change', (event) => {
    const cb = event.target.closest('[data-slice-usealt]');
    if (!cb) return;
    const index = Number(cb.dataset.sliceUsealt);
    state.slices[index].useAlt = cb.checked;
    state.generated = null;
    const altInput = document.querySelector(`[data-slice-alt="${index}"]`);
    if (altInput) altInput.disabled = !cb.checked;
    updateUi();
  });

  // Alt text input
  els.sliceList.addEventListener('input', (event) => {
    const altInput = event.target.closest('[data-slice-alt]');
    if (!altInput) return;
    const index = Number(altInput.dataset.sliceAlt);
    state.slices[index].alt = altInput.value;
    state.generated = null;
  });
  [
    els.imageFormat,
    els.exportWidth,
    els.exportDpi,
    els.imageQuality,
    els.filePrefix,
    els.duplicateFolderName
  ].forEach((input) => {
    if (!input) return;
    const handleFieldChange = () => {
      const hadGenerated = Boolean(state.generated);
      state.generated = null;
      if (hadGenerated && [els.imageFormat, els.exportWidth, els.exportDpi, els.imageQuality].includes(input)) {
        setStatus('Settings changed. Generate again to refresh slices.', 'success');
      }
      if (input === els.duplicateFolderName) {
        state.campaignFolderManual = false;
        syncCampaignFolderFromName();
      }
      updateCampaignPathPreview();
      updateUi();
    };
    input.addEventListener('input', handleFieldChange);
    input.addEventListener('change', handleFieldChange);
  });

  updateUi();

  // Code modal functionality
  const codeModal = document.getElementById('code-modal');
  const codeModalOutput = document.getElementById('code-modal-output');
  const codeModalLines = document.getElementById('code-modal-lines');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const closeCodeModal = document.getElementById('close-code-modal');
  const copyAllCode = document.getElementById('copy-all-code');

  function generateCodeForSlices() {
    const slices = state.slices.filter((s, i) => !state.excluded[i]);
    if (!slices.length) return '';

    const prefix = document.getElementById('file-prefix')?.value || 'img';
    let code = '';

    function buildImageTag(slice, i) {
      const num = String(i + 1).padStart(2, '0');
      const alt = escapeAttribute(slice.useAlt ? (slice.alt || 'image') : 'image');
      const src = `images/${prefix}_${num}.jpg`;
      const imgTag = `<img class="img_scale" src="${src}" editable="true" alt="${alt}" style="display: block; text-decoration: none; border-color: rgb(238, 53, 37); color: rgb(238, 53, 37);" border="0" width="600" />`;
      
      if (slice.cta && slice.link) {
        return `<a href="${escapeAttribute(slice.link)}" target="_blank" title="${alt}">\n  ${imgTag}\n</a>`;
      }
      return imgTag;
    }

    function buildImageTagGallery(slice, i) {
      const num = String(i + 1).padStart(2, '0');
      const alt = escapeAttribute(slice.useAlt ? (slice.alt || 'image') : 'image');
      const src = `images/${prefix}_${num}.jpg`;
      const imgTag = `<img class="img_scale" src="${src}" editable="true" alt="${alt}" style="display: block; text-decoration: none; border-color: rgb(238, 53, 37); color: rgb(238, 53, 37);" border="0" width="300" />`;
      
      if (slice.cta && slice.link) {
        return `<a href="${escapeAttribute(slice.link)}" target="_blank" title="${alt}">\n  ${imgTag}\n</a>`;
      }
      return imgTag;
    }

    const cardImageTag = `<img class="img_scale" src="images/template/header-hsbc.jpg" editable="true" alt="HSBC Card" style="display: block; text-decoration: none; border-color: rgb(238, 53, 37); color: rgb(238, 53, 37);" border="0" width="600" />`;

    code += `<!-- START OF IMAGE-->\n`;
    code += `<tr data-remove="ds-remove-1" class="ds-remove">\n`;
    code += `  <td mc:edit="FA_img" style="padding: 0px; font-family:Arial, sans-serif; font-style: italic; color:#242424; font-size:12px; line-height:18px;" align="center" valign="top">\n`;
    code += `    <!-- card image -->\n`;
    code += `    ${cardImageTag}\n`;
    code += `    <!-- end card image -->\n`;
    code += `    <!-- main KV image -->\n`;
    slices.forEach((slice, i) => {
      code += `${buildImageTag(slice, i).split('\n').map((line) => `    ${line}`).join('\n')}\n`;
    });
    code += `    <!-- end main KV image -->\n`;
    code += `  </td>\n`;
    code += `</tr>\n`;
    code += `<!-- END OF IMAGE-->\n`;

    return code;
  }

  function updateModalCode() {
    const code = generateCodeForSlices();
    if (codeModalOutput) codeModalOutput.textContent = code;
    if (codeModalLines) {
      const lineCount = Math.max(1, code.split('\n').length);
      codeModalLines.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join('\n');
    }
  }

  codeModalOutput?.parentElement.addEventListener('scroll', () => {
    if (codeModalLines) codeModalLines.scrollTop = codeModalOutput.parentElement.scrollTop;
  });

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      updateModalCode();
      codeModal?.showModal();
    });
  }

  if (closeCodeModal) {
    closeCodeModal.addEventListener('click', () => codeModal?.close());
  }

  if (codeModal) {
    codeModal.addEventListener('click', (e) => {
      if (e.target === codeModal) codeModal.close();
    });
  }

  if (copyAllCode) {
    copyAllCode.addEventListener('click', () => {
      const code = codeModalOutput?.textContent;
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          copyAllCode.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          setTimeout(() => {
            copyAllCode.innerHTML = '<i class="fa-regular fa-copy"></i> Copy to Clipboard';
          }, 2000);
        });
      }
    });
  }

  window.getSlicerState = function() {
    return {
      hasImage: !!state.image,
      hasSlices: state.slices.length > 0,
      hasGenerated: !!state.generated
    };
  };
})();
