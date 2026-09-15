const PROJECT_PATH = '/beta';
const isProjectPath = (
  window.location.pathname === PROJECT_PATH
  || window.location.pathname.startsWith(`${PROJECT_PATH}/`)
);
const BASE_PATH = window.location.hostname.includes('github.io') || isProjectPath
  ? PROJECT_PATH
  : '';

const ROUTES = {
  '/': {
    content: 'home.md',
    label: 'Overview'
  },
  '/bookmarklet': {
    content: 'bookmarklet.md',
    label: 'Bookmarklet'
  },
  '/campaign-counter': {
    content: 'campaign-counter.md',
    label: 'Campaign Counter'
  },
  '/config-edm': {
    content: 'config-edm.md',
    label: 'Config eDM'
  },
  '/database-checker': {
    content: 'database-checker.md',
    label: 'Database Checker'
  },
  '/database-generator': {
    content: 'database-generator.md',
    label: 'Database Generator'
  },

  '/doc-to-html': {
    content: 'doc-to-html.md',
    label: 'DOCX to HTML'
  },
  '/layout-checker': {
    content: 'layout-checker.md',
    label: 'Layout Checker'
  },
  '/layout-slicer': {
    content: 'layout-slicer.md',
    label: 'Layout Slicer'
  },
  '/tnc-uploader': {
    content: 'tnc-uploader.md',
    label: 'TNC Uploader'
  },
  '/text-correction': {
    content: 'text-correction.md',
    label: 'Text Correction'
  },
  '/wfh-tracker': {
    content: 'wfh-tracker.md',
    label: 'WFH Tracker'
  },
  '/docs': {
    content: 'index.md',
    label: 'Documentation',
    source: 'docs'
  },
  '/maintenance': {
    content: 'index.md',
    label: 'Documentation',
    source: 'docs'
  }
};

const LEGACY_PATHS = {
  '/index.html': '/',
  '/bookmarklet.html': '/bookmarklet',
  '/campaign-counter.html': '/campaign-counter',
  '/config.html': '/config-edm',
  '/database-checker.html': '/database-checker',
  '/database-generator.html': '/database-generator',

  '/doc-to-html.html': '/doc-to-html',
  '/layout-checker.html': '/layout-checker',
  '/layout-slicer.html': '/layout-slicer',
  '/tnc-uploader.html': '/tnc-uploader',
  '/wfh-tracker.html': '/wfh-tracker',
  '/maintenance.html': '/docs'
};

const viewport = document.getElementById('content-viewport');
const sidebar = document.getElementById('app-sidebar');
const backdrop = document.getElementById('sidebar-backdrop');
const menuToggle = document.getElementById('menu-toggle');
const routePageCache = new Map();
const routeScrollPositions = new Map();
const PERSISTENT_TOOL_ROUTES = new Set(['/database-checker', '/config-edm']);
let activeRoutePath = '';

const TOOL_META = {
  '/bookmarklet': {
    icon: 'fa-solid fa-bookmark',
    label: 'Bookmarklet'
  },
  '/campaign-counter': {
    icon: 'fa-solid fa-chart-line',
    label: 'Campaign Counter'
  },
  '/config-edm': {
    icon: 'fa-solid fa-sliders',
    label: 'Config eDM'
  },
  '/database-checker': {
    icon: 'fa-solid fa-circle-check',
    label: 'Database Checker'
  },
  '/database-generator': {
    icon: 'fa-solid fa-database',
    label: 'Database Generator'
  },

  '/doc-to-html': {
    icon: 'fa-solid fa-file-word',
    label: 'DOCX to HTML'
  },
  '/layout-checker': {
    icon: 'fa-solid fa-ruler-combined',
    label: 'Layout Checker'
  },
  '/layout-slicer': {
    icon: 'fa-solid fa-scissors',
    label: 'Layout Slicer'
  },
  '/tnc-uploader': {
    icon: 'fa-solid fa-file-pdf',
    label: 'TNC Uploader'
  },
  '/text-correction': {
    icon: 'fa-solid fa-spell-check',
    label: 'Text Correction'
  },
  '/wfh-tracker': {
    icon: 'fa-solid fa-calendar-days',
    label: 'WFH Tracker'
  },
  '/docs': {
    icon: 'fa-solid fa-shield-halved',
    label: 'Documentation'
  },
  '/maintenance': {
    icon: 'fa-solid fa-shield-halved',
    label: 'Documentation'
  }
};

const TOOL_COUNT = Object.keys(TOOL_META).filter((path) => path !== '/maintenance').length;

const TOOL_PRIVACY = {
  '/bookmarklet': 'Local only',
  '/campaign-counter': 'Local only',
  '/config-edm': 'Local only',
  '/database-checker': 'External checks optional',
  '/database-generator': 'Local only',

  '/doc-to-html': 'Local + CDN assets',
  '/layout-checker': 'External + CDN assets',
  '/layout-slicer': 'Local + CDN assets',
  '/tnc-uploader': 'Local only',
  '/text-correction': 'Local only',
  '/wfh-tracker': 'Local only',
  '/maintenance': 'Local only'
};

const LAZY_SCRIPT_CACHE = new Map();
function loadScript(src) {
  if (LAZY_SCRIPT_CACHE.has(src)) return LAZY_SCRIPT_CACHE.get(src);
  if (document.querySelector(`script[src="${CSS.escape(src)}"]`)) {
    const done = Promise.resolve();
    LAZY_SCRIPT_CACHE.set(src, done);
    return done;
  }
  const promise = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
  LAZY_SCRIPT_CACHE.set(src, promise);
  return promise;
}

const HOME_BADGE_CACHE_KEY = 'edm-helper:home-badge-cache';
const HOME_BADGE_TTL = 3 * 60 * 1000;

function getCachedHomeBadge() {
  try {
    const raw = sessionStorage.getItem(HOME_BADGE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.md || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > HOME_BADGE_TTL) return null;
    return parsed.md;
  } catch { return null; }
}

function setCachedHomeBadge(md) {
  try { sessionStorage.setItem(HOME_BADGE_CACHE_KEY, JSON.stringify({ md, ts: Date.now() })); } catch {}
}

function ensurePrivacySettings() {
  if (window.EDM_PRIVACY) return Promise.resolve();
  return loadScript(withBasePath('/js/privacy-settings.js'));
}

function ensureLocalBackup() {
  if (window.EDM_LOCAL_BACKUP) return Promise.resolve();
  return loadScript(withBasePath('/js/local-backup.js'));
}

function getVersion() {
  return typeof VERSION_CONFIG !== 'undefined' ? VERSION_CONFIG.version : '6.6.0';
}

function getRouteToolKey(path, route) {
  if (path === '/') return 'home';
  if (route?.source === 'docs') return 'docs';
  return path.replace(/^\//, '');
}

function getRouteToolVersion(path, route) {
  const key = getRouteToolKey(path, route);
  if (typeof getToolVersion === 'function') return getToolVersion(key);
  if (typeof TOOL_VERSIONS !== 'undefined') return TOOL_VERSIONS[key] || null;
  return null;
}

function renderToolVersionBadge(path, route) {
  if (path === '/') return '';
  const versionInfo = getRouteToolVersion(path, route);
  if (!versionInfo?.version) return '';
  const isBeta = versionInfo.status === 'beta' || route?.status === 'beta';
  const label = `v${versionInfo.version}${isBeta ? ' beta' : ''}`;
  return `<span class="tool-version-badge${isBeta ? ' is-beta' : ''}">${escapeHtml(label)}</span>`;
}

function renderPrivacyBadge(path) {
  const label = TOOL_PRIVACY[path];
  if (!label) return '';
  const isLocal = label === 'Local only';
  const isShared = label === 'Supabase + local';
  const isExternal = label.includes('External') || label.includes('CDN');
  const classes = [
    'tool-privacy-badge',
    isLocal ? 'is-local' : '',
    isShared ? 'is-shared' : '',
    isExternal ? 'is-external' : ''
  ].filter(Boolean).join(' ');
  return `<span class="${classes}">${escapeHtml(label)}</span>`;
}

function withBasePath(path) {
  const absolutePath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${absolutePath}` || '/';
}

function withQueryParam(path, key, value) {
  const hashIndex = path.indexOf('#');
  const base = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}${hash}`;
}

function stripBasePath(pathname) {
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length) || '/';
  }

  return pathname || '/';
}

function normalizePath(pathname) {
  if (LEGACY_PATHS[pathname]) {
    return LEGACY_PATHS[pathname];
  }

  if (pathname.length > 1) {
    return pathname.replace(/\/+$/, '');
  }

  return pathname;
}

function getCurrentPath() {
  let path = window.location.pathname;
  if (path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  if (!path || path === '/') return '/';
  return normalizePath(path);
}

function configureRouteLinks() {
  document.querySelectorAll('a[data-route]').forEach((link) => {
    const currentHref = link.getAttribute('href') || '/';
    const routePath = currentHref === './'
      ? '/'
      : normalizePath(stripBasePath(new URL(currentHref, window.location.href).pathname));

    link.dataset.routePath = routePath;
    link.setAttribute('href', withBasePath(routePath));
  });
}

function parseFrontmatter(source) {
  const result = { attributes: {}, body: source.trim() };

  if (!source.startsWith('---')) {
    return result;
  }

  const closingMarker = source.indexOf('\n---', 3);
  if (closingMarker === -1) {
    return result;
  }

  const frontmatter = source.slice(3, closingMarker).trim();
  result.body = source.slice(closingMarker + 4).trim();

  frontmatter.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(':');
    if (separator === -1) return;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    result.attributes[key] = value;
  });

  return result;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isWithinRecentDays(date, days = 3) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const diffDays = Math.floor((getStartOfDay(new Date()) - getStartOfDay(date)) / 86400000);
  return diffDays >= 0 && diffDays <= days;
}

function parseUpdateDate(text) {
  const monthIndex = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11
  };
  const match = text.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  if (!match) return null;
  return new Date(Number(match[3]), monthIndex[match[2].toLowerCase()], Number(match[1]));
}

function renderMarkdown(source) {
  if (!source) return '';

  const lines = source.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let listType = null;
  let sectionOpen = false;
  let subsectionOpen = false;
  let detailsOpen = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  lines.forEach((line) => {
    const detailsStart = line.match(/^:::details\s+(.+)$/);
    if (detailsStart) {
      flushParagraph();
      closeList();
      if (detailsOpen) html.push('</details>');
      html.push(`<details class="docs-details"><summary>${inlineMarkdown(detailsStart[1])}</summary>`);
      detailsOpen = true;
      return;
    }

    if (line.trim() === ':::') {
      flushParagraph();
      closeList();
      if (detailsOpen) {
        html.push('</details>');
        detailsOpen = false;
      }
      return;
    }

    if (line.trim() === '{{privacy-settings}}') {
      flushParagraph();
      closeList();
      html.push('<div class="privacy-settings-panel" data-privacy-settings></div>');
      return;
    }

    if (line.trim() === '{{local-backup}}') {
      flushParagraph();
      closeList();
      html.push('<div class="local-backup-mount" data-local-backup></div>');
      return;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);

    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      const headingHtml = inlineMarkdown(heading[2]);
      const headingId = slugifyHeading(heading[2]);

      if (level === 2) {
        if (subsectionOpen) {
          html.push('</div>');
          subsectionOpen = false;
        }
        if (sectionOpen) html.push('</section>');
        html.push(`<section class="markdown-section" data-section="${headingId}">`);
        sectionOpen = true;
      } else if (level === 3) {
        if (subsectionOpen) html.push('</div>');
        html.push('<div class="markdown-subsection">');
        subsectionOpen = true;
      }

      html.push(`<h${level} id="${headingId}">${headingHtml}</h${level}>`);
      return;
    }

    if (unordered || ordered) {
      flushParagraph();
      const nextListType = unordered ? 'ul' : 'ol';
      if (listType !== nextListType) {
        closeList();
        listType = nextListType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      return;
    }

    paragraph.push(line.trim());
  });

  flushParagraph();
  closeList();
  if (detailsOpen) html.push('</details>');
  if (subsectionOpen) html.push('</div>');
  if (sectionOpen) html.push('</section>');
  return html.join('');
}

function configureMarkdownLinks(container) {
  container.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#')) {
      link.dataset.anchor = href.slice(1);
      return;
    }

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) {
      link.target = '_blank';
      link.rel = 'noreferrer';
      return;
    }

    const routePath = normalizePath(stripBasePath(url.pathname));
    if (!ROUTES[routePath]) return;

    link.dataset.route = '';
    link.dataset.routePath = routePath;
    link.setAttribute('href', withBasePath(routePath));
  });
}

function scrollToMarkdownAnchor(anchor, options = {}) {
  if (!anchor) return false;
  const id = decodeURIComponent(anchor).replace(/^#/, '');
  if (!id) return false;

  const target = document.getElementById(id) || document.querySelector(`[data-section="${CSS.escape(id)}"]`);
  if (!target) return false;

  const offset = Math.max(0, target.offsetTop - 18);
  viewport.scrollTo({
    top: offset,
    behavior: options.instant ? 'auto' : 'smooth'
  });
  target.focus?.({ preventScroll: true });
  return true;
}

function setActiveDocsTab(container, anchor) {
  if (!container || !anchor) return;
  container.querySelectorAll('[data-section="security-navigation"] a[data-anchor]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.anchor === anchor);
  });
}

function enhanceHomeDashboard(container) {
  const quickAccess = container.querySelector('[data-section="quick-access"]');
  quickAccess?.querySelectorAll('li').forEach((item) => {
    const link = item.querySelector('a[data-route-path]');
    const meta = link ? TOOL_META[link.dataset.routePath] : null;
    if (!link || !meta) return;

    Array.from(item.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .forEach((node) => node.remove());

    item.classList.add('quick-access-item');
    link.insertAdjacentHTML(
      'afterbegin',
      `<span class="quick-access-icon"><i class="${meta.icon}" aria-hidden="true"></i></span>`
    );
  });

  const sitemap = container.querySelector('[data-section="tool-sitemap"]');
  sitemap?.querySelectorAll('.markdown-subsection').forEach((section) => {
    const heading = section.querySelector('h3');
    const count = section.querySelectorAll('li').length;
    if (!heading) return;
    heading.insertAdjacentHTML('beforeend', `<span class="section-count">${count}</span>`);
  });

  const updates = container.querySelector('[data-section="recent-updates"]');
  if (updates) {
    const subsections = Array.from(updates.querySelectorAll('.markdown-subsection'));
    if (subsections.length > 1) {
      const tabsWrapper = document.createElement('div');
      tabsWrapper.className = 'updates-tabs';

      const tabBar = document.createElement('div');
      tabBar.className = 'updates-tab-bar';
      tabsWrapper.appendChild(tabBar);

      const tabContent = document.createElement('div');
      tabContent.className = 'updates-tab-content';
      tabsWrapper.appendChild(tabContent);

      const tabIds = [];
      subsections.forEach((sub, i) => {
        const h3 = sub.querySelector('h3');
        const dateText = h3?.textContent || `Tab ${i + 1}`;
        const tabId = `update-tab-${i}`;
        tabIds.push(tabId);

        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = `updates-tab-btn${i === 0 ? ' active' : ''}`;
        tabBtn.dataset.tab = tabId;
        tabBtn.textContent = dateText;
        tabBar.appendChild(tabBtn);

        const panel = document.createElement('div');
        panel.className = `updates-tab-panel${i === 0 ? ' active' : ''}`;
        panel.id = tabId;
        panel.append(...Array.from(sub.querySelectorAll('ul, p')));

        sub.querySelectorAll('code').forEach((code) => {
          if (code.textContent.trim().toLowerCase() !== 'budd') return;
           code.textContent = 'budife.psd';
        });

        tabContent.appendChild(panel);
      });

      tabBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.updates-tab-btn');
        if (!btn) return;
        const tabId = btn.dataset.tab;
        tabBar.querySelectorAll('.updates-tab-btn').forEach((b) => b.classList.remove('active'));
        tabContent.querySelectorAll('.updates-tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        tabContent.querySelector(`#${tabId}`)?.classList.add('active');
      });

      subsections.forEach((sub) => sub.remove());
      const existingLink = updates.querySelector('p:last-child a');
      updates.appendChild(tabsWrapper);
      if (existingLink) {
        updates.appendChild(existingLink);
      }
    } else {
      const updateItems = Array.from(updates.querySelectorAll('li'));
      updateItems[0]?.classList.add('latest-update');
      updates.querySelectorAll('code').forEach((code) => {
        if (code.textContent.trim().toLowerCase() !== 'budd') return;
         code.textContent = 'budife.psd';
      });
    }
  }

  const usefulLinks = container.querySelector('[data-section="useful-links"]');
  usefulLinks?.querySelectorAll('li').forEach((item) => {
    const link = item.querySelector('a');
    if (!link) return;

    let icon = 'fa-solid fa-sitemap';
    if (link.href.includes('/issues')) icon = 'fa-solid fa-circle-exclamation';
    if (link.href.includes('github.com') && !link.href.includes('/issues')) icon = 'fa-brands fa-github';
    link.insertAdjacentHTML('afterbegin', `<i class="${icon}" aria-hidden="true"></i>`);
  });

  const systemInfo = container.querySelector('[data-section="system-info"]');
  if (systemInfo) {
    const list = systemInfo.querySelector('ul');
    list?.insertAdjacentHTML(
      'afterbegin',
      `<li><strong>Version:</strong> <code>${escapeHtml(getVersion())}</code></li>`
    );
  }
}

async function renderPrivacySettings(container) {
  const panel = container.querySelector('[data-privacy-settings]');
  if (!panel) return;
  try { await ensurePrivacySettings(); } catch {}
  if (!window.EDM_PRIVACY) return;

  const definitions = window.EDM_PRIVACY.definitions;
  panel.innerHTML = Object.entries(definitions).map(([key, definition]) => `
    <label class="privacy-setting">
      <span>
        <strong>${escapeHtml(definition.label)}</strong>
        <small>${escapeHtml(definition.description)}</small>
      </span>
      <input type="checkbox" data-privacy-key="${escapeHtml(key)}" ${window.EDM_PRIVACY.get(key) ? 'checked' : ''}>
    </label>
  `).join('');

  panel.addEventListener('change', (event) => {
    const input = event.target.closest('[data-privacy-key]');
    if (!input) return;
    window.EDM_PRIVACY.set(input.dataset.privacyKey, input.checked);
  });
}

async function renderLocalBackup(container) {
  const panel = container.querySelector('[data-local-backup]');
  if (!panel) return;
  try { await ensureLocalBackup(); } catch {}
  if (!window.EDM_LOCAL_BACKUP?.render) {
    panel.innerHTML = '<p class="local-backup-status is-error">Local backup helper failed to load.</p>';
    return;
  }
  window.EDM_LOCAL_BACKUP.render(panel);
}

function enhanceDocsPage(container) {
  renderDocsTools(container);
  renderLocalBackup(container);
  renderPrivacySettings(container);
  const currentAnchor = window.location.hash.slice(1);
  const firstTab = container.querySelector('[data-section="security-navigation"] a[data-anchor]');
  setActiveDocsTab(container, currentAnchor || firstTab?.dataset.anchor);
}

function renderDocsTools(container) {
  const navigation = container.querySelector('[data-section="docs-navigation"]');
  if (!navigation || container.querySelector('[data-docs-tools]')) return;

  const tools = document.createElement('div');
  tools.className = 'docs-tools';
  tools.dataset.docsTools = '';
  tools.innerHTML = `
    <label class="docs-search">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input type="search" placeholder="Search documentation" aria-label="Search documentation" data-docs-search>
    </label>
    <div class="docs-tools-actions">
      <button type="button" data-docs-expand>Expand all</button>
      <button type="button" data-docs-collapse>Collapse all</button>
    </div>
    <p class="docs-search-status" data-docs-search-status hidden></p>
  `;
  navigation.insertAdjacentElement('afterend', tools);

  const details = Array.from(container.querySelectorAll('.docs-details'));
  const sections = Array.from(container.querySelectorAll('.markdown-section:not([data-section="docs-navigation"])'));
  const search = tools.querySelector('[data-docs-search]');
  const status = tools.querySelector('[data-docs-search-status]');

  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let matchedSections = 0;

    sections.forEach((section) => {
      const sectionMatches = !query || section.textContent.toLowerCase().includes(query);
      section.hidden = !sectionMatches;
      if (sectionMatches) matchedSections += 1;
    });

    details.forEach((item) => {
      if (query && item.textContent.toLowerCase().includes(query)) item.open = true;
    });

    status.hidden = !query;
    status.textContent = query
      ? `${matchedSections} section${matchedSections === 1 ? '' : 's'} matched.`
      : '';
  });

  tools.querySelector('[data-docs-expand]').addEventListener('click', () => {
    details.forEach((item) => { item.open = true; });
  });
  tools.querySelector('[data-docs-collapse]').addEventListener('click', () => {
    details.forEach((item) => { item.open = false; });
  });
}

function setActiveLink(path) {
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    const active = link.dataset.routePath === path;
    link.classList.toggle('active', active);
    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

const recentUpdateDates = new Map();

function parseRecentUpdateDates(markdown) {
  const lines = markdown.split('\n');
  let inRecentUpdates = false;
  let currentDate = null;
  for (const line of lines) {
    if (/^##\s+Recent Updates/i.test(line)) { inRecentUpdates = true; continue; }
    if (inRecentUpdates && /^##\s/.test(line)) break;
    if (!inRecentUpdates) continue;
    const headingMatch = line.match(/^###\s+(\d{1,2}\s+\w+\s+\d{4})/i);
    if (headingMatch) {
      currentDate = parseUpdateDate(headingMatch[1]);
      continue;
    }
    const match = line.match(/\*\*(.+?)\s+v[\d.]+\s/i);
    if (!match) continue;
    const toolName = match[1].trim().toLowerCase();
    const date = currentDate || parseUpdateDate(line);
    if (!date) continue;
    const existing = recentUpdateDates.get(toolName);
    if (!existing || date > existing) recentUpdateDates.set(toolName, date);
  }
}

function applySidebarBadges() {
  document.querySelectorAll('.sidebar-link[data-route]').forEach((link) => {
    const existing = link.querySelector('.sidebar-new-badge');
    if (existing) existing.remove();
    const rawHref = link.getAttribute('href') || '';
    const routePath = rawHref.startsWith('/') ? rawHref : `/${rawHref}`;
    const meta = TOOL_META[routePath];
    if (!meta) return;
    const date = recentUpdateDates.get(meta.label.toLowerCase());
    if (!date || !isWithinRecentDays(date)) return;
    const badge = document.createElement('span');
    badge.className = 'sidebar-new-badge';
    badge.textContent = 'new';
    link.appendChild(badge);
  });
}

function closeSidebar() {
  sidebar.classList.remove('open');
  backdrop.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
}

function styleEmbeddedTool(frame) {
  try {
    const frameDocument = frame.contentDocument;
    const frameWindow = frame.contentWindow;
    if (!frameDocument || !frameWindow) return;
    const scrollableToolPaths = [
      '/bookmarklet.html',
      '/campaign-counter.html',
      '/database-generator.html',
      '/layout-slicer.html',
      '/tnc-uploader.html',
      '/wfh-tracker.html',
    ];
    const allowsPageScroll = scrollableToolPaths.some((path) => frameWindow.location.pathname.endsWith(path));
    const isCampaignCounter = frameWindow.location.pathname.endsWith('/campaign-counter.html');

    const style = frameDocument.createElement('style');
    style.textContent = `
      html, body {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        overflow-x: hidden !important;
      }
      body { padding-top: 0 !important; min-height: 100% !important; }
      body > .header, body > .footer { display: none !important; }
      main#main-content {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        overflow-x: hidden !important;
        overflow-y: ${allowsPageScroll ? 'auto' : 'hidden'} !important;
        overscroll-behavior: contain;
      }
      main#main-content > .sidebar,
      main#main-content > .main-content,
      .content-area,
      .panel,
      .panel-body {
        min-height: 0 !important;
      }
      ${isCampaignCounter ? `
        .campaign-section {
          height: auto !important;
          min-height: 100% !important;
        }
        .campaign-section .container,
        .tab-content,
        .tab-pane.active {
          height: auto !important;
        }
        .history-container,
        .history-list {
          overflow: visible !important;
        }
      ` : ''}
    `;
    frameDocument.head.appendChild(style);
    frameWindow.history.scrollRestoration = 'manual';
    frameWindow.scrollTo(0, 0);
    frameWindow.requestAnimationFrame(() => frameWindow.scrollTo(0, 0));

    frameDocument.querySelectorAll('a[href$="index.html"], a[href="/"], a.nav-link').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (href === '/' || href?.endsWith('index.html')) {
          event.preventDefault();
          navigate('/');
        }
      });
    });
  } catch (error) {
    console.warn('Unable to apply embedded tool layout styles.', error);
  } finally {
    frame.classList.add('is-ready');
  }
}

function clearTransientViews() {
  viewport.querySelectorAll('[data-transient-view]').forEach(element => element.remove());
}

function deactivateRoutePages() {
  if (activeRoutePath) routeScrollPositions.set(activeRoutePath, viewport.scrollTop);
  viewport.querySelectorAll('[data-route-page]').forEach(page => {
    const path = page.dataset.routePage;
    if (PERSISTENT_TOOL_ROUTES.has(path)) {
      page.hidden = true;
      return;
    }
    page.remove();
    routePageCache.delete(path);
    routeScrollPositions.delete(path);
  });
}

function activateRoutePage(path) {
  const page = routePageCache.get(path);
  if (!page) return false;
  clearTransientViews();
  deactivateRoutePages();
  page.hidden = false;
  activeRoutePath = path;
  document.title = page.dataset.documentTitle || `${ROUTES[path]?.label || 'BETA'} | BETA`;
  viewport.scrollTop = routeScrollPositions.get(path) || 0;
  viewport.focus({ preventScroll: true });
  return true;
}

function showTransientView(markup) {
  clearTransientViews();
  deactivateRoutePages();
  const transient = document.createElement('div');
  transient.dataset.transientView = 'true';
  transient.innerHTML = markup;
  viewport.appendChild(transient);
  activeRoutePath = '';
}

async function renderPage(path, route, markdown) {
  const { attributes, body } = parseFrontmatter(markdown);
  const title = attributes.title || route.label;
  const description = attributes.description || '';
  const icon = attributes.icon || 'fa-solid fa-wand-magic-sparkles';
  const category = attributes.category || 'BETA';
  const tool = attributes.tool
    ? /^https?:\/\//i.test(attributes.tool)
      ? attributes.tool
      : withQueryParam(withBasePath(attributes.tool), 'embed', '1')
    : '';
  const isHome = route.content === 'home.md';
  const isDocs = route.source === 'docs';

  const documentTitle = `${title} | BETA`;
  document.title = documentTitle;

  const intro = `
    <header class="content-intro">
      <div class="content-intro-topline">
        <p class="content-eyebrow">${escapeHtml(category)}</p>
        ${isHome ? `
          <div class="home-meta" aria-label="Application information">
            <span class="version-badge">v${escapeHtml(getVersion())}</span>
            <span class="status-badge"><span class="status-dot"></span>All systems operational</span>
            <span class="tool-count-badge">${TOOL_COUNT} tools</span>
          </div>
        ` : ''}
      </div>
      <h1 class="content-title">
        <i class="${escapeHtml(icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(title)}</span>
        ${renderToolVersionBadge(path, route)}
        ${renderPrivacyBadge(path)}
      </h1>
      ${description ? `<p class="content-description">${escapeHtml(description)}</p>` : ''}
    </header>
  `;

  const markdownContent = body
    ? `<article class="markdown-content">${renderMarkdown(body)}</article>`
    : '';

  const toolFrame = tool
    ? `
      <div class="tool-frame-wrap">
        <iframe
          class="tool-frame"
          src="${escapeHtml(tool)}"
          title="${escapeHtml(title)} tool"
          loading="eager"
        ></iframe>
      </div>
    `
    : '';

  const pageClass = tool ? 'content-page content-page--tool' : 'content-page';
  clearTransientViews();
  deactivateRoutePages();
  const page = document.createElement('div');
  page.className = pageClass;
  page.dataset.routePage = path;
  page.dataset.documentTitle = documentTitle;
  page.innerHTML = `${intro}${markdownContent}${toolFrame}`;
  viewport.appendChild(page);
  if (PERSISTENT_TOOL_ROUTES.has(path)) routePageCache.set(path, page);
  activeRoutePath = path;

  const markdownContainer = page.querySelector('.markdown-content');
  if (markdownContainer) {
    configureMarkdownLinks(markdownContainer);
    if (isDocs) {
      markdownContainer.classList.add('docs-content');
      enhanceDocsPage(markdownContainer);
    }
    if (isHome) {
      markdownContainer.classList.add('home-dashboard');
      enhanceHomeDashboard(markdownContainer);
      applySidebarBadges();
    }
  }

  if (window.location.hash) {
    window.requestAnimationFrame(() => {
      scrollToMarkdownAnchor(window.location.hash.slice(1), { instant: true });
    });
  }

  const frame = page.querySelector('.tool-frame');
  if (frame) {
    frame.addEventListener('load', () => styleEmbeddedTool(frame));
  }
}

function renderNotFound() {
  document.title = 'Page Not Found | BETA';
  showTransientView(`
    <section class="content-error">
      <p class="content-eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The requested BETA tool does not exist.</p>
      <a href="${withBasePath('/')}" data-route data-route-path="/">Back to overview</a>
    </section>
  `);
}

function renderLocalServerWarning() {
  document.title = 'Local Server Required | BETA';
  showTransientView(`
    <section class="content-error">
      <p class="content-eyebrow">Local file</p>
      <h1>Unable to load this tool</h1>
      <p>Please run BETA through its local server instead of opening the HTML file directly.</p>
    </section>
  `);
}

function renderContentError(error) {
  document.title = 'Content Error | BETA';
  showTransientView(`
    <section class="content-error">
      <p class="content-eyebrow">Content error</p>
      <h1>Unable to load this tool</h1>
      <p>The tool content could not be loaded. Please refresh the page and try again.</p>
    </section>
  `);
  console.error(error);
}

async function loadRoute(path) {
  const route = ROUTES[path];
  setActiveLink(path);
  closeSidebar();

  if (window.location.protocol === 'file:') {
    renderLocalServerWarning();
    return;
  }

  if (!route) {
    renderNotFound();
    return;
  }

  if (activateRoutePage(path)) return;

  showTransientView(`
    <div class="content-loading" role="status">
      <i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
      <span>Loading ${escapeHtml(route.label)}...</span>
    </div>
  `);

  try {
    const contentRoot = route.source === 'docs' ? 'docs' : 'content';
    const contentUrl = `${BASE_PATH}/${contentRoot}/${route.content}`;
    const response = await fetch(contentUrl, { cache: 'default' });
    if (!response.ok) {
      throw new Error(`Unable to load ${contentUrl}: ${response.status}`);
    }
    await renderPage(path, route, await response.text());
    viewport.scrollTop = 0;
    viewport.focus({ preventScroll: true });
  } catch (error) {
    renderContentError(error);
  }
}

function navigate(path, options = {}) {
  const normalized = normalizePath(path);
  const browserPath = withBasePath(normalized);
  if (!options.replace && browserPath !== window.location.pathname) {
    window.history.pushState({}, '', browserPath);
  } else if (options.replace || browserPath !== window.location.pathname) {
    window.history.replaceState({}, '', browserPath);
  }
  loadRoute(normalized);
}

document.addEventListener('click', (event) => {
  const anchorLink = event.target.closest('a[data-anchor]');
  if (anchorLink && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    const anchor = anchorLink.dataset.anchor;
    if (scrollToMarkdownAnchor(anchor)) {
      const markdownContainer = anchorLink.closest('.markdown-content');
      setActiveDocsTab(markdownContainer, anchor);
      window.history.replaceState({}, '', `${window.location.pathname}#${anchor}`);
    }
    return;
  }

  const link = event.target.closest('a[data-route]');
  if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const url = new URL(link.href, window.location.origin);
  if (url.origin !== window.location.origin) return;

  const targetPath = normalizePath(stripBasePath(url.pathname));
  if (targetPath !== activeRoutePath) {
    const frame = viewport.querySelector('.tool-frame');
    const slicerState = frame?.contentWindow?.getSlicerState?.();
    if (slicerState && (slicerState.hasImage || slicerState.hasSlices || slicerState.hasGenerated) && !window.confirm('This tool has unsaved data. Leave anyway?')) {
      return;
    }
    const tncState = frame?.contentWindow?.getTncUploaderState?.();
    if (tncState && (tncState.hasQueuedFiles || tncState.hasUploadedFiles) && !window.confirm('TNC Uploader has uploaded or queued PDFs. Leave anyway?')) {
      return;
    }
  }

  event.preventDefault();
  navigate(targetPath);
});

window.addEventListener('popstate', () => {
  loadRoute(getCurrentPath());
});

menuToggle.addEventListener('click', () => {
  const open = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  backdrop.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
});

backdrop.addEventListener('click', closeSidebar);

document.getElementById('footer-year').textContent = '2025';

configureRouteLinks();

const homeContentUrl = `${BASE_PATH}/content/home.md`;
const cachedHomeBadge = getCachedHomeBadge();
if (cachedHomeBadge) {
  parseRecentUpdateDates(cachedHomeBadge);
  applySidebarBadges();
} else {
  fetch(homeContentUrl, { cache: 'default' })
    .then((res) => res.ok ? res.text() : '')
    .then((md) => {
      if (md) setCachedHomeBadge(md);
      parseRecentUpdateDates(md);
      applySidebarBadges();
    })
    .catch(() => applySidebarBadges());
}

viewport.replaceChildren();

const initialPath = getCurrentPath();
const initialBrowserPath = withBasePath(initialPath);
if (initialBrowserPath !== window.location.pathname) {
  window.history.replaceState({}, '', initialBrowserPath);
}
loadRoute(initialPath);
