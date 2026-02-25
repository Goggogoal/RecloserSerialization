// ============================================================
// PEA-AIMS Auth Service
// ============================================================

import { CONFIG } from '../config.js';
import { store } from '../store.js';
import { api } from './api.js';
import { dataCache } from './data-cache.js';
import { writeQueue } from './write-queue.js';

export const auth = {
    async login(username, password) {
        store.set('loading', true);
        store.set('error', null);
        try {
            const result = await api.call('login', { username, password });
            if (result.success) {
                const user = result.user;
                sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(user));
                store.set('user', user);
                // Load all data from server BEFORE returning (so dashboard has data)
                try {
                    await dataCache.loadAllData();
                } catch (err) {
                    console.warn('[Auth] Data load failed, will retry on navigation:', err);
                }
                // Process any queued writes from previous sessions
                writeQueue.processRemaining();
                store.set('loading', false);
                return { success: true, user };
            } else {
                store.set('loading', false);
                return { success: false, message: result.message || 'Invalid credentials' };
            }
        } catch (err) {
            store.set('loading', false);
            store.set('error', err.message);
            return { success: false, message: err.message };
        }
    },

    logout() {
        sessionStorage.removeItem(CONFIG.SESSION_KEY);
        dataCache.clear();
        writeQueue.clear();
        store.update({
            user: null,
            currentView: 'login',
            selectedWarehouse: null,
            selectedMaterialType: null
        });
    },

    getUser() {
        if (store.get('user')) return store.get('user');
        const saved = sessionStorage.getItem(CONFIG.SESSION_KEY);
        if (saved) {
            try {
                const user = JSON.parse(saved);
                store.set('user', user);
                return user;
            } catch { return null; }
        }
        return null;
    },

    // Parse role string like "Manager A" → { role: "Manager", zone: "A" }
    parseRole(roleStr) {
        if (!roleStr) return { role: 'Inspector', zone: '' };
        const str = roleStr.trim();
        if (str === 'Admin') return { role: 'Admin', zone: 'ALL' };
        const parts = str.split(' ');
        if (parts.length >= 2) {
            return { role: parts[0], zone: parts.slice(1).join(' ') };
        }
        return { role: str, zone: '' };
    },

    isAdmin(user) {
        return user && user.role === 'Admin';
    },

    isManager(user) {
        return user && user.role === 'Manager';
    },

    isInspector(user) {
        return user && user.role === 'Inspector';
    },

    canAccessZone(user, zone) {
        if (!user) return false;
        if (user.role === 'Admin') return true;
        return user.zone === zone;
    }
};
