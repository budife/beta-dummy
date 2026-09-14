(function (root, factory) {
  root.CampaignRegistryService = factory(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  const STORAGE_KEY = 'edm-helper:campaign-counter';
  const ACTIVITY_KEY = 'edm-helper:campaign-counter-activity';
  const FOLDER_KEY = 'edm-helper:campaign-counter-folders';

  function read(key, fallback) {
    try { return JSON.parse(root.localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  function write(key, value) { root.localStorage.setItem(key, JSON.stringify(value)); }

  async function loadCounter() {
    return Number(read(STORAGE_KEY, { currentValue: 0 }).currentValue) || 0;
  }

  async function loadLastCampaign() {
    return read(ACTIVITY_KEY, [])[0] || null;
  }

  async function checkConnection() {
    return { connected: true };
  }

  async function loadRecentActivity() {
    return read(ACTIVITY_KEY, []).slice(0, 20);
  }

  async function generateCampaign(username, dateStamp, campaignName) {
    const current = await loadCounter();
    const campaign_id = Math.min(current + 1, 9999);
    const result = { campaign_id, generated_by: username, generated_at: new Date().toISOString(), action: 'generated', full_id: `${dateStamp}_${campaignName || 'nama-campaign'}_${String(campaign_id).padStart(4, '0')}` };
    write(STORAGE_KEY, { currentValue: campaign_id });
    write(ACTIVITY_KEY, [result, ...read(ACTIVITY_KEY, [])].slice(0, 100));
    return result;
  }

  async function backCampaign(username) {
    const campaign_id = Math.max((await loadCounter()) - 1, 1);
    write(STORAGE_KEY, { currentValue: campaign_id });
    return { campaign_id };
  }

  async function setNextCampaignId(nextCampaignId, username, note) {
    const campaign_id = Number(nextCampaignId);
    write(STORAGE_KEY, { currentValue: campaign_id });
    write(ACTIVITY_KEY, [{ campaign_id, generated_by: username, generated_at: new Date().toISOString(), action: 'manual_set', note: note || '' }, ...read(ACTIVITY_KEY, [])].slice(0, 100));
    return { campaign_id };
  }

  function subscribeCounter(onChange) {
    const handler = () => loadCounter().then(onChange);
    root.addEventListener('storage', handler);
    return () => root.removeEventListener('storage', handler);
  }

  function subscribeActivity(onInsert) {
    const handler = () => onInsert(read(ACTIVITY_KEY, [])[0]);
    root.addEventListener('storage', handler);
    return () => root.removeEventListener('storage', handler);
  }

  async function saveFolderScan(scannedBy, folderName, entries) {
    const existing = read(FOLDER_KEY, []);
    write(FOLDER_KEY, [...existing, ...entries.map(entry => ({ ...entry, scanned_by: scannedBy, folder_name: folderName }))]);
    return entries.length;
  }

  async function loadFolderScans() {
    return read(FOLDER_KEY, []);
  }

  async function clearFolderScans(scannedBy) {
    write(FOLDER_KEY, read(FOLDER_KEY, []).filter(entry => entry.scanned_by !== scannedBy));
    return true;
  }

  return {
    checkConnection,
    loadLastCampaign,
    loadCounter,
    loadRecentActivity,
    generateCampaign,
    backCampaign,
    setNextCampaignId,
    subscribeCounter,
    subscribeActivity,
    saveFolderScan,
    loadFolderScans,
    clearFolderScans
  };
});
