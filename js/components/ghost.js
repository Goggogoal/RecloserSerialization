// ============================================================
// PEA-AIMS Ghost Items Component — items not in SAP (MB52)
// ============================================================
import { store } from '../store.js';
import { api } from '../services/api.js';
import { auth } from '../services/auth.js';
import { CONFIG } from '../config.js';

const ICONS = { 'Recloser': '⚡', 'Control Cabinet': '🔧', 'PT': '🔌' };

export function renderGhost() {
    return `
    <div class="ghost-page" id="ghostPage">
        <div class="page-header">
            <h2 class="page-title"><i data-lucide="package-search"></i> Ghost Items</h2>
            <p class="page-subtitle">Items not found in SAP (MB52)</p>
        </div>
        <div class="filters-bar">
            <div class="filter-group filter-group-search">
                <label><i data-lucide="warehouse"></i> Warehouse</label>
                <div class="searchable-select-wrapper">
                    <input type="text" id="ghostWhSearch" placeholder="Search warehouse..." class="search-input filter-search-input" autocomplete="off" />
                    <select id="ghostWarehouseSelect" class="filter-select"><option value="">All Warehouses</option></select>
                </div>
            </div>
            <div class="filter-group">
                <label><i data-lucide="box"></i> SLoc</label>
                <select id="ghostSLocSelect" class="filter-select"><option value="">All SLoc</option></select>
            </div>
            <div class="filter-group">
                <label><i data-lucide="layers"></i> Material Type</label>
                <div class="material-tabs" id="ghostMaterialTabs">
                    <button class="material-tab ghost-tab" data-type="">All</button>
                    ${CONFIG.MATERIAL_TYPES.map(t => `<button class="material-tab ghost-tab" data-type="${t}"><span class="tab-icon">${ICONS[t] || '📦'}</span>${t}</button>`).join('')}
                </div>
            </div>
        </div>
        <div class="ghost-actions-bar">
            <button class="btn btn-primary" id="btnAddGhost"><i data-lucide="plus-circle"></i> Add Ghost Item</button>
        </div>
        <div class="inspection-list" id="ghostList">
            <div class="empty-state"><i data-lucide="search"></i><p>Select a warehouse to see ghost items</p></div>
        </div>
        ${renderGhostFormModal()}
        ${renderGhostViewModal()}
    </div>`;
}

function renderGhostFormModal() {
    return `
    <div class="modal-overlay" id="ghostFormOverlay" style="display:none;">
        <div class="modal-container modal-large">
            <div class="modal-header">
                <h3 id="ghostFormTitle"><i data-lucide="plus-circle"></i> Add Ghost Item</h3>
                <button class="modal-close" id="ghostFormClose"><i data-lucide="x"></i></button>
            </div>
            <form class="modal-body" id="ghostForm" autocomplete="off">
                <div class="form-row">
                    <div class="form-group"><label for="ghostWarehouse">Warehouse <span class="required">*</span></label>
                        <select id="ghostWarehouse" required class="filter-select"><option value="">-- Select --</option></select></div>
                    <div class="form-group"><label for="ghostSLoc">SLoc <span class="required">*</span></label>
                        <select id="ghostSLoc" required class="filter-select"><option value="">-- Select --</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="ghostMaterialTypeField">Material Type <span class="required">*</span></label>
                        <select id="ghostMaterialTypeField" required class="filter-select">
                            <option value="">-- Select --</option>
                            ${CONFIG.MATERIAL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select></div>
                    <div class="form-group"><label for="ghostBatch">Batch <span class="required">*</span></label>
                        <select id="ghostBatch" required><option value="N">N - New</option><option value="R">R - Refurbished</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="ghostPeaNo">PEA No. <span class="required">*</span></label>
                        <input type="text" id="ghostPeaNo" required placeholder="e.g. RC-1234" /></div>
                    <div class="form-group"><label for="ghostSerialNo">Serial No. <span class="required">*</span></label>
                        <input type="text" id="ghostSerialNo" required placeholder="e.g. 12345" /></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="ghostContractNo">Contract No.</label>
                        <input type="text" id="ghostContractNo" placeholder="Contract number" /></div>
                    <div class="form-group"><label for="ghostBrand">Brand</label>
                        <input type="text" id="ghostBrand" placeholder="Brand name" /></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="ghostModel">Model</label>
                        <input type="text" id="ghostModel" placeholder="Model name" /></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>รูปถ่ายทั้งตัว/Overview Photo <span class="required">*</span></label>
                        <div class="photo-upload" id="ghostPhotoOverview"><div class="photo-dropzone" data-field="imageOverview"><i data-lucide="camera"></i><p>Click or drag</p><input type="file" accept="image/*" class="photo-input" /></div>
                        <div class="photo-preview" style="display:none;"><img src="" alt="Overview" /><button type="button" class="photo-remove"><i data-lucide="trash-2"></i></button></div></div></div>
                    <div class="form-group"><label>รูปถ่าย PEA No./แผ่นป้าย/Nameplate Photo <span class="required">*</span></label>
                        <div class="photo-upload" id="ghostPhotoNameplate"><div class="photo-dropzone" data-field="imageNameplate"><i data-lucide="image"></i><p>Click or drag</p><input type="file" accept="image/*" class="photo-input" /></div>
                        <div class="photo-preview" style="display:none;"><img src="" alt="Nameplate" /><button type="button" class="photo-remove"><i data-lucide="trash-2"></i></button></div></div></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="ghostInspectorName">ชื่อผู้ตรวจ/Inspector Name <span class="required">*</span></label>
                        <input type="text" id="ghostInspectorName" required placeholder="Enter inspector name" /></div>
                    <div class="form-group"><label for="ghostPhone">เบอร์โทร/Phone <span class="required">*</span></label>
                        <input type="tel" id="ghostPhone" required placeholder="e.g. 081-234-5678" /></div>
                </div>
                <div class="form-group"><label for="ghostRemarks">หมายเหตุ/Remarks</label>
                    <textarea id="ghostRemarks" rows="2" placeholder="Notes..."></textarea></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="ghostFormCancel">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Save</button>
                </div>
            </form>
        </div>
    </div>`;
}

function renderGhostViewModal() {
    return `
    <div class="modal-overlay" id="ghostViewOverlay" style="display:none;">
        <div class="modal-container modal-large">
            <div class="modal-header"><h3><i data-lucide="eye"></i> Ghost Item Details</h3><button class="modal-close" id="ghostViewClose"><i data-lucide="x"></i></button></div>
            <div class="modal-body" id="ghostViewBody"></div>
        </div>
    </div>`;
}

// ─── Init ────────────────────────────────────────
export async function initGhost() {
    const user = store.get('user');
    if (!user) return;

    // Load master data if not cached
    if (!(store.get('warehouses') || []).length) {
        const r = await api.call('getMasterData');
        if (r.success) store.update({ warehouses: r.warehouses, contracts: r.contracts, equipment: r.equipment, mb52: r.mb52 });
    }

    // Populate warehouse dropdown (unique by code, filtered by zone)
    const whSelect = document.getElementById('ghostWarehouseSelect');
    const formWhSelect = document.getElementById('ghostWarehouse');
    const allWhs = store.get('warehouses') || [];
    const uniqueWHs = [];
    const seenCodes = new Set();
    (user.zone === 'ALL' ? allWhs : allWhs.filter(w => w.zone === user.zone)).forEach(wh => {
        if (!seenCodes.has(wh.code)) { seenCodes.add(wh.code); uniqueWHs.push(wh); }
    });
    uniqueWHs.forEach(wh => {
        const o = new Option(`${wh.name} | ${wh.code}`, wh.code);
        whSelect.appendChild(o);
        formWhSelect.appendChild(o.cloneNode(true));
    });

    // Pre-select from store
    const sel = store.get('selectedWarehouse');
    if (sel) whSelect.value = sel.code;

    // Search filter for warehouse dropdown
    const searchInput = document.getElementById('ghostWhSearch');
    searchInput?.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        Array.from(whSelect.options).forEach(opt => {
            if (!opt.value) return;
            opt.hidden = q && !opt.textContent.toLowerCase().includes(q);
        });
    });

    // Warehouse change → populate SLoc dropdown
    whSelect.addEventListener('change', () => {
        populateFilterSLocs(whSelect.value);
        loadGhostList();
    });
    document.getElementById('ghostSLocSelect')?.addEventListener('change', () => loadGhostList());

    // Pre-populate SLocs if warehouse selected
    if (sel) populateFilterSLocs(sel.code);

    // Material tabs
    document.querySelectorAll('.ghost-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.ghost-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadGhostList();
        });
    });
    // Default first tab
    const firstTab = document.querySelector('.ghost-tab');
    if (firstTab) firstTab.classList.add('active');

    // Form warehouse change → populate form SLocs
    formWhSelect.addEventListener('change', () => {
        populateFormSLocs(formWhSelect.value);
    });

    // Add button
    document.getElementById('btnAddGhost').addEventListener('click', () => openGhostForm());

    setupGhostFormHandlers();
    setupGhostViewHandlers();
    setupGhostPhotos();

    if (sel) loadGhostList();
}

// ─── SLoc Population ─────────────────────────────
function populateFilterSLocs(whCode) {
    const slocSelect = document.getElementById('ghostSLocSelect');
    slocSelect.innerHTML = '<option value="">All SLoc</option>';
    if (!whCode) return;
    const warehouses = store.get('warehouses') || [];
    const slocs = [...new Set(warehouses.filter(w => w.code === whCode && w.sloc).map(w => w.sloc))];
    slocs.forEach(sl => {
        const o = document.createElement('option');
        o.value = sl;
        const whEntry = warehouses.find(w => w.code === whCode && w.sloc === sl);
        o.textContent = whEntry?.slocName ? `${whEntry.slocName} | ${sl}` : sl;
        slocSelect.appendChild(o);
    });
}

function populateFormSLocs(whCode) {
    const slocSelect = document.getElementById('ghostSLoc');
    slocSelect.innerHTML = '<option value="">-- Select --</option>';
    if (!whCode) return;
    const warehouses = store.get('warehouses') || [];
    const slocs = [...new Set(warehouses.filter(w => w.code === whCode && w.sloc).map(w => w.sloc))];
    slocs.forEach(sl => {
        const o = document.createElement('option');
        o.value = sl;
        const whEntry = warehouses.find(w => w.code === whCode && w.sloc === sl);
        o.textContent = whEntry?.slocName ? `${whEntry.slocName} | ${sl}` : sl;
        slocSelect.appendChild(o);
    });
}

// ─── List ────────────────────────────────────────
async function loadGhostList() {
    const whCode = document.getElementById('ghostWarehouseSelect')?.value;
    const slocVal = document.getElementById('ghostSLocSelect')?.value;
    const activeTab = document.querySelector('.ghost-tab.active');
    const matType = activeTab?.dataset?.type || '';
    const list = document.getElementById('ghostList');
    list.innerHTML = `<div class="loading-placeholder"><div class="spinner-large"></div></div>`;

    const r = await api.call('getGhosts', {
        warehouseCode: whCode || undefined,
        materialType: matType || undefined,
        sloc: slocVal || undefined
    });
    if (!r.success) { list.innerHTML = `<div class="empty-state error"><p>Error loading ghost items</p></div>`; return; }

    const items = r.ghosts || [];
    if (!items.length) {
        list.innerHTML = `<div class="empty-state"><i data-lucide="package-search"></i><p>No ghost items found. Click "Add Ghost Item" to add one.</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const user = store.get('user');
    const isManagerOrAdmin = auth.isManager(user) || auth.isAdmin(user);

    list.innerHTML = `
        <div class="list-summary">
            <span>👻 Ghost Items: <strong>${items.length}</strong></span>
        </div>
        <div class="inspection-cards">${items.map(i => ghostCardHTML(i, isManagerOrAdmin)).join('')}</div>`;

    if (window.lucide) lucide.createIcons();
    list.querySelectorAll('.btn-edit-ghost').forEach(b => b.addEventListener('click', () => openGhostForm(b.dataset.id)));
    list.querySelectorAll('.btn-view-ghost').forEach(b => b.addEventListener('click', () => viewGhost(b.dataset.id)));
    list.querySelectorAll('.btn-approve-ghost').forEach(b => b.addEventListener('click', () => approveGhost(b.dataset.id)));
    list.querySelectorAll('.btn-reject-ghost').forEach(b => b.addEventListener('click', () => rejectGhost(b.dataset.id)));
    list.querySelectorAll('.btn-revert-ghost').forEach(b => b.addEventListener('click', () => revertGhost(b.dataset.id)));
}

function ghostCardHTML(i, isManagerOrAdmin) {
    const sc = i.status === 'Approved' ? 'status-approved' : i.status === 'Inspected' ? 'status-inspected' : i.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    const user = store.get('user');
    const isAdmin = auth.isAdmin(user);
    return `<div class="inspection-card ${sc}" style="border-left:4px solid #f59e0b">
        <div class="insp-card-header">
            <span class="insp-pea-no">${i.peaNo || '-'}</span>
            <span class="insp-status-badge ${sc}">👻 ${i.status}</span>
        </div>
        <div class="insp-card-body">
            <div class="insp-detail"><strong>Serial:</strong> ${i.serialNo || '-'}</div>
            <div class="insp-detail"><strong>Warehouse:</strong> ${i.warehouseCode || '-'}</div>
            <div class="insp-detail"><strong>SLoc:</strong> ${i.sloc || '-'}</div>
            <div class="insp-detail"><strong>Type:</strong> ${i.materialType || '-'}</div>
            <div class="insp-detail"><strong>Brand:</strong> ${i.brand || '-'}</div>
            <div class="insp-detail"><strong>Batch:</strong> ${i.batch === 'N' ? 'New' : 'Refurbished'}</div>
        </div>
        ${i.remarks ? `<div class="insp-remarks"><i data-lucide="message-square"></i> ${i.remarks}</div>` : ''}
        ${i.managerComment ? `<div class="manager-comment"><i data-lucide="user-check"></i> Manager: ${i.managerComment}</div>` : ''}
        <div class="insp-card-footer">
            <span class="insp-timestamp"><i data-lucide="clock"></i> ${i.timestamp}</span>
            <div class="action-btns">
                <button class="btn btn-sm btn-outline btn-view-ghost" data-id="${i.id}" title="View"><i data-lucide="eye"></i></button>
                ${i.status !== 'Approved' ? `<button class="btn btn-sm btn-outline btn-edit-ghost" data-id="${i.id}" title="Edit"><i data-lucide="edit-2"></i></button>` : ''}
                ${isManagerOrAdmin && i.status === 'Inspected' ? `<button class="btn btn-sm btn-success btn-approve-ghost" data-id="${i.id}" title="Approve"><i data-lucide="check"></i> Approve</button>` : ''}
                ${isManagerOrAdmin && i.status === 'Inspected' ? `<button class="btn btn-sm btn-danger btn-reject-ghost" data-id="${i.id}" title="Reject"><i data-lucide="x"></i> Reject</button>` : ''}
                ${isAdmin && i.status === 'Approved' ? `<button class="btn btn-sm btn-warning btn-revert-ghost" data-id="${i.id}" title="Revert"><i data-lucide="undo-2"></i> Revert</button>` : ''}
            </div>
        </div>
    </div>`;
}

// ─── Approve / Reject / Revert Ghost ─────────────
async function approveGhost(id) {
    if (!confirm('Approve this ghost item?')) return;
    const r = await api.call('approveGhost', { id });
    if (r.success) { showToast('Approved!', 'success'); loadGhostList(); } else showToast('Error', 'error');
}

async function rejectGhost(id) {
    const comment = prompt('Enter rejection comment:');
    if (comment === null) return;
    const r = await api.call('rejectGhost', { id, comment: comment || 'Rejected' });
    if (r.success) { showToast('Rejected', 'success'); loadGhostList(); } else showToast('Error', 'error');
}

async function revertGhost(id) {
    const comment = prompt('Enter revert comment:');
    if (comment === null) return;
    const r = await api.call('revertGhost', { id, comment: comment || 'Reverted by admin' });
    if (r.success) { showToast('Reverted to Inspected', 'success'); loadGhostList(); } else showToast('Error', 'error');
}

// ─── View ────────────────────────────────────────
async function viewGhost(id) {
    const r = await api.call('getGhostById', { id });
    if (!r.success || !r.ghost) { showToast('Could not load ghost details', 'error'); return; }
    const i = r.ghost;
    const body = document.getElementById('ghostViewBody');
    body.innerHTML = `
        <div class="view-detail-grid">
            <div class="view-row"><strong>PEA No.</strong><span>${i.peaNo || '-'}</span></div>
            <div class="view-row"><strong>Serial No.</strong><span>${i.serialNo || '-'}</span></div>
            <div class="view-row"><strong>Warehouse</strong><span>${i.warehouseCode || '-'}</span></div>
            <div class="view-row"><strong>SLoc</strong><span>${i.sloc || '-'}</span></div>
            <div class="view-row"><strong>Material Type</strong><span>${i.materialType || '-'}</span></div>
            <div class="view-row"><strong>Contract No.</strong><span>${i.contractNo || '-'}</span></div>
            <div class="view-row"><strong>Batch</strong><span>${i.batch === 'N' ? 'New' : i.batch === 'R' ? 'Refurbished' : (i.batch || '-')}</span></div>
            <div class="view-row"><strong>Brand</strong><span>${i.brand || '-'}</span></div>
            <div class="view-row"><strong>Model</strong><span>${i.model || '-'}</span></div>
            <div class="view-row"><strong>Status</strong><span class="insp-status-badge status-${(i.status || 'pending').toLowerCase()}">${i.status || '-'}</span></div>
            <div class="view-row"><strong>Inspector</strong><span>${i.instructorName || i.inspectorId || '-'}</span></div>
            <div class="view-row"><strong>Phone</strong><span>${i.phone || '-'}</span></div>
            <div class="view-row"><strong>Timestamp</strong><span>${i.timestamp || '-'}</span></div>
            ${i.remarks ? `<div class="view-row full-width"><strong>Remarks</strong><span>${i.remarks}</span></div>` : ''}
            ${i.managerComment ? `<div class="view-row full-width"><strong>Manager Comment</strong><span>${i.managerComment}</span></div>` : ''}
        </div>
        ${(i.imageOverview || i.imageNameplate) ? `<div class="view-photos">
            ${i.imageOverview ? `<div class="view-photo"><label>Overview Photo</label><img src="${i.imageOverview}" alt="Overview" /></div>` : ''}
            ${i.imageNameplate ? `<div class="view-photo"><label>Nameplate Photo</label><img src="${i.imageNameplate}" alt="Nameplate" /></div>` : ''}
        </div>` : ''}`;
    const ov = document.getElementById('ghostViewOverlay');
    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('visible'));
    if (window.lucide) lucide.createIcons();
}

function setupGhostViewHandlers() {
    const ov = document.getElementById('ghostViewOverlay');
    document.getElementById('ghostViewClose')?.addEventListener('click', () => closeModal(ov));
    ov?.addEventListener('click', e => { if (e.target === ov) closeModal(ov); });
}

// ─── Form ────────────────────────────────────────
async function openGhostForm(editId = null) {
    const ov = document.getElementById('ghostFormOverlay');
    const form = document.getElementById('ghostForm');
    form.reset();
    form.dataset.editId = editId || '';
    document.querySelectorAll('#ghostForm .photo-preview').forEach(p => { p.style.display = 'none'; p.querySelector('img').src = ''; });
    document.querySelectorAll('#ghostForm .photo-dropzone').forEach(d => d.style.display = 'flex');

    if (editId) {
        document.getElementById('ghostFormTitle').innerHTML = '<i data-lucide="edit"></i> Edit Ghost Item';
        const r = await api.call('getGhostById', { id: editId });
        if (r.success && r.ghost) {
            const g = r.ghost;
            document.getElementById('ghostWarehouse').value = g.warehouseCode || '';
            populateFormSLocs(g.warehouseCode || '');
            document.getElementById('ghostSLoc').value = g.sloc || '';
            document.getElementById('ghostMaterialTypeField').value = g.materialType || '';
            document.getElementById('ghostBatch').value = g.batch || 'N';
            document.getElementById('ghostPeaNo').value = g.peaNo || '';
            document.getElementById('ghostSerialNo').value = g.serialNo || '';
            document.getElementById('ghostContractNo').value = g.contractNo || '';
            document.getElementById('ghostBrand').value = g.brand || '';
            document.getElementById('ghostModel').value = g.model || '';
            document.getElementById('ghostInspectorName').value = g.instructorName || '';
            document.getElementById('ghostPhone').value = g.phone || '';
            // Merge manager comment if rejected
            let remarks = g.remarks || '';
            if (g.managerComment && g.status === 'Rejected') {
                remarks = remarks ? remarks + '\n[Manager: ' + g.managerComment + ']' : '[Manager: ' + g.managerComment + ']';
            }
            document.getElementById('ghostRemarks').value = remarks;
            if (g.imageOverview) {
                const pv = document.querySelector('#ghostPhotoOverview .photo-preview');
                const img = pv?.querySelector('img');
                if (pv && img) { img.src = g.imageOverview; pv.style.display = 'block'; document.querySelector('#ghostPhotoOverview .photo-dropzone').style.display = 'none'; }
            }
            if (g.imageNameplate) {
                const pv = document.querySelector('#ghostPhotoNameplate .photo-preview');
                const img = pv?.querySelector('img');
                if (pv && img) { img.src = g.imageNameplate; pv.style.display = 'block'; document.querySelector('#ghostPhotoNameplate .photo-dropzone').style.display = 'none'; }
            }
        }
    } else {
        document.getElementById('ghostFormTitle').innerHTML = '<i data-lucide="plus-circle"></i> Add Ghost Item';
        // Pre-fill from filters
        const filterWh = document.getElementById('ghostWarehouseSelect')?.value;
        if (filterWh) {
            document.getElementById('ghostWarehouse').value = filterWh;
            populateFormSLocs(filterWh);
        }
    }

    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('visible'));
    if (window.lucide) lucide.createIcons();
}

function setupGhostFormHandlers() {
    const ov = document.getElementById('ghostFormOverlay');
    document.getElementById('ghostFormClose')?.addEventListener('click', () => closeModal(ov));
    document.getElementById('ghostFormCancel')?.addEventListener('click', () => closeModal(ov));
    ov?.addEventListener('click', e => { if (e.target === ov) closeModal(ov); });

    document.getElementById('ghostForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = store.get('user');
        const editId = e.target.dataset.editId;

        // Validate required photos
        const ovImg = document.querySelector('#ghostPhotoOverview .photo-preview img')?.src;
        const npImg = document.querySelector('#ghostPhotoNameplate .photo-preview img')?.src;
        const hasOverview = ovImg && ovImg !== '' && ovImg !== window.location.href;
        const hasNameplate = npImg && npImg !== '' && npImg !== window.location.href;
        if (!hasOverview) { showToast('Overview Photo is required', 'error'); return; }
        if (!hasNameplate) { showToast('Nameplate Photo is required', 'error'); return; }

        const data = {
            inspectorId: user?.username || '',
            warehouseCode: document.getElementById('ghostWarehouse').value,
            sloc: String(document.getElementById('ghostSLoc').value),
            materialType: document.getElementById('ghostMaterialTypeField').value,
            batch: document.getElementById('ghostBatch').value,
            peaNo: document.getElementById('ghostPeaNo').value.trim(),
            serialNo: String(document.getElementById('ghostSerialNo').value.trim()),
            contractNo: document.getElementById('ghostContractNo').value.trim(),
            brand: document.getElementById('ghostBrand').value.trim(),
            model: document.getElementById('ghostModel').value.trim(),
            instructorName: document.getElementById('ghostInspectorName').value.trim(),
            phone: String(document.getElementById('ghostPhone').value.trim()),
            remarks: document.getElementById('ghostRemarks').value.trim()
        };

        const hasNewOverview = ovImg && ovImg.startsWith('data:');
        const hasNewNameplate = npImg && npImg.startsWith('data:');
        const hasImages = hasNewOverview || hasNewNameplate;

        const saveBtn = e.target.querySelector('[type="submit"]');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<div class="spinner"></div> Saving...';

        try {
            const r = editId
                ? await api.call('updateGhost', { id: editId, updates: data })
                : await api.call('submitGhost', data);

            if (!r.success) { showToast('Save failed: ' + (r.message || 'Unknown'), 'error'); saveBtn.disabled = false; saveBtn.innerHTML = '<i data-lucide="save"></i> Save'; return; }

            // Upload images
            if (hasImages) {
                let ghostId = editId || r.id;
                if (!ghostId) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        const listR = await api.call('getGhosts', { warehouseCode: data.warehouseCode });
                        if (listR.success && listR.ghosts?.length) {
                            const match = listR.ghosts.reverse().find(g => g.serialNo === data.serialNo && g.peaNo === data.peaNo);
                            if (match) ghostId = match.id;
                        }
                    } catch (err) { console.warn('Ghost ID resolve error:', err); }
                }
                if (ghostId) {
                    const imgPayload = { id: ghostId, plant: data.warehouseCode, sloc: data.sloc, isEdit: !!editId };
                    if (hasNewOverview) imgPayload.imageOverview = ovImg;
                    if (hasNewNameplate) imgPayload.imageNameplate = npImg;
                    await api.call('uploadGhostImages', imgPayload);
                } else {
                    showToast('Photos skipped — could not resolve ID', 'warning');
                }
            }

            showToast('Saved!', 'success');
            closeModal(ov);
            loadGhostList();
        } catch (err) {
            console.error('Ghost save error:', err);
            showToast('Save failed: ' + (err.message || 'Unknown'), 'error');
        }
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="save"></i> Save';
        if (window.lucide) lucide.createIcons();
    });
}

// ─── Photo helpers ───────────────────────────────
function setupGhostPhotos() {
    setupGhostPhoto('ghostPhotoOverview');
    setupGhostPhoto('ghostPhotoNameplate');
}

function setupGhostPhoto(id) {
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
                while (dataUrl.length > 400 * 1024 && quality > 0.3) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                img.src = dataUrl; pv.style.display = 'block'; dz.style.display = 'none';
            };
            tempImg.src = e.target.result;
        };
        reader.readAsDataURL(f);
    }
}

// ─── Helpers ─────────────────────────────────────
function closeModal(ov) { ov.classList.remove('visible'); setTimeout(() => ov.style.display = 'none', 300); }

function showToast(msg, type = 'info') {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = `toast toast-${type}`;
    t.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'alert-circle'}"></i><span>${msg}</span>`;
    document.body.appendChild(t); if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3000);
}
