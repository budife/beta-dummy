const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../js/campaign-id-core.js');
const localStore = require('../js/campaign-id-local-store.js');

test('normalizes and sorts used campaign sequences', () => {
  assert.deepEqual(core.normalizeUsedSequences(['0231', 228, '0229', 228, 'x']), [228, 229, 231]);
});

test('allocates the smallest available gap from the smallest used sequence', () => {
  assert.equal(core.findNextAvailable([228, 229, 231, 235]), 230);
});

test('skips numbers already used ahead of the current gap', () => {
  const used = [228, 229, 230, 231, 235];
  assert.equal(core.findNextAvailable(used), 232);
  assert.equal(core.findNextAvailable([...used, 232, 233, 234]), 236);
});

test('respects an explicit sequence floor', () => {
  assert.equal(core.findNextAvailable([1, 2, 228, 229], 228), 230);
});

test('higher subitem ranges do not move the active regular floor', () => {
  const used = [244, 245, 246, 1111, 1112, 1113, 9999];
  assert.equal(core.findNextAvailable(used, 245), 247);
});

test('formats campaign sequence as four digits', () => {
  assert.equal(core.formatSequence(29), '0029');
  assert.equal(core.formatSequence('0228'), '0228');
});

test('groups IDs into regular and thousand series', () => {
  assert.equal(core.getSeries(246).key, 'regular');
  assert.equal(core.getSeries(1116).key, 'series-1000');
  assert.equal(core.getSeries(9999).key, 'series-9000');
});

test('series state uses the number after the latest used ID', () => {
  const values = [244, 245, 246, 1111, 1116, 9999];
  assert.deepEqual(
    core.getSeriesState(values, 'regular'),
    {
      key: 'regular',
      label: 'Regular',
      start: 1,
      end: 999,
      used: [244, 245, 246],
      latest: 246,
      next: 247
    }
  );
  assert.equal(core.getSeriesState(values, 'series-1000').next, 1117);
  assert.equal(core.getSeriesState(values, 'series-9000').next, null);
});

test('extracts Campaign IDs from Monday worksheet cell text', () => {
  assert.deepEqual(
    core.extractCampaignIds('20260614_edm4_0247 and 20260614_sub1_1117'),
    [
      { campaignId: '20260614_edm4_0247', sequenceNumber: 247 },
      { campaignId: '20260614_sub1_1117', sequenceNumber: 1117 }
    ]
  );
});

test('parses blast date and sequence from a full Campaign ID', () => {
  assert.deepEqual(
    core.parseCampaignId('20260614_edm-reblast_0246'),
    {
      campaignId: '20260614_edm-reblast_0246',
      sequenceNumber: 246,
      campaignLabel: 'edm-reblast',
      blastDate: '2026-06-14'
    }
  );
  assert.equal(core.parseCampaignId('20260230_invalid_0246').blastDate, null);
});

test('groups reblasts under the same sequence and sorts newest first', () => {
  const groups = core.groupCampaignRecords([
    { sequenceNumber: 246, campaignId: 'A', blastDate: '2026-06-14' },
    { sequenceNumber: 246, campaignId: 'B', blastDate: '2026-06-20' },
    { sequenceNumber: 1111, campaignId: 'C', blastDate: '2026-06-15' }
  ]);
  assert.deepEqual(groups.get(246).map(record => record.campaignId), ['B', 'A']);
  assert.equal(groups.get(1111).length, 1);
});

test('pairs Monday item and subitem names with their Campaign IDs', () => {
  const records = core.extractCampaignRecordsFromRows([
    ['Task', 'Campaign ID'],
    ['EDM 4', '20260614_edm4_0247'],
    ['Subitem', 'Owner', 'Campaign ID (sub)'],
    ['Reblast A', '', '20260620_reblast-a_0247'],
    ['Reblast B', '', '20260621_reblast-b_1117']
  ], 'Board');

  assert.deepEqual(records, [
    {
      fullCampaignId: '20260614_edm4_0247',
      sequenceNumber: 247,
      itemName: 'EDM 4',
      itemType: 'item',
      blastDate: '2026-06-14',
      sheetName: 'Board',
      sourceRow: 2
    },
    {
      fullCampaignId: '20260620_reblast-a_0247',
      sequenceNumber: 247,
      itemName: 'Reblast A',
      itemType: 'subitem',
      blastDate: '2026-06-20',
      sheetName: 'Board',
      sourceRow: 4
    },
    {
      fullCampaignId: '20260621_reblast-b_1117',
      sequenceNumber: 1117,
      itemName: 'Reblast B',
      itemType: 'subitem',
      blastDate: '2026-06-21',
      sheetName: 'Board',
      sourceRow: 5
    }
  ]);
});

test('local Campaign ID store exposes its existing backup operations', () => {
  assert.deepEqual(
    Object.keys(localStore).sort(),
    ['importRecords', 'load', 'reserve', 'reset', 'saveFolderHandle']
  );
});

test('Campaign Counter uses a local service while the bookmarklet stays local', () => {
  const adapter = fs.readFileSync(path.join(__dirname, '../js/campaign-counter-local.js'), 'utf8');
  const counter = fs.readFileSync(path.join(__dirname, '../js/pages-campaign-counter.js'), 'utf8');
  const bookmarklet = fs.readFileSync(path.join(__dirname, '../js/monday-campaign-bookmarklet.js'), 'utf8');
  assert.match(adapter, /localStorage/);
  assert.doesNotMatch(adapter, /supabase|createClient|script\.google/i);
  assert.match(adapter, /subscribeCounter/);
  assert.match(counter, /CampaignRegistryService/);
  assert.doesNotMatch(bookmarklet, /supabase|campaign-id-bridge|neuyjcotcmjnndjyzbcq/i);
});

test('Campaign Counter uses browser storage as its source of truth', () => {
  const counter = fs.readFileSync(path.join(__dirname, '../js/pages-campaign-counter.js'), 'utf8');
  const adapter = fs.readFileSync(path.join(__dirname, '../js/campaign-counter-local.js'), 'utf8');
  assert.match(adapter, /STORAGE_KEY/);
  assert.match(adapter, /Math\.min\(current \+ 1, 9999\)/);
  assert.match(adapter, /Math\.max\(\(await loadCounter\(\)\) - 1, 1\)/);
  assert.doesNotMatch(counter, /currentCampaignId\s*=\s*Math\.min\(currentCampaignId \+ 1, 9999\)/);
  assert.match(counter, /campaignRegistryService\.generateCampaign\(username, dateStamp, campaignName\)/);
  assert.match(counter, /campaignRegistryService\.backCampaign\(username\)/);
  assert.match(counter, /subscribeCounter/);
});

test('Campaign Counter Phase 1 exposes only the dashboard workflow', () => {
  const counterSource = fs.readFileSync(
    path.join(__dirname, '../tools/campaign-counter.html'),
    'utf8'
  );
  const counterScript = fs.readFileSync(
    path.join(__dirname, '../js/pages-campaign-counter.js'),
    'utf8'
  );
  const bookmarkletSource = fs.readFileSync(
    path.join(__dirname, '../js/monday-campaign-bookmarklet.js'),
    'utf8'
  );

  assert.match(counterSource, /id="generate-campaign"/);
  assert.match(counterSource, /id="activity-list"/);
  assert.match(counterSource, /id="welcome-dialog"/);
  assert.match(counterSource, /id="edit-last-campaign"/);
  assert.match(counterSource, /id="manual-dialog"/);
  assert.match(counterScript, /setNextCampaignId/);
  assert.match(counterScript, /setNextCampaignId/);
  assert.doesNotMatch(counterSource, /id="scan-folder"/);
  assert.match(counterScript, /showDirectoryPicker/);
  assert.match(bookmarkletSource, /<option value="merge">Merge<\/option>/);
  assert.match(bookmarkletSource, /<option value="replace">Replace<\/option>/);
  assert.match(bookmarkletSource, /Local backup downloaded/);
});
