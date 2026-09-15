/**
 * Tool Version Registry
 * Keeps each eDM Helper tool on its own release line.
 */

const TOOL_VERSIONS = {
  core: {
    label: 'Core',
    version: '6.16.25',
    status: 'stable'
  },
  home: {
    label: 'Home',
    version: '1.0.1',
    status: 'stable'
  },
  bookmarklet: {
    label: 'Bookmarklet',
    version: '1.3.1',
    status: 'stable'
  },
  'campaign-counter': {
    label: 'Campaign Counter',
    version: '1.7.0',
    status: 'stable'
  },
  'config-edm': {
    label: 'Config eDM',
    version: '1.6.1',
    status: 'stable'
  },
  'database-checker': {
    label: 'Database Checker',
    version: '1.8.1',
    status: 'stable'
  },
  'database-generator': {
    label: 'Database Generator',
    version: '1.5.9',
    status: 'stable'
  },

  'doc-to-html': {
    label: 'DOCX to HTML',
    version: '1.3.10',
    status: 'stable'
  },
  'layout-checker': {
    label: 'Layout Checker',
    version: '2.1.10',
    status: 'stable'
  },
  'layout-slicer': {
    label: 'Layout Slicer',
    version: '0.5.5',
    status: 'stable'
  },
  'tnc-uploader': {
    label: 'TNC Uploader',
    version: '0.3.13',
    status: 'stable'
  },
  'text-correction': {
    label: 'Text Correction',
    version: '1.0.2',
    status: 'stable'
  },
  'wfh-tracker': {
    label: 'WFH Tracker',
    version: '1.3.0',
    status: 'stable'
  },
  docs: {
    label: 'Documentation',
    version: '1.0.2',
    status: 'stable'
  },
  maintenance: {
    label: 'Documentation',
    version: '1.0.3',
    status: 'stable'
  }
};

function getToolVersion(key) {
  return TOOL_VERSIONS[key] || null;
}
