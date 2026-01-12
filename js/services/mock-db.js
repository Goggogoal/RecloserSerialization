const STORAGE_KEY = 'parcel_app_db_v1';

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
};

const getData = () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"warehouses": []}');
};

const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const db = {
    getWarehouses: () => {
        return getData().warehouses;
    },

    getWarehouse: (id) => {
        return getData().warehouses.find(w => w.id === id);
    },

    // New Method for Bulk Updates
    updateWarehouses: (warehouses) => {
        saveData({ warehouses });
    },

    clearData: () => {
        localStorage.removeItem(STORAGE_KEY);
        // initMockData will run on next load or we can run it now
        // Let's just remove it and let the app cycle
        location.reload();
    },

    saveParcel: (warehouseId, parcelData) => {
        const data = getData();
        const start = Date.now();
        const whIndex = data.warehouses.findIndex(w => w.id === warehouseId);

        if (whIndex === -1) return false;

        // Check if parcel exists (update) or new
        // For simplicity, we'll append for now or update by ID if we add IDs
        // Assuming parcelData comes with an ID if it's an edit

        const existingParcelIndex = data.warehouses[whIndex].parcels.findIndex(p => p.id === parcelData.id);

        if (existingParcelIndex >= 0) {
            data.warehouses[whIndex].parcels[existingParcelIndex] = { ...data.warehouses[whIndex].parcels[existingParcelIndex], ...parcelData };
        } else {
            parcelData.id = `p-${Date.now()}`;
            parcelData.timestamp = new Date().toISOString();
            data.warehouses[whIndex].parcels.push(parcelData);
        }

        saveData(data);
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

        const list = data.meta[type]; // 'brands' or 'models'
        if (list && !list.includes(value)) {
            list.push(value);
            saveData(data);
            return true;
        }
        return false;
    }
};
