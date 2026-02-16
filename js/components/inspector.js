// ============================================================
// PEA-AIMS Inspector Component v2 — Search, SLoc stock, Edit prefill
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
        <button class="fab" id="fabAddItem" style="display:none;" title="Add New Item"><i data-lucide="plus"></i></button>
        ${renderFormModal()}
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
                    <div class="form-group"><label for="inspContractNo">Contract No.</label><input type="text" id="inspContractNo" placeholder="Auto-filled or manual" /></div>
                    <div class="form-group"><label for="inspBatch">Batch <span class="required">*</span></label>
                        <select id="inspBatch" required><option value="N">N - New</option><option value="R">R - Refurbished</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label for="inspBrand">Brand</label><input type="text" id="inspBrand" placeholder="Auto-filled or manual" /></div>
                    <div class="form-group"><label for="inspModel">Model</label><input type="text" id="inspModel" placeholder="Enter model" /></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Overview Photo</label>
                        <div class="photo-upload" id="photoOverview"><div class="photo-dropzone" data-field="imageOverview"><i data-lucide="camera"></i><p>Click or drag</p><input type="file" accept="image/*" capture="environment" class="photo-input" /></div>
                        <div class="photo-preview" style="display:none;"><img src="" alt="Overview" /><button type="button" class="photo-remove"><i data-lucide="trash-2"></i></button></div></div></div>
                    <div class="form-group"><label>Nameplate Photo</label>
                        <div class="photo-upload" id="photoNameplate"><div class="photo-dropzone" data-field="imageNameplate"><i data-lucide="image"></i><p>Click or drag</p><input type="file" accept="image/*" capture="environment" class="photo-input" /></div>
                        <div class="photo-preview" style="display:none;"><img src="" alt="Nameplate" /><button type="button" class="photo-remove"><i data-lucide="trash-2"></i></button></div></div></div>
                </div>
                <div class="form-group"><label for="inspRemarks">Remarks</label><textarea id="inspRemarks" rows="2" placeholder="Notes..."></textarea></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="inspFormCancel">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Save</button>
                </div>
            </form>
        </div>
    </div>`;
}

export async function initInspector() {
    const user = store.get('user');
    if (!user) return;

    // Load master data if needed
    if (!(store.get('warehouses') || []).length) {
        const r = await api.call('getMasterData');
        if (r.success) store.update({ warehouses: r.warehouses, contracts: r.contracts, equipment: r.equipment, mb52: r.mb52 });
    }

    // Back button
    document.getElementById('inspBackBtn')?.addEventListener('click', () => {
        const selWh = store.get('selectedWarehouse');
        store.set('currentView', selWh ? 'sloc' : 'dashboard');
    });

    // Populate warehouse dropdown (unique by code) — show "Warehouse Name | Warehouse Code"
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
            if (!opt.value) return; // keep placeholder
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
        // Pre-select SLoc from store
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

    document.getElementById('fabAddItem')?.addEventListener('click', () => openForm());
    setupFormHandlers();

    if (sel) loadList();
}

function populateSLocs(whCode) {
    const slocSelect = document.getElementById('inspSLocSelect');
    slocSelect.innerHTML = '<option value="">All SLoc</option>';
    if (!whCode) return;
    const allWhs = store.get('warehouses') || [];
    const slocs = [...new Set(allWhs.filter(w => w.code === whCode).map(w => w.sloc))];
    slocs.forEach(sl => {
        const o = document.createElement('option');
        o.value = sl;
        o.textContent = sl;
        slocSelect.appendChild(o);
    });
    // Pre-select if stored
    const preSloc = store.get('selectedSLoc');
    if (preSloc && slocs.includes(preSloc)) slocSelect.value = preSloc;
}

async function loadList() {
    const whCode = document.getElementById('inspWarehouseSelect')?.value;
    const sloc = document.getElementById('inspSLocSelect')?.value;
    const matType = store.get('selectedMaterialType');
    const list = document.getElementById('inspectionList');
    const fab = document.getElementById('fabAddItem');

    if (!whCode || !matType) {
        list.innerHTML = `<div class="empty-state"><i data-lucide="search"></i><p>Select warehouse and type</p></div>`;
        if (window.lucide) lucide.createIcons();
        fab.style.display = 'none';
        return;
    }
    fab.style.display = 'flex';
    list.innerHTML = `<div class="loading-placeholder"><div class="spinner-large"></div></div>`;

    const result = await api.call('getInspections', { warehouseCode: whCode, sloc: sloc || undefined, materialType: matType });
    if (!result.success) { list.innerHTML = `<div class="empty-state error"><p>Failed to load</p></div>`; return; }

    const items = result.inspections;
    const mb52 = store.get('mb52') || [];

    // Stock — filter by warehouse + sloc + materialType
    let stockItems = mb52.filter(m => m.whCode === whCode && m.materialType === matType);
    if (sloc) stockItems = stockItems.filter(m => m.sloc === sloc);
    const stock = stockItems.reduce((s, m) => s + m.qty, 0);
    const pct = stock > 0 ? Math.round(items.length / stock * 100) : 0;

    // SLoc label for display
    const slocLabel = sloc ? ` / ${sloc}` : '';

    list.innerHTML = `
        <div class="list-summary">
            <span><i data-lucide="warehouse"></i> ${whCode}${slocLabel}</span>
            <span><i data-lucide="package"></i> Stock: ${stock}</span>
            <span><i data-lucide="check"></i> Done: ${items.length}</span>
            <span><i data-lucide="trending-up"></i> ${pct}%</span>
        </div>
        ${items.length ? `<div class="inspection-cards">${items.map(i => cardHTML(i)).join('')}</div>` : `<div class="empty-state"><i data-lucide="clipboard"></i><p>No inspections yet</p></div>`}`;
    if (window.lucide) lucide.createIcons();
    list.querySelectorAll('.btn-edit-inspection').forEach(b => b.addEventListener('click', () => openForm(b.dataset.id)));
}

function cardHTML(i) {
    const sc = i.status === 'Approved' ? 'status-approved' : i.status === 'Inspected' ? 'status-inspected' : i.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    return `<div class="inspection-card ${sc}"><div class="insp-card-header"><span class="insp-pea-no">${i.peaNo}</span><span class="insp-status-badge ${sc}">${i.status}</span></div>
    <div class="insp-card-body"><div class="insp-detail"><strong>Serial:</strong> ${i.serialNo}</div><div class="insp-detail"><strong>Contract:</strong> ${i.contractNo || '-'}</div><div class="insp-detail"><strong>Brand:</strong> ${i.brand || '-'}</div><div class="insp-detail"><strong>Batch:</strong> ${i.batch === 'N' ? 'New' : 'Refurb'}</div></div>
    ${i.remarks ? `<div class="insp-remarks"><i data-lucide="message-square"></i> ${i.remarks}</div>` : ''}
    <div class="insp-card-footer"><span class="insp-timestamp"><i data-lucide="clock"></i> ${i.timestamp}</span>${i.status !== 'Approved' ? `<button class="btn btn-sm btn-outline btn-edit-inspection" data-id="${i.id}"><i data-lucide="edit-2"></i></button>` : ''}</div></div>`;
}

async function openForm(editId = null) {
    const ov = document.getElementById('inspFormOverlay'), form = document.getElementById('inspForm');
    form.reset();
    form.dataset.editId = editId || '';
    document.querySelectorAll('.photo-preview').forEach(p => { p.style.display = 'none'; p.querySelector('img').src = ''; });
    document.querySelectorAll('.photo-dropzone').forEach(d => d.style.display = 'flex');
    document.getElementById('autoFillIndicator').style.display = 'none';

    // ★ Edit mode: prefill ALL fields with existing data
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
            // Photos
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

function closeForm() { const ov = document.getElementById('inspFormOverlay'); ov.classList.remove('visible'); setTimeout(() => ov.style.display = 'none', 300); }

function setupFormHandlers() {
    document.getElementById('inspFormClose')?.addEventListener('click', closeForm);
    document.getElementById('inspFormCancel')?.addEventListener('click', closeForm);
    document.getElementById('inspFormOverlay')?.addEventListener('click', e => { if (e.target.id === 'inspFormOverlay') closeForm(); });

    // Auto-fill
    const peaIn = document.getElementById('inspPeaNo');
    if (peaIn) { let t; peaIn.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => autoFill(peaIn.value.trim()), 500); }); }

    // Photos
    ['photoOverview', 'photoNameplate'].forEach(setupPhoto);

    // Submit
    document.getElementById('inspForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        const whCode = document.getElementById('inspWarehouseSelect')?.value;
        const sloc = document.getElementById('inspSLocSelect')?.value;
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
            remarks: document.getElementById('inspRemarks').value.trim(),
            imageOverview: document.querySelector('#photoOverview .photo-preview img')?.src || '',
            imageNameplate: document.querySelector('#photoNameplate .photo-preview img')?.src || ''
        };
        const editId = document.getElementById('inspForm')?.dataset.editId;
        const r = editId
            ? await api.call('updateInspection', { id: editId, updates: data })
            : await api.call('submitInspection', data);
        if (r.success) { closeForm(); showToast('Saved!', 'success'); loadList(); }
        else showToast(r.message || 'Error', 'error');
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
    dz.addEventListener('click', () => inp.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer.files.length) readImg(e.dataTransfer.files[0]); });
    inp.addEventListener('change', () => { if (inp.files.length) readImg(inp.files[0]); });
    rm?.addEventListener('click', () => { img.src = ''; pv.style.display = 'none'; dz.style.display = 'flex'; inp.value = ''; });
    function readImg(f) { if (!f.type.startsWith('image/')) return; const r = new FileReader(); r.onload = e => { img.src = e.target.result; pv.style.display = 'block'; dz.style.display = 'none'; }; r.readAsDataURL(f); }
}

function showToast(msg, type = 'info') {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = `toast toast-${type}`;
    t.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i><span>${msg}</span>`;
    document.body.appendChild(t); if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3000);
}
