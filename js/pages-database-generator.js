
// ---- Extracted scripts from inline <script> blocks ----
const $ = (sel) => document.querySelector(sel);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const campaignRegex = /^\d{8}[A-Za-z]?_.*$/; // Format: YYYYMMDD or YYYYMMDDX, followed by _Campaign-Name_XXXX

    const campaignIdEl = $('#campaignId');

    // Email/KR elements
    const newEmailEl = $('#newEmail');
    const addEmailBtn = $('#addEmail');

    // BULK refs
    const bulkEmailsEl = $('#bulkEmails');
    const applyBulkBtn = $('#applyBulk');
    const bulkInfo = $('#bulkInfo');

    const newKeyEl = $('#newKey');
    const addKeyBtn = $('#addKey');
    const krhredChips = $('#krhredChips');
    const krHeadRow = $('#krHeadRow');
    const krBody = $('#krBody');

    const btnDownload = $('#btnDownload');
    const btnSave = $('#btnSave');
    const stateMsg = $('#stateMsg');
    const errorEl = $('#error');
    const previewsEl = $('#previews');
    const countInfo = $('#countInfo');
    const invalidInfo = $('#invalidInfo');
    const emailCount = $('#emailCount');
    const validCount = $('#validCount');
    const krhredCount = $('#krhredCount');
    const campaignError = $('#campaignError');
    const emailError = $('#emailError');
    const keyError = $('#keyError');

    const dlSection = $('#dlSection');
    const downloadsList = $('#downloadsList');

    // State
    let emails = [];                 // [{ id, email }, ...]
    let krKeys = [];                 // ["KRHRED_Unit_30", ...]
    const krValues = new Map();      // row id -> Map(key -> value)
    let campaignType = 'static';     // 'static' or 'dynamic'
    let nextRowId = 1;

    // Get KRHRED section element
    const krhredSection = $('#krhredSection');

    // ---------- Helpers ----------
    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function setFieldError(element, message = '') {
      element.textContent = message;
      element.classList.toggle('hidden', !message);
    }

    function setStatus(message, type = 'neutral') {
      stateMsg.textContent = message;
      stateMsg.classList.remove('is-neutral', 'is-ready', 'is-error');
      stateMsg.classList.add(`is-${type}`);
    }

    function renderPreviewEmpty(message) {
      previewsEl.innerHTML = `
        <div class="preview-empty">
          <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
          <p>${escapeHtml(message)}</p>
        </div>`;
    }

    function parseManyEmails(text) {
      return (text || '')
        .split(/[\n,;\s]+/)        // baris, koma, titik koma, spasi
        .map(s => s.trim())
        .filter(Boolean);
    }

    function normalizeKey(k) {
      const raw = String(k ?? '').trim();
      if (raw) {
        if (!/^\d+$/.test(raw)) return '';
        const unitNumber = Number.parseInt(raw, 10);
        if (!Number.isSafeInteger(unitNumber) || unitNumber < 1) return '';
        return `KRHRED_Unit_${unitNumber}`;
      }
      // auto-generate KRHRED_Unit_N starting at 30
      const nums = krKeys
        .map(x => (/KRHRED_Unit_(\d+)/i.exec(x)?.[1]))
        .filter(Boolean)
        .map(n => parseInt(n, 10));
      const max = nums.length ? Math.max(...nums) : 29;
      return `KRHRED_Unit_${max + 1}`;
    }

    function createEmailRow(email) {
      const row = { id: nextRowId, email };
      nextRowId += 1;
      emails.push(row);
      ensureRowMap(row.id);
      return row;
    }

    function ensureRowMap(rowId) {
      if (!krValues.has(rowId)) krValues.set(rowId, new Map());
      return krValues.get(rowId);
    }

    function migrateEmail(rowId, newEmail) {
      const row = emails.find(item => item.id === rowId);
      if (!row || row.email === newEmail) return;
      row.email = newEmail;
      updateUI();
    }

    function removeEmailRow(rowId) {
      emails = emails.filter(row => row.id !== rowId);
      krValues.delete(rowId);
      renderTable();
      updateUI();
    }

    function renderKrhredChips() {
      if (!krhredChips) return;
      krhredChips.innerHTML = '';

      if (campaignType !== 'dynamic') {
        krhredChips.classList.add('is-empty');
        krhredChips.innerHTML = '<span class="krhred-chip-empty">Switch to Dynamic to add KRHRED units.</span>';
        return;
      }

      if (!krKeys.length) {
        krhredChips.classList.add('is-empty');
        krhredChips.innerHTML = '<span class="krhred-chip-empty">No KRHRED units yet.</span>';
        return;
      }

      krhredChips.classList.remove('is-empty');
      for (const key of krKeys) {
        const unitNumber = key.replace(/^KRHRED_Unit_/i, '');
        const chip = document.createElement('button');
        chip.className = 'krhred-chip';
        chip.type = 'button';
        chip.title = `Remove ${key}`;
        chip.setAttribute('aria-label', `Remove ${key}`);
        chip.dataset.removeKey = key;
        chip.innerHTML = `
          <span>${escapeHtml(unitNumber)}</span>
          <i class="fa-solid fa-times" aria-hidden="true"></i>
        `;
        chip.addEventListener('click', () => {
          krKeys = krKeys.filter(item => item !== key);
          for (const m of krValues.values()) m.delete(key);
          renderTable();
          updateUI();
        });
        krhredChips.appendChild(chip);
      }
    }

    function renderTable() {
      renderKrhredChips();
      // Header: hapus kolom KR lama
      krHeadRow.querySelectorAll('th[data-key]').forEach(th => th.remove());
      for (const key of krKeys) {
        const th = document.createElement('th');
        th.className = 'krhred-header';
        th.setAttribute('data-key', key);
        th.innerHTML = `
          <div class="krhred-header-content">
            <span class="krhred-key">${escapeHtml(key)}</span>
            <button class="krhred-remove-btn" type="button" title="Remove KRHRED column ${escapeHtml(key)}" aria-label="Remove KRHRED column ${escapeHtml(key)}" data-remove-key="${escapeHtml(key)}">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>`;
        krHeadRow.appendChild(th);
      }

      // Body
      krBody.innerHTML = '';
      if (emails.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
          <td colspan="100%" class="table-empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p class="table-empty-title">No customer data yet</p>
            <p class="table-empty-copy">Add one email or use bulk paste.</p>
          </td>
        `;
        krBody.appendChild(emptyRow);
        return;
      }

      for (const row of emails) {
        const { id: rowId, email } = row;
        const tr = document.createElement('tr');

        const tdEmail = document.createElement('td');
        tdEmail.className = 'email-column';
        const emailIsValid = emailRegex.test(email);
        tdEmail.innerHTML = `
          <div class="email-input-wrapper">
            <input class="email-input${emailIsValid ? '' : ' is-invalid'}" type="email" value="${escapeHtml(email)}" placeholder="email@example.com" aria-label="Email customer" aria-invalid="${String(!emailIsValid)}" />
            <button class="email-remove-btn" type="button" title="Remove ${escapeHtml(email)}" aria-label="Remove ${escapeHtml(email)}" data-remove-row="${rowId}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>`;
        tr.appendChild(tdEmail);

        const rowMap = ensureRowMap(rowId);
        for (const key of krKeys) {
          const td = document.createElement('td');
          td.className = 'krhred-column';
          const inp = document.createElement('input');
          inp.className = 'krhred-input';
          inp.value = rowMap.get(key) ?? '';
          inp.placeholder = 'nilai';
          inp.setAttribute('aria-label', `${key} for ${email}`);
          inp.addEventListener('input', () => { rowMap.set(key, inp.value); updateUI(); });
          td.appendChild(inp);
          tr.appendChild(td);
        }
        krBody.appendChild(tr);

        // email change listener
        const emailInput = tdEmail.querySelector('input');
        emailInput.addEventListener('input', () => {
          const value = emailInput.value.trim();
          const isValid = emailRegex.test(value);
          emailInput.classList.toggle('is-invalid', !isValid);
          emailInput.setAttribute('aria-invalid', String(!isValid));
          migrateEmail(rowId, value);
        });
      }

      // Listeners: remove email / remove key
      krHeadRow.querySelectorAll('button[data-remove-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          const k = btn.getAttribute('data-remove-key');
          krKeys = krKeys.filter(x => x !== k);
          for (const m of krValues.values()) m.delete(k);
          renderTable();
          updateUI();
        });
      });
      krBody.querySelectorAll('button[data-remove-row]').forEach(btn => {
        btn.addEventListener('click', () => removeEmailRow(Number(btn.getAttribute('data-remove-row'))));
      });
    }

    function recordId(campaignId, i) { return `${campaignId}-${String(i + 1).padStart(6, '0')}`; }
    function rowEmailCustMast(id, email) { const emptyCount = 17; const empties = Array(emptyCount).fill('').join('|'); return `${id}|${email}|${empties}|\n`; }
    function rowCustPref(id, email, campaignId) { return `${id}|${email}|CMPG_ID|${campaignId}|\n`; }
    function rowCustSubs(id, email) { return `${id}|${email}|IMO Marketing|Y|\n`; }
    function rowsCustAttrStatic(id, email, campaignId) { return `${id}|${email}|CMPG_ID|${campaignId}|\n`; }
    function getEmailValue(entry) {
      return typeof entry === 'string' ? entry : entry.email;
    }

    function getEntryValues(entry) {
      if (typeof entry === 'string') return krValues.get(entry) || new Map();
      return krValues.get(entry.id) || new Map();
    }

    function buildAllFiles(campaignId, emailList, useKr) {
      let mast = '', pref = '', subs = '', attr = '';
      
      // Build records by email (correct order)
      emailList.forEach((entry, i) => {
        const email = getEmailValue(entry);
        const id = recordId(campaignId, i);
        mast += rowEmailCustMast(id, email);
        pref += rowCustPref(id, email, campaignId);
        subs += rowCustSubs(id, email);
      });
      
      // For CustAttr, if dynamic, build by key groups
      if (useKr) {
        // Add CMPG_ID for all emails
        emailList.forEach((entry, i) => {
          const email = getEmailValue(entry);
          const id = recordId(campaignId, i);
          attr += `${id}|${email}|CMPG_ID|${campaignId}|\n`;
        });
        
        // Add KRHRED values grouped by key
        krKeys.forEach(key => {
          emailList.forEach((entry, i) => {
            const email = getEmailValue(entry);
            const id = recordId(campaignId, i);
            const rowMap = getEntryValues(entry);
            const val = rowMap.get(key) ?? '';
            attr += `${id}|${email}|${key}|${val}|\n`;
          });
        });
      } else {
        // Static: just add CMPG_ID
        emailList.forEach((entry, i) => {
          const email = getEmailValue(entry);
          const id = recordId(campaignId, i);
          attr += rowsCustAttrStatic(id, email, campaignId);
        });
      }
      
      return {
        [`${campaignId}-EmailCustMast.txt`]: mast,
        [`${campaignId}-CustPref.txt`]: pref,
        [`${campaignId}-CustSubs.txt`]: subs,
        [`${campaignId}-CustAttr.txt`]: attr,
      };
    }

    function downloadText(name, content) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a);
      setTimeout(() => {
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
      }, 0);
    }

    function renderDownloadLinks(files) {
      downloadsList.innerHTML = '';
      for (const [name, content] of Object.entries(files)) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        a.textContent = name;
        downloadsList.appendChild(a);
        // Revoke after two minutes so the link remains usable.
        setTimeout(() => { URL.revokeObjectURL(url); a.removeAttribute('href'); a.classList.add('opacity-50','pointer-events-none'); }, 120000);
      }
      dlSection.classList.remove('hidden');
    }

    async function saveAllToFolder(files) {
      errorEl.classList.add('hidden');
      const originalButtonHtml = btnSave.innerHTML;
      btnSave.disabled = true;
      btnSave.setAttribute('aria-busy', 'true');
      btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Opening...';
      try {
         if (!('showDirectoryPicker' in window)) throw new Error("This browser does not support 'Save to folder'. Try desktop Chrome or Edge.");
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Saving...';
        for (const [name, content] of Object.entries(files)) {
          const fileHandle = await dirHandle.getFileHandle(name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
        }
        setStatus('Four files were saved to the selected folder.', 'ready');
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        errorEl.textContent = e?.message || 'Unable to save to the folder.';
        errorEl.classList.remove('hidden');
        setStatus('Files were not saved. Check the error message below.', 'error');
      } finally {
        btnSave.removeAttribute('aria-busy');
        btnSave.innerHTML = originalButtonHtml;
        updateUI();
      }
    }

    function updateUI() {
      renderKrhredChips();
      const campaignIdVal = campaignIdEl.value.trim();
      const useKrVal = campaignType === 'dynamic' && krKeys.length > 0;
      const dynamicReady = campaignType === 'static' || krKeys.length > 0;

      // Stats & validation
      const invalid = emails.filter(row => !emailRegex.test(row.email));
      countInfo.textContent = `Total: ${emails.length}`;
      emailCount.textContent = emails.length;
      validCount.textContent = emails.length - invalid.length;
      krhredCount.textContent = campaignType === 'dynamic' ? krKeys.length : 0;
      if (invalid.length) {
        invalidInfo.textContent = `Invalid: ${invalid.slice(0,3).map(row => row.email).join(', ')}${invalid.length>3?', …':''}`;
        invalidInfo.classList.remove('hidden');
      } else {
        invalidInfo.classList.add('hidden');
      }

      const ok = campaignRegex.test(campaignIdVal)
        && emails.length > 0
        && invalid.length === 0
        && dynamicReady;
      btnDownload.disabled = !ok;
      btnSave.disabled = !ok;

      const campaignIsValid = campaignRegex.test(campaignIdVal);
      setFieldError(
        campaignError,
        campaignIdVal && !campaignIsValid
          ? 'Campaign ID must start with an eight-digit date followed by an underscore.'
          : ''
      );

      if (ok) {
        const dynamicInfo = campaignType === 'dynamic'
              ? ` with ${krKeys.length} KRHRED column${krKeys.length === 1 ? '' : 's'}`
          : '';
        setStatus(`Ready to create 4 files for ${emails.length} email${emails.length === 1 ? '' : 's'}${dynamicInfo}.`, 'ready');
      } else if (!campaignIsValid) {
        setStatus('Enter a Campaign ID in the format YYYYMMDD_Campaign-Name_XXXX.', 'neutral');
      } else if (!emails.length) {
        setStatus('Add at least one email to create files.', 'neutral');
      } else if (!dynamicReady) {
        setStatus('Add at least one KRHRED column for a Dynamic campaign.', 'neutral');
      } else {
        setStatus('Fix invalid email addresses before creating files.', 'error');
      }

      // Previews
      if (!ok) {
        renderPreviewEmpty(
          !campaignIsValid
            ? 'The preview will appear after entering a valid Campaign ID.'
            : !emails.length
              ? 'Add at least one valid email to view the preview.'
              : !dynamicReady
                ? 'Add at least one KRHRED column to view the Dynamic preview.'
              : 'Fix invalid email addresses to continue.'
        );
        return;
      }

      previewsEl.innerHTML = '';
      
      // Build actual preview content
      const files = buildAllFiles(campaignIdVal, emails, useKrVal);
      
      for (const [name, content] of Object.entries(files)) {
        // Count lines and show file info
        const lines = content.split('\n').filter(line => line.trim()).length;
        const isKrFile = name.includes('CustAttr');
        const fileSize = (new Blob([content]).size / 1024).toFixed(1);
        const card = document.createElement('details');
        card.className = `preview-card${isKrFile ? ' is-primary' : ''}`;
        card.open = isKrFile;
        
        card.innerHTML = `
          <summary class="preview-header">
            <div class="preview-title">
              <i class="fa-solid fa-file-lines"></i>
              <span title="${escapeHtml(name)}">${escapeHtml(name)}</span>
            </div>
            <div class="preview-badge">
              <span class="preview-lines">${lines} baris</span>
              <span class="preview-size">${fileSize} KB</span>
              <span class="preview-toggle" aria-hidden="true"></span>
            </div>
          </summary>
          <div class="preview-content">
            <pre>${escapeHtml(content.substring(0, 500))}${content.length > 500 ? '\n\n...' : ''}</pre>
          </div>
          ${isKrFile && useKrVal ? '<div class="preview-notice"><i class="fa-solid fa-info-circle"></i> Format: CMPG_ID semua email → KRHRED_Unit_30 semua email → dst</div>' : ''}
        `;
        
        previewsEl.appendChild(card);
      }
    }

    // --- Events ---
    addEmailBtn.addEventListener('click', () => {
      const v = (newEmailEl.value || '').trim();
      setFieldError(emailError);
      if (!v) {
         setFieldError(emailError, 'Enter an email address first.');
        newEmailEl.focus();
        return;
      }
      if (!emailRegex.test(v)) {
         setFieldError(emailError, 'Invalid email format.');
        newEmailEl.focus();
        return;
      }
      createEmailRow(v);
      renderTable();
      updateUI();
      newEmailEl.value = '';
    });

    newEmailEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addEmailBtn.click();
      }
    });

    // Bulk paste remains visible in the compact workspace.
    applyBulkBtn.addEventListener('click', () => {
      const list = parseManyEmails(bulkEmailsEl.value);
      const valid = [];
      const invalid = [];
      for (const e of list) {
        if (emailRegex.test(e)) valid.push(e);
        else invalid.push(e);
      }
       // Duplicate emails remain separate customer rows.
      for (const e of valid) {
        createEmailRow(e);
      }
      renderTable();
      updateUI();

      // info singkat
      const parts = [];
      if (valid.length) parts.push(`${valid.length} email ditambahkan`);
      if (invalid.length) parts.push(`${invalid.length} invalid (diabaikan)`);
          bulkInfo.textContent = parts.join(' • ') || 'No new emails.';
       // Keep the pasted text so it can be corrected and added again.
    });

    addKeyBtn.addEventListener('click', () => {
      const key = normalizeKey(newKeyEl.value.trim());
      setFieldError(keyError);
      if (!key) {
         setFieldError(keyError, 'Enter a valid KRHRED number, for example: 30.');
        newKeyEl.focus();
        return;
      }
      if (krKeys.includes(key)) {
         setFieldError(keyError, 'That KRHRED column already exists.');
        newKeyEl.focus();
        return;
      }
      
      krKeys.push(key);
      for (const row of emails) ensureRowMap(row.id).set(key, '');
      newKeyEl.value = '';
      renderTable();
      updateUI();
    });

    newKeyEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addKeyBtn.click();
      }
    });

    btnDownload.addEventListener('click', async () => {
      const campaignId = campaignIdEl.value.trim();
      const useKr = campaignType === 'dynamic' && krKeys.length > 0;
      const files = buildAllFiles(campaignId, emails, useKr);
      for (const [name, content] of Object.entries(files)) {
        downloadText(name, content);
        await new Promise(r => setTimeout(r, 120));
      }
      renderDownloadLinks(files);
       setStatus('Download started. Manual links are available if the browser blocks a file.', 'ready');
    });

    btnSave.addEventListener('click', async () => {
      const campaignId = campaignIdEl.value.trim();
      const useKr = campaignType === 'dynamic' && krKeys.length > 0;
      const files = buildAllFiles(campaignId, emails, useKr);
      await saveAllToFolder(files);
    });

    campaignIdEl.addEventListener('input', updateUI);

    // Campaign type change handler
    document.querySelectorAll('input[name="campaignType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        campaignType = e.target.value;
        toggleKRHREDSection();
        
        // Clear KR keys if switching to static
        if (campaignType === 'static') {
          krKeys = [];
          renderTable();
        }
        
        updateUI();
      });
    });

    // Toggle KRHRED section visibility
    function toggleKRHREDSection() {
      document.body.classList.toggle('is-dynamic-generator', campaignType === 'dynamic');
      if (krhredSection) {
        if (campaignType === 'dynamic') {
          krhredSection.style.display = '';
        } else {
          krhredSection.style.display = 'none';
        }
      }
    }

    // Init
    if (new URLSearchParams(window.location.search).get('embed') === '1') {
      document.body.classList.add('is-embedded');
    }
    toggleKRHREDSection();
    renderTable();
    updateUI();
