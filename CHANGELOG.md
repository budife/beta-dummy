# Changelog

All notable user-facing changes to BETA are tracked here.

## Core v6.16.21 - 16 September 2026

- Combined Documentation and Maintenance into one Privacy & Security page.
- Added a detailed per-tool data-handling table, local-storage explanation, backup controls, network controls, and audit guidance.
- Kept `/maintenance` as a legacy URL that opens the combined page.

## Core and Tool Updates - 16 September 2026

- Kept Campaign Counter Generate enabled after returning from another tool and made clipboard copying best-effort.
- Removed TNC Uploader external PDF link checking and fallback proxy requests.
- Fixed TNC Uploader queued-file rendering after local history restoration and after file selection.
- Added numbered entries to the TNC Uploader dropped-file list.
- Removed WFH Tracker holiday API requests and the holiday auto-sync privacy setting.
- Restored the external layout-fetcher worker files and related external integration documentation state.

## Core v6.16.20 - 15 September 2026

- Updated every tool privacy badge to identify local processing, Supabase sharing, optional external checks, and CDN assets.

## Campaign Counter v1.7.0 - 15 September 2026

- Replaced Supabase counter, activity, and folder scan storage with browser-local storage.
- Added JSON backup export and import with merge or replace mode.

## TNC Uploader v0.3.12 - 15 September 2026

- Removed external PDF link checking and proxy fallback requests.
- Kept generated link copy and manual open actions available.

## TNC Uploader v0.3.13 - 15 September 2026

- Kept queued PDF names visible after local history is restored.
- Clarified that a PDF must be selected again before it can be saved to a folder.

## WFH Tracker v1.3.0 - 15 September 2026

- Removed external holiday API requests and holiday cache handling.
- WFH Tracker now uses built-in local holiday data only.

## Core v6.16.15 - 10 September 2026

- Rebranded the application to BETA (Budd Email Tools & Automation).
- Added a welcome section to the Home page.
- Removed social links and creator note interactions; footer attribution is now non-clickable `budife.psd`.

## Core v6.16.16 - 10 September 2026

- Corrected Home tool count to exclude Maintenance and improved Bookmarklet mobile layout.

## Core v6.16.17 - 10 September 2026

- Added Text Correction as the eleventh tool using the Epsilon workspace page.

## Core v6.16.18 - 10 September 2026

- Marked Text Correction as a local tool in the privacy badge.

## Layout Slicer v0.5.4 - 10 September 2026

- Improved generated HTML code modal with aligned line numbers and cleaner code spacing.
- Copying code still excludes the line number gutter.

## Layout Slicer v0.5.5 - 10 September 2026

- Fixed generated CTA markup indentation so anchor and image elements are nested and aligned correctly.

## Layout Checker v2.1.8 - 10 September 2026

- Added a local HTML Typo Checker button beside Screenshot with all results shown in a responsive modal.
- Added shared English and Indonesian typo dictionary with explicit and possible typo detection.

## Layout Checker v2.1.9 - 10 September 2026

- Centered the Typo Checker modal consistently in the viewport.

## Layout Checker v2.1.10 - 10 September 2026

- Clarified on the Typo Checker button that only HTML text is scanned, not text inside images.

## DOCX to HTML v1.3.0 - 10 September 2026

- Removed PDF input and PDF conversion modes; the tool now focuses on DOCX to HTML conversion.
- Font size controls now display numeric values.

## DOCX to HTML v1.3.1 - 10 September 2026

- Added a custom numeric font-size input for preview editing.

## DOCX to HTML v1.3.2 - 10 September 2026

- Combined font-size presets and custom entry into one Word-like numeric control.

## DOCX to HTML v1.3.3 - 10 September 2026

- Preserved selected text when applying font size or formatting from the preview toolbar.

## DOCX to HTML v1.3.4 - 10 September 2026

- Fixed font-size dropdown selection so the selected text block is preserved when the toolbar receives focus.

## DOCX to HTML v1.3.5 - 10 September 2026

- Reworked font-size control into decrease, editable numeric value, and increase controls.

## DOCX to HTML v1.3.6 - 10 September 2026

- Replaced the native number spinner with a text input and preset datalist dropdown.

## DOCX to HTML v1.3.7 - 10 September 2026

- Replaced the unreliable native datalist with a visible custom font-size preset menu.

## DOCX to HTML v1.3.8 - 10 September 2026

- Removed browser font-size autocomplete/history so only the custom preset menu appears.

## DOCX to HTML v1.3.10 - 11 September 2026

- Removed the obsolete beta warning popup from DOCX to HTML.

## DOCX to HTML v1.3.9 - 10 September 2026

- Removed the red focus ring from DOCX to HTML fields and CodeMirror.

## Core v6.16.19 - 11 September 2026

- Removed the beta badge from DOCX to HTML navigation.

## DOCX/PDF to HTML v1.2.1 - 10 September 2026

- Added expandable conversion details so unsupported Word formatting areas are easier to identify.
- Preview and generated HTML now appear side-by-side on desktop and stack responsively on smaller screens.

## DOCX/PDF to HTML v1.2.2 - 10 September 2026

- Desktop workspace now keeps the preview on the left and the full editable HTML code on the right.
- Editing the HTML code updates the preview immediately.

## DOCX/PDF to HTML v1.2.3 - 10 September 2026

- Fixed desktop workspace alignment: Preview stays on the left, while the view controls and code editor stay on the right.

## DOCX/PDF to HTML v1.2.4 - 10 September 2026

- Enabled CodeMirror with line numbers and HTML syntax mode in the right-side editor.

## DOCX/PDF to HTML v1.2.5 - 10 September 2026

- Forced the desktop layout to show the full editable CodeMirror panel on the right of the preview.

## DOCX/PDF to HTML v1.2.6 - 10 September 2026

- Simplified `d2h-workspace` to exactly two panels: Preview on the left and HTML CodeMirror on the right.

## DOCX/PDF to HTML v1.2.7 - 10 September 2026

- Added `docx-preview` for a visual DOCX preview while keeping Mammoth as the editable HTML converter.

## DOCX/PDF to HTML v1.2.8 - 10 September 2026

- DOCX visual rendering now becomes the editor source when available, preserving font size, spacing, bold, italic, and layout more closely.
- Mammoth remains the fallback converter when visual DOCX rendering is unavailable.

## DOCX/PDF to HTML v1.2.9 - 10 September 2026

- Added an editable Preview mode with basic bold, italic, underline, font size, and alignment controls.
- Preview edits sync back to the CodeMirror HTML editor, with Reset to visual DOCX available.

## DOCX/PDF to HTML v1.2.10 - 10 September 2026

- Prevented DOCX visual header/footer content from being wrapped a second time when opening or saving generated HTML.

## DOCX/PDF to HTML v1.2.11 - 10 September 2026

- Fixed Edit Preview so it edits the clean HTML source instead of importing visual DOCX header/footer wrappers.

## Text Correction v1.0.1 - 10 September 2026

- Migrated Text Correction into a local BETA tool with the same case conversion, copy, download, and clear workflows.

## Text Correction v1.0.2 - 10 September 2026

- Added explicit plain-text paste handling to remove rich-text formatting from pasted content.

## TNC Uploader v0.3.10 - 10 September 2026

- Made duplicate PDF warnings visible when a queued PDF was already saved in the selected destination.

## TNC Uploader v0.3.11 - 10 September 2026

- Added a navigation warning when leaving the tool with uploaded PDFs or an active PDF queue.

## Campaign Counter v1.6.6 - 5 September 2026

- Added conflict tooltip on red Campaign ID and "exists" badge on Recent Activity rows when ID already exists in scanned folders.
- Recent Activity now shows last 20 entries instead of 10.
- Activity list auto-refreshes after folder scan, refresh, or reset.

## Database Generator v1.5.9 - 5 September 2026

- Fixed the JavaScript cache-buster so deployed pages load the current generator behavior.
- Removed unused bulk toggle code.
- Added Static/Dynamic mode hints and improved table input accessibility and invalid email states.

## Database Generator v1.5.8 - 5 September 2026

- Compact 780px centered shell.

## Core v6.16.14 - 4 September 2026

- Restored Database Checker and Database Generator tools and all references.
- Fixed Layout Slicer unsaved data warning: replaced reactive flag with direct state query via `getSlicerState()`.

## Bookmarklet v1.3.1 - 4 September 2026

- Removed all bookmarklets except Typo Scanner and Local to HSBC URL.
- Fixed Typo Scanner: corrupted unicode, expanded dictionary (~90 words), inline highlighting with hover tooltip, clipboard copy.

## Layout Slicer v0.5.3 - 4 September 2026

- Added unsaved data warning when navigating away from the tool with loaded image, slices, or generated output.

## Doc to HTML v1.2.0 - 4 September 2026

- Added beta warning dialog on tool load with "Don't show again" option (localStorage).

## Config eDM v1.6.1 - 4 September 2026

- XML preview panel: full content, syntax highlighting, line numbers, collapsible, search, copy button.
- Preview stays sticky with scrollable content area and responsive layout.
- Added Conversation dropdown (IMO Marketing / IMO Non-Marketing EDM / Custom) with optional checkbox, Description attribute auto-fill.
- UAT badge color changed from red to yellow.
- Form field values highlighted in XML preview.

## Core v6.16.13 - 3 September 2026

- Removed **Database Checker** and **Database Generator** tools: deleted all dedicated HTML, JS, CSS, markdown content, and test files; cleaned routes, sidebar navigation, tool metadata, version entries, documentation, and cross-references.

## Core v6.16.12 - 30 August 2026

- Made **Campaign Counter** fully fluid responsive: 3→2→1 column grid (`repeat(3, minmax(0, 1fr))` → `repeat(2, minmax(0, 1fr))` at 1250px → single column at 900px), `clamp()` page padding, and stacked folder actions on mobile.

## Core v6.16.11 - 30 August 2026

- Removed render-blocking `@import` for `tokens.css` in `theme.css`; shell and all 10 tool pages now load `tokens.css` explicitly with `preconnect` for Font Awesome.
- Lazy-loaded `privacy-settings.js` and `local-backup.js` on demand via `app.js` for `/maintenance` and docs privacy panels instead of blocking shell load.
- Cached `content/home.md` sidebar badge data in `sessionStorage` (3 min TTL) and switched fetches to `cache: 'default'` to reduce cold loads.
- Removed dead auto-update code from `version-config.js` (~8KB).
- Updated favicon to new logo (`favicon.svg` as base64 PNG wrapper + `favicon.png` fallback) across `index.html`, `404.html`, and all tool pages.

## Layout Slicer v0.5.2 - 30 August 2026

- Compact drop zones with visible dashed accent, preserved command wrappers in generated code, added card/main comments and header image, removed code tabs, gated Copy Code until generate, compacted toolbar and slice labels.

## Campaign Counter v1.6.5 - 30 August 2026

- Compact responsive layout: equal-width 1fr cards, 10→8→6→4 column folder grid, `fit-content` chips with fully visible numbers, equal-height cards with per-list scrolling, optimized welcome dialog, and refined spacing.

## Campaign Counter v1.6.4 - 30 August 2026

- Fluid 3→2→1 column layout for compact monitors and tablets; inputs stack on mobile and folder heading wraps cleanly on narrow screens.
- Refreshed cache-busters for the responsive update.

## Home - Recent Updates Tab Redesign

- Reworked Recent Updates on home page from chronological list into date-based tab navigation. Dates are now `###` headings in markdown, transformed into clickable tabs by JavaScript. Tabs show last 6 update dates (24 Aug, 23 Aug, 21 Aug, 20 Aug, 13 Aug), oldest entries link to full Changelog. Leftmost tab selected by default.

## Layout Checker - Screenshot Full Height Fix

- Fixed screenshot capturing only visible viewport instead of full scrollable content. The preview iframe height is now temporarily expanded to match content scrollHeight before capture, then restored afterward.

## Layout Checker v2.1.5 - 26 August 2026

- Moved collapse button into action buttons row, aligned with other action buttons.

## Layout Checker v2.1.7 - 27 August 2026

- Full responsive layout for desktop, tablet, and mobile. Source bar, editor toolbar, and all panels adapt properly.

## Campaign Counter v1.6.3 - 27 August 2026

- Added **Refresh button** to reload folder scans from Supabase without re-scanning local folder.
- Last scanned folder name persists across sessions via localStorage.

## Campaign Counter v1.6.2 - 27 August 2026

- Folder scans now visible to all users. Everyone sees all scanned campaigns regardless of who scanned them.

- Improved collapse button layout: own grid column, no overlap with action buttons.

## Layout Checker v2.1.1 - 26 August 2026

- Improved collapse button visibility: larger size, background, border, better hover state.

## Layout Checker v2.1.0 - 26 August 2026

- Added **auto-retry** for Google Apps Script fetcher (up to 2 retries with 2s delay) to handle cold starts.

## Layout Checker v2.0.9 - 26 August 2026

- Added **collapse button** for the source bar (URL, subject, fetcher settings).

## Layout Checker v2.0.8 - 26 August 2026

- Fixed error overlay not hiding when starting a new fetch.

## Layout Checker v2.0.7 - 26 August 2026

- Added error overlay with **Retry button** when fetch fails. Shows error message and retry option.

## Layout Checker v2.0.6 - 26 August 2026

- Removed progress text during fetch. URL input disabled during fetch, reset button becomes Stop button.

## Layout Checker v2.0.5 - 26 August 2026

- Moved fetch overlay from modal to **inside the preview panel**. Shows "Checking..." title, status text, provider name, and spinner.

## Layout Checker v2.0.4 - 26 August 2026

- Added animated progress bar to fetch modal with sliding gradient effect.

## Layout Checker v2.0.3 - 26 August 2026

- Improved fetch modal design: cleaner layout with subtitle showing fetcher provider, backdrop blur, smooth animations, outline Stop button.

## Layout Checker v2.0.2 - 26 August 2026

- Replaced loading overlay with a **modal dialog** that shows which fetcher is being used (Google Apps Script, Cloudflare Worker, or Custom URL) with a Stop button.

## Layout Checker v2.0.1 - 26 August 2026

- Removed Code/Preview tab switcher. Preview is now the default and only view. Shows a placeholder message when no layout is loaded.

## Layout Checker v2.0.0 - 26 August 2026

- **Major simplification**: Removed CodeMirror editor and all its CDN dependencies (~200KB+). The code view now uses a simple textarea. Preview remains the primary view. Page load is faster and simpler.

## Layout Checker v1.5.8 - 26 August 2026

- Added a **full-screen loading overlay** when fetching HTML from a URL. Shows a centered spinner and "Fetching HTML..." message.

## Layout Checker v1.5.7 - 26 August 2026

- Changed the **Subject input field** from a single-line text input to a multi-line textarea with 2 rows height.

## Layout Checker v1.5.6 - 26 August 2026

- Added a **reset button** next to the Layout URL input to clear the URL and hide the Load URL / Open URL / Text Mode buttons.

## Layout Checker v1.5.5 - 26 August 2026

- Added a **reset button** next to the Subject fields to clear both the subject input and processed output.

## Layout Checker v1.5.4 - 26 August 2026

- Removed the **Open HTML** file upload button. Layout Checker now only loads HTML from URLs.
- Added auto-reload: when the HTML fetcher provider is changed in the dropdown and a URL is already entered, the app automatically retries loading the URL with the newly selected fetcher.

## Layout Checker v1.5.3 - 26 August 2026

- Added a configurable **HTML Fetcher** dropdown in Layout Checker. Users can now choose between Google Apps Script, Cloudflare Worker, Jina AI, or a custom URL. Selections are saved to localStorage. A Reset button restores the default Google Apps Script fetcher.

## Campaign Counter - Reset Folder Scans

- Added a **Reset** button next to **Scan Folder** in Campaign Counter. Clicking Reset clears all saved folder scan results from Supabase and empties the local folder list.

## Campaign Counter - Tooltip Multiple Entries Fix

- Fixed campaign folder tooltip to display all scanned entries that share the same campaign ID but have different dates. Previously only the first entry was shown on hover.

## Campaign Counter - Folder Name Parsing Fix

- Fixed campaign folder name parsing to properly handle `ID | Campaign Name | Date | Manager` format with pipe separators. Date and manager fields are now correctly identified regardless of their order (date can be before or after manager).

## Layout Checker v1.5.2 - 24 August 2026

- Subject field moved to source bar below Layout URL input, processes KRHRED placeholders live as unit values are entered. Removed old subject panel section and unused Add Unit button.

## Layout Checker v1.5.1 - 24 August 2026

- Added a Subject field in the sidebar. Subject lines can include KRHRED placeholders and are processed when Apply is clicked, showing the replaced subject below the input. Removed the unused Add Unit button and normalized Reset/Apply button widths. Added a highlighter icon and hover state to the Highlight KRHRED toggle.

## Core - 24 August 2026

- Fixed sidebar recent-update badge matching so tool links without a leading slash correctly map to `TOOL_META` entries. Fixed badge date selection to use the most recent update per tool instead of the last parsed entry. Badges now auto-hide after three days based on `home.md` Recent Updates dates.

## Layout Checker v1.5.0 - 24 August 2026

- Replaced public CORS proxies (corsproxy.io, CodeTabs, r.jina.ai, AllOrigins, ThingProxy) with a dedicated Cloudflare Worker for fetching remote HTML. The Worker only allows the target host `mail.hsbc.com.hk` and returns CORS headers for the GitHub Pages frontend. Added Worker source at `workers/html-fetcher.js` and deployment documentation at `workers/README.md`. Updated `fetchRemoteHtmlFast()` to use the Worker exclusively. Normalized action bar button heights and added hover state and highlighter icon to the Highlight KRHRED toggle.

## Campaign Counter v2.0.0, Layout Slicer v0.5.0, TNC Uploader v0.3.9 - 23 August 2026

- Promoted Campaign Counter, Layout Slicer and TNC Uploader from beta to stable. Removed in-tool beta warnings and sidebar beta badges.

## Doc to HTML v1.1.0 - 24 August 2026

- Added PDF support via PDF.js: two conversion modes - Editable Text (extracts text for copy-paste) and Image (renders pages as images, 100% visually identical). Both modes show a mode selector dialog when a PDF is dropped. Added Save to Folder button using File System Access API with auto-created nested subfolders (emailblast\MKT\2026\tnc\filename.html). Output filename auto-fills with path prefix on document load. Added Open in New Tab button on preview tab bar. Improved mammoth.js styleMap with additional Word style mappings (List Paragraph, Normal, Body Text, Heading 1-6, Block Text, Quote). Preview uses same CSS as downloaded HTML for pixel-perfect rendering. Redesigned layout: filebar separated from preview, full-height preview with A4 paper card on gray background, compact UI.

## Doc to HTML v1.0.0 - 24 August 2026

- New tool: convert DOCX documents to HTML directly in the browser. Features drag-and-drop or file picker, converts headings, paragraphs, lists, tables, links, and images. Side-by-side preview and HTML editor with copy and download. Based on mammoth.js with local processing (no server upload).

## Layout Slicer v0.5.1 - 24 August 2026

- Improved Generate/Export UX: step-based action bar with numbered workflow badges, loading spinner on Generate slices, and green export summary bar showing slice count, format, width, and total file size after generation. Replaced Download and Save folder with a single Save to folder primary action that shows a confirmation dialog before writing files. Added per-slice file size estimates on slice cards (estimated before generate, actual after). Added customizable file name prefix in the preview toolbar so exported slices can use any prefix instead of the default `img_`.

## Layout Slicer v0.5.0 beta - 23 August 2026

- Moved rulers to canvas-wrap level so they span the full workspace and reach the layout edges like Photoshop. Rulers now sit on dark gray `#4a4a4a` bars outside the image with tick-0 aligned to the image top-left corner, inline style cleanup prevents collapsed rulers from hiding after image load, guide lines extend to the left ruler edge, and per-slice "Include in export" checkboxes with sequential renumbering and numbered canvas overlay badges.

## Campaign Counter v2.0.0 beta - 21 August 2026

- Made Supabase the single source of truth for the counter. Generate atomically increments a server-side `campaign_counter` row (+1) and Back atomically decrements it (-1) through dedicated RPCs, so concurrent users can never produce duplicate IDs. The UI updates only after Supabase returns the new value, and Supabase Realtime broadcasts the change so every open tab updates instantly without a refresh.

## Campaign Counter v1.9.0 beta - 20 August 2026

- Rewrote navigation to simple local counter: Generate = current ID + 1, Back = current ID - 1; current displayed ID is now the single source of truth, no Supabase round-trip on every click.

## Campaign Counter v1.8.8 beta - 20 August 2026

- Fixed generate to use server-side `generate_campaign_id` RPC so the next ID is always calculated from the latest registry state, preventing stale local counter issues when multiple users generate.

## Campaign Counter v1.8.7 beta - 20 August 2026

- Improved campaign folder scanner to detect the 4-digit campaign ID anywhere in the folder name (not just at the start), using word-boundary matching; folders like `JANC 0044 Portfolio asset Bianca 03-21` now parse correctly.

## Campaign Counter v1.8.6 beta - 20 August 2026

- Moved hover detail panel to a body-level portal with `position: fixed` so it floats freely without clipping or causing scrollbars on the campaign list; added viewport-edge flip and vertical boundary clamping.

## Campaign Counter v1.8.5 beta - 20 August 2026

- Improved UI/UX: compact Generate button, single-line activity rows, prominent Scan Folder button, 6-column folder grid, and informative empty-state guidance.

## Campaign Counter v1.8.2 beta - 20 August 2026

- Resized the folder list into a compact 10-column grid and added hover tooltips showing blast date, campaign name, and campaign manager parsed from folder names.

## Campaign Counter v1.8.1 beta - 20 August 2026

- Moved the Campaign Folder scanner into its own dedicated right-side panel with a compact vertical folder list.

## Campaign Counter v1.8.0 beta - 20 August 2026

- Added a Campaign Folder picker that scans a local folder for existing campaign directories, lists found campaign numbers, and highlights conflicts in red when a generated ID already has a matching folder.

## Campaign Counter v1.7.2 beta - 20 August 2026

- Tidied the Date and Campaign Name fields into a clean side-by-side row with aligned labels and inputs.

## Campaign Counter v1.7.1 beta - 20 August 2026

- Added a Date field next to Campaign Name so users can override the default `YYYYMMDD` stamp before generating.

## Campaign Counter v1.7.0 beta - 20 August 2026

- Added an optional Campaign Name field so generated IDs copy as `YYYYMMDD_nama-campaign_XXXX` instead of just the four-digit number; leaving the field empty defaults to `nama-campaign`.

## TNC Uploader v0.3.9 beta - 13 August 2026

- Removed the duplicate transient status row; the newest real activity now carries the compact `New` badge and timestamp.

## TNC Uploader v0.3.8 beta - 13 August 2026

- Merged the latest success, error, or info status into Recent Activity as a compact non-persistent `New` row.

## TNC Uploader v0.3.7 beta - 13 August 2026

- Expanded Recent Activity with file names, destination paths, filename changes, and link-check results, then added matching success, info, accent, and error colors for faster scanning.

## TNC Uploader v0.3.6 beta - 13 August 2026

- Made Recent Activity denser and easier to scan with compact action rows, inline timestamps, and semantic local action colors.

## TNC Uploader v0.3.5 beta - 13 August 2026

- Fixed saved PDF history not rendering on initial tool load; active queue and saved records now appear immediately.

## TNC Uploader v0.3.4 beta - 13 August 2026

- Reordered the PDF workspace so active dropped files always appear above saved history.
- Simplified destination actions to Pick destination folder, Save PDFs, and Clear queue; the selected root and planned target path are now visible before saving.
- Moved the live status message into Recent Activity and removed the obsolete download fallback.

## TNC Uploader v0.3.3 beta - 13 August 2026

- Added a compact right-side Recent Activity log that persists the latest 30 local actions, including file queueing, folder selection, saving, downloads, link copies, checks, and history cleanup.
- Kept the activity log separate from saved PDF history, with its own Clear action so file records remain available unless explicitly cleared.

## Layout Slicer v0.4.2 beta - 3 August 2026

- Reworked Copy Folder into a compact pre-copy workflow with the original template name, a new campaign-name field, editable Root/Team/Year/Campaign Folder segments, child-folder chips, and a separate multi-file HTML rename area.
- Campaign Folder now derives `XXXX-YYYYMMDD-XX` from the new campaign name's `MM-DD` and the editable Year segment, while remaining manually editable.
- New campaign folder names are now the outer project folder; the copied `emailblast/Team/Year/Campaign Folder` structure is created inside it.
- Copy stays disabled until a new campaign name generates a destination; edited HTML names now convert spaces to hyphens automatically.
- Output Preview now lists only explicitly renamed HTML files as direct `mail.hsbc.com.hk/id/...` URLs, so one supplied rename produces one public link preview.
- Added a live output preview, direct copy into a newly created destination, duplicate-name protection, and post-copy path actions including Copy Path and Duplicate Another.
- Added real file-count copy progress from the initial template scan, including the current stage, file, completed count, and percentage.
- Removed Full Workflow and the duplicate in-tool Layout Slicer header; Copy Folder and Slice Layout remain as the two focused workflows.

## Core v6.14.6 - 3 August 2026

- Removed the unsupported `file-system-access` iframe permission attribute and refreshed the app shell cache-buster.

## Campaign Counter v1.6.1 beta - 3 August 2026

- Reworked Campaign Counter into Phase 1: Supabase connection status, Last Campaign, one guarded Generate action, and the latest 20 activity records.
- Added a first-run local username dialog and a dedicated Campaign Registry service; generated IDs are allocated and recorded through one Supabase RPC.
- Removed Folder Browser, XLSX, local backup, series navigation, and related controls from this module for the focused Phase 1 flow.
- Added a subtle manual counter adjustment dialog with optional note and `manual_set` registry records; any unused ID from `0001` through `9999` can be set.
- Connected the deployed Campaign Counter to the Supabase Campaign Registry using the project's public endpoint and publishable key.
- Removed prior Counter table/query/schema references; the module now uses only `campaign_registry`, `generate_campaign_id`, and `set_next_campaign_id`.
- Improved manual counter error feedback with safe RPC messages and full browser-console diagnostics.
- Added a qualified-column SQL fix for the manual counter RPC PostgreSQL `42702` error.
- Removed an unsupported iframe permission attribute that produced a browser console warning.
- Manual counter adjustment now accepts any four-digit Campaign ID instead of only values above the current ID.
- Last Campaign now reflects the latest registry activity, including a manual set, instead of the numerically highest ID.
- Removed the duplicate page header and legacy Home bar; connection state now lives in the Last Campaign panel for a consistent tool workspace.
- Added a compact Back action beside Generate to manually step the current Last Campaign down by one when that ID is unused.
- Made the latest manual or generated registry activity the active counter pointer, so setting `0314` makes the next generated ID `0315` without discarding prior generated activity.
- Generate now explicitly saves `Last Campaign + 1` through the active pointer, preventing old maximum-value RPC behavior from jumping to an unrelated high ID.

## Core v6.14.5 - 31 July 2026

- Refreshed Layout Slicer cache-busters after its workflow rework.

## Layout Slicer v0.4.0 beta - 31 July 2026

- Reworked the entry flow into three large actions: Copy folder, Slice layout, and Full workflow.
- Simplified template duplication: the copied folder now keeps the original template structure instead of moving nested HTML paths automatically.
- Added a pre-copy subfolder list so the complete template structure is visible before duplicate.
- Added PDF source support by rendering the first page in-browser before slicing; JPG, JPEG, and PNG remain supported.

## Core v6.14.4 - 31 July 2026

- Removed the duplicate privacy-settings surface from Documentation and kept Maintenance as the single settings location.

## Documentation v1.0.2 - 31 July 2026

- Replaced the duplicate editable privacy panel with a clear link to Maintenance.

## Maintenance v1.0.2 - 31 July 2026

- Kept Maintenance as the canonical place for browser-local privacy and network controls.

## Core v6.14.3 - 31 July 2026

- Optimized Documentation with in-page search plus compact Expand all and Collapse all controls.
- Hardened shared Docs and Maintenance layouts for long content, narrow screens, and visible keyboard focus.
- Refreshed shared shell cache-busters for the Docs and Maintenance update.

## Documentation v1.0.1 - 31 July 2026

- Added quick search across documentation sections and automatic expansion of matching guidance.
- Added simple all-open and all-closed controls to keep the long reference easy to scan.

## Maintenance v1.0.1 - 31 July 2026

- Reorganized backup, privacy, release, and recovery guidance into a more direct operating flow.
- Added clear error handling for backup export, restore, and local-data clearing.
- Added backup-file compatibility validation before restoring browser-local state.

## Core v6.14.2 - 31 July 2026

- Refreshed Layout Checker cache-busters after the screenshot capture fix.

## Layout Checker v1.4.2 - 31 July 2026

- Improved Screenshot export so remote email images are prepared through direct/proxy image fetching before capture.
- Added image-load waiting and data-URL embedding for preview screenshots so captured layouts include more than just text.
- Kept a clearer screenshot failure message when a browser or remote host still blocks image capture.

## Core v6.14.1 - 30 July 2026

- Refreshed cache-busters after restoring Database Checker to the previous compact workspace.

## Layout Checker v1.4.1 - 30 July 2026

- Added an Open Preview action to launch the applied layout and KRHRED values in a new browser tab.
- Added a Screenshot action beside the Highlight KRHRED control.
- Switched screenshot capture to the visible preview for a faster export, with a clear fallback message when browser security blocks remote images.

## Database Checker v1.8.1 - 30 July 2026

- Reverted the automatic dashboard redesign.
- Restored the previous Database Checker package workspace, validation panels, package overview, and layout-test workflow.
- Kept the existing validation rules and tests intact.

## TNC Uploader v0.3.2 beta - 28 July 2026

- Added optional filename rename for new uploads through a compact double-click editor inside the PDF queue.
- Preserved replace-link mode so replacement PDFs keep the existing public filename.
- Blocked empty or invalid Windows filename characters before save/download.
- Prevented normal uploads from overwriting an existing destination file without choosing another name.
- Hardened long filenames, generated links, status messages, queue cards, and action rows so they wrap without breaking the layout.

## Core v6.13.6 - 19 June 2026

- Fixed sidebar beta badge spacing so longer tool labels like Campaign Counter keep their status badge visible.

## Core v6.13.5 - 19 June 2026

- Refreshed cache-busters for the Campaign Counter unparsed-folder note cleanup.

## Campaign Counter v1.4.2 beta - 19 June 2026

- Removed the long unparsed folder list from the workspace so it no longer blocks the Campaign ID grid.
- Kept failed-folder counts visible in the scan summary and folder header, with folder details available as a compact hover note.

## Core v6.13.4 - 19 June 2026

- Refreshed cache-busters for the latest Campaign Counter folder-scan and range UI changes.

## Campaign Counter v1.4.1 beta - 19 June 2026

- Added reusable folder refresh so the last scanned campaign folder can be checked again without opening the folder picker every time.
- Saved the last manually generated campaign ID separately from imported/scanned IDs.
- Improved campaign folder parsing for spaced ranges like `0007 - 0010`, copied-folder suffixes, and folder names with extra text before the campaign ID.
- Rendered each campaign ID only once while keeping multiple campaign details available in the hover/click popup.
- Added visual range brackets for multi-ID folders and aligned all campaign ID chips so bracketed and non-bracketed items share the same row height.

## Core v6.13.3 - 19 June 2026

- Refreshed cache-busters after the Campaign Counter beta UI updates so iframe CSS and JS changes load reliably.

## Core v6.13.2 - 18 June 2026

- Refreshed cache-busters for the latest Layout Slicer and TNC Uploader changes.

## Layout Slicer v0.3.0 beta - 18 June 2026

- Reworked Layout Slicer into a pure image slicing workflow by removing HTML generation, link mapping, and HTML preview/export controls.
- Added accordion sections so Campaign Folder and Image Slicer stay focused one at a time.
- Clarified image export controls, adaptive rulers, source/export metadata, and image-only save/download output.
- Grouped slicing actions into Guides, Process, and Export so the workflow is easier to scan.

## TNC Uploader v0.3.1 beta - 18 June 2026

- Cleared saved PDFs from the active drop queue while preserving saved history.
- Limited replace-link mode to one PDF at a time and improved the drop-zone copy for replacement uploads.
- Simplified queue actions and labels for clearer save/download folder behavior.

## Core v6.13.1 - 18 June 2026

- Moved update status out of the sidebar and added automatic Recent Updates badges that show new update for entries from the last three days.

## Core v6.13.0 - 18 June 2026

- Added Maintenance with local backup restore, per-tool smoke tests, privacy controls, and release helper workflow.

## Layout Slicer v0.2.1 beta - 18 June 2026

- Removed the extra Layout Slicer markdown heading so the embedded tool starts directly after the route header.
- Made the duplicate-folder flow derive the generated campaign folder from the folder name, while auto HTML filenames use only campaign number and campaign name.

## v6.12.6 - 17 June 2026

- Moved Layout Slicer HTML filename input to the first field in the Location panel.
- Added filename parsing for names such as `1112 ANA Premium Pertralite 06-17 Bianca`, filling campaign number, blast date, prefix, and manager.
- Scans HTML files as soon as the template folder is selected, while keeping actual HTML renaming manual.
- Shows selected folder status with detected HTML file counts.

## v6.12.5 - 17 June 2026

- Fixed Layout Slicer campaign target selection so the user chooses the campaign parent folder, for example `MKT/2026`.
- Prevented copying into an already-created campaign folder, avoiding repeated paths like `campaign/emailblast/MKT/YYYY/campaign`.
- Updated Layout Slicer documentation to clarify the expected folder target.

## v6.12.4 - 17 June 2026

- Added a Layout Slicer campaign location helper for copying a selected template folder into `emailblast/MKT/YYYY/NNNN-YYYYMMDD-MGR`.
- Added target path preview and copy action for campaign HTML paths such as `emailblast/MKT/2026/0018-20260105-RA/0018-ANA-Premier.html`.
- Added copied-folder HTML detection and a rename helper so ID/INDO HTML files can be prepared from the copied campaign folder.

## v6.12.3 - 17 June 2026

- Marked Layout Slicer as beta in the sidebar, route header, and tool header.
- Added a yellow beta warning on Layout Slicer so generated slices/HTML are reviewed before production use.
- Updated cache-busters and app version for the beta notice release.

## v6.12.2 - 17 June 2026

- Increased Layout Slicer JPG export quality for cleaner sliced assets.
- Clarified that slice images export at the original source pixel width while HTML display width controls rendered email width.
- Added a Use source width in HTML option for layouts that should render at the full uploaded image width.
- Documented the browser Canvas DPI limitation so export expectations stay clear.

## v6.12.1 - 17 June 2026

- Refined Layout Slicer into a Photoshop-like guide workflow with top/left rulers and draggable blue guide lines.
- Kept Layout Slicer markdown content minimal and moved detailed usage notes into Documentation.

## v6.12.0 - 17 June 2026

- Added Layout Slicer as a new local tool for converting JPG/PNG layouts into sliced eDM HTML and image assets.
- Added horizontal slice lines, drag adjustment, optional link mapping per slice, generated preview, individual downloads, and save-to-folder export.
- Added Layout Slicer route, sidebar menu item, markdown content page, and documentation entry.
- Ignored the local reference folder `contoh jangan di deploy/` so sample source files are not deployed.

## v6.11.8 - 16 June 2026

- Expanded the creator modal Built with credits to include GitHub Pages, CSS, Font Awesome, SheetJS/XLSX, CodeMirror, File System Access, IndexedDB, and localStorage.
- Updated Documentation credits to explain the broader app stack and browser APIs.

## v6.11.7 - 16 June 2026

- Added Fork the repo and Send feedback actions to the creator modal.
- Added a local mailto feedback form for bug reports, requests, or complaints.
- Updated Documentation credits with fork and feedback guidance.

## v6.11.6 - 16 June 2026

- Removed the extra "from budd the Lazy" subtitle from the creator modal.
- Added compact Built with credits for OpenAI Codex, GitHub, Vanilla JS, and Markdown.

## v6.11.5 - 16 June 2026

- Kept the `budd` hover interaction but changed the hover label to "meet the maker".
- Added a creator note modal instead of opening the creator website from the `budd` name.
- Added the personal "Hi rakyat" creator message, GitHub repository link, and Credits & Dedication to Documentation.

## v6.11.4 - 16 June 2026

- Changed Documentation navigation from a long table of contents into a compact sticky tab bar.
- Added active tab styling for the selected documentation section.

## v6.11.3 - 16 June 2026

- Fixed Documentation table-of-contents anchors so they scroll inside the eDM Helper content viewport.
- Added support for direct documentation section links such as `/docs#tnc-uploader`.

## v6.11.2 - 16 June 2026

- Expanded Documentation into a complete guide for every eDM Helper web app/tool.
- Added collapsible documentation sections and a table of contents.
- Added browser-local privacy/network toggles for external URL checks, proxy fallback, and holiday auto-sync.
- Connected those toggles to WFH Tracker, Layout Checker, Database Checker Layout Test, and TNC Uploader link checks.
- Aligned Documentation typography with the main app page sizing.

## v6.11.1 - 16 June 2026

- Added the missing repository changelog file linked from Home.
- Matched Documentation typography with the main eDM Helper markdown style.

## v6.11.0 - 16 June 2026

- Added TNC Uploader for local PDF queueing, folder saving, generated public links, and replace-link workflows.
- Added live PDF link checks with browser-safe fallbacks.
- Added lazy-loaded `/docs` documentation route.
- Upgraded WFH Tracker with browser-local marks, clearer clear-month controls, and auto-updating Indonesian holiday/cuti bersama data with fallback caching.

## v6.10.2 - 16 June 2026

- Matched creator hover popovers across Home and footer areas.
- Normalized Recent Updates version colors.
- Expanded the full changelog history.

## v6.10.1 - 16 June 2026

- Added maintainer polish for centralized footer rendering.
- Added a release helper script and clearer local backup guidance.
- Refreshed cache-busters and simplified the `budd` hover label.

## v6.10.0 - 16 June 2026

- Moved Campaign Counter and the Monday bookmarklet to browser-local XLSX workflows.
- Added campaign ID series and reblast tooling.
- Preserved folder sessions for supported tools.
- Improved database/layout editing polish.

## v6.9.0 - 15 June 2026

- Rebuilt Campaign Counter around Regular-to-9000 ID series.
- Added Monday XLSX synchronization and the compact Monday counter bookmarklet.
- Added a GitHub Pages data bridge for environments that block direct Supabase requests.

## v6.8.1 - 14 June 2026

- Moved the Database Generator Add action below the email field.
- Streamlined Config eDM with same-file saving and a NOW date shortcut.
- Added the hoverable `budd` creator footer with website and social links.

## v6.8.0 - 14 June 2026

- Corrected the four-file database package standard to use `EmailCustMast`.
- Updated package validation, raw-data inspection, layout testing, and generated database filenames.

## v6.7.3 - 14 June 2026

- Fixed Layout Checker KRHRED highlighting to match Database Checker previews.
- Enlarged the primary Apply action.

## v6.7.2 - 14 June 2026

- Restored the complete release timeline from Alpha Sensei through every eDM Helper version.

## v6.7.1 - 14 June 2026

- Preserved the complete Recent Updates history while keeping the timeline compact and scrollable.

## v6.7.0 - 14 June 2026

- Refined Layout Checker with faster URL loading, embedded code/preview tabs, full-height workspace panels, reliable image base paths, manual and bulk KRHRED application, reset-to-source preview, and optional KRHRED highlighting.

## v6.6.0 - 14 June 2026

- Redesigned Config eDM into a compact file workflow.
- Added field locking, PROD/UAT campaign toggles, Apply & Save, automatic XML renaming, file filtering/status, validation summaries, and Back/Next XML navigation.

## v6.5.0 - 14 June 2026

- Redesigned Database Generator with compact campaign controls.
- Added always-visible statistics and bulk paste, removable KRHRED chips, denser sticky customer tables, and responsive two-column desktop workflows.

## v6.4.2 - 14 June 2026

- Refreshed Bookmarklet with reliable embedded scrolling, a cleaner flat layout, compact search and controls, consistent tool cards, responsive spacing, and hidden duplicate navigation inside the eDM Helper shell.

## v6.4.1 - 14 June 2026

- Polished Database Generator UI with compact numeric KRHRED unit input, shorter toolbar labels, aligned compact actions, clearer summary badges, smaller empty states, and collapsible file previews.

## v6.4.0 - 14 June 2026

- Refactored Database Generator into a compact workspace with inline validation, stable embedded scrolling, aligned controls, duplicate-email support, responsive data tables, clearer file previews, and generator regression tests.

## v6.3.1 - 14 June 2026

- Moved the primary repository and GitHub Pages base path from `beta-uat` to `beta`.

## v6.3.0 - 14 June 2026

- Added the shared UI style guide, reusable design tokens, consistent 12px form controls across all tools, regular-weight typography, and responsive Database Checker modal/workspace refinements.

## v6.2.0 - 14 June 2026

- Added Database-to-Layout Test with automatic HTML loading, random or manual customer selection, KRHRED personalization and highlighting, subject normalization, coverage alerts, full-screen preview, and temporary URL/subject drafts.

## v6.1.0 - 14 June 2026

- Upgraded Database Checker with four-file package validation, static/dynamic detection, grouped anomaly findings, raw-line inspection, CSV export, and a compact package workspace.

## v6.0.1 - 13 June 2026

- Introduced the wiki-style layout.
- Refreshed the Home dashboard.
- Improved GitHub Pages deployment.
- Fixed the embedded Database Generator layout.

## v5.0.0 - 12 April 2026

- Released version 5.

## v4.0.0 - 14 March 2026

- Released version 4.

## v3.0.0 - 20 February 2026

- Released version 3.

## v2.0.0 - 13 October 2025

- Renamed the application to eDM Helper.
- Released version 2.

## v1.0.0 - 17 August 2025

- Released version 1.

## v0.0.0 - April 2025

- Created the first app prototype as Alpha Sensei.
