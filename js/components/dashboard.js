// ============================================================
// PEA-AIMS Dashboard — Deduplicated Warehouses + Search
// ============================================================

import { store } from '../store.js';
import { dataCache } from '../services/data-cache.js';
import { CONFIG } from '../config.js';

export function renderDashboard() {
    return `
    <div class="dashboard-page" id="dashboardPage">
        <div class="page-header">
            <h2 class="page-title"><i data-lucide="layout-dashboard"></i> Dashboard</h2>
            <p class="page-subtitle" id="dashboardZoneLabel">Loading...</p>
        </div>
        <div class="stats-row" id="statsRow">
            <div class="stat-card stat-total"><div class="stat-icon"><i data-lucide="package"></i></div><div class="stat-content"><span class="stat-value" id="statTotal">--</span><span class="stat-label">Total Stock</span></div></div>
            <div class="stat-card stat-inspected"><div class="stat-icon"><i data-lucide="clipboard-check"></i></div><div class="stat-content"><span class="stat-value" id="statInspected">--</span><span class="stat-label">Inspected</span></div></div>
            <div class="stat-card stat-approved"><div class="stat-icon"><i data-lucide="check-circle"></i></div><div class="stat-content"><span class="stat-value" id="statApproved">--</span><span class="stat-label">Approved</span></div></div>
            <div class="stat-card stat-progress"><div class="stat-icon"><i data-lucide="trending-up"></i></div><div class="stat-content"><span class="stat-value" id="statProgress">--%</span><span class="stat-label">Progress</span></div><div class="stat-progress-ring" id="statProgressRing"></div></div>
        </div>
        <div class="section-header">
            <h3><i data-lucide="warehouse"></i> Warehouse Overview</h3>
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" id="whSearchInput" placeholder="Search warehouse..." class="search-input" />
            </div>
        </div>
        <div class="warehouse-grid" id="warehouseGrid">
            <div class="loading-placeholder"><div class="spinner-large"></div><p>Loading warehouse data...</p></div>
        </div>
        <!-- Ghost Items Section -->
        <div class="section-header" style="margin-top:2rem;">
            <h3><i data-lucide="package-search"></i> Ghost Items (Not in SAP)</h3>
        </div>
        <div class="stats-row stats-row-ghost" id="ghostStatsRow">
            <div class="stat-card stat-ghost-total"><div class="stat-icon"><i data-lucide="package-search"></i></div><div class="stat-content"><span class="stat-value" id="statGhostTotal">--</span><span class="stat-label">Total Ghost</span></div></div>
            <div class="stat-card stat-ghost-inspected"><div class="stat-icon"><i data-lucide="clipboard-check"></i></div><div class="stat-content"><span class="stat-value" id="statGhostInspected">--</span><span class="stat-label">Inspected</span></div></div>
            <div class="stat-card stat-ghost-approved"><div class="stat-icon"><i data-lucide="check-circle"></i></div><div class="stat-content"><span class="stat-value" id="statGhostApproved">--</span><span class="stat-label">Approved</span></div></div>
        </div>
        <div class="warehouse-grid" id="ghostWarehouseGrid">
            <div class="loading-placeholder"><div class="spinner-large"></div><p>Loading ghost data...</p></div>
        </div>
    </div>
    `;
}

let _warehouseStats = [];

export async function initDashboard() {
    const user = store.get('user');
    if (!user) return;
    const zoneLabel = document.getElementById('dashboardZoneLabel');
    if (zoneLabel) zoneLabel.textContent = user.zone === 'ALL' ? 'All Zones Overview' : `Zone ${user.zone} Overview`;

    // Compute stats from local cache (instant, no API call)
    try {
        const result = dataCache.getDashboardStats(user.zone);
        if (result.success) {
            updateStats(result);
            _warehouseStats = result.warehouseStats;
            renderWarehouseCards(_warehouseStats);
        }
    } catch (err) {
        console.error('Dashboard stats error:', err);
    }

    // Ghost stats from local cache (instant)
    try {
        const gResult = dataCache.getGhostStats(user.zone);
        if (gResult.success) {
            animateCounter('statGhostTotal', gResult.total);
            animateCounter('statGhostInspected', gResult.inspected);
            animateCounter('statGhostApproved', gResult.approved);
            renderGhostWarehouseCards(gResult.warehouseStats || []);
        }
    } catch (err) {
        console.error('Ghost stats error:', err);
        const ghostGrid = document.getElementById('ghostWarehouseGrid');
        if (ghostGrid) ghostGrid.innerHTML = `<div class="empty-state"><p>No ghost items yet</p></div>`;
    }

    // Search handler
    document.getElementById('whSearchInput')?.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) { renderWarehouseCards(_warehouseStats); return; }
        const filtered = _warehouseStats.filter(wh => wh.name.toLowerCase().includes(q) || wh.code.toLowerCase().includes(q));
        renderWarehouseCards(filtered);
    });
}

function updateStats({ totalStock, inspected, approved, progress }) {
    animateCounter('statTotal', totalStock);
    animateCounter('statInspected', inspected);
    animateCounter('statApproved', approved);
    const progressEl = document.getElementById('statProgress');
    if (progressEl) progressEl.textContent = `${progress}%`;
    const ring = document.getElementById('statProgressRing');
    if (ring) {
        ring.innerHTML = `<svg viewBox="0 0 44 44" class="progress-ring-svg"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/><circle cx="22" cy="22" r="18" fill="none" stroke="#FFD700" stroke-width="4" stroke-dasharray="${2 * Math.PI * 18}" stroke-dashoffset="${2 * Math.PI * 18 * (1 - progress / 100)}" stroke-linecap="round" transform="rotate(-90 22 22)" class="progress-ring-circle"/></svg>`;
    }
}

function animateCounter(elId, target) {
    const el = document.getElementById(elId);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current.toLocaleString();
    }, 30);
}

function renderWarehouseCards(warehouseStats) {
    const grid = document.getElementById('warehouseGrid');
    if (!grid || !warehouseStats) return;

    if (warehouseStats.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No warehouses found.</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    grid.innerHTML = warehouseStats.map(wh => `
        <div class="warehouse-card" data-wh-code="${wh.code}">
            <div class="wh-card-header">
                <div class="wh-card-title">
                    <i data-lucide="warehouse"></i>
                    <div>
                        <h4>${wh.name}</h4>
                        <span class="wh-code-badge">${wh.code}</span>
                        ${wh.slocs && wh.slocs.length > 1 ? `<span class="wh-sloc-count">${wh.slocs.length} SLoc</span>` : ''}
                    </div>
                </div>
                <div class="wh-progress-badge ${getProgressClass(wh.progress)}">${wh.progress}%</div>
            </div>
            <div class="wh-card-body">
                ${wh.types.map(t => `
                    <div class="wh-type-row">
                        <div class="wh-type-info">
                            <span class="wh-type-icon">${getTypeIcon(t.type)}</span>
                            <span class="wh-type-name">${t.type}</span>
                        </div>
                        <div class="wh-type-stats">
                            <span class="wh-type-count">${t.done}/${t.stock}</span>
                            <div class="progress-bar-mini"><div class="progress-bar-fill ${getProgressClass(t.progress)}" style="width: ${t.progress}%"></div></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="wh-card-footer">
                <span class="wh-total">${wh.inspected}/${wh.totalStock} items</span>
                <button class="btn btn-sm btn-outline wh-inspect-btn" data-wh-code="${wh.code}" data-wh-name="${wh.name}">
                    <i data-lucide="arrow-right"></i> View
                </button>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();

    // Click → go to SLoc view (not directly to inspector)
    grid.querySelectorAll('.wh-inspect-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.dataset.whCode;
            const name = btn.dataset.whName;
            store.update({ selectedWarehouse: { code, name }, currentView: 'sloc' });
        });
    });
}

function getProgressClass(p) { return p >= 80 ? 'progress-high' : p >= 40 ? 'progress-mid' : 'progress-low'; }
function getTypeIcon(type) {
    switch (type) {
        case 'Recloser': return '⚡';
        case 'Control Cabinet': return '🔧';
        case 'PT': return '🔌';
        default: return '📦';
    }
}

function renderGhostWarehouseCards(whStats) {
    const grid = document.getElementById('ghostWarehouseGrid');
    if (!grid) return;
    if (!whStats || !whStats.length) {
        grid.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No ghost items yet.</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    grid.innerHTML = whStats.map(wh => `
        <div class="warehouse-card ghost-wh-card" data-wh-code="${wh.code}">
            <div class="wh-card-header">
                <div class="wh-card-title">
                    <i data-lucide="warehouse"></i>
                    <div>
                        <h4>${wh.name}</h4>
                        <span class="wh-code-badge">${wh.code}</span>
                    </div>
                </div>
                <div class="wh-progress-badge ghost-badge">👻 ${wh.total}</div>
            </div>
            <div class="wh-card-body">
                <div class="wh-type-row">
                    <div class="wh-type-info"><span class="wh-type-name">Inspected</span></div>
                    <span class="wh-type-count">${wh.inspected}</span>
                </div>
                <div class="wh-type-row">
                    <div class="wh-type-info"><span class="wh-type-name">Approved</span></div>
                    <span class="wh-type-count">${wh.approved}</span>
                </div>
            </div>
            <div class="wh-card-footer">
                <span class="wh-total">${wh.total} ghost items</span>
                <button class="btn btn-sm btn-outline ghost-view-btn" data-wh-code="${wh.code}" data-wh-name="${wh.name}">
                    <i data-lucide="arrow-right"></i> View
                </button>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
    grid.querySelectorAll('.ghost-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            store.update({ selectedWarehouse: { code: btn.dataset.whCode, name: btn.dataset.whName }, currentView: 'ghost' });
        });
    });
}
