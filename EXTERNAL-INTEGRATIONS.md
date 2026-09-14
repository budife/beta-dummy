# External Integrations

The application is now local-first for data and integrations. Runtime code does not connect to Supabase,
Google Apps Script, Cloudflare Workers, public CORS proxies, or a holiday API.

## What Was Disabled

- **Campaign Counter:** data, activity, manual changes, and folder scans use browser `localStorage`.
- **Layout Checker:** remote fetchers are disabled. Use a local HTML file or paste the HTML source.
- **Database Checker:** remote layout checks are disabled. Use a local file or pasted HTML.
- **TNC Uploader:** link verification is disabled. The tool still creates and copies links, but does not request them.
- **WFH Tracker:** holiday data uses the built-in local calendar only; automatic API sync is disabled.
- **Proxy image/screenshot fetches:** removed. Screenshots work only with assets already accessible in the loaded document.

## Replacement Points

- `js/campaign-counter-local.js`: replace `CampaignRegistryService` methods with an approved API adapter.
- `js/pages-layout-checker.js`: implement `fetchRemoteHtmlFast()` behind an approved server endpoint.
- `js/pages-database-checker.js`: implement `fetchRemoteLayoutTemplate()` behind an approved endpoint.
- `js/pages-tnc-uploader.js`: implement `verifyLink()` using an approved link-checking service.
- `js/pages-wfh-tracker.js`: update `defaultHolidays` or add a reviewed self-hosted data file.

## Fully Offline Deployment

CDN libraries are intentionally retained for the frontend UI and document tools.
This includes Font Awesome, Mammoth, JSZip, CodeMirror, html2canvas, and PDF.js.
These are libraries only, not data integrations. If a fully air-gapped deployment
is needed later, vendor reviewed copies into `vendor/` and update the tags/imports.

The Campaign Counter is per browser profile. Clearing site data removes it, and
another browser or device does not see it. Use a reviewed self-hosted API only
if a shared counter is required; never put a service credential in frontend code.
