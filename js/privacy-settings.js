/**
 * eDM Helper privacy/network settings.
 * Stored locally in the browser and shared across tools on the same origin.
 */
(function () {
  const STORAGE_PREFIX = 'edm-helper:privacy:';

  const DEFINITIONS = {
    externalChecks: {
      label: 'Enable external URL checks',
      description: 'Allows tools to fetch public layout URLs and open public HTTP/HTTPS resources.',
      defaultValue: true
    },
    proxyFallbacks: {
      label: 'Enable proxy fallback',
      description: 'Allows fallback proxy services only when direct browser requests are blocked.',
      defaultValue: true
    },
  };

  function getStorageKey(key) {
    return `${STORAGE_PREFIX}${key}`;
  }

  function get(key) {
    const definition = DEFINITIONS[key];
    if (!definition) return true;
    const stored = localStorage.getItem(getStorageKey(key));
    if (stored === null) return definition.defaultValue;
    return stored === 'true';
  }

  function set(key, value) {
    if (!DEFINITIONS[key]) return;
    localStorage.setItem(getStorageKey(key), value ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('edm-helper:privacy-change', {
      detail: { key, value: Boolean(value), settings: all() }
    }));
  }

  function all() {
    return Object.fromEntries(
      Object.keys(DEFINITIONS).map((key) => [key, get(key)])
    );
  }

  window.EDM_PRIVACY = {
    definitions: DEFINITIONS,
    get,
    set,
    all
  };
})();
