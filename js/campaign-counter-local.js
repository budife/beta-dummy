(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CampaignCounterLocalStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'edm-helper:campaign-counter';
  const VERSION = 1;
  const MAX_ACTIVITY = 200;

  function createInitialState() {
    return {
      version: VERSION,
      currentCampaignId: 0,
      activity: [],
      folderScans: [],
      lastFolderName: '',
      updatedAt: null
    };
  }

  function normalizeId(value) {
    const id = Number.parseInt(value, 10);
    return Number.isInteger(id) && id >= 0 && id <= 9999 ? id : 0;
  }

  function normalizeState(value) {
    const state = value && typeof value === 'object' ? value : {};
    return {
      ...createInitialState(),
      ...state,
      version: VERSION,
      currentCampaignId: normalizeId(state.currentCampaignId),
      activity: Array.isArray(state.activity) ? state.activity.slice(0, MAX_ACTIVITY) : [],
      folderScans: Array.isArray(state.folderScans) ? state.folderScans : [],
      lastFolderName: typeof state.lastFolderName === 'string' ? state.lastFolderName : ''
    };
  }

  function read() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch {
      return createInitialState();
    }
  }

  function write(state) {
    const next = normalizeState({ ...state, updatedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function addActivity(state, item) {
    state.activity = [
      { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...item },
      ...state.activity
    ].slice(0, MAX_ACTIVITY);
  }

  function updateCounter(id, item) {
    const state = read();
    state.currentCampaignId = normalizeId(id);
    addActivity(state, {
      campaign_id: state.currentCampaignId,
      generated_at: new Date().toISOString(),
      generated_by: item.generated_by || 'Local user',
      action: item.action || 'manual_set',
      note: item.note || '',
      full_id: item.full_id || ''
    });
    return write(state);
  }

  function importData(payload, mode) {
    const imported = normalizeState(payload);
    if (mode === 'replace') return write(imported);
    const current = read();
    const activity = [...current.activity, ...imported.activity]
      .filter((item, index, list) => item.id && list.findIndex(other => other.id === item.id) === index)
      .sort((a, b) => String(b.generated_at).localeCompare(String(a.generated_at)))
      .slice(0, MAX_ACTIVITY);
    const folderScans = [...current.folderScans, ...imported.folderScans]
      .filter((item, index, list) => {
        const key = `${item.campaign_id}|${item.folder_date}|${item.campaign_name}|${item.manager}`;
        return list.findIndex(other => `${other.campaign_id}|${other.folder_date}|${other.campaign_name}|${other.manager}` === key) === index;
      });
    return write({
      ...current,
      currentCampaignId: Math.max(current.currentCampaignId, imported.currentCampaignId),
      activity,
      folderScans,
      lastFolderName: imported.lastFolderName || current.lastFolderName
    });
  }

  return {
    STORAGE_KEY,
    VERSION,
    load: read,
    checkConnection: async () => ({ connected: true }),
    loadCounter: async () => read().currentCampaignId,
    loadRecentActivity: async () => read().activity,
    generateCampaign: async (username, dateStamp, campaignName) => {
      const nextId = Math.min(read().currentCampaignId + 1, 9999);
      const stamp = dateStamp || new Date().toISOString().slice(0, 10).replaceAll('-', '');
      const slug = String(campaignName || 'campaign-name').trim().replace(/\s+/g, '') || 'campaign-name';
      const result = { campaign_id: nextId, full_id: `${stamp}_${slug}_${String(nextId).padStart(4, '0')}` };
      updateCounter(nextId, { generated_by: username, action: 'generate', full_id: result.full_id });
      return result;
    },
    backCampaign: async username => {
      const nextId = Math.max(read().currentCampaignId - 1, 0);
      updateCounter(nextId, { generated_by: username, action: 'back', note: 'Moved counter back by one' });
      return { campaign_id: nextId };
    },
    setNextCampaignId: async (nextId, username, note) => {
      const id = normalizeId(nextId);
      if (id < 1) throw new Error('Campaign ID must be between 0001 and 9999.');
      updateCounter(id, { generated_by: username, action: 'manual_set', note });
      return { campaign_id: id };
    },
    setCounter: updateCounter,
    saveFolderScans(folderName, entries) {
      const state = read();
      const existing = new Set(state.folderScans.map(item => `${item.campaign_id}|${item.folder_date}|${item.campaign_name}|${item.manager}`));
      entries.forEach(entry => {
        const key = `${entry.campaign_id}|${entry.folder_date}|${entry.campaign_name}|${entry.manager}`;
        if (!existing.has(key)) state.folderScans.push(entry);
      });
      state.lastFolderName = folderName || state.lastFolderName;
      return write(state);
    },
    loadFolderScans: async () => read().folderScans,
    clearFolderScans() {
      const state = read();
      state.folderScans = [];
      state.lastFolderName = '';
      return write(state);
    },
    importData,
    exportData: read,
    reset() {
      return write(createInitialState());
    }
  };
});
