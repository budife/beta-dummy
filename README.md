# BETA

Budd Email Tools & Automation for everyday campaign work.

BETA is a static web app built for validating campaign files, preparing database outputs, checking HTML layouts, managing campaign IDs, uploading TNC PDFs, slicing visual layouts, and tracking WFH/office days. It is intentionally lightweight: mostly vanilla HTML, CSS, and JavaScript, with browser-local storage where possible.

Internal deployment; server URL is environment-specific.

## Highlights

- Wiki-style app shell with a persistent sidebar and clean routes.
- Markdown-driven tool pages for easier documentation updates.
- Local-first workflows for sensitive campaign work.
- File System Access support for folder-based tools in Chromium browsers.
- GitHub Pages friendly routing with `404.html` SPA fallback.
- No build step required for normal usage.

## Tools

| Tool | Status | Purpose |
| --- | --- | --- |
| Bookmarklet | Stable | Browser shortcuts for repetitive page cleanup and helper actions. |
| Campaign Counter | Stable | Generate and track Campaign IDs locally with folder scanning and JSON import/export. |
| Config eDM | Stable | Open and update eDM XML configuration files with safer field editing. |
| Database Checker | Stable | Validate database packages locally and optionally test entered public layout URLs. |
| Database Generator | Stable | Generate campaign database output files locally from customer and KRHRED inputs. |
| Layout Checker | Stable | Load HTML layouts, apply KRHRED values, preview, open in a new tab, and capture screenshots when browser security allows. |
| Layout Slicer | Stable | Copy campaign folders and slice PDF/image layouts into ordered image assets. |
| DOCX to HTML | Stable | Convert DOCX files into upload-ready HTML directly in the browser. |
| TNC Uploader | Stable | Rename, queue, save, and generate public links for PDF terms and conditions locally. |
| Text Correction | Stable | Convert pasted text to plain text and apply common text transformations locally. |
| WFH Tracker | Stable | Track WFH/WFO and holidays using built-in local holiday data. |
| Documentation | Stable | Review workflows, privacy badges, security proof, backups, and network behavior. |

## Privacy Notes

This project is designed for internal-style daily work and processes sensitive data locally by default.

- Database TXT/CSV/XML files, DOCX files, PDFs, pasted HTML, generated campaign IDs, WFH marks, and most tool data stay in the browser or selected local folders.
- Campaign Counter stores its counter, activity, folder scans, and JSON backups in the current browser only.
- TNC Uploader does not upload PDFs and no longer performs automatic PDF link checks.
- WFH Tracker uses built-in holiday data and does not call an external holiday API.
- External network access is limited to explicitly used public URL workflows in Layout Checker and Database Checker, plus static CDN assets used by some tools.
- DOCX to HTML may load Mammoth, JSZip, CodeMirror, and docx-preview from CDN assets; mirror these assets locally if the deployment must avoid CDN requests.
- Read the [Documentation](/docs) page for the per-tool privacy badge guide, security proof, storage details, backup controls, and audit steps.
- Review the source before using it with confidential work. The code is plain static web code and can be inspected directly in this repository.

## Run Locally

Use a local server. Do not open `index.html` directly with `file://`, because Markdown/content fetches and some browser APIs require HTTP.

```powershell
python server.py
```

Then open:

```text
http://localhost:8000/
```

Clean routes are supported locally, for example:

```text
http://localhost:8000/layout-checker
http://localhost:8000/tnc-uploader
```

## Internal Deployment

The app is intended for an authenticated private GitHub Pages or internal static deployment. Configure the final base path for the target environment before publishing.

Important deployment details:

- `.nojekyll` is included for static hosting environments that support it.
- `404.html` acts as the SPA fallback for clean-route refreshes.
- Runtime code uses a base path helper for project-site paths.
- Asset and content fetch paths must stay relative or base-path aware.

## Browser Support

Best supported browser: Chromium-based browsers such as Microsoft Edge or Chrome.

Some APIs depend on browser support:

- Folder saving uses the File System Access API.
- Screenshot export can be limited by browser canvas security when remote images do not allow cross-origin capture.
- Direct folder pickers may work more reliably when a tool is opened directly instead of inside an iframe.

## Project Structure

```text
content/                 Markdown content rendered in the app shell
css/                     Shared and per-tool styles
docs/                    Documentation content
js/                      App shell, tool scripts, version registry
scripts/                 Maintenance and release helper scripts
tests/                   Node test suite
tools/                   Standalone tool HTML files embedded by routes
404.html                 GitHub Pages SPA fallback
index.html               Main app shell
server.py                Local development server
STYLE-GUIDE.md           UI/style guide for future changes
CHANGELOG.md             Release history
```

## Testing

Run the regression suite with:

```powershell
node --test tests/*.test.js
```

Useful quick checks:

```powershell
git diff --check
node --check js/pages-layout-checker.js
node --check js/pages-tnc-uploader.js
```

## Development Notes

- Keep tools lightweight and dependency-free unless there is a strong reason.
- Prefer local/browser storage over cloud storage for work data.
- Always update `CHANGELOG.md` and `content/home.md` Recent Updates after finishing an edit, fix, or new feature.
- Update `js/tool-versions.js` when a specific tool changes.
- Update cache-busters in affected HTML files when CSS/JS changes need to refresh on GitHub Pages.
- Follow `STYLE-GUIDE.md` for spacing, colors, typography, and UI patterns.

## Release Checklist

Before calling a feature or fix done:

- Add a concise entry to `content/home.md` under `Recent Updates`.
- Add the matching details to `CHANGELOG.md`.
- Bump the relevant tool version in `js/tool-versions.js` when the change is user-facing.
- Refresh cache-busters in affected HTML files when CSS or JavaScript changed.
- Run `git diff --check` and the relevant test command.

## Credits

Created and maintained as an internal BETA toolkit.

Built with vanilla HTML, CSS, JavaScript, Markdown, Font Awesome, CodeMirror, SheetJS/XLSX, File System Access API, IndexedDB, localStorage, and GitHub Pages.

Not an official HSBC product. Use responsibly and verify outputs before production work.
