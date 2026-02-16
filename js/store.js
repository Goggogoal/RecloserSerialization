// ============================================================
// PEA-AIMS Global State Store (Observer Pattern)
// ============================================================

class Store {
    constructor() {
        this._state = {
            user: null,           // { username, role, zone }
            currentView: 'login', // login | dashboard | inspector | manager | admin
            warehouses: [],       // [{ code, name, sloc, zone }]
            contracts: [],        // [{ contractNo, poNo, equipType, peaStart, peaEnd }]
            equipment: [],        // [{ materialNo, equipType, equipGroup }]
            mb52: [],             // [{ materialCode, whName, whCode, batch, qty }]
            inspections: [],      // [{ ...inspection fields }]
            selectedWarehouse: null,
            selectedMaterialType: null,
            prImageUrl: null,
            dashboardStats: null,
            loading: false,
            error: null
        };
        this._listeners = {};
    }

    getState() {
        return { ...this._state };
    }

    get(key) {
        return this._state[key];
    }

    set(key, value) {
        const oldValue = this._state[key];
        this._state[key] = value;
        this._notify(key, value, oldValue);
    }

    update(partial) {
        Object.keys(partial).forEach(key => {
            this._state[key] = partial[key];
        });
        Object.keys(partial).forEach(key => {
            this._notify(key, partial[key]);
        });
    }

    on(key, callback) {
        if (!this._listeners[key]) {
            this._listeners[key] = [];
        }
        this._listeners[key].push(callback);
        return () => {
            this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
        };
    }

    _notify(key, value, oldValue) {
        if (this._listeners[key]) {
            this._listeners[key].forEach(cb => cb(value, oldValue));
        }
        // Also notify wildcard listeners
        if (this._listeners['*']) {
            this._listeners['*'].forEach(cb => cb(key, value, oldValue));
        }
    }
}

export const store = new Store();
