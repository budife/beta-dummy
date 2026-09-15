---
title: BETA
description: Budd Email Tools & Automation for campaign work and everyday productivity.
icon: fa-solid fa-layer-group
category: Home
---

## Welcome to BETA

**Budd Email Tools & Automation** is a focused workspace for campaign operations, database preparation, layout checks, and everyday marketing utilities.

Use the sidebar to open a tool, or start with one of the quick access links below.

## Quick Access

- [Config eDM](/config-edm)
- [Layout Checker](/layout-checker)
- [Layout Slicer](/layout-slicer)
- [Campaign Counter](/campaign-counter)
- [Text Correction](/text-correction)

## Recent Updates

### 16 September 2026
- **Core v6.16.26** - Corrected the Home tool counter to show the 11 actual tools, excluding Documentation.
- **Core v6.16.25** - Completed the English UI/documentation audit, aligned standalone cache-busters, and added local-only integration regression checks.
- **Core v6.16.24** - Translated active tool interfaces, validation messages, documentation, worker guidance, and user-facing status text to English.
- **Core v6.16.23** - Renamed the combined Privacy & Security page to Documentation and added an auditable Security Proof section.
- **Core v6.16.22** - Fixed Privacy & Security navigation tabs and restored the Credits button.
- **Core v6.16.21** - Combined Documentation and Maintenance into one detailed Privacy & Security page covering local data, external requests, backups, controls, and audit guidance.
- **Campaign Counter** - Fixed Generate staying disabled after returning from another tool and made clipboard copying optional.
- **TNC Uploader** - Fixed queued PDF rendering, added numbered dropped-file entries, and removed external link checks.
- **WFH Tracker** - Removed holiday API synchronization and kept holiday data local-only.
- **Layout Checker** - Restored the external HTML fetcher worker files for configured external fetching.

### 15 September 2026
- **Core v6.16.20** - Updated every tool privacy badge to identify local processing, Supabase sharing, optional external checks, and CDN assets.
- **Campaign Counter v1.7.0** - Replaced Supabase with local counter storage and added JSON backup import/export.
- **TNC Uploader v0.3.12** - Removed external PDF link checking; generated links can still be copied or opened manually.
- **TNC Uploader v0.3.13** - Keeps queued PDF names visible after local history is restored and explains when a file must be selected again to save.
- **WFH Tracker v1.3.0** - Removed external holiday sync and now uses built-in local holiday data only.

### 11 September 2026
- **Core v6.16.19** - Removed the DOCX to HTML beta badge.
- **DOCX to HTML v1.3.10** - Removed the obsolete beta warning popup.

### 10 September 2026
- **Text Correction v1.0.2** - Pasted content is now forced to plain text without rich-text formatting.
- **DOCX to HTML v1.3.9** - Finalized the local DOCX conversion and editing workflow.
- **Layout Checker v2.1.10** - Added local HTML Typo Checker with text-only scope clarification.
- **Layout Slicer v0.5.5** - Fixed generated CTA anchor and image indentation.
- **Core v6.16.16** - Corrected the tool count to 10 and improved Bookmarklet mobile layout.
- **Core v6.16.15** - Rebranded the app as BETA, added a welcome section, and simplified footer attribution to non-clickable `budife.psd`.
- **TNC Uploader v0.3.10** - Visible warning when a PDF was already uploaded to the selected destination.
- **TNC Uploader v0.3.11** - Warning before leaving with uploaded PDFs or an active queue.

### 5 September 2026
- **Campaign Counter v1.6.6** - Conflict tooltip on red ID, "exists" badge on Recent Activity, show 20 recent entries, auto-refresh activity after folder scan.
- **Database Generator v1.5.9** - Fixed generator cache-buster, removed unused bulk toggle code, and improved input accessibility.
- **Database Generator v1.5.8** - Compact 780px centered shell.

### 4 September 2026
- **Core v6.16.14** - Restored Database Checker and Database Generator. Fixed Layout Slicer unsaved data warning.
- **Bookmarklet v1.3.1** - Removed 8 bookmarklets, kept Typo Scanner and Local to HSBC URL only. Fixed typo scanner with expanded dictionary and inline highlighting.
- **Layout Slicer v0.5.3** - Unsaved data warning when navigating away.
- **Doc to HTML v1.2.0** - Beta warning dialog on load with "Don't show again" option.
- **Config eDM v1.6.1** - XML preview panel with syntax highlighting, line numbers, search, copy, collapsible. Conversation dropdown (IMO Marketing / Non-Marketing EDM / Custom) with optional checkbox. UAT badge yellow. Form values highlighted in preview.

### 3 September 2026
- **Core v6.16.13** - Removed Database Checker and Database Generator tools and all related files, routes, sidebar entries, and documentation references.

### 30 August 2026
- **Layout Slicer v0.5.2** - Compact drop zones, header included in generated code with card/main comments, removed code tabs, copy-code gated by generate, compact toolbar and labels.
- **Campaign Counter v1.6.5** - Compact responsive layout with equal-width cards, max 10-column folder grid (8/6/4 on narrow), fit-size chips, equal-height cards, scroll per list, optimized welcome dialog.
- **Campaign Counter v1.6.4** - Responsive 3→2→1 column layout: fluid `minmax` grid, stacked inputs on mobile, wraps folder actions on narrow screens.
- **Core v6.16.11** - Performance optimizations: removed render-blocking `@import` in `theme.css`, explicit `tokens.css` loading with `preconnect`, lazy-loaded `privacy-settings` and `local backup` on demand, cached `home.md` badge in `sessionStorage`, removed dead auto-update code. Fixed favicon to new logo (`favicon.png` + `favicon.svg`).

### 27 August 2026
- **Layout Checker v2.1.7** - Full responsive layout for all screen sizes.
- **Campaign Counter v1.6.3** - Refresh button for folder scans, last folder persists across sessions.
- **Campaign Counter v1.6.2** - Folder scans visible to all users.
- **Layout Checker v2.1.5** - Collapse button moved into action buttons row.
- **Layout Checker v2.1.4** - Collapse button has own grid column, no overlap with action buttons.
- **Layout Checker v2.1.1** - Improved collapse button visibility.
- **Layout Checker v2.1.0** - Auto-retry for Google Apps Script (handles cold starts).
- **Layout Checker v2.0.9** - Added collapse button for source bar.
- **Layout Checker v2.0.8** - Fixed error overlay not hiding when starting new fetch.
- **Layout Checker v2.0.7** - Added error overlay with Retry button when fetch fails.
- **Layout Checker v2.0.6** - URL input disabled during fetch, reset button becomes Stop button.
- **Layout Checker v2.0.5** - Fetch overlay moved inside preview panel with status text and provider info.
- **Layout Checker v2.0.4** - Added animated progress bar to fetch modal.
- **Layout Checker v2.0.3** - Improved fetch modal: cleaner design, backdrop blur, animations, outline Stop button.
- **Layout Checker v2.0.2** - Loading overlay replaced with modal showing fetcher provider + Stop button.
- **Layout Checker v2.0.1** - Removed Code/Preview tab switcher. Preview is default view with placeholder message.
- **Layout Checker v2.0.0** - Major simplification: removed CodeMirror editor (~200KB saved). Preview remains primary, code view uses simple textarea.
- **Layout Checker v1.5.8** - Added full-screen loading overlay when fetching HTML.
- **Layout Checker v1.5.7** - Subject input changed to textarea with 2 rows height.
- **Layout Checker v1.5.6** - Added reset button for Layout URL.
- **Layout Checker v1.5.5** - Added reset button for Subject fields.
- **Layout Checker v1.5.4** - Removed Open HTML file upload. Auto-reload URL when switching HTML fetcher provider.
- **Layout Checker v1.5.3** - Added configurable HTML fetcher dropdown: Google Apps Script, Cloudflare Worker, Jina AI, or Custom URL.
- **Campaign Counter v2.0.1** - Added Reset button next to Scan Folder to clear all saved folder scans from Supabase.
- **Campaign Counter v2.0.1** - Fixed campaign folder tooltip to show all entries with the same campaign ID but different dates.
- **Campaign Counter v2.0.1** - Fixed folder name parsing to handle pipe-separated format with date and manager in either order.

### 24 August 2026
- **Layout Checker v1.5.2** - Subject field integrated in source bar below URL, auto-processes KRHRED placeholders live as unit values are entered. Removed old subject panel and Add Unit button.
- **Doc to HTML v1.1.0** - Added PDF support (editable text + image modes), Save to Folder with auto nested subfolders (emailblast\MKT\2026\tnc\), Open in New Tab, improved Word styleMap, redesigned full-height A4 preview.
- **Layout Slicer v0.5.1** - Improved Generate/Export UX with step-based workflow, loading spinner, export summary, save-folder confirmation, per-slice size estimates, and customizable file name prefix.

### 23 August 2026
- **Campaign Counter v2.0.0, Layout Slicer v0.5.0, TNC Uploader v0.3.9** - Promoted to stable. Removed beta warnings and sidebar beta badges.
- **Layout Slicer v0.5.0 beta** - Full Photoshop-like rulers spanning the canvas wrap with tick-0 aligned to image top-left, exclude-checkbox per slice with sequential renumbering, and numbered canvas overlay badges.

### 21 August 2026
- **Campaign Counter v2.0.0 beta** - Made Supabase the single source of truth for the counter: Generate and Back atomically increment or decrement a server-side counter row via RPC, the UI updates only after Supabase confirms the new ID, and Supabase Realtime keeps every open tab in sync instantly.

### 20 August 2026
- **Campaign Counter v1.9.0 beta** - Rewrote navigation to simple local counter: Generate = current ID + 1, Back = current ID - 1; current displayed ID is now the single source of truth, no Supabase round-trip on every click.
- **Campaign Counter v1.8.8 beta** - Fixed generate to use server-side `generate_campaign_id` RPC so the next ID is always calculated from the latest registry state, preventing stale local counter issues when multiple users generate.
- **Campaign Counter v1.8.2 beta** - Resized the folder list into a compact 10-column grid and added hover tooltips showing blast date, campaign name, and campaign manager parsed from folder names.
- **Campaign Counter v1.8.1 beta** - Moved the Campaign Folder scanner into its own dedicated right-side panel with a compact vertical folder list.
- **Campaign Counter v1.8.0 beta** - Added a Campaign Folder picker that scans a local folder for existing campaign directories, lists found campaign numbers, and highlights conflicts in red when a generated ID already has a matching folder.
- **Campaign Counter v1.7.2 beta** - Tidied the Date and Campaign Name fields into a clean side-by-side row with aligned labels and inputs.
- **Campaign Counter v1.7.1 beta** - Added a Date field next to Campaign Name so users can override the default date stamp before generating.
- **Campaign Counter v1.7.0 beta** - Added an optional Campaign Name field so generated IDs copy as `YYYYMMDD_nama-campaign_XXXX` instead of just the four-digit number.

### 13 August 2026
- **TNC Uploader v0.3.9 beta** - Removed the duplicate status row so the newest real activity carries the `New` badge instead.
- **TNC Uploader v0.3.8 beta** - Merged the latest status into Recent Activity as a compact colored `New` row.
- **TNC Uploader v0.3.7 beta** - Expanded Recent Activity with file names, paths, filename changes, link-check results, and colored action content.
- **TNC Uploader v0.3.6 beta** - Made Recent Activity more compact with colored local action markers and inline timestamps.
- **TNC Uploader v0.3.5 beta** - Fixed saved PDF history so it renders immediately when the tool opens.
- **TNC Uploader v0.3.4 beta** - Put active dropped PDFs above saved history, clarified the selected destination and target path, and streamlined actions to pick a folder, save PDFs, or clear the queue.
- **TNC Uploader v0.3.3 beta** - Added a persistent right-side Recent Activity log for local queue, folder, save, download, copy, check, and cleanup actions without changing the existing PDF history.

## System Info

- **Available tools:** `11`
- **Deployment:** Private GitHub Pages and local server
- **Status:** All tools available
