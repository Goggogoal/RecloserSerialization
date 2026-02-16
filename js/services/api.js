// ============================================================
// PEA-AIMS API Service Layer
// Routes between real GAS API and mock data based on config
// ============================================================

import { CONFIG } from '../config.js';
import { mockApi } from './mock-api.js';

async function callGAS(action, payload = {}) {
    const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...payload })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

export const api = {
    async call(action, payload = {}) {
        if (CONFIG.DEMO_MODE) {
            // Route to mock API
            switch (action) {
                case 'login': return mockApi.login(payload);
                case 'getPR': return mockApi.getPR();
                case 'getMasterData': return mockApi.getMasterData();
                case 'getDashboardStats': return mockApi.getDashboardStats(payload);
                case 'getInspections': return mockApi.getInspections(payload);
                case 'submitInspection': return mockApi.submitInspection(payload);
                case 'updateInspection': return mockApi.updateInspection(payload);
                case 'approveInspection': return mockApi.approveInspection(payload);
                case 'rejectInspection': return mockApi.rejectInspection(payload);
                default: return { success: false, message: `Unknown action: ${action}` };
            }
        } else {
            return callGAS(action, payload);
        }
    }
};
