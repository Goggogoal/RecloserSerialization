// ============================================================
// PEA-AIMS Manager Review Component — v2 (confirm, view)
// ============================================================
import { store } from '../store.js';
import { api } from '../services/api.js';
import { CONFIG } from '../config.js';

export function renderManager() {
    return `
    <div class="manager-page" id="managerPage">
        <div class="page-header">
            <h2 class="page-title"><i data-lucide="check-circle"></i> Review Inspections</h2>
            <p class="page-subtitle">Approve, edit, or reject inspection records</p>
        </div>
        <div class="filters-bar">
            <div class="filter-group">
                <label><i data-lucide="warehouse"></i> Warehouse</label>
                <select id="mgrWarehouseSelect" class="filter-select"><option value="">All Warehouses</option></select>
            </div>
            <div class="filter-group">
                <label><i data-lucide="filter"></i> Status</label>
                <select id="mgrStatusFilter" class="filter-select">
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Inspected" selected>Inspected</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>
        </div>
        <div class="review-list" id="reviewList">
            <div class="loading-placeholder"><div class="spinner-large"></div><p>Loading...</p></div>
        </div>
        <!-- Comment Modal -->
        <div class="modal-overlay" id="commentOverlay" style="display:none;">
            <div class="modal-container modal-small">
                <div class="modal-header"><h3 id="commentTitle">Add Comment</h3><button class="modal-close" id="commentClose"><i data-lucide="x"></i></button></div>
                <div class="modal-body">
                    <div class="form-group"><label for="mgrComment">Comment</label><textarea id="mgrComment" rows="3" placeholder="Enter comment..."></textarea></div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" id="commentCancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="commentSubmitBtn"><i data-lucide="send"></i> Submit</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- View Modal -->
        <div class="modal-overlay" id="viewOverlay" style="display:none;">
            <div class="modal-container modal-large">
                <div class="modal-header"><h3><i data-lucide="eye"></i> Inspection Details</h3><button class="modal-close" id="viewClose"><i data-lucide="x"></i></button></div>
                <div class="modal-body" id="viewBody"></div>
            </div>
        </div>
    </div>`;
}

export async function initManager() {
    const user = store.get('user');
    if (!user) return;
    if (!(store.get('warehouses') || []).length) {
        const r = await api.call('getMasterData');
        if (r.success) store.update({ warehouses: r.warehouses, contracts: r.contracts, equipment: r.equipment, mb52: r.mb52 });
    }
    const sel = document.getElementById('mgrWarehouseSelect');
    const whs = store.get('warehouses') || [];
    const seen = new Set();
    (user.zone === 'ALL' ? whs : whs.filter(w => w.zone === user.zone)).forEach(wh => {
        if (seen.has(wh.code)) return;
        seen.add(wh.code);
        const o = document.createElement('option'); o.value = wh.code; o.textContent = `${wh.name} (${wh.code})`; sel.appendChild(o);
    });
    const presel = store.get('selectedWarehouse');
    if (presel) sel.value = presel.code;
    sel.addEventListener('change', loadReviews);
    document.getElementById('mgrStatusFilter').addEventListener('change', loadReviews);
    setupCommentModal();
    setupViewModal();
    loadReviews();
}

async function loadReviews() {
    const user = store.get('user');
    const whCode = document.getElementById('mgrWarehouseSelect')?.value;
    const status = document.getElementById('mgrStatusFilter')?.value;
    const list = document.getElementById('reviewList');
    list.innerHTML = `<div class="loading-placeholder"><div class="spinner-large"></div></div>`;
    const r = await api.call('getInspections', { warehouseCode: whCode || undefined, zone: user.zone, status: status || undefined });
    if (!r.success) { list.innerHTML = `<div class="empty-state error"><p>Error loading</p></div>`; return; }
    const items = r.inspections;
    if (!items.length) { list.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No items found</p></div>`; if (window.lucide) lucide.createIcons(); return; }
    list.innerHTML = `<div class="review-count">${items.length} inspection(s)</div><div class="review-cards">${items.map(reviewCard).join('')}</div>`;
    if (window.lucide) lucide.createIcons();
    list.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', () => approveItem(b.dataset.id)));
    list.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', () => rejectItem(b.dataset.id)));
    list.querySelectorAll('.btn-comment').forEach(b => b.addEventListener('click', () => openComment(b.dataset.id)));
    list.querySelectorAll('.btn-view-detail').forEach(b => b.addEventListener('click', () => viewItem(b.dataset.id)));
}

function reviewCard(i) {
    const sc = i.status === 'Approved' ? 'status-approved' : i.status === 'Inspected' ? 'status-inspected' : i.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    return `<div class="review-card ${sc}">
        <div class="review-card-header">
            <div><span class="insp-pea-no">${i.peaNo}</span><span class="insp-status-badge ${sc}">${i.status}</span></div>
            <span class="review-wh">${i.warehouseCode} • ${i.materialType}</span>
        </div>
        <div class="review-card-body">
            <div class="review-grid">
                <div><strong>Serial:</strong> ${i.serialNo}</div>
                <div><strong>เลขที่สัญญา/Contract:</strong> ${i.contractNo || '-'}</div>
                <div><strong>ยี่ห้อ/Brand:</strong> ${i.brand || '-'}</div>
                <div><strong>รุ่น/Model:</strong> ${i.model || '-'}</div>
                <div><strong>Batch:</strong> ${i.batch === 'N' ? 'New' : 'Refurbished'}</div>
                <div><strong>Inspector:</strong> ${i.inspectorId}</div>
            </div>
            ${i.remarks ? `<div class="insp-remarks"><i data-lucide="message-square"></i> ${i.remarks}</div>` : ''}
            ${i.managerComment ? `<div class="manager-comment"><i data-lucide="user-check"></i> Manager: ${i.managerComment}</div>` : ''}
        </div>
        <div class="review-card-actions">
            <span class="insp-timestamp"><i data-lucide="clock"></i> ${i.timestamp}</span>
            <div class="action-btns">
                <button class="btn btn-sm btn-outline btn-view-detail" data-id="${i.id}" title="View Details"><i data-lucide="eye"></i></button>
                ${i.status !== 'Approved' ? `<button class="btn btn-sm btn-success btn-approve" data-id="${i.id}" title="Approve"><i data-lucide="check"></i> Approve</button>` : ''}
                ${i.status !== 'Rejected' && i.status !== 'Approved' ? `<button class="btn btn-sm btn-danger btn-reject" data-id="${i.id}" title="Reject"><i data-lucide="x"></i> Reject</button>` : ''}
                <button class="btn btn-sm btn-outline btn-comment" data-id="${i.id}" title="Comment"><i data-lucide="message-circle"></i></button>
            </div>
        </div>
    </div>`;
}

async function approveItem(id) {
    if (!confirm('Are you sure you want to approve this inspection?')) return;
    const r = await api.call('approveInspection', { id });
    if (r.success) { showToast('Approved!', 'success'); loadReviews(); } else showToast('Error', 'error');
}

async function rejectItem(id) {
    openComment(id, true);
}

async function viewItem(id) {
    const r = await api.call('getInspectionById', { id });
    if (!r.success || !r.inspection) { showToast('Could not load details', 'error'); return; }
    const i = r.inspection;
    const body = document.getElementById('viewBody');
    body.innerHTML = `
        <div class="view-detail-grid">
            <div class="view-row"><strong>PEA No.</strong><span>${i.peaNo || '-'}</span></div>
            <div class="view-row"><strong>Serial No.</strong><span>${i.serialNo || '-'}</span></div>
            <div class="view-row"><strong>Warehouse</strong><span>${i.warehouseCode || '-'}</span></div>
            <div class="view-row"><strong>SLoc</strong><span>${i.sloc || '-'}</span></div>
            <div class="view-row"><strong>ประเภทพัสดุ/Material Type</strong><span>${i.materialType || '-'}</span></div>
            <div class="view-row"><strong>เลขที่สัญญา/Contract No.</strong><span>${i.contractNo || '-'}</span></div>
            <div class="view-row"><strong>Batch</strong><span>${i.batch === 'N' ? 'New' : i.batch === 'R' ? 'Refurbished' : (i.batch || '-')}</span></div>
            <div class="view-row"><strong>ยี่ห้อ/Brand</strong><span>${i.brand || '-'}</span></div>
            <div class="view-row"><strong>รุ่น/Model</strong><span>${i.model || '-'}</span></div>
            <div class="view-row"><strong>สถานะ/Status</strong><span class="insp-status-badge status-${(i.status || 'pending').toLowerCase()}">${i.status || '-'}</span></div>
            <div class="view-row"><strong>Inspector</strong><span>${i.inspectorId || '-'}</span></div>
            <div class="view-row"><strong>Timestamp</strong><span>${i.timestamp || '-'}</span></div>
            ${i.remarks ? `<div class="view-row full-width"><strong>หมายเหตุ/Remarks</strong><span>${i.remarks}</span></div>` : ''}
            ${i.managerComment ? `<div class="view-row full-width"><strong>Manager Comment</strong><span>${i.managerComment}</span></div>` : ''}
        </div>
        ${(i.imageOverview || i.imageNameplate) ? `<div class="view-photos">
            ${i.imageOverview ? `<div class="view-photo"><label>รูปถ่ายทั้งตัว/Overview Photo</label><img src="${i.imageOverview}" alt="Overview" /></div>` : ''}
            ${i.imageNameplate ? `<div class="view-photo"><label>รูปถ่าย PEA No./แผ่นป้าย/Nameplate Photo</label><img src="${i.imageNameplate}" alt="Nameplate" /></div>` : ''}
        </div>` : ''}`;
    const ov = document.getElementById('viewOverlay');
    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('visible'));
    if (window.lucide) lucide.createIcons();
}

function setupViewModal() {
    const ov = document.getElementById('viewOverlay');
    document.getElementById('viewClose')?.addEventListener('click', () => closeModal(ov));
    ov?.addEventListener('click', e => { if (e.target === ov) closeModal(ov); });
}

let _commentId = null, _isReject = false;
function openComment(id, reject = false) {
    _commentId = id; _isReject = reject;
    const ov = document.getElementById('commentOverlay');
    document.getElementById('commentTitle').textContent = reject ? 'Reject — Add Comment' : 'Add Comment';
    document.getElementById('mgrComment').value = '';
    ov.style.display = 'flex'; requestAnimationFrame(() => ov.classList.add('visible'));
    if (window.lucide) lucide.createIcons();
}

function closeModal(ov) { ov.classList.remove('visible'); setTimeout(() => ov.style.display = 'none', 300); }

function setupCommentModal() {
    const ov = document.getElementById('commentOverlay');
    document.getElementById('commentClose')?.addEventListener('click', () => closeModal(ov));
    document.getElementById('commentCancelBtn')?.addEventListener('click', () => closeModal(ov));
    ov?.addEventListener('click', e => { if (e.target === ov) closeModal(ov); });
    document.getElementById('commentSubmitBtn')?.addEventListener('click', async () => {
        const comment = document.getElementById('mgrComment').value.trim();
        if (_isReject && !confirm('Are you sure you want to reject this inspection?')) return;
        let r;
        if (_isReject) { r = await api.call('rejectInspection', { id: _commentId, comment: comment || 'Rejected' }); }
        else { r = await api.call('updateInspection', { id: _commentId, updates: { managerComment: comment } }); }
        if (r.success) { closeModal(ov); showToast(_isReject ? 'Rejected' : 'Comment saved', 'success'); loadReviews(); }
        else showToast('Error', 'error');
    });
}

function showToast(msg, type = 'info') {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = `toast toast-${type}`;
    t.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i><span>${msg}</span>`;
    document.body.appendChild(t); if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3000);
}
