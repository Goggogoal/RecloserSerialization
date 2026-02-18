// ============================================================
// PEA-AIMS Inspector Component v3 — MB52-based pending items
// Shows all MB52 qty items as pending slots + existing inspections
// ============================================================
import { store } from '../store.js';
import { api } from '../services/api.js';
import { CONFIG } from '../config.js';

const ICONS = { 'Recloser': '⚡', 'Control Cabinet': '🔧', 'PT': '🔌' };

export function renderInspector() {
    return `
    <div class="inspector-page" id="inspectorPage">
        <div class="page-header">
            <div class="page-breadcrumb">
                <button class="btn btn-sm btn-secondary breadcrumb-back" id="inspBackBtn"><i data-lucide="arrow-left"></i> Back</button>
            </div>
            <h2 class="page-title"><i data-lucide="clipboard-check"></i> Inspection</h2>
            <p class="page-subtitle">Add and manage inspection records</p>
        </div>
        <div class="filters-bar">
            <div class="filter-group filter-group-search">
                <label><i data-lucide="warehouse"></i> Warehouse</label>
                <div class="searchable-select-wrapper">
                    <input type="text" id="inspWhSearch" placeholder="Search warehouse..." class="search-input filter-search-input" autocomplete="off" />
                    <select id="inspWarehouseSelect" class="filter-select"><option value="">Select Warehouse...</option></select>
                </div>
            </div>
            <div class="filter-group">
                <label><i data-lucide="box"></i> SLoc</label>
                <select id="inspSLocSelect" class="filter-select"><option value="">All SLoc</option></select>
            </div>
            <div class="filter-group">
                <label><i data-lucide="layers"></i> Material Type</label>
                <div class="material-tabs" id="materialTabs">
                    ${CONFIG.MATERIAL_TYPES.map(t => `<button class="material-tab" data-type="${t}"><span class="tab-icon">${ICONS[t] || '📦'}</span>${t}</button>`).join('')}
                </div>
            </div>
        </div>
        <div class="inspection-list" id="inspectionList">
            <div class="empty-state"><i data-lucide="search"></i><p>Select a warehouse and material type</p></div>
        </div>
        ${renderFormModal()}
        ${renderViewModal()}
    </div>`;
}

function renderFormModal() {
    return `
    <div class="modal-overlay" id="inspFormOverlay" style="display:none;">
        <div class="modal-container modal-large">
            <div class="modal-header">
                <h3 id="inspFormTitle"><i data-lucide="plus-circle"></i> Add New Inspection</h3>
                <button class="modal-close" id="inspFormClose"><i data-lucide="x"></i></button>
            </div>
            <form class="modal-body" id="inspForm">
                <div class="form-row">
                    <div class="form-group"><label for="inspPeaNo">PEA No. <span class="required">*</span></label>
                        <input type="text" id="inspPeaNo" placeholder="e.g. PEA-R-0012" required />
                        <div class="auto-fill-indicator" id="autoFillIndicator" style="display:none;"><i data-lucide="zap"></i> Auto-filled</div></div>
                    <div class="form-group"><label for="inspSerialNo">Serial No. <span class="required">*</span></label>
                        <input type="text" id="inspSerialNo" placeholder="Enter serial number" required /></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="inspContractNo">เลขที่สัญญา/Contract No.</label><input type="text" id="inspContractNo" placeholder="Auto-filled or manual" /></div>
                    <div class="form-group"><label for="inspBatch">Batch <span class="required">*</span></label>
                        <select id="inspBatch" required><option value="N">N - New</option><option value="R">R - Refurbished</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="inspBrand">ยี่ห้อ/Brand</label><input type="text" id="inspBrand" placeholder="Auto-filled or manual" /></div>
                    <div class="form-group"><label for="inspModel">รุ่น/Model</label><input type="text" id="inspModel" placeholder="Enter model" /></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>รูปถ่ายทั้งตัว/Overview Photo</label>
                        <div class="photo-upload" id="photoOverview"><div class="photo-dropzone" data-field="imageOverview"><i data-lucide="camera"></i><p>Click or drag</p><input type="file" accept="image/*" capture="environment" class="photo-input" /></div>
                        <div class="photo-preview" style="display:none;"><img src="" alt="Overview" /><button type="button" class="photo-remove"><i data-lucide="trash-2"></i></button></div></div></div>
                    <div class="form-group"><label>รูปถ่าย PEA No./แผ่นป้าย/Nameplate Photo</label>
                        <div class="photo-upload" id="photoNameplate"><div class="photo-dropzone" data-field="imageNameplate"><i data-lucide="image"></i><p>Click or drag</p><input type="file" accept="image/*" capture="environment" class="photo-input" /></div>
                        <div class="photo-preview" style="display:none;"><img src="" alt="Nameplate" /><button type="button" class="photo-remove"><i data-lucide="trash-2"></i></button></div></div></div>
                </div>
                <div class="form-group"><label for="inspRemarks">หมายเหตุ/Remarks</label><textarea id="inspRemarks" rows="2" placeholder="Notes..."></textarea></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="inspFormCancel">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Save</button>
                </div>
            </form>
        </div>
    </div>`;
}

function renderViewModal() {
    return `
    <div class="modal-overlay" id="inspViewOverlay" style="display:none;">
        <div class="modal-container modal-large">
            <div class="modal-header"><h3><i data-lucide="eye"></i> Inspection Details</h3><button class="modal-close" id="inspViewClose"><i data-lucide="x"></i></button></div>
            <div class="modal-body" id="inspViewBody"></div>
        </div>
    </div>`;
}

export async function initInspector() {
    const user = store.get('user');
    if (!user) return;

    if (!(store.get('warehouses') || []).length) {
        const r = await api.call('getMasterData');
        if (r.success) store.update({ warehouses: r.warehouses, contracts: r.contracts, equipment: r.equipment, mb52: r.mb52 });
    }

    // Back button
    document.getElementById('inspBackBtn')?.addEventListener('click', () => {
        const selWh = store.get('selectedWarehouse');
        store.set('currentView', selWh ? 'sloc' : 'dashboard');
    });

    // Populate warehouse dropdown (unique by code)
    const whSelect = document.getElementById('inspWarehouseSelect');
    const allWhs = store.get('warehouses') || [];
    const uniqueWHs = [];
    const seenCodes = new Set();
    (user.zone === 'ALL' ? allWhs : allWhs.filter(w => w.zone === user.zone)).forEach(wh => {
        if (!seenCodes.has(wh.code)) { seenCodes.add(wh.code); uniqueWHs.push(wh); }
    });
    uniqueWHs.forEach(wh => {
        const o = document.createElement('option');
        o.value = wh.code;
        o.textContent = `${wh.name} | ${wh.code}`;
        whSelect.appendChild(o);
    });

    // Pre-select from store
    const sel = store.get('selectedWarehouse');
    if (sel) whSelect.value = sel.code;

    // Search filter for warehouse dropdown
    const searchInput = document.getElementById('inspWhSearch');
    searchInput?.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        Array.from(whSelect.options).forEach(opt => {
            if (!opt.value) return;
            opt.hidden = q && !opt.textContent.toLowerCase().includes(q);
        });
    });

    // Warehouse change → populate SLoc dropdown
    whSelect.addEventListener('change', () => {
        populateSLocs(whSelect.value);
        loadList();
    });

    // SLoc change
    document.getElementById('inspSLocSelect')?.addEventListener('change', () => loadList());

    // Pre-populate SLocs if warehouse selected
    if (sel) {
        populateSLocs(sel.code);
        const preSloc = store.get('selectedSLoc');
        if (preSloc) document.getElementById('inspSLocSelect').value = preSloc;
    }

    // Material tabs
    document.querySelectorAll('.material-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.material-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            store.set('selectedMaterialType', tab.dataset.type);
            loadList();
        });
    });
    const firstTab = document.querySelector('.material-tab');
    if (firstTab) { firstTab.classList.add('active'); store.set('selectedMaterialType', firstTab.dataset.type); }

    setupFormHandlers();
    setupViewHandlers();

    if (sel) loadList();
}

function populateSLocs(whCode) {
    const slocSelect = document.getElementById('inspSLocSelect');
    slocSelect.innerHTML = '<option value="">All SLoc</option>';
    if (!whCode) return;
    // Derive SLocs from MB52 data (source of truth for stock)
    const mb52 = store.get('mb52') || [];
    const slocs = [...new Set(mb52.filter(m => m.whCode === whCode && m.sloc).map(m => m.sloc))];
    slocs.forEach(sl => {
        const o = document.createElement('option');
        o.value = sl;
        o.textContent = sl;
        slocSelect.appendChild(o);
    });
    const preSloc = store.get('selectedSLoc');
    if (preSloc && slocs.includes(preSloc)) slocSelect.value = preSloc;
}

// ───────────────────────────────────────────────
// Main list: MB52 qty items as pending + inspections
// ───────────────────────────────────────────────
async function loadList() {
    const whCode = document.getElementById('inspWarehouseSelect')?.value;
    const sloc = document.getElementById('inspSLocSelect')?.value;
    const matType = store.get('selectedMaterialType');
    const list = document.getElementById('inspectionList');

    if (!whCode || !matType) {
        list.innerHTML = `<div class="empty-state"><i data-lucide="search"></i><p>Select warehouse and type</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    list.innerHTML = `<div class="loading-placeholder"><div class="spinner-large"></div></div>`;

    // Fetch inspections
    const result = await api.call('getInspections', { warehouseCode: whCode, sloc: sloc || undefined, materialType: matType });
    if (!result.success) { list.innerHTML = `<div class="empty-state error"><p>Failed to load</p></div>`; return; }

    const inspections = result.inspections || [];
    const mb52 = store.get('mb52') || [];

    // Stock — filter by warehouse + sloc + materialType, sum qty
    let stockItems = mb52.filter(m => m.whCode === whCode && m.materialType === matType);
    if (sloc) stockItems = stockItems.filter(m => m.sloc === sloc);
    const totalStock = stockItems.reduce((s, m) => s + m.qty, 0);
    const doneCount = inspections.length;
    const pendingCount = Math.max(0, totalStock - doneCount);
    const pct = totalStock > 0 ? Math.round(doneCount / totalStock * 100) : 0;

    const slocLabel = sloc ? ` / ${sloc}` : '';

    // Build HTML
    list.innerHTML = `
        <div class="list-summary">
            <span><i data-lucide="warehouse"></i> ${whCode}${slocLabel}</span>
            <span><i data-lucide="package"></i> Total: ${totalStock}</span>
            <span class="summary-done"><i data-lucide="check-circle"></i> Done: ${doneCount}</span>
            <span class="summary-pending"><i data-lucide="clock"></i> Pending: ${pendingCount}</span>
            <span><i data-lucide="trending-up"></i> ${pct}%</span>
        </div>

        ${inspections.length ? `
        <h4 class="list-section-title"><i data-lucide="check-circle"></i> Inspected Items (${doneCount})</h4>
        <div class="inspection-cards">${inspections.map(i => inspectedCardHTML(i)).join('')}</div>` : ''}

        ${pendingCount > 0 ? `
        <h4 class="list-section-title pending-title"><i data-lucide="clock"></i> Pending Items (${pendingCount})</h4>
        <div class="pending-items-list">
            ${generatePendingSlots(pendingCount, doneCount)}
        </div>` : ''}

        ${totalStock === 0 ? `<div class="empty-state"><i data-lucide="inbox"></i><p>No stock found for this selection</p></div>` : ''}
    `;

    if (window.lucide) lucide.createIcons();

    // Bind events
    list.querySelectorAll('.btn-edit-inspection').forEach(b => b.addEventListener('click', () => openForm(b.dataset.id)));
    list.querySelectorAll('.btn-view-inspection').forEach(b => b.addEventListener('click', () => viewInspection(b.dataset.id)));
    list.querySelectorAll('.btn-fill-pending').forEach(b => b.addEventListener('click', () => openForm(null)));
}

function generatePendingSlots(count, offset) {
    // Show up to 50 pending slots with "show more" for performance
    const showCount = Math.min(count, 50);
    let html = '';
    for (let i = 0; i < showCount; i++) {
        html += `
        <div class="pending-item">
            <div class="pending-item-info">
                <span class="pending-item-number">#${offset + i + 1}</span>
                <span class="insp-status-badge status-pending">Pending</span>
            </div>
            <button class="btn btn-sm btn-primary btn-fill-pending" title="Fill inspection data">
                <i data-lucide="edit-2"></i> Fill Data
            </button>
        </div>`;
    }
    if (count > 50) {
        html += `<div class="pending-more-info"><i data-lucide="info"></i> Showing 50 of ${count} pending items. Complete inspections to see the rest.</div>`;
    }
    return html;
}

function inspectedCardHTML(i) {
    const sc = i.status === 'Approved' ? 'status-approved' : i.status === 'Inspected' ? 'status-inspected' : i.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    return `<div class="inspection-card ${sc}">
        <div class="insp-card-header">
            <span class="insp-pea-no">${i.peaNo || '-'}</span>
            <span class="insp-status-badge ${sc}">${i.status}</span>
        </div>
        <div class="insp-card-body">
            <div class="insp-detail"><strong>Serial:</strong> ${i.serialNo || '-'}</div>
            <div class="insp-detail"><strong>Contract:</strong> ${i.contractNo || '-'}</div>
            <div class="insp-detail"><strong>Brand:</strong> ${i.brand || '-'}</div>
            <div class="insp-detail"><strong>Batch:</strong> ${i.batch === 'N' ? 'New' : 'Refurb'}</div>
        </div>
        ${i.remarks ? `<div class="insp-remarks"><i data-lucide="message-square"></i> ${i.remarks}</div>` : ''}
        <div class="insp-card-footer">
            <span class="insp-timestamp"><i data-lucide="clock"></i> ${i.timestamp}</span>
            <div class="action-btns">
                <button class="btn btn-sm btn-outline btn-view-inspection" data-id="${i.id}" title="View"><i data-lucide="eye"></i></button>
                ${i.status !== 'Approved' ? `<button class="btn btn-sm btn-outline btn-edit-inspection" data-id="${i.id}" title="Edit"><i data-lucide="edit-2"></i></button>` : ''}
            </div>
        </div>
    </div>`;
}

// ───────────────────────────────────────────────
// View Inspection (read-only modal)
// ───────────────────────────────────────────────
async function viewInspection(id) {
    const r = await api.call('getInspectionById', { id });
    if (!r.success || !r.inspection) { showToast('Could not load details', 'error'); return; }
    const i = r.inspection;
    const body = document.getElementById('inspViewBody');
    body.innerHTML = `
        <div class="view-detail-grid">
            <div class="view-row"><strong>PEA No.</strong><span>${i.peaNo || '-'}</span></div>
            <div class="view-row"><strong>Serial No.</strong><span>${i.serialNo || '-'}</span></div>
            <div class="view-row"><strong>Warehouse</strong><span>${i.warehouseCode || '-'}</span></div>
            <div class="view-row"><strong>SLoc</strong><span>${i.sloc || '-'}</span></div>
            <div class="view-row"><strong>Material Type</strong><span>${i.materialType || '-'}</span></div>
            <div class="view-row"><strong>เลขที่สัญญา/Contract No.</strong><span>${i.contractNo || '-'}</span></div>
            <div class="view-row"><strong>Batch</strong><span>${i.batch === 'N' ? 'New' : i.batch === 'R' ? 'Refurbished' : (i.batch || '-')}</span></div>
            <div class="view-row"><strong>ยี่ห้อ/Brand</strong><span>${i.brand || '-'}</span></div>
            <div class="view-row"><strong>รุ่น/Model</strong><span>${i.model || '-'}</span></div>
            <div class="view-row"><strong>Status</strong><span class="insp-status-badge status-${(i.status || 'pending').toLowerCase()}">${i.status || '-'}</span></div>
            <div class="view-row"><strong>Inspector</strong><span>${i.inspectorId || '-'}</span></div>
            <div class="view-row"><strong>Timestamp</strong><span>${i.timestamp || '-'}</span></div>
            ${i.remarks ? `<div class="view-row full-width"><strong>หมายเหตุ/Remarks</strong><span>${i.remarks}</span></div>` : ''}
            ${i.managerComment ? `<div class="view-row full-width"><strong>Manager Comment</strong><span>${i.managerComment}</span></div>` : ''}
        </div>
        ${(i.imageOverview || i.imageNameplate) ? `<div class="view-photos">
            ${i.imageOverview ? `<div class="view-photo"><label>รูปถ่ายทั้งตัว/Overview Photo</label><img src="${i.imageOverview}" alt="Overview" /></div>` : ''}
            ${i.imageNameplate ? `<div class="view-photo"><label>รูปถ่าย PEA No./แผ่นป้าย/Nameplate Photo</label><img src="${i.imageNameplate}" alt="Nameplate" /></div>` : ''}
        </div>` : ''}`;
    const ov = document.getElementById('inspViewOverlay');
    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('visible'));
    if (window.lucide) lucide.createIcons();
}

function setupViewHandlers() {
    const ov = document.getElementById('inspViewOverlay');
    document.getElementById('inspViewClose')?.addEventListener('click', () => closeModal(ov));
    ov?.addEventListener('click', e => { if (e.target === ov) closeModal(ov); });
}

// ───────────────────────────────────────────────
// Form (Add / Edit)
// ───────────────────────────────────────────────
async function openForm(editId = null) {
    const ov = document.getElementById('inspFormOverlay'), form = document.getElementById('inspForm');
    form.reset();
    form.dataset.editId = editId || '';
    document.querySelectorAll('.photo-preview').forEach(p => { p.style.display = 'none'; p.querySelector('img').src = ''; });
    document.querySelectorAll('.photo-dropzone').forEach(d => d.style.display = 'flex');
    document.getElementById('autoFillIndicator').style.display = 'none';

    if (editId) {
        document.getElementById('inspFormTitle').innerHTML = '<i data-lucide="edit"></i> Edit';
        const r = await api.call('getInspectionById', { id: editId });
        if (r.success && r.inspection) {
            const ins = r.inspection;
            document.getElementById('inspPeaNo').value = ins.peaNo || '';
            document.getElementById('inspSerialNo').value = ins.serialNo || '';
            document.getElementById('inspContractNo').value = ins.contractNo || '';
            document.getElementById('inspBatch').value = ins.batch || 'N';
            document.getElementById('inspBrand').value = ins.brand || '';
            document.getElementById('inspModel').value = ins.model || '';
            document.getElementById('inspRemarks').value = ins.remarks || '';
            if (ins.imageOverview) {
                const pv = document.querySelector('#photoOverview .photo-preview');
                const img = pv?.querySelector('img');
                if (pv && img) { img.src = ins.imageOverview; pv.style.display = 'block'; document.querySelector('#photoOverview .photo-dropzone').style.display = 'none'; }
            }
            if (ins.imageNameplate) {
                const pv = document.querySelector('#photoNameplate .photo-preview');
                const img = pv?.querySelector('img');
                if (pv && img) { img.src = ins.imageNameplate; pv.style.display = 'block'; document.querySelector('#photoNameplate .photo-dropzone').style.display = 'none'; }
            }
        }
    } else {
        document.getElementById('inspFormTitle').innerHTML = '<i data-lucide="plus-circle"></i> Add New';
    }

    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('visible'));
    if (window.lucide) lucide.createIcons();
}

function closeModal(ov) { ov.classList.remove('visible'); setTimeout(() => ov.style.display = 'none', 300); }

function setupFormHandlers() {
    const ov = document.getElementById('inspFormOverlay');
    document.getElementById('inspFormClose')?.addEventListener('click', () => closeModal(ov));
    document.getElementById('inspFormCancel')?.addEventListener('click', () => closeModal(ov));
    ov?.addEventListener('click', e => { if (e.target.id === 'inspFormOverlay') closeModal(ov); });

    // Auto-fill
    const peaIn = document.getElementById('inspPeaNo');
    if (peaIn) { let t; peaIn.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => autoFill(peaIn.value.trim()), 500); }); }

    // Photos
    ['photoOverview', 'photoNameplate'].forEach(setupPhoto);

    // Submit ★ two-phase: text first (instant), images in background
    document.getElementById('inspForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!confirm('Are you sure you want to save this inspection?')) return;

        const whCode = document.getElementById('inspWarehouseSelect')?.value;
        const sloc = document.getElementById('inspSLocSelect')?.value;
        const imgOverview = document.querySelector('#photoOverview .photo-preview img')?.src || '';
        const imgNameplate = document.querySelector('#photoNameplate .photo-preview img')?.src || '';
        const hasImages = (imgOverview && imgOverview.startsWith('data:image')) || (imgNameplate && imgNameplate.startsWith('data:image'));

        const data = {
            inspectorId: store.get('user')?.username,
            warehouseCode: whCode,
            sloc: sloc || '',
            materialType: store.get('selectedMaterialType'),
            peaNo: document.getElementById('inspPeaNo').value.trim(),
            serialNo: document.getElementById('inspSerialNo').value.trim(),
            contractNo: document.getElementById('inspContractNo').value.trim(),
            batch: document.getElementById('inspBatch').value,
            brand: document.getElementById('inspBrand').value.trim(),
            model: document.getElementById('inspModel').value.trim(),
            remarks: document.getElementById('inspRemarks').value.trim()
        };

        const editId = document.getElementById('inspForm')?.dataset.editId;

        // Phase 1: Save text data (fast)
        const r = editId
            ? await api.call('updateInspection', { id: editId, updates: data })
            : await api.call('submitInspection', data);

        if (!r.success) { showToast(r.message || 'Error', 'error'); return; }

        closeModal(ov);
        showToast('Saved!', 'success');
        setTimeout(loadList, 500);

        // Phase 2: Upload images in background (non-blocking)
        if (hasImages) {
            const inspId = editId || r.id;
            if (inspId) {
                const imgPayload = { id: inspId };
                if (imgOverview && imgOverview.startsWith('data:image')) imgPayload.imageOverview = imgOverview;
                if (imgNameplate && imgNameplate.startsWith('data:image')) imgPayload.imageNameplate = imgNameplate;
                showUploadProgress();
                api.call('uploadImages', imgPayload).then(imgR => {
                    hideUploadProgress();
                    if (imgR.success) showToast('Photos uploaded ✓', 'success');
                    else showToast('Photo upload failed', 'error');
                    loadList();
                }).catch(() => { hideUploadProgress(); showToast('Photo upload failed', 'error'); });
            }
        }
    });
}

function autoFill(peaNo) {
    const contracts = store.get('contracts') || [], ind = document.getElementById('autoFillIndicator');
    if (!peaNo) { ind.style.display = 'none'; return; }
    const m = peaNo.match(/^(PEA-\w+-?)(\d+)$/i);
    if (!m) { ind.style.display = 'none'; return; }
    const pfx = m[1].toUpperCase(), num = parseInt(m[2], 10);
    for (const c of contracts) {
        const sm = c.peaStart.match(/^(PEA-\w+-?)(\d+)$/i), em = c.peaEnd.match(/^(PEA-\w+-?)(\d+)$/i);
        if (!sm || !em) continue;
        if (pfx === sm[1].toUpperCase() && num >= parseInt(sm[2], 10) && num <= parseInt(em[2], 10)) {
            document.getElementById('inspContractNo').value = c.contractNo;
            document.getElementById('inspBrand').value = c.brand || '';
            ind.style.display = 'flex';
            ind.innerHTML = `<i data-lucide="zap"></i> ${c.contractNo} (${c.equipType})`;
            if (window.lucide) lucide.createIcons();
            return;
        }
    }
    ind.style.display = 'none';
}

function setupPhoto(id) {
    const c = document.getElementById(id); if (!c) return;
    const dz = c.querySelector('.photo-dropzone'), inp = c.querySelector('.photo-input'), pv = c.querySelector('.photo-preview'), img = pv?.querySelector('img'), rm = c.querySelector('.photo-remove');
    dz.addEventListener('click', (e) => { if (e.target === inp) return; inp.click(); });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer.files.length) compressImg(e.dataTransfer.files[0]); });
    inp.addEventListener('click', e => e.stopPropagation());
    inp.addEventListener('change', () => { if (inp.files.length) compressImg(inp.files[0]); });
    rm?.addEventListener('click', (e) => { e.stopPropagation(); img.src = ''; pv.style.display = 'none'; dz.style.display = 'flex'; inp.value = ''; });

    function compressImg(f) {
        if (!f.type.startsWith('image/')) return;
        const MAX_WIDTH = 1024;
        const TARGET_BYTES = 300 * 1024; // 300KB
        const reader = new FileReader();
        reader.onload = e => {
            const tempImg = new Image();
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                let w = tempImg.width, h = tempImg.height;
                if (w > MAX_WIDTH) { h = Math.round(h * MAX_WIDTH / w); w = MAX_WIDTH; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(tempImg, 0, 0, w, h);
                let quality = 0.7;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                // Reduce quality if still over 300KB
                while (dataUrl.length > TARGET_BYTES * 1.37 && quality > 0.3) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                img.src = dataUrl;
                pv.style.display = 'block';
                dz.style.display = 'none';
            };
            tempImg.src = e.target.result;
        };
        reader.readAsDataURL(f);
    }
}

function showToast(msg, type = 'info') {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = `toast toast-${type}`;
    t.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i><span>${msg}</span>`;
    document.body.appendChild(t); if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3000);
}

function showUploadProgress() {
    document.getElementById('uploadProgress')?.remove();
    const el = document.createElement('div');
    el.id = 'uploadProgress';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--card-bg,#fff);border-radius:12px;padding:12px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:10000;display:flex;align-items:center;gap:12px;font-size:0.85rem;color:var(--text-primary,#333);min-width:220px;';
    el.innerHTML = `
        <div style="flex:1;">
            <div style="margin-bottom:6px;font-weight:600;">📷 Uploading photos...</div>
            <div style="height:4px;background:#e0e0e0;border-radius:2px;overflow:hidden;">
                <div style="height:100%;background:linear-gradient(90deg,var(--primary,#1565c0),var(--primary-light,#42a5f5));border-radius:2px;animation:uploadPulse 1.5s ease-in-out infinite;width:100%;"></div>
            </div>
        </div>`;
    // Add animation keyframes if not exists
    if (!document.getElementById('uploadAnimStyle')) {
        const style = document.createElement('style');
        style.id = 'uploadAnimStyle';
        style.textContent = '@keyframes uploadPulse{0%{opacity:0.4;transform:translateX(-60%)}50%{opacity:1;transform:translateX(0)}100%{opacity:0.4;transform:translateX(60%)}}';
        document.head.appendChild(style);
    }
    document.body.appendChild(el);
}

function hideUploadProgress() {
    const el = document.getElementById('uploadProgress');
    if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }
}
