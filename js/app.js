// ============================================================
// PEA-AIMS Main Application Entry + Router — v2 with SLoc
// ============================================================
import { store } from './store.js';
import { auth } from './services/auth.js';
import { dataCache } from './services/data-cache.js';
import { writeQueue } from './services/write-queue.js';
import { showPRPopup } from './components/pr-popup.js';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { renderLogin, initLogin } from './components/login.js';
import { renderDashboard, initDashboard } from './components/dashboard.js';
import { renderSLoc, initSLoc } from './components/sloc-view.js';
import { renderInspector, initInspector } from './components/inspector.js';
import { renderManager, initManager } from './components/manager.js';
import { renderAdmin, initAdmin } from './components/admin.js';
import { renderGhost, initGhost } from './components/ghost.js';

const app = document.getElementById('app');

const views = {
    login: { render: renderLogin, init: initLogin },
    dashboard: { render: renderDashboard, init: initDashboard },
    sloc: { render: renderSLoc, init: initSLoc },
    inspector: { render: renderInspector, init: initInspector },
    manager: { render: renderManager, init: initManager },
    admin: { render: renderAdmin, init: initAdmin },
    ghost: { render: renderGhost, init: initGhost }
};

async function navigate(viewName) {
    const user = auth.getUser();
    if (viewName !== 'login' && !user) viewName = 'login';
    if (viewName === 'admin' && user?.role !== 'Admin') viewName = 'dashboard';
    if (viewName === 'manager' && user?.role !== 'Manager' && user?.role !== 'Admin') viewName = 'dashboard';

    const view = views[viewName];
    if (!view) { console.error('Unknown view:', viewName); return; }

    const navHTML = viewName === 'login' ? '' : renderNavbar();
    app.innerHTML = navHTML + `<main class="main-content">${view.render()}</main>`;
    if (window.lucide) lucide.createIcons();
    if (viewName !== 'login') initNavbar();
    await view.init();
    if (window.lucide) lucide.createIcons();
    window.location.hash = viewName;
}

store.on('currentView', (view) => navigate(view));

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'login';
    if (hash !== store.get('currentView')) store.set('currentView', hash);
});

async function init() {
    await showPRPopup();
    const user = auth.getUser();
    if (user) {
        store.set('user', user);
        // Load all data once (from localStorage cache or server)
        const loaded = await dataCache.loadAllData();
        if (!loaded) {
            console.warn('[App] Data load failed — will retry on navigation');
        }
        // Process any writes that were queued in a previous session
        writeQueue.processRemaining();
        const hash = window.location.hash.replace('#', '');
        store.set('currentView', hash && views[hash] ? hash : 'dashboard');
    } else {
        store.set('currentView', 'login');
    }
}

init();
