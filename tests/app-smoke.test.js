const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function getRoutes() {
  const app = read('js/app.js');
  const routeBlock = app.match(/const ROUTES = \{([\s\S]*?)\n\};/);
  assert.ok(routeBlock, 'ROUTES block exists');
  return Array.from(routeBlock[1].matchAll(/'([^']+)':\s*\{([\s\S]*?)\n\s*\}/g))
    .map((match) => {
      const routeBody = match[2];
      const content = routeBody.match(/content:\s*'([^']+)'/)?.[1];
      const source = routeBody.match(/source:\s*'([^']+)'/)?.[1] || 'content';
      return { path: match[1], content, source };
    })
    .filter((route) => route.content);
}

test('all SPA routes have matching markdown content', () => {
  for (const route of getRoutes()) {
    const base = route.source === 'docs' ? 'docs' : 'content';
    assert.ok(fs.existsSync(path.join(root, base, route.content)), `${route.path} content exists`);
  }
});

test('all tool routes have a tool version entry', () => {
  const versions = read('js/tool-versions.js');
  const routes = getRoutes().filter((route) => route.path !== '/');
  for (const route of routes) {
    const key = route.path.slice(1);
    assert.match(versions, new RegExp(`(?:['"]${key}['"]|${key})\\s*:`), `${key} has a version entry`);
  }
});

test('home tool count excludes documentation and maintenance routes', () => {
  const app = read('js/app.js');
  assert.match(app, /const TOOL_COUNT = Object\.keys\(TOOL_META\)[\s\S]*path !== '\/docs'[\s\S]*path !== '\/maintenance'/);
  assert.match(read('content/home.md'), /\*\*Available tools:\*\* `11`/);
});

test('tool markdown files point to existing HTML tools', () => {
  for (const fileName of fs.readdirSync(path.join(root, 'content')).filter((name) => name.endsWith('.md'))) {
    const markdown = read(`content/${fileName}`);
    const toolMatch = markdown.match(/^tool:\s*(.+)$/m);
    if (!toolMatch) continue;
    const toolPath = toolMatch[1].trim().replace(/^\/+/, '').split('?')[0];
    if (/^https?:\/\//i.test(toolPath)) continue;
    assert.ok(fs.existsSync(path.join(root, toolPath)), `${fileName} tool exists at ${toolPath}`);
  }
});

test('Layout Checker includes local typo scanner assets', () => {
  const html = read('tools/layout-checker.html');
  assert.match(html, /js\/typo-dictionary\.js/);
  assert.match(html, /js\/typo-engine\.js/);
  assert.match(html, /id="typoCheckerBtn"/);
  assert.match(read('js/typo-dictionary.js'), /hte:\s*'the'/);
  assert.match(read('js/typo-engine.js'), /function scanHtml\(html\)/);
});

test('typo engine does not flag correctly spelled dictionary suggestions', () => {
  const engine = read('js/typo-engine.js');
  assert.match(engine, /if \(suggestion\.toLowerCase\(\) === lower\) continue;/);
});

test('shell loads required maintenance scripts', () => {
  const app = read('js/app.js');
  for (const file of ['index.html', '404.html']) {
    const html = read(file);
    assert.match(html, /js\/tool-versions\.js/, `${file} loads tool versions`);
  }
  assert.match(app, /local-backup\.js/, 'app.js lazy-loads local backup helper');
  assert.match(app, /privacy-settings\.js/, 'app.js lazy-loads privacy settings');
});

test('standalone tools use the current core version-config cache-buster', () => {
  const versionConfig = read('js/version-config.js');
  const coreVersion = versionConfig.match(/version:\s*'([^']+)'/)?.[1];
  assert.ok(coreVersion, 'core version exists');
  const toolsDir = path.join(root, 'tools');
  for (const fileName of fs.readdirSync(toolsDir).filter((name) => name.endsWith('.html'))) {
    const html = read(`tools/${fileName}`);
    assert.match(html, new RegExp(`version-config\\.js\\?v=${coreVersion.replace(/\./g, '\\.')}`), `${fileName} uses current version config`);
  }
});

test('local-only tools do not load their removed external integrations', () => {
  const campaignCounter = read('tools/campaign-counter.html');
  const tncUploader = read('js/pages-tnc-uploader.js');
  const wfhTracker = read('js/pages-wfh-tracker.js');
  assert.doesNotMatch(campaignCounter, /supabase|campaign-counter-supabase/i);
  assert.doesNotMatch(tncUploader, /fetch\(|proxy|checkItemLink|verifyLink/i);
  assert.doesNotMatch(wfhTracker, /fetch\(|HOLIDAY_API|upset\.dev|fetchHolidayMap|EDM_PRIVACY/i);
});
