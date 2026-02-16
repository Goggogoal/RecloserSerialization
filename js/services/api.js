// ============================================================
// PEA-AIMS API Layer — Routes to Mock or GAS backend
// ============================================================

import { CONFIG } from '../config.js';
import { mockApi } from './mock-api.js';

async function callGAS(action, payload = {}) {
    const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...payload })
    });
    return response.json();
}

export const api = {
    async call(action, payload = {}) {
        if (CONFIG.DEMO_MODE) {
            // Route to mock API
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
