// ============================================================
// PEA-AIMS Main Application Entry + Router
// ============================================================
import { store } from './store.js';
import { auth } from './services/auth.js';
import { showPRPopup } from './components/pr-popup.js';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { renderLogin, initLogin } from './components/login.js';
import { renderDashboard, initDashboard } from './components/dashboard.js';
import { renderInspector, initInspector } from './components/inspector.js';
import { renderManager, initManager } from './components/manager.js';
import { renderAdmin, initAdmin } from './components/admin.js';

const app = document.getElementById('app');

// View renderers & initializers
const views = {
    login: { render: renderLogin, init: initLogin },
    dashboard: { render: renderDashboard, init: initDashboard },
    inspector: { render: renderInspector, init: initInspector },
    manager: { render: renderManager, init: initManager },
    admin: { render: renderAdmin, init: initAdmin }
};

// Route to view
async function navigate(viewName) {
    const user = auth.getUser();

    // Guard: must be logged in for anything except login
    if (viewName !== 'login' && !user) {
        viewName = 'login';
    }

    // Guard: role-based access
    if (viewName === 'admin' && user?.role !== 'Admin') viewName = 'dashboard';
    if (viewName === 'manager' && user?.role !== 'Manager' && user?.role !== 'Admin') viewName = 'dashboard';

    const view = views[viewName];
    if (!view) { console.error('Unknown view:', viewName); return; }

    // Render
    const navHTML = viewName === 'login' ? '' : renderNavbar();
    app.innerHTML = navHTML + `<main class="main-content">${view.render()}</main>`;

    // Initialize lucide icons
    if (window.lucide) lucide.createIcons();

    // Init navbar
    if (viewName !== 'login') initNavbar();

    // Init view
    await view.init();

    // Re-init icons after async init
    if (window.lucide) lucide.createIcons();

    // Update hash
    window.location.hash = viewName;
}

// Listen to store changes
store.on('currentView', (view) => navigate(view));

// Hash-based routing
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'login';
    if (hash !== store.get('currentView')) {
        store.set('currentView', hash);
    }
});

// Boot
async function init() {
    // Show PR popup
    await showPRPopup();

    // Check existing session
    const user = auth.getUser();
    if (user) {
        store.set('user', user);
        const hash = window.location.hash.replace('#', '');
        store.set('currentView', hash && views[hash] ? hash : 'dashboard');
    } else {
        store.set('currentView', 'login');
    }
}

init();
