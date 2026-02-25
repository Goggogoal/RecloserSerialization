// ============================================================
// PEA-AIMS Data Cache — Offline-First / localStorage + Memory
// Single fetch on login, all reads from local cache.
// ============================================================

import { CONFIG } from '../config.js';
import { store } from '../store.js';
import { api } from './api.js';

const CACHE_KEY = CONFIG.DATA_KEY || 'pea_aims_data';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ─── Public API ──────────────────────────────────

export const dataCache = {

    /**
     * Load ALL data from server (or cache).
     * Call once after login. Returns quickly if valid cache exists.
     */
    async loadAllData(forceRefresh = false) {
        // Try localStorage first
        if (!forceRefresh) {
            const cached = readCache();
            if (cached) {
                hydrateStore(cached);
                console.log('[DataCache] Loaded from localStorage, age:', Math.round((Date.now() - cached._ts) / 1000), 's');
                // Background refresh if stale (but UI is already populated)
                if (Date.now() - cached._ts > CACHE_TTL) {
                    console.log('[DataCache] Cache stale, refreshing in background...');
                    this._backgroundRefresh();
                }
                return true;
            }
        }

        // No cache or forced — fetch from server
        return this._fetchAndCache();
    },

    /**
     * Fetch from server, update cache + store.
     */
    async _fetchAndCache() {
        try {
            const r = await api.call('getBootstrapData', { zone: store.get('user')?.zone || 'ALL' });
            if (!r.success) {
                console.error('[DataCache] Bootstrap fetch failed:', r.message);
                return false;
            }
            const data = {
                warehouses: r.warehouses || [],
                contracts: r.contracts || [],
                equipment: r.equipment || [],
                mb52: r.mb52 || [],
                inspections: r.inspections || [],
                ghosts: r.ghosts || [],
                _ts: Date.now()
            };
            writeCache(data);
            hydrateStore(data);
            console.log('[DataCache] Fetched & cached from server');
            return true;
        } catch (err) {
            console.error('[DataCache] Fetch error:', err);
            return false;
        }
    },

    /**
     * Background refresh — doesn't block UI.
     */
    _backgroundRefresh() {
        this._fetchAndCache().catch(err => console.warn('[DataCache] Background refresh failed:', err));
    },

    /**
     * Force a full refresh (e.g., after a write that we want to verify).
     */
    async refresh() {
        return this._fetchAndCache();
    },

    // ─── Local Read Methods (no API calls) ───────────

    getMasterData() {
        return {
            warehouses: store.get('warehouses') || [],
            contracts: store.get('contracts') || [],
            equipment: store.get('equipment') || [],
            mb52: store.get('mb52') || []
        };
    },

    getInspections(filters = {}) {
        let items = store.get('inspections') || [];
        if (filters.warehouseCode) items = items.filter(i => i.warehouseCode === filters.warehouseCode);
        if (filters.sloc) items = items.filter(i => i.sloc === filters.sloc);
        if (filters.materialType) items = items.filter(i => i.materialType === filters.materialType);
        if (filters.status) items = items.filter(i => i.status === filters.status);
        return { success: true, inspections: items };
    },

    getInspectionById(id) {
        const items = store.get('inspections') || [];
        const item = items.find(i => i.id === id);
        return item ? { success: true, inspection: item } : { success: false, message: 'Not found' };
    },

    getGhosts(filters = {}) {
        let items = store.get('ghosts') || [];
        if (filters.warehouseCode) items = items.filter(i => i.warehouseCode === filters.warehouseCode);
        if (filters.sloc) items = items.filter(i => i.sloc === filters.sloc);
        if (filters.materialType) items = items.filter(i => i.materialType === filters.materialType);
        return { success: true, ghosts: items };
    },

    getGhostById(id) {
        const items = store.get('ghosts') || [];
        const item = items.find(i => i.id === id);
        return item ? { success: true, ghost: item } : { success: false, message: 'Not found' };
    },

    // ─── Client-Side Stats Computation ───────────────

    getDashboardStats(zone) {
        const warehouses = store.get('warehouses') || [];
        const mb52 = store.get('mb52') || [];
        const inspections = store.get('inspections') || [];
        const materialTypes = CONFIG.MATERIAL_TYPES;

        let whs = warehouses;
        if (zone && zone !== 'ALL') {
            whs = whs.filter(w => w.zone === zone);
        }
        const whCodes = new Set(whs.map(w => w.code));

        const filteredMb52 = mb52.filter(m => !zone || zone === 'ALL' || whCodes.has(m.whCode));
        const filteredInsp = inspections.filter(i => !zone || zone === 'ALL' || whCodes.has(i.warehouseCode));

        const totalStock = filteredMb52.reduce((s, m) => s + m.qty, 0);
        const inspected = filteredInsp.filter(i => i.status === 'Inspected' || i.status === 'Approved').length;
        const approved = filteredInsp.filter(i => i.status === 'Approved').length;
        const pending = filteredInsp.filter(i => i.status === 'Pending').length;
        const progress = totalStock > 0 ? Math.round((inspected / totalStock) * 100) : 0;

        // Deduplicate warehouses by code
        const seenCodes = new Set();
        const uniqueWhs = [];
        whs.forEach(w => { if (!seenCodes.has(w.code)) { seenCodes.add(w.code); uniqueWhs.push(w); } });

        const warehouseStats = uniqueWhs.map(wh => {
            const code = wh.code;
            const whMb52 = mb52.filter(m => m.whCode === code);
            const whInsp = inspections.filter(i => i.warehouseCode === code);

            const slocSet = new Set();
            mb52.filter(m => m.whCode === code).forEach(m => { if (m.sloc) slocSet.add(m.sloc); });

            const types = materialTypes.map(type => {
                const stock = whMb52.filter(m => m.materialType === type).reduce((s, m) => s + m.qty, 0);
                const done = whInsp.filter(i => i.materialType === type && (i.status === 'Inspected' || i.status === 'Approved')).length;
                return { type, stock, done, progress: stock > 0 ? Math.round((done / stock) * 100) : 0 };
            });
            const totalWh = whMb52.reduce((s, m) => s + m.qty, 0);
            const doneWh = whInsp.filter(i => i.status === 'Inspected' || i.status === 'Approved').length;
            return {
                name: wh.name, code, zone: wh.zone, slocs: [...slocSet],
                totalStock: totalWh, inspected: doneWh,
                progress: totalWh > 0 ? Math.round((doneWh / totalWh) * 100) : 0,
                types
            };
        }).filter(w => w.totalStock > 0);

        return { success: true, totalStock, inspected, approved, pending, progress, warehouseStats };
    },

    getGhostStats(zone) {
        const warehouses = store.get('warehouses') || [];
        const ghosts = store.get('ghosts') || [];

        let filtered = ghosts;
        if (zone && zone !== 'ALL') {
            const zoneCodes = new Set(warehouses.filter(w => w.zone === zone).map(w => w.code));
            filtered = ghosts.filter(g => zoneCodes.has(g.warehouseCode));
        }

        const total = filtered.length;
        const inspected = filtered.filter(g => g.status === 'Inspected' || g.status === 'Approved').length;
        const approved = filtered.filter(g => g.status === 'Approved').length;

        const whMap = {};
        filtered.forEach(g => {
            if (!whMap[g.warehouseCode]) whMap[g.warehouseCode] = { code: g.warehouseCode, total: 0, inspected: 0, approved: 0 };
            whMap[g.warehouseCode].total++;
            if (g.status === 'Inspected' || g.status === 'Approved') whMap[g.warehouseCode].inspected++;
            if (g.status === 'Approved') whMap[g.warehouseCode].approved++;
        });

        const whStats = Object.values(whMap).map(w => {
            const whInfo = warehouses.find(wh => wh.code === w.code);
            w.name = whInfo ? whInfo.name : w.code;
            w.zone = whInfo ? whInfo.zone : '';
            return w;
        });

        return { success: true, total, inspected, approved, warehouseStats: whStats };
    },

    getSLocStats(warehouseCode) {
        const warehouses = store.get('warehouses') || [];
        const mb52 = store.get('mb52') || [];
        const inspections = store.get('inspections') || [];
        const materialTypes = CONFIG.MATERIAL_TYPES;

        const wh = warehouses.find(w => w.code === warehouseCode);
        if (!wh) return { success: false, message: 'Warehouse not found' };

        // Collect unique SLocs from MB52
        const slocSet = new Set();
        mb52.filter(m => m.whCode === warehouseCode).forEach(m => { if (m.sloc) slocSet.add(m.sloc); });

        const slocStats = [...slocSet].map(sloc => {
            const slocMb52 = mb52.filter(m => m.whCode === warehouseCode && m.sloc === sloc);
            const slocInsp = inspections.filter(i => i.warehouseCode === warehouseCode && i.sloc === sloc);
            const types = materialTypes.map(type => {
                const stock = slocMb52.filter(m => m.materialType === type).reduce((s, m) => s + m.qty, 0);
                const done = slocInsp.filter(i => i.materialType === type && (i.status === 'Inspected' || i.status === 'Approved')).length;
                return { type, stock, done, progress: stock > 0 ? Math.round((done / stock) * 100) : 0 };
            });
            const total = slocMb52.reduce((s, m) => s + m.qty, 0);
            const done = slocInsp.filter(i => i.status === 'Inspected' || i.status === 'Approved').length;
            const whEntry = warehouses.find(w => w.code === warehouseCode && w.sloc === sloc);
            return {
                sloc, slocName: whEntry ? whEntry.slocName : '',
                types, totalStock: total, inspected: done,
                progress: total > 0 ? Math.round((done / total) * 100) : 0
            };
        }).filter(s => s.totalStock > 0);

        return { success: true, warehouseName: wh.name, warehouseCode, slocStats };
    },

    // ─── Optimistic Mutations ────────────────────────

    /** Add a new inspection to the local cache (before server confirms). */
    addInspection(data) {
        const items = store.get('inspections') || [];
        const tempId = 'TEMP-' + Date.now();
        const newItem = {
            id: tempId,
            timestamp: new Date().toLocaleString('th-TH'),
            status: 'Inspected',
            ...data,
            _pending: true  // mark as not yet confirmed
        };
        items.push(newItem);
        store.set('inspections', items);
        persistToCache('inspections', items);
        return tempId;
    },

    /** Update an existing inspection in the local cache. */
    updateInspection(id, updates) {
        const items = store.get('inspections') || [];
        const idx = items.findIndex(i => i.id === id);
        if (idx >= 0) {
            Object.assign(items[idx], updates, { timestamp: new Date().toLocaleString('th-TH'), status: 'Inspected', _pending: true });
            store.set('inspections', items);
            persistToCache('inspections', items);
        }
    },

    /** Update inspection status (approve/reject/revert). */
    updateInspectionStatus(id, status, comment) {
        const items = store.get('inspections') || [];
        const idx = items.findIndex(i => i.id === id);
        if (idx >= 0) {
            items[idx].status = status;
            if (comment !== undefined) items[idx].managerComment = comment;
            items[idx]._pending = true;
            store.set('inspections', items);
            persistToCache('inspections', items);
        }
    },

    /** Add a ghost item optimistically. */
    addGhost(data) {
        const items = store.get('ghosts') || [];
        const tempId = 'GTEMP-' + Date.now();
        const newItem = {
            id: tempId,
            timestamp: new Date().toLocaleString('th-TH'),
            status: 'Inspected',
            ...data,
            _pending: true
        };
        items.push(newItem);
        store.set('ghosts', items);
        persistToCache('ghosts', items);
        return tempId;
    },

    /** Update a ghost item in the local cache. */
    updateGhost(id, updates) {
        const items = store.get('ghosts') || [];
        const idx = items.findIndex(i => i.id === id);
        if (idx >= 0) {
            Object.assign(items[idx], updates, { timestamp: new Date().toLocaleString('th-TH'), status: 'Inspected', _pending: true });
            store.set('ghosts', items);
            persistToCache('ghosts', items);
        }
    },

    /** Update ghost status (approve/reject/revert). */
    updateGhostStatus(id, status, comment) {
        const items = store.get('ghosts') || [];
        const idx = items.findIndex(i => i.id === id);
        if (idx >= 0) {
            items[idx].status = status;
            if (comment !== undefined) items[idx].managerComment = comment;
            items[idx]._pending = true;
            store.set('ghosts', items);
            persistToCache('ghosts', items);
        }
    },

    /** Clear all cached data (on logout). */
    clear() {
        try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ }
        store.update({ warehouses: [], contracts: [], equipment: [], mb52: [], inspections: [], ghosts: [] });
    }
};

// ─── Internal helpers ────────────────────────────

function readCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data._ts) return null;
        return data;
    } catch (e) {
        console.warn('[DataCache] localStorage read error:', e);
        return null;
    }
}

function writeCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('[DataCache] localStorage write error (quota?):', e);
    }
}

function persistToCache(key, value) {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            data[key] = value;
            data._ts = Date.now(); // keep cache fresh
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
    } catch (e) {
        console.warn('[DataCache] Partial persist error:', e);
    }
}

function hydrateStore(data) {
    store.update({
        warehouses: data.warehouses || [],
        contracts: data.contracts || [],
        equipment: data.equipment || [],
        mb52: data.mb52 || [],
        inspections: data.inspections || [],
        ghosts: data.ghosts || []
    });
}
