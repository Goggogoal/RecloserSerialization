// ============================================================
// PEA-AIMS SLoc View — Sub-warehouse detail page
// Shown after clicking a warehouse from the Dashboard
// ============================================================

import { store } from '../store.js';
import { api } from '../services/api.js';
import { CONFIG } from '../config.js';

export function renderSLoc() {
    const wh = store.get('selectedWarehouse') || {};
    return `
    <div class="sloc-page" id="slocPage">
        <div class="page-header">
            <div class="page-breadcrumb">
                <button class="btn btn-sm btn-secondary breadcrumb-back" id="slocBackBtn"><i data-lucide="arrow-left"></i> Dashboard</button>
            </div>
            <h2 class="page-title"><i data-lucide="warehouse"></i> ${wh.name || 'Warehouse'}</h2>
            <p class="page-subtitle">${wh.code || ''} — Storage Location Overview</p>
        </div>
        <div class="sloc-grid" id="slocGrid">
            <div class="loading-placeholder"><div class="spinner-large"></div><p>Loading SLoc data...</p></div>
        </div>
    </div>`;
}

export async function initSLoc() {
    const wh = store.get('selectedWarehouse');
    if (!wh) { store.set('currentView', 'dashboard'); return; }

    document.getElementById('slocBackBtn')?.addEventListener('click', () => store.set('currentView', 'dashboard'));

    const result = await api.call('getSLocStats', { warehouseCode: wh.code });
    if (!result.success) {
        document.getElementById('slocGrid').innerHTML = `<div class="empty-state"><p>Error loading SLoc data</p></div>`;
        return;
    }

    const grid = document.getElementById('slocGrid');
    const stats = result.slocStats;

    if (!stats.length) {
        grid.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No SLoc data found</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    grid.innerHTML = stats.map(sl => `
        <div class="sloc-card">
            <div class="sloc-card-header">
                <div class="sloc-card-title">
                    <i data-lucide="box"></i>
                    <div>
                        <h4>SLoc: ${sl.sloc}</h4>
                        <span class="wh-code-badge">${wh.code} / ${sl.sloc}</span>
                    </div>
                </div>
                <div class="wh-progress-badge ${getPC(sl.progress)}">${sl.progress}%</div>
            </div>
            <div class="sloc-card-body">
                ${sl.types.map(t => `
                    <div class="wh-type-row">
                        <div class="wh-type-info">
                            <span class="wh-type-icon">${getIcon(t.type)}</span>
                            <span class="wh-type-name">${t.type}</span>
                        </div>
                        <div class="wh-type-stats">
                            <span class="wh-type-count">${t.done}/${t.stock}</span>
                            <div class="progress-bar-mini"><div class="progress-bar-fill ${getPC(t.progress)}" style="width:${t.progress}%"></div></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="sloc-card-footer">
                <span class="wh-total">${sl.inspected}/${sl.totalStock} items</span>
                <button class="btn btn-sm btn-primary sloc-inspect-btn" data-sloc="${sl.sloc}">
                    <i data-lucide="clipboard-check"></i> Inspect
                </button>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();

    // Navigate to inspector with sloc context
    grid.querySelectorAll('.sloc-inspect-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            store.update({
                selectedSLoc: btn.dataset.sloc,
                currentView: store.get('user')?.role === 'Manager' ? 'manager' : 'inspector'
            });
        });
    });
}

function getPC(p) { return p >= 80 ? 'progress-high' : p >= 40 ? 'progress-mid' : 'progress-low'; }
function getIcon(type) {
    switch (type) { case 'Recloser': return '⚡'; case 'Control Cabinet': return '🔧'; case 'PT': return '🔌'; default: return '📦'; }
}
