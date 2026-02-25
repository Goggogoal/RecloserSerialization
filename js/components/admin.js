// ============================================================
// PEA-AIMS Admin Component
// ============================================================
import { store } from '../store.js';
import { dataCache } from '../services/data-cache.js';
import { CONFIG } from '../config.js';

export function renderAdmin() {
    return `
    <div class="admin-page" id="adminPage">
        <div class="page-header">
            <h2 class="page-title"><i data-lucide="settings"></i> Admin Panel</h2>
            <p class="page-subtitle">System-wide overview and management</p>
        </div>
        <div class="admin-grid">
            <!-- Quick Links -->
            <div class="admin-card">
                <h3 class="admin-card-title"><i data-lucide="external-link"></i> Master Data (Google Sheets)</h3>
                <p class="admin-card-desc">Click to open and edit master data directly in Google Sheets</p>
                <div class="admin-links">
                    <a href="#" class="admin-link" target="_blank"><i data-lucide="table"></i> MB52 (Stock Data)</a>
                    <a href="#" class="admin-link" target="_blank"><i data-lucide="users"></i> Username (Auth)</a>
                    <a href="#" class="admin-link" target="_blank"><i data-lucide="warehouse"></i> Warehouse</a>
                    <a href="#" class="admin-link" target="_blank"><i data-lucide="file-text"></i> Contract</a>
                    <a href="#" class="admin-link" target="_blank"><i data-lucide="cpu"></i> Equipment</a>
                    <a href="#" class="admin-link" target="_blank"><i data-lucide="image"></i> PR</a>
                </div>
            </div>
            <!-- Zone Summary -->
            <div class="admin-card admin-card-wide">
                <h3 class="admin-card-title"><i data-lucide="bar-chart-3"></i> Zone Summary</h3>
                <div id="zoneSummaryTable" class="admin-table-wrapper">
                    <div class="loading-placeholder"><div class="spinner-large"></div></div>
                </div>
            </div>
            <!-- System Info -->
            <div class="admin-card">
                <h3 class="admin-card-title"><i data-lucide="info"></i> System Info</h3>
                <div class="admin-info-list">
                    <div class="info-row"><span>Version</span><span>${CONFIG.VERSION}</span></div>
                    <div class="info-row"><span>Mode</span><span class="badge ${CONFIG.DEMO_MODE ? 'badge-warn' : 'badge-ok'}">${CONFIG.DEMO_MODE ? 'DEMO' : 'Production'}</span></div>
                    <div class="info-row"><span>Material Types</span><span>${CONFIG.MATERIAL_TYPES.length}</span></div>
                </div>
            </div>
        </div>
    </div>`;
}

export async function initAdmin() {
    const r = dataCache.getDashboardStats('ALL');
    if (!r.success) return;
    const ws = r.warehouseStats || [];
    // Group by zone
    const zones = {};
    ws.forEach(w => { if (!zones[w.zone]) zones[w.zone] = { stock: 0, done: 0, whs: [] }; zones[w.zone].stock += w.totalStock; zones[w.zone].done += w.inspected; zones[w.zone].whs.push(w.name); });
    const table = document.getElementById('zoneSummaryTable');
    if (!table) return;
    table.innerHTML = `<table class="data-table"><thead><tr><th>Zone</th><th>Warehouses</th><th>Stock</th><th>Inspected</th><th>Progress</th></tr></thead><tbody>
        ${Object.entries(zones).map(([z, d]) => `<tr><td><strong>Zone ${z}</strong></td><td>${d.whs.length}</td><td>${d.stock}</td><td>${d.done}</td><td><div class="progress-bar-mini"><div class="progress-bar-fill ${d.stock > 0 && (d.done / d.stock * 100) >= 80 ? 'progress-high' : d.stock > 0 && (d.done / d.stock * 100) >= 40 ? 'progress-mid' : 'progress-low'}" style="width:${d.stock ? Math.round(d.done / d.stock * 100) : 0}%"></div></div>${d.stock ? Math.round(d.done / d.stock * 100) : 0}%</td></tr>`).join('')}
        </tbody></table>`;
    if (window.lucide) lucide.createIcons();
}
