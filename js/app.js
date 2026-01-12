import { Store } from './store.js';
import { renderDashboard } from './components/dashboard.js';
import { renderWarehouseView } from './components/warehouse-view.js';
import { initMockData } from './services/mock-db.js';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App Initializing...');

    // Initialize Icons
    lucide.createIcons();

    // Check/Init Data
    initMockData();

    // Init Store
    window.appStore = new Store();

    // Initial Render
    // renderDashboard(document.getElementById('main-content'));

    // Subscribe to Store Changes for Routing
    window.appStore.subscribe((state) => {
        const container = document.getElementById('main-content');
        container.innerHTML = ''; // Clear current view

        if (state.currentView === 'dashboard') {
            renderDashboard(container);
        } else if (state.currentView === 'warehouse') {
            renderWarehouseView(container, state.selectedWarehouseId);
        }
    });

    // trigger initial render
    window.appStore.notify();

    // Global Event Listeners
    setupGlobalEvents();
});

function setupGlobalEvents() {
    // Role Switcher
    const roleBtns = document.querySelectorAll('.role-btn');
    roleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI
            roleBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Update State
            const newRole = e.target.dataset.role;
            window.appStore.setRole(newRole);
        });
    });
}
