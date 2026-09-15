const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/pages-database-checker.js'), 'utf8');
const constants = source.slice(
  source.indexOf('const LINES_PER_PAGE'),
  source.indexOf('// Make constants configurable')
) + source.slice(source.indexOf('const unitRegex'), source.indexOf('/* ========= File reader'));
const classStart = source.indexOf('class DatabaseChecker');
const classEnd = source.indexOf('\n/* ========= Utils', classStart);
const sandbox = {
  console,
  window: {},
  document: { addEventListener() {} },
  navigator: {},
  alert() {},
  setTimeout,
  clearTimeout,
  Blob,
  URL,
  TextDecoder,
  DOMException,
  AbortController,
  performance
};
const sessionValues = new Map();
sandbox.sessionStorage = {
  getItem(key) {
    return sessionValues.has(key) ? sessionValues.get(key) : null;
  },
  setItem(key, value) {
    sessionValues.set(key, String(value));
  }
};

vm.createContext(sandbox);
vm.runInContext(`${constants}\n${source.slice(classStart, classEnd)}\nthis.DatabaseChecker = DatabaseChecker;`, sandbox);

function checker() {
  const instance = Object.create(sandbox.DatabaseChecker.prototype);
  instance.updatePercent = () => {};
  return instance;
}

function packageFiles(rows = {}) {
  const defaults = {
    EmailCustMast: ['20260101_TEST-000001|user@example.com||||||||||||||||||'],
    CustPref: ['20260101_TEST-000001|user@example.com|CMPG_ID|20260101_TEST|'],
    CustSubs: ['20260101_TEST-000001|user@example.com|Marketing|Y|'],
    CustAttr: ['20260101_TEST-000001|user@example.com|CMPG_ID|20260101_TEST|']
  };

  return Object.fromEntries(Object.entries({ ...defaults, ...rows }).map(([type, lines]) => [
    type,
    { type, name: `${type}.txt`, size: lines.join('\n').length, lines }
  ]));
}

test('valid static package has no findings', async () => {
  const result = await checker().validateDatabasePackage(packageFiles(), { key: '20260101_TEST' });
  assert.equal(result.databaseType, 'Static');
  assert.equal(result.findingCount, 0);
});

test('dynamic package validates KRHRED values', async () => {
  const files = packageFiles({
    CustAttr: [
      '20260101_TEST-000001|user@example.com|CMPG_ID|20260101_TEST|',
      '20260101_TEST-000001|user@example.com|KRHRED_Unit_30|hello  world|'
    ]
  });
  const result = await checker().validateDatabasePackage(files, { key: '20260101_TEST' });
  assert.equal(result.databaseType, 'Dynamic');
  assert.equal(result.categoryCounts.find(([category]) => category === 'Repeated Spaces')[1], 1);
  assert.equal(result.categoryCounts.some(([category]) => category === 'Invalid KRHRED Data'), false);
});

test('missing file is reported', async () => {
  const files = packageFiles();
  delete files.CustSubs;
  const result = await checker().validateDatabasePackage(files, { key: '20260101_TEST' });
  assert.ok(result.findings.some((finding) => finding.category === 'Missing File' && finding.file === 'CustSubs'));
});

test('CustMast is accepted as a customer master alias', async () => {
  const files = packageFiles();
  files.CustMast = files.EmailCustMast;
  files.CustMast.type = 'CustMast';
  delete files.EmailCustMast;

  const result = await checker().validateDatabasePackage(files, { key: '20260101_TEST' });

  assert.equal(result.findingCount, 0);
  assert.equal(result.fileStats.find((item) => item.type === 'EmailCustMast').present, true);
});

test('customer master filename pattern accepts both supported names', () => {
  assert.equal(
    vm.runInContext("PACKAGE_FILE_PATTERN.test('20260101_TEST-EmailCustMast.txt')", sandbox),
    true
  );
  assert.equal(
    vm.runInContext("PACKAGE_FILE_PATTERN.test('20260101_TEST-CustMast.txt')", sandbox),
    true
  );
  assert.equal(vm.runInContext("normalizePackageFileType('CustMast')", sandbox), 'EmailCustMast');
});

test('email mismatch is reported across files', async () => {
  const files = packageFiles({
    CustPref: ['20260101_TEST-000001|other@example.com|CMPG_ID|20260101_TEST|']
  });
  const result = await checker().validateDatabasePackage(files, { key: '20260101_TEST' });
  assert.ok(result.findings.some((finding) => finding.category === 'Email Mismatch'));
});

test('clean routes do not collide with root HTML tool files', () => {
  const rootHtml = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
  assert.deepEqual(rootHtml, ['404.html', 'index.html']);

  const markdown = fs.readFileSync(path.join(root, 'content/database-checker.md'), 'utf8');
  assert.match(markdown, /tool: \/tools\/database-checker\.html\?embed=1/);
});

test('validation respects an aborted signal', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    checker().validateDatabasePackage(packageFiles(), { key: '20260101_TEST' }, controller.signal),
    (error) => error.name === 'AbortError'
  );
});

test('package date parser rejects implausible dates', () => {
  const instance = checker();
  assert.equal(instance.extractPackageDate('20260115_TEST').getFullYear(), 2026);
  assert.equal(instance.extractPackageDate('30250525_TEST'), null);
  assert.equal(instance.extractPackageDate('20261340_TEST'), null);
});

test('ASP package month and day inherit the dominant explicit year', () => {
  const instance = checker();
  const packages = [
    {
      key: '20250525_ABC_700',
      date: instance.extractPackageDate('20250525_ABC_700'),
      dateTimestamp: 0,
      latestModified: new Date(2026, 0, 1).getTime()
    },
    {
      key: '20250424_UAT',
      date: instance.extractPackageDate('20250424_UAT'),
      dateTimestamp: 0,
      latestModified: new Date(2026, 0, 1).getTime()
    },
    {
      key: 'ASP_IMO_9990525',
      date: null,
      dateTimestamp: 0,
      latestModified: new Date(2026, 0, 1).getTime()
    }
  ];

  instance.resolvePackageDates(packages);
  assert.equal(instance.getDateKey(packages[2].date), '2025-05-25');
  assert.match(packages[2].dateSource, /inferred 2025/);
});

test('ASP month-day parser uses the final four digits', () => {
  const instance = checker();
  assert.deepEqual(
    { ...instance.extractAspMonthDay('ASP_IMO_7000525') },
    { month: 5, day: 25 }
  );
  assert.equal(instance.extractAspMonthDay('ASP_IMO_7001399'), null);
});

test('file modified date never determines package grouping', () => {
  const instance = checker();
  const packages = [{
    key: 'CAMPAIGN_WITHOUT_DATE',
    date: null,
    dateTimestamp: 0,
    dateSource: '',
    latestModified: new Date(2026, 5, 14).getTime()
  }];

  instance.resolvePackageDates(packages);
  assert.equal(packages[0].date, null);
  assert.equal(packages[0].dateTimestamp, 0);
  assert.equal(packages[0].dateSource, '');
});

test('ASP package without a campaign year reference stays unknown', () => {
  const instance = checker();
  const packages = [{
    key: 'ASP_IMO_9990525',
    date: null,
    dateTimestamp: 0,
    dateSource: '',
    latestModified: new Date(2026, 5, 14).getTime()
  }];

  instance.resolvePackageDates(packages);
  assert.equal(packages[0].date, null);
  assert.equal(packages[0].dateSource, '');
});

test('package findings group by warning type and filter by KRHRED unit', () => {
  const instance = checker();
  const findings = [
    instance.createFinding('KRHRED Too Long', 'CustAttr', 2, '', 'KRHRED_Unit_30 contains 70 characters.'),
    instance.createFinding('Empty KRHRED Value', 'CustAttr', 3, '', 'KRHRED_Unit_31: Value is empty.'),
    instance.createFinding('Repeated Spaces', 'CustAttr', 4, '', 'KRHRED_Unit_30: Value contains repeated spaces.')
  ];

  const allGroups = instance.groupPackageFindings(findings);
  assert.equal(allGroups.length, 3);

  const filteredGroups = instance.groupPackageFindings(findings, 'KRHRED_Unit_30');
  assert.deepEqual(
    Array.from(filteredGroups, (group) => [group.category, group.items.length]),
    [['KRHRED Too Long', 1], ['Repeated Spaces', 1]]
  );
});

test('compact finding reason removes repeated KRHRED unit prefix', () => {
  const instance = checker();
  const finding = instance.createFinding(
    'Empty KRHRED Value',
    'CustAttr',
    4,
    '',
    'KRHRED_Unit_30: Value is empty.'
  );

  assert.equal(
    instance.getCompactFindingReason(finding),
    'Value is empty.'
  );
});

test('KRHRED value anomalies use specific categories', () => {
  const instance = checker();

  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue('').anomalies, (item) => item.category),
    ['Empty KRHRED Value']
  );
  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue('.').anomalies, (item) => item.category),
    ['Dot-only KRHRED Value']
  );
  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue(' value ').anomalies, (item) => item.category),
    ['Outer Whitespace']
  );
  assert.deepEqual(
    Array.from(instance.describeInvalidKrhredValue('hello  world').anomalies, (item) => item.category),
    ['Repeated Spaces']
  );
});

test('layout test substitutes customer values and reports unresolved KRHRED units', () => {
  const result = checker().applyKrhredTemplate(
    '<p><%[KRHRED_Unit_30]|%></p><p><%[KRHRED_31]|%></p>',
    { KRHRED_Unit_30: 'Hello Budi' }
  );

  assert.equal(result.content, '<p>Hello Budi</p><p></p>');
  assert.deepEqual(Array.from(result.usedUnits), ['KRHRED_Unit_30', 'KRHRED_Unit_31']);
  assert.deepEqual(Array.from(result.missingUnits), ['KRHRED_Unit_31']);
});

test('layout highlight marks visible KRHRED text without breaking attributes', () => {
  const result = checker().applyHighlightedKrhredTemplate(
    '<a href="?name=<%[KRHRED_Unit_30]|%>">Hello <%[KRHRED_Unit_30]|%></a>',
    { KRHRED_Unit_30: 'Budi' }
  );

  assert.equal(
    result,
    '<a href="?name=Budi">Hello <mark class="edm-krhred-highlight" title="KRHRED_Unit_30">Budi</mark></a>'
  );
});

test('layout highlight marks every visible KRHRED unit and removes empty values', () => {
  const result = checker().applyHighlightedKrhredTemplate(
    '<p><%[KRHRED_Unit_30]|%> / <%[KRHRED_Unit_31]|%> / <%[KRHRED_Unit_32]|%></p>',
    {
      KRHRED_Unit_30: 'First',
      KRHRED_Unit_31: 'Second',
      KRHRED_Unit_32: ''
    }
  );

  assert.match(result, /title="KRHRED_Unit_30">First<\/mark>/);
  assert.match(result, /title="KRHRED_Unit_31">Second<\/mark>/);
  assert.doesNotMatch(result, /KRHRED_Unit_32/);
});

test('layout coverage is based on resolved layout units', () => {
  const instance = checker();
  const html = '<%[KRHRED_Unit_30]|%><%[KRHRED_Unit_31]|%><%[KRHRED_Unit_32]|%>';
  const result = instance.applyKrhredTemplate(html, {
    KRHRED_Unit_30: 'A',
    KRHRED_Unit_31: '',
    KRHRED_Unit_32: 'C'
  });

  const total = instance.extractKrhredPlaceholders(html).length;
  assert.equal(total - result.missingUnits.length, 2);
  assert.equal(total, 3);
});

test('subject KRHRED normalizer follows Config eDM token format', () => {
  const instance = checker();
  assert.equal(
    instance.normalizeSubjectKrhredTokens('Untuk KRHRED-unit-31'),
    'Untuk <%[KRHRED_Unit_31]|%>'
  );
  assert.equal(
    instance.normalizeSubjectKrhredTokens('Untuk KRHRED_unit_salah'),
    'Untuk <%[KRHRED_Unit_XX]|%>'
  );
  assert.equal(instance.normalizeSubjectKrhredTokens('Plain subject'), 'Plain subject');
  assert.equal(instance.normalizeSubjectKrhredTokens(''), '');
});

test('layout test extracts unique KRHRED placeholders in numeric order', () => {
  const units = checker().extractKrhredPlaceholders(
    '<%[KRHRED_Unit_32]|%> <%[KRHRED_Unit_7]|%> <%[KRHRED_Unit_32]|%>'
  );

  assert.deepEqual(Array.from(units), ['KRHRED_Unit_7', 'KRHRED_Unit_32']);
});

test('layout HTML title can still be extracted for reference', () => {
  assert.equal(
    checker().extractHtmlTitle('<html><head><title> RFM Spend Boost | HSBC Indonesia </title></head></html>'),
    'RFM Spend Boost | HSBC Indonesia'
  );
});

test('layout preview injects a base URL for relative campaign assets', () => {
  const result = checker().prepareLayoutPreviewHtml(
    '<html><head></head><body><img src="images/banner.jpg"></body></html>',
    'https://mail.example.com/campaign/layout.html'
  );

  assert.match(result, /<base href="https:\/\/mail\.example\.com\/campaign\/">/);
});

test('layout test customer samples include checked dynamic values', () => {
  const instance = checker();
  const mastRecords = [{
    id: '20260101_TEST-000001',
    email: 'user@example.com'
  }];
  const attrRecords = [{
    id: '20260101_TEST-000001',
    attribute: 'KRHRED_Unit_31',
    valueRaw: 'Budi'
  }];
  const attrById = new Map([
    ['20260101_TEST-000001', new Set(['CMPG_ID', 'KRHRED_Unit_31'])]
  ]);

  assert.deepEqual(
    JSON.parse(JSON.stringify(instance.buildLayoutTestCustomers(mastRecords, attrRecords, attrById))),
    [{
      id: '20260101_TEST-000001',
      email: 'user@example.com',
      campaignId: '20260101_TEST',
      values: { KRHRED_Unit_31: 'Budi' }
    }]
  );
});

test('layout test accepts pasted HTML without a network request', async () => {
  const html = '<!doctype html><html><head><title>Test</title></head><body>Layout</body></html>';
  assert.equal(await checker().fetchLayoutTemplate('https://example.com/layout.html', null, html), html);
});

test('layout source fetch accepts the first valid parallel proxy response', async () => {
  const calls = [];
  sandbox.fetch = async (url) => {
    calls.push(url);
    if (url.includes('api.codetabs.com')) {
      return {
        ok: true,
        text: async () => '<!doctype html><html><body>Proxy layout</body></html>'
      };
    }
    throw new Error('Unavailable');
  };

  const result = await checker().fetchRemoteLayoutTemplate('https://example.com/layout.html');
  assert.equal(result.via, 'CodeTabs');
  assert.match(result.html, /Proxy layout/);
  assert.equal(calls.length, 9);
  delete sandbox.fetch;
});

test('layout test draft temporarily stores URL and subject', () => {
  const instance = checker();
  instance.layoutTestUrl = { value: 'https://example.com/layout.html' };
  instance.layoutTestSubject = { value: 'Hello <%[KRHRED_Unit_31]|%>' };
  instance.saveLayoutTestDraft();

  instance.layoutTestUrl.value = '';
  instance.layoutTestSubject.value = '';
  instance.restoreLayoutTestDraft();

  assert.equal(instance.layoutTestUrl.value, 'https://example.com/layout.html');
  assert.equal(instance.layoutTestSubject.value, 'Hello <%[KRHRED_Unit_31]|%>');
});

test('manual layout customer lookup accepts exact email', async () => {
  const instance = checker();
  const makeHandle = (lines) => ({
    async getFile() {
      return new Blob([lines.join('\n')]);
    }
  });
  instance.selectedPackage = {
    files: new Map([
      ['EmailCustMast', makeHandle(['20260101_TEST-000001|user@example.com||||||||||||||||||'])],
      ['CustAttr', makeHandle([
        '20260101_TEST-000001|user@example.com|CMPG_ID|20260101_TEST|',
        '20260101_TEST-000001|user@example.com|KRHRED_Unit_31|Budi|'
      ])]
    ])
  };

  const customer = await instance.findLayoutTestCustomer('user@example.com');
  assert.equal(customer.id, '20260101_TEST-000001');
  assert.equal(customer.values.KRHRED_Unit_31, 'Budi');
});
