---
title: Documentation
description: Complete documentation for workflows, local data security, external connections, backups, and tool audits.
icon: fa-solid fa-book-open
category: Reference
---

## Documentation Navigation

- [Security proof](#security-proof)
- [Security summary](#privacy-network-behavior)
- [Data by tool](#data-handling-by-tool)
- [Network controls](#network-settings)
- [Local backup](#local-data-backup)
- [Recovery and audit](#recovery-and-audit)
- [Credits](#credits-dedication)

Use the search field to find a tool, data type, setting, filename, or error message quickly. This page combines the former Documentation and Maintenance pages and includes an auditable security proof.

## Security Proof

The following points are verifiable from the static source code and browser behavior:

- There is no application endpoint that accepts uploaded campaign files.
- Local file workflows use browser JavaScript, `localStorage`, IndexedDB, or a folder explicitly selected through the browser.
- Campaign Counter, WFH Tracker, TNC Uploader, Config eDM, Database Generator, DOCX conversion, Text Correction, and Layout Slicer do not send their local work data to a third party.
- TNC Uploader has no automatic PDF link checker or proxy fallback.
- WFH Tracker does not call a holiday API; its holiday list is bundled in the tool source.
- External requests are limited to explicitly used public URL workflows and static CDN assets listed below.
- URL requests do not silently attach local database, PDF, DOCX, Campaign Counter, or WFH data.

This is a source-level and runtime-design guarantee, not a claim that the browser, hosting provider, browser extensions, operating system, or a manually selected external URL can never observe network metadata. Use the audit steps below for the deployment you are using.

## Privacy & Network Behavior

eDM Helper is a local-first static web application. Local files and campaign data are processed by JavaScript in the browser. There is no application upload endpoint, server-side campaign database, or automatic cloud sync for local work data.

- Database, XML, XLSX, DOCX, PDF, pasted HTML, and generated output files are not uploaded by eDM Helper.
- Campaign Counter, WFH Tracker, TNC Uploader history, and configuration drafts stay in browser storage or IndexedDB.
- TNC Uploader saves PDFs to a folder selected by the user and has no automatic link checker.
- WFH Tracker uses built-in holiday data and has no holiday API request.
- External requests exist only for explicitly selected public URL workflows and static CDN assets.

:::details What can contact a third-party service?

- Layout Checker may send an entered public layout URL to its selected fetch provider or proxy.
- Database Checker may request an entered public layout URL when Layout Test uses a URL instead of pasted HTML.
- Browser pages may request CDN libraries such as Font Awesome, Mammoth, CodeMirror, html2canvas, JSZip, or PDF.js.

These flows do not intentionally upload local files, PDFs, DOCX files, customer databases, Campaign Counter data, or WFH marks. URL providers receive only the public URL required for the selected request.
:::

:::details What stays local?

- Config eDM XML parsing, editing, and saving.
- Database parsing, validation, findings, and pasted HTML.
- Database Generator inputs and generated files.
- Campaign Counter counter, activity, folder scans, and JSON backups.
- Bookmarklet local campaign ID data.
- DOCX conversion and editing.
- TNC PDF queue/history and generated links.
- Layout Slicer source processing and generated assets.
- Text Correction text processing.
- WFH/WFO marks, statistics, and built-in holidays.
:::

## Network Settings

Use these controls before working with stricter campaign data. Settings are saved in this browser only.

- Turn off external URL checks to prevent optional URL fetch workflows.
- Turn off proxy fallback to prevent third-party proxy requests.

{{privacy-settings}}

## Data Handling By Tool

| Tool | Local data | Possible external activity |
| --- | --- | --- |
| Campaign Counter | Counter, activity, folder scans, JSON backups | None |
| Config eDM | XML parsing, edits, selected folders | None for local files |
| Database Checker | Database files, pasted HTML, validation results | Entered public layout URLs only |
| Database Generator | Inputs and generated files | None for local generation |
| DOCX to HTML | DOCX conversion and editing | CDN libraries only |
| Layout Checker | Pasted HTML and local test values | Entered layout URL, provider/proxy, CDN screenshot library |
| Layout Slicer | Local PDF/image processing and generated assets | CDN libraries only |
| TNC Uploader | PDF queue, history, folder save, generated links | None; no link checker |
| Text Correction | Pasted text and generated output | None |
| WFH Tracker | Calendar marks, stats, built-in holidays | None |
| Bookmarklet | Browser-local helper data | Actions run on the page where clicked |

## Local Data Backup

Backup files are generated and downloaded by the browser. They are not uploaded by eDM Helper.

{{local-backup}}

## Recovery And Audit

- Importing a backup changes matching local browser data only.
- Folder permissions are managed by the browser and are not included in backups.
- Campaign Counter also has its own JSON Export/Import controls.
- Browser DevTools Network can audit requests while a tool is running.
- For strict mode, disable external URL checks and proxy fallback, paste HTML instead of entering a layout URL, and mirror CDN assets locally.

## Technical Audit

- Static HTML, CSS, and JavaScript are served without a backend upload API.
- Local storage uses browser `localStorage`, IndexedDB, and user-selected File System Access folders.
- The source code is available in the repository for review.
- External URL paths are limited to explicitly used Layout Checker and Database Checker URL workflows.

## Global Navigation

The app uses clean SPA routes with a fixed sidebar. Opening a tool changes only the content area, while sidebar and footer stay in place.

- Home: `/`
- Docs: `/docs`
- Legacy Maintenance URL: `/maintenance` (opens this page)
- Bookmarklet: `/bookmarklet`
- Campaign Counter: `/campaign-counter`
- Config eDM: `/config-edm`
- Layout Checker: `/layout-checker`
- Layout Slicer: `/layout-slicer`
- TNC Uploader: `/tnc-uploader`
- WFH Tracker: `/wfh-tracker`

## Bookmarklet

:::details Purpose

Bookmarklet contains small browser helpers for web pages and Monday workflows. It is meant to reduce repetitive browser actions while keeping actions manual and visible.
:::

:::details Campaign ID Tracker bookmarklet

The Campaign ID Tracker bookmarklet can load local Monday XLSX data, show used campaign IDs by series, and help select the next available ID. Data stays in browser-local storage.

If Monday subitems are collapsed in the visible page, browser scanning cannot read them. Export/upload XLSX when complete campaign ID coverage is needed.
:::

:::details Privacy behavior

Bookmarklet helpers run in the browser page where they are clicked. Campaign ID data is local. The current local workflow does not sync to Supabase.
:::

## Campaign Counter

:::details Purpose

Campaign Counter stores the current Campaign ID, activity, folder scans, and JSON backups locally in this browser.
:::

:::details Workflow

- Enter a name once, then use Generate, Back, or manual adjustment.
- Scan a campaign folder to detect existing four-digit IDs and conflicts.
- Export a JSON backup before moving to another browser or clearing data.
- Import a JSON backup and choose Replace or Merge.
- Use Reset only when you want to clear the saved folder scan.
:::

:::details Reblast behavior

The same campaign number can appear multiple times for reblast scenarios. Folder scanning groups duplicate numbers and shows all related campaign names, dates, and managers in the details view.
:::

:::details Storage

Campaign Counter data is stored in this browser only. It is not uploaded to Supabase or another third-party service.
:::

## Config eDM

:::details Purpose

Config eDM edits campaign XML config values such as Campaign ID, Subject, and Link. It is designed for fast repeated edits across many XML files.
:::

:::details Workflow

- Open a folder containing XML files.
- Select an XML file from the sidebar.
- Update Campaign ID, Subject, and Link.
- Use PROD/UAT toggle to add or remove the `-UAT` suffix.
- Use NOW to update the `YYYYMMDD` date segment to today.
- Apply changes.
- Use Back / Next XML for file-by-file processing.
:::

:::details Editing behavior

After paste/apply, fields can auto-select for quick replacement. Selection can be cancelled and fields can still be edited manually. The workflow is local and does not upload XML files.
:::

## Layout Checker

:::details Purpose

Layout Checker loads or accepts HTML source, detects KRHRED placeholders, applies test values, and previews the personalized eDM layout before publishing.
:::

:::details Workflow

- Paste a layout URL or open an HTML file.
- Use Code/Preview tabs to inspect source and rendered output.
- Enter KRHRED values manually or paste bulk values.
- Apply values.
- Toggle KRHRED highlighting in preview when needed.
- Reset values to restore the original placeholders.
:::

:::details Network behavior

If a layout URL is used, the tool may request the layout directly. If direct browser access is blocked and proxy fallback is enabled, it may try proxy services. Disable external checks or proxy fallback in Docs when working with restricted material.
:::

## Layout Slicer

:::details Copy Folder

Choose the template folder, then choose the output parent folder. The new campaign name becomes the outer project folder; the editable `Root/Team/Year/Campaign Folder` eDM structure is created inside it. Copy Folder lists only direct child folders and lets each HTML file keep its original name or receive a new name before copying. The preview updates as names change. After a successful copy, use Copy Path or Duplicate Another; browsers cannot force-open Windows Explorer, but Open Folder opens the selected handle in the browser folder picker when supported.
:::

:::details Purpose

Layout Slicer turns a flat JPG or PNG eDM mockup into ordered image slices. It uses guide lines first, then generates image assets only when output is generated.
:::

:::details Workflow

- Drop or choose a JPG/PNG layout.
- Use the top and left rulers to read position.
- Click the preview once to add a horizontal guide line.
- Drag guide lines to adjust them.
- Generate slices.
- Download the generated images or save them into a selected local folder.
:::

:::details Campaign location helper

The Location panel can copy an existing template folder into a new campaign path.

- Choose the template folder to copy.
- Choose the campaign parent folder as the save target, for example `MKT/2026`.
- Fill HTML File Name first, for example `1112 ANA Premium Pertralite 06-17 Bianca`.
- The helper can parse campaign number, short blast date, prefix, and manager from that name.
- You can still edit Campaign No, Blast Date, Manager, or Prefix manually after parsing.
- The tool creates `NNNN-YYYYMMDD-MGR/emailblast/MKT/YYYY/NNNN-YYYYMMDD-MGR`.
- Do not choose an existing campaign folder as the target parent, otherwise the campaign folder would be nested inside another campaign folder.
- HTML files are scanned when the template folder is selected. Rename only happens when the manual Rename selected HTML button is clicked.
- The target path preview can be copied for reference.
- After copy, HTML files in the copied folder are listed so the selected ID/INDO file can be renamed to the final campaign HTML filename.

Folder copying uses the browser File System Access API and stays local.
:::

:::details Local behavior

Image processing uses the browser Canvas API. Files stay in the browser unless you explicitly download them or save them to a chosen local folder.
:::

:::details Export quality and width

Layout Slicer exports each slice using the selected Export Width. The preview metadata shows both the original source dimensions and the current export settings so the source and output sizes stay clear.

JPG export uses the selected browser quality. Browser Canvas export does not reliably write 300dpi metadata, but email and webmail rendering depends on pixel dimensions, so choosing the right export width is the important part.
:::

## TNC Uploader

:::details Purpose

TNC Uploader prepares PDF files for the `emailblast/MKT/YYYY/tnc` folder structure, generates the final public link, and can save renamed PDFs into a selected local folder.
:::

:::details Workflow

- Choose year and market.
- Choose save folder.
- Drop PDF files into the queue.
- Review each file item and generated link.
- Save to folder or download renamed files.
- Copy links per item or copy all links.
:::

:::details Replace PDF link mode

Use Replace PDF link when an existing public PDF URL must be replaced. Paste the old PDF link and the tool derives year, target folder, and final filename from the old URL.
:::

:::details Live check behavior

Check only verifies whether a generated public PDF link appears reachable. It does not upload the PDF. If direct browser check fails and proxy fallback is enabled, it may use a proxy check. Disable proxy fallback if that is not allowed.
:::

## WFH Tracker

:::details Purpose

WFH Tracker marks WFH/WFO days on a monthly calendar and shows a compact monthly summary.
:::

:::details Workflow

- Click a normal work day once for WFH.
- Click again for WFO.
- Click again to clear the day.
- Use Today to return to the current month.
- Use Clear to remove WFH/WFO marks for the current month.
:::

:::details Colors

- WFH: yellow.
- WFO: green.
- Holiday/cuti bersama: red.
- Weekend: grey.
:::

:::details Holiday data

WFH Tracker uses the built-in Indonesian holiday and cuti bersama data. It does not fetch external holiday data or send personal WFH/WFO marks.
:::

## Release Workflow

:::details Versioning

eDM Helper now uses two version layers:

- **Core version** tracks the shared shell, sidebar, router, footer, shared style, and deployment cache-busters.
- **Tool versions** track each tool independently in `js/tool-versions.js`.

Stable tools show a small subtle badge in the tool header. Beta tools show a clearer amber `beta` badge. Home keeps the global Core version because it describes the whole app shell.
:::

:::details Header privacy labels

Tool headers show a privacy label explaining where the tool's data is processed and whether an optional network path exists. The label describes capability, not an automatic upload.

| Badge | Meaning | Tools |
| --- | --- | --- |
| **Local only** | Local files and work data stay in the browser or a user-selected folder. The tool has no required third-party data request. | Bookmarklet, Config eDM, Campaign Counter, Database Generator, TNC Uploader, Text Correction, WFH Tracker, Documentation |
| **External checks optional** | The core workflow is local, but an entered public URL can be fetched when the related external check is used and enabled. | Database Checker |
| **Local + CDN assets** | Work data is processed locally, but the page may download static libraries from a CDN. | DOCX to HTML, Layout Slicer |
| **External + CDN assets** | The tool may fetch an entered public layout URL through a selected provider/proxy and may download static CDN libraries. | Layout Checker |

How to read the badge:

- **Local** refers to campaign files, pasted content, generated output, and tool state being processed in the browser or selected local folder.
- **External** refers only to an optional URL-based request. It does not mean local files are uploaded automatically.
- **CDN assets** are downloaded libraries; they are not destinations for campaign files.
- **Optional** means the request is triggered only when the feature is used. Pasting HTML instead of entering a URL avoids the URL-fetch path.
- Generated public links are text values. Creating or copying a link does not upload the local PDF or campaign file.

The badge does not promise that the browser, extensions, operating system, hosting provider, or a manually opened external website cannot observe normal network metadata. Use the Security Proof and audit steps above for deployment-specific verification.
:::

:::details Checklist

- Update the Core version only when shared shell/deployment behavior changes.
- Update the affected tool version in `js/tool-versions.js` when a specific tool changes.
- Update cache-busters when shipping frontend changes.
- Update Recent Updates on Home.
- Update `CHANGELOG.md`.
- Run syntax checks for edited JavaScript files.
- Run the test suite.
- Run `git diff --check`.
- Commit with a clear release message.
- Push to `origin main`.
:::

:::details Release helper

Use `scripts/release.ps1` to reduce manual release edits.

- Core release: `scripts/release.ps1 -Version 6.13.0 -UpdateNote "Updated shared shell maintenance tools."`
- Tool release: `scripts/release.ps1 -Tool layout-slicer -ToolVersion 0.2.2 -UpdateNote "Improved duplicate folder naming."`

The helper updates Recent Updates and `CHANGELOG.md`. Core releases also update cache-busters unless `-NoCacheBuster` is used.
:::

## Local Data Backup

:::details Backup and restore

Use the Local Data Backup section above to export or import browser-local data. The backup downloads as JSON and is not uploaded by eDM Helper.

Use this before clearing browser data, switching machines, or moving between office browser profiles.
:::

## Local Data & Storage

:::details Browser-local storage

The app uses browser storage for convenience:

- Campaign Counter imported IDs.
- Bookmarklet campaign tracker data.
- WFH/WFO marks.
- Built-in WFH holiday data.
- TNC queue/history.
- Layout drafts such as recent URL/source where applicable.

Clearing browser data can remove these local states.
:::

:::details File System Access

Some tools can save to a local folder selected by the user. This requires browser support and user permission. The app cannot write outside the selected folder unless the browser grants access.
:::

## Troubleshooting

:::details Refresh route shows missing styling or loading state

Check GitHub Pages base path and cache-busters. The app should load assets relative to `/beta` on GitHub Pages and clean routes should fall back through `404.html`.
:::

:::details Layout URL cannot be fetched

The remote server may block browser CORS. Use HTML file fallback or paste source. If proxy fallback is allowed, enable it in Docs.
:::

:::details TNC link cannot be verified

Browser checks may be blocked even when the link is valid. Use Open to verify manually, or enable proxy fallback if allowed.
:::

:::details WFH holiday data looks stale

The tracker uses the built-in holiday list. Update the local holiday list in the tool source when a new year needs to be added.
:::

## Credits & Dedication

:::details A small note

Hi everyone, thank you for taking the time to review this web app.

This app was built to reduce repetitive work and keep daily tasks moving quickly. It is far from perfect, but it is useful.

For local workflows, BETA processes data in the browser or a local folder according to the active tool.

For internal deployment, follow the security and maintenance procedures required by the target environment.

Enjoy bro n sis.

Cheers,

**BETA internal toolkit**
:::

:::details Credits

- **budife.psd** - creator and maintainer of BETA.
- **Yuda Andi** - contributor, collaborator, and coach.
- **OpenCode** - AI coding assistant used during development and maintenance.
- **GPT-5.6 Luna** - model used through OpenCode for development assistance.
- **BETA** - internal campaign operations toolkit.
- **Vanilla JavaScript, CSS, and Markdown** - the simple stack behind the app shell and documentation.
- **Font Awesome** - icon set for the sidebar, buttons, and tool UI.
- **SheetJS/XLSX** - local Monday XLSX imports for Campaign Counter.
- **CodeMirror** - lightweight HTML editing in Layout Checker.
- **Browser APIs** - File System Access, IndexedDB, localStorage, drag-and-drop, and clipboard helpers.
- **Forks and feedback** - welcome when they make the workflow simpler.
- **The campaign workflow** - messy enough to deserve its own helper.
- **Local-first tools** - because not every file needs to leave the browser.
- **Deadline energy** - loud, stressful, but weirdly productive.
- **All the strange bugs** - annoying at first, useful eventually.
:::
