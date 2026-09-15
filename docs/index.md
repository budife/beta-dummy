---
title: Documentation
description: Internal operating guide, privacy notes, and maintenance references for every eDM Helper tool.
icon: fa-solid fa-book-open
category: Reference
---

## Docs Navigation

- [Privacy](#privacy-network-behavior)
- [Basics](#global-navigation)
- [Tools](#bookmarklet)
- [Local Backup](#local-data-backup)
- [Maintenance](#release-workflow)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits-dedication)

Use the search field to find a workflow, setting, filename, or error message quickly. Expand all is useful when you want to read the guide end-to-end; collapse all brings the page back to a compact reference view.

## Privacy & Network Behavior

eDM Helper is designed as a local-first internal helper. Files such as database TXT, XML config, XLSX imports, PDFs, pasted HTML, customer emails, and KRHRED values are processed in the browser unless a tool explicitly checks a public URL.

- Database, XML, XLSX, PDF, and generated output files are not uploaded by eDM Helper.
- Campaign Counter and Monday bookmarklet data stay in browser-local storage.
- TNC Uploader saves files to the folder selected by the user and only generates public URL text.
- Network access is only used by URL-based checks and layout fetching.
- Proxy fallback should only be enabled when browser CORS blocks direct access and the user accepts that the target public URL may be requested through a third-party proxy.

:::details What can contact a third-party service?

- Layout Checker URL loading may fetch the layout URL directly and, if enabled, through proxy fallbacks.
- TNC Uploader Check may verify a public PDF URL directly and, if enabled, through proxy fallbacks.

These flows do not intentionally upload local files or customer databases. They only request the URL or year needed for the selected action.
:::

:::details What stays local?

- Config eDM XML parsing, editing, and saving.
- Campaign Counter XLSX import and ID history.
- Bookmarklet local campaign ID data.
- TNC PDF queue/history and generated links.
- WFH/WFO marks in the calendar.
:::

## Network Settings

Use the [Maintenance](/maintenance) page when working in stricter office environments. Privacy settings are saved in this browser only and apply immediately to the related tool.

- Turn off external URL checks to prevent tools from fetching public layout/PDF URLs.
- Turn off proxy fallback to allow direct browser checks only.

## Global Navigation

The app uses clean SPA routes with a fixed sidebar. Opening a tool changes only the content area, while sidebar and footer stay in place.

- Home: `/`
- Docs: `/docs`
- Maintenance: `/maintenance`
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

Tool headers show a small privacy label:

- **Local only** means data stays in browser/file handles unless you save/export it yourself.
- **External optional** means the tool can fetch a public URL only when you use that feature and external checks are enabled.
- **Local holiday data** means WFH Tracker uses the built-in holiday list in the browser.
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

Open `/maintenance` to export or import browser-local data. The backup downloads as JSON and is not uploaded by eDM Helper.

Use this before clearing browser data, switching machines, or moving between office browser profiles.
:::

## Local Data & Storage

:::details Browser-local storage

The app uses browser storage for convenience:

- Campaign Counter imported IDs.
- Bookmarklet campaign tracker data.
- WFH/WFO marks.
- WFH holiday cache.
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

Hi rakyat, terima kasih sudah menyempatkan waktu buat mengecek web app buatan saya.

Tujuan web app ini dibuat karena saya malas dan biar kerja repetitif jadi lebih sat set. It should be a sederhana web, but here we are: jauh dari kata sempurna, but it is useful.

100% aman untuk workflow lokal yang sensitif. BETA memproses data di browser atau folder lokal sesuai fungsi yang sedang digunakan.

Untuk deployment internal, gunakan prosedur maintenance dan security yang berlaku di environment target.

Enjoy bro n sis.

Cheers,

**BETA internal toolkit**
:::

:::details Credits

- **BETA** - internal campaign operations toolkit.
- **Vanilla JavaScript, CSS, and Markdown** - the simple stack behind the app shell and documentation.
- **Font Awesome** - icon set for the sidebar, buttons, and tool UI.
- **SheetJS/XLSX** - local Monday XLSX imports for Campaign Counter.
- **CodeMirror** - lightweight HTML editing in Layout Checker.
- **Browser APIs** - File System Access, IndexedDB, localStorage, drag-and-drop, and clipboard helpers.
- **Forks and feedback** - welcome, as long as it helps the workflow get less ribet.
- **The campaign workflow** - messy enough to deserve its own helper.
- **Local-first tools** - because not every file needs to leave the browser.
- **Deadline energy** - loud, stressful, but weirdly productive.
- **All the strange bugs** - annoying at first, useful eventually.
:::
