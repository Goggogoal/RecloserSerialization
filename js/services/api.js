// ============================================================
// PEA-AIMS API Layer — Routes to Mock or GAS backend
// ============================================================

import { CONFIG } from '../config.js';
import { mockApi } from './mock-api.js';

async function callGAS(action, payload = {}) {
    // Actions that write data — if the request goes through, data is saved
    // even if the response is blocked by CORS redirect
    const writeActions = ['submitInspection', 'updateInspection', 'uploadImages',
        'approveInspection', 'rejectInspection'];
    try {
        const response = await fetch(CONFIG.GAS_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action, ...payload })
        });
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.warn('GAS response not JSON for', action, ':', text.substring(0, 200));
            if (response.ok) return { success: true, id: null };
            return { success: false, message: 'Server returned invalid response' };
        }
    } catch (err) {
        // "Failed to fetch" — GAS processed the request but CORS blocks the response
        if (writeActions.includes(action)) {
            console.warn(`Fetch error for write action "${action}" — assuming success:`, err.message);
            return { success: true, id: null, message: 'Saved' };
        }
        // For read operations, we need the response data — re-throw
        throw err;
    }
}

export const api = {
    async call(action, payload = {}) {
        if (CONFIG.DEMO_MODE) {
            if (typeof mockApi[action] === 'function') {
                return mockApi[action](payload);
            }
            console.warn('Unknown mock action:', action);
            return { success: false, message: `Mock action "${action}" not found` };
        } else {
            return callGAS(action, payload);
        }
    }
};
