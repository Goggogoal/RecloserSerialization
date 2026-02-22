// ============================================================
// PEA-AIMS API Layer — Routes to Mock or GAS backend
// ============================================================

import { CONFIG } from '../config.js';
import { mockApi } from './mock-api.js';

async function callGAS(action, payload = {}) {
    const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...payload })
    });
    // GAS returns via redirect — response may not always parse as JSON directly
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        // If we got HTML or non-JSON back, check if it still looks like success
        console.warn('GAS response not JSON for action:', action, 'Response:', text.substring(0, 300));
        // If the request completed (2xx) but response isn't JSON, treat as success
        // since GAS sometimes wraps responses in HTML on redirects
        if (response.ok) {
            return { success: true, message: 'Saved (response parse fallback)', id: null };
        }
        return { success: false, message: 'Server returned invalid response' };
    }
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
