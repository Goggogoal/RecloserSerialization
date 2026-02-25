// ============================================================
// PEA-AIMS Write Queue — Background saves with retry
// Saves are non-blocking: UI updates instantly, queue processes
// in background. Failed writes persist in localStorage for retry.
// ============================================================

import { api } from './api.js';
import { dataCache } from './data-cache.js';

const QUEUE_KEY = 'pea_aims_write_queue';
let processing = false;

export const writeQueue = {

    /**
     * Enqueue a write operation.
     * @param {string} action - API action name (e.g. 'submitInspection')
     * @param {object} payload - Data payload
     * @param {object} [options] - Optional callbacks
     * @param {function} [options.onSuccess] - Called on success
     * @param {function} [options.onError] - Called on failure
     */
    enqueue(action, payload, options = {}) {
        const entry = {
            id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
            action,
            payload,
            retries: 0,
            maxRetries: 3,
            createdAt: Date.now()
        };

        // Save to localStorage (persist across refreshes)
        const queue = this._readQueue();
        queue.push(entry);
        this._writeQueue(queue);

        console.log(`[WriteQueue] Enqueued: ${action} (${entry.id})`);

        // Start processing
        this._processQueue(options);
    },

    /**
     * Process all queued items sequentially.
     */
    async _processQueue(options = {}) {
        if (processing) return;
        processing = true;

        const queue = this._readQueue();
        const failed = [];

        for (const entry of queue) {
            try {
                console.log(`[WriteQueue] Processing: ${entry.action} (${entry.id})`);
                const result = await api.call(entry.action, entry.payload);

                if (result.success || result.id !== undefined) {
                    console.log(`[WriteQueue] ✓ ${entry.action} succeeded`);
                    if (options.onSuccess) options.onSuccess(entry, result);
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
            } catch (err) {
                entry.retries++;
                console.warn(`[WriteQueue] ✗ ${entry.action} failed (attempt ${entry.retries}/${entry.maxRetries}):`, err.message);

                if (entry.retries < entry.maxRetries) {
                    failed.push(entry);
                } else {
                    console.error(`[WriteQueue] ✗ ${entry.action} permanently failed after ${entry.maxRetries} attempts`);
                    showRetryToast(entry);
                    if (options.onError) options.onError(entry, err);
                }
            }
        }

        // Save remaining failed items back to queue
        this._writeQueue(failed);
        processing = false;

        // If there are failed items, retry after a delay
        if (failed.length > 0) {
            console.log(`[WriteQueue] ${failed.length} items pending retry in 30s...`);
            setTimeout(() => this._processQueue(options), 30000);
        }
    },

    /**
     * Process any remaining items from previous sessions.
     * Call on app startup.
     */
    async processRemaining() {
        const queue = this._readQueue();
        if (queue.length > 0) {
            console.log(`[WriteQueue] Found ${queue.length} pending items from previous session`);
            showInfoToast(`Syncing ${queue.length} pending save(s)...`);
            await this._processQueue();
            // Refresh cache after processing leftover writes
            dataCache.refresh();
        }
    },

    /**
     * Get count of pending items.
     */
    getPendingCount() {
        return this._readQueue().length;
    },

    /**
     * Clear all pending items (e.g., on logout).
     */
    clear() {
        this._writeQueue([]);
    },

    // ─── Internal ────────────────────────────────────

    _readQueue() {
        try {
            const raw = localStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    },

    _writeQueue(queue) {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.warn('[WriteQueue] localStorage write error:', e);
        }
    }
};

// ─── Toast helpers (standalone, no import cycle) ──

function showRetryToast(entry) {
    removeToast();
    const t = document.createElement('div');
    t.className = 'toast toast-error';
    t.innerHTML = `<i data-lucide="alert-circle"></i><span>Save failed: ${entry.action}. Check your connection.</span>`;
    document.body.appendChild(t);
    if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 5000);
}

function showInfoToast(msg) {
    removeToast();
    const t = document.createElement('div');
    t.className = 'toast toast-info';
    t.innerHTML = `<i data-lucide="loader"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3000);
}

function removeToast() {
    document.querySelector('.toast')?.remove();
}
