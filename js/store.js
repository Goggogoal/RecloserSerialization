export class Store {
    constructor() {
        this.state = {
            role: 'inspector', // 'inspector' | 'manager'
            currentView: 'dashboard',
            selectedWarehouseId: null,
            lastUpdate: Date.now()
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setRole(role) {
        this.state.role = role;
        this.notify();
        // Also trigger specific UI updates if needed
        document.body.dataset.role = role;
        console.log(`Role switched to: ${role}`);
    }

    setView(view, params = {}) {
        this.state.currentView = view;
        if (params.warehouseId) this.state.selectedWarehouseId = params.warehouseId;
        this.notify();
    }
}
