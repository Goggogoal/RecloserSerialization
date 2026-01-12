const STORAGE_KEY = 'parcel_app_db_v1';
const API_KEY_STORAGE = 'parcel_app_api_url';

// Helper for API Calls - Google Apps Script compatible
const apiCall = async (action, payload = {}) => {
    const url = localStorage.getItem(API_KEY_STORAGE);
    if (!url) return null;

    try {
        // Google Apps Script requires specific handling
        const formData = new URLSearchParams();
        formData.append('payload', JSON.stringify({ action, ...payload }));

        const response = await fetch(url, {
            method: 'POST',
            redirect: 'follow', // Important for Apps Script redirects
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            console.log("Response:", text);
            return null;
        }
    } catch (e) {
        console.error("API Sync Error:", e);
        return null;
    }
};

export const initMockData = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const warehouses = Array.from({ length: 34 }, (_, i) => ({
            id: `wh-${i + 1}`,
            name: `Warehouse ${i + 1}`,
            parcels: []
        }));

        const meta = {
            brands: ['Precise', 'Entec', 'Cooper', 'ABB', 'Schneider'],
            models: ['Type A', 'Type B', 'Outdoor', 'Indoor', 'Smart']
        };

        saveData({ warehouses, meta });
        console.log('Initialized Mock Data for 34 Warehouses + Enums');
    }

    // Auto-Sync on load if online
    if (localStorage.getItem(API_KEY_STORAGE)) {
        db.syncFromCloud().then(res => {
            if (res) console.log("Synced from Cloud on Init");
        });
    }
};

const getData = () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"warehouses": []}');
};

const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const db = {
    setApiUrl: async (url) => {
        localStorage.setItem(API_KEY_STORAGE, url);
        return await db.syncFromCloud(); // Initial pull
    },

    getApiUrl: () => {
        return localStorage.getItem(API_KEY_STORAGE);
    },

    // Sync: Cloud -> Local (Replace Local)
    syncFromCloud: async () => {
        const result = await apiCall('getParcels');
        if (result && result.warehouses) {
            // Merge or Replace? Replace is safer for "Source of Truth"
            // But we need to keep meta/enums if server doesn't send them.
            // Server currently sends { warehouses }.
            const localData = getData();
            localData.warehouses = result.warehouses;
            saveData(localData);
            return true;
        }
        return false;
    },

    getWarehouses: () => {
        return getData().warehouses;
    },

    getWarehouse: (id) => {
        return getData().warehouses.find(w => w.id === id);
    },

    // New Method for Bulk Updates
    updateWarehouses: (warehouses) => {
        saveData({ ...getData(), warehouses });
        // We probably don't push full bulk to API yet, as API is optimized for single parcel save.
        // For import, valid to just loop and save? Or add 'bulkSave' to API.
        // For now, let's just keep it local-first for Import.
        alert("Bulk import saved locally. Cloud sync for bulk not fully implemented in this v1.");
    },

    clearData: async () => {
        if (confirm('Clear Cloud Data too?')) {
            await apiCall('clearData');
        }
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    },

    saveParcel: async (warehouseId, parcelData) => {
        const data = getData();
        const whIndex = data.warehouses.findIndex(w => w.id === warehouseId);
        if (whIndex === -1) return false;

        const existingParcelIndex = data.warehouses[whIndex].parcels.findIndex(p => p.id === parcelData.id);

        if (existingParcelIndex >= 0) {
            data.warehouses[whIndex].parcels[existingParcelIndex] = { ...data.warehouses[whIndex].parcels[existingParcelIndex], ...parcelData };
        } else {
            parcelData.id = parcelData.id || `p-${Date.now()}`;
            parcelData.timestamp = new Date().toISOString();
            data.warehouses[whIndex].parcels.push(parcelData);
        }

        saveData(data);

        // Async Sync to Cloud
        if (db.getApiUrl()) {
            console.log("Syncing to Cloud...");
            const res = await apiCall('saveParcel', { parcel: parcelData, warehouseId });
            if (res && res.success && res.parcel && res.parcel.photo.startsWith('http')) {
                // Update local with the Cloud URL for the image
                const newData = getData(); // Refetch in case changed
                const pIndex = newData.warehouses[whIndex].parcels.findIndex(p => p.id === parcelData.id);
                if (pIndex >= 0) {
                    newData.warehouses[whIndex].parcels[pIndex].photo = res.parcel.photo;
                    saveData(newData);
                    console.log("Image URL updated from Cloud");
                }
            }
        }
        return true;
    },

    // Enum Management
    getEnums: () => {
        const data = getData();
        return data.meta || { brands: [], models: [] };
    },

    addEnum: (type, value) => {
        const data = getData();
        if (!data.meta) data.meta = { brands: [], models: [] };

        const list = data.meta[type];
        if (list && !list.includes(value)) {
            list.push(value);
            saveData(data);
            return true;
        }
        return false;
    }
};
