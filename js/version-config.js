/**
 * Version Configuration System
 * Manages application version and build information
 */

function generateBuildNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${time}`;
}

const VERSION_CONFIG = {
  version: '6.16.21',
  buildDate: new Date().toISOString(),
  buildNumber: generateBuildNumber(),
  environment: 'development',
  appName: 'BETA',
  author: 'budife.psd'
};

function getVersionInfo() {
  return {
    ...VERSION_CONFIG,
    currentYear: new Date().getFullYear(),
    formattedBuildDate: formatDate(VERSION_CONFIG.buildDate)
  };
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

function getCreatorFooterMarkup() {
  const versionInfo = getVersionInfo();
  return `© 2025 ${versionInfo.appName} by <span>budife.psd</span>`;
}

function updateFooterVersion() {
  const yearElement = document.getElementById('footer-year');
  if (yearElement) {
    yearElement.textContent = '2025';
  }
  document.querySelectorAll('.footer-text').forEach((footerText) => {
    footerText.innerHTML = getCreatorFooterMarkup();
  });
}

function updateAllVersionDisplays() {
  const versionInfo = getVersionInfo();
  updateFooterVersion();
  const versionElements = document.querySelectorAll('[data-version]');
  versionElements.forEach(element => {
    element.textContent = `v${versionInfo.version}`;
  });
  const buildDateElements = document.querySelectorAll('[data-build-date]');
  buildDateElements.forEach(element => {
    element.textContent = versionInfo.formattedBuildDate;
  });
}

function getAppVersion() {
  return VERSION_CONFIG.version;
}

function getBuildInfo() {
  return {
    version: VERSION_CONFIG.version,
    buildDate: VERSION_CONFIG.buildDate,
    buildNumber: VERSION_CONFIG.buildNumber,
    environment: VERSION_CONFIG.environment
  };
}

document.addEventListener('DOMContentLoaded', function() {
  updateAllVersionDisplays();
});

window.updateVersion = function(newVersion, buildDate = null) {
  VERSION_CONFIG.version = newVersion;
  if (buildDate) {
    VERSION_CONFIG.buildDate = buildDate;
  }
  VERSION_CONFIG.buildNumber = generateBuildNumber();
  updateAllVersionDisplays();
};
