// ============================================================
// PEA-AIMS Navbar Component
// ============================================================

import { store } from '../store.js';
import { auth } from '../services/auth.js';

export function renderNavbar() {
    const user = store.get('user');
    const currentView = store.get('currentView');
    if (!user || currentView === 'login') return '';

    const isAdmin = auth.isAdmin(user);
    const isManager = auth.isManager(user);
    const isInspector = auth.isInspector(user);

    const navLinks = [];
    navLinks.push({ id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' });
    if (isInspector || isAdmin) navLinks.push({ id: 'inspector', label: 'Inspect', icon: 'clipboard-check' });
    if (isManager || isAdmin) navLinks.push({ id: 'manager', label: 'Review', icon: 'check-circle' });
    if (isAdmin) navLinks.push({ id: 'admin', label: 'Admin', icon: 'settings' });

    return `
    <nav class="navbar" id="mainNavbar">
        <div class="navbar-container">
            <div class="navbar-brand">
                <div class="navbar-logo">
                    <svg viewBox="0 0 48 48" class="pea-logo-svg">
                        <circle cx="24" cy="24" r="23" fill="#103889" stroke="#FFD700" stroke-width="2"/>
                        <path d="M24 8 L28 20 L38 20 L30 28 L33 40 L24 33 L15 40 L18 28 L10 20 L20 20 Z" fill="#FFD700"/>
                        <text x="24" y="46" text-anchor="middle" font-size="5" fill="#FFD700" font-weight="bold">PEA</text>
                    </svg>
                </div>
                <div class="navbar-title">
                    <span class="navbar-title-main">PEA-AIMS</span>
                    <span class="navbar-title-sub">Asset Inventory Management</span>
                </div>
            </div>
            <div class="navbar-links" id="navbarLinks">
                ${navLinks.map(link => `
                    <a href="#" class="nav-link ${currentView === link.id ? 'active' : ''}" data-view="${link.id}">
                        <i data-lucide="${link.icon}"></i>
                        <span>${link.label}</span>
                    </a>
                `).join('')}
            </div>
            <div class="navbar-user">
                <div class="user-badge">
                    <i data-lucide="user-circle"></i>
                    <div class="user-info">
                        <span class="user-name">${user.fullName || user.username}</span>
                        <span class="user-role">${user.role}${user.zone !== 'ALL' ? ' • Zone ' + user.zone : ''}</span>
                    </div>
                </div>
                <button class="btn-logout" id="btnLogout" title="Logout">
                    <i data-lucide="log-out"></i>
                </button>
            </div>
            <button class="navbar-toggle" id="navbarToggle" aria-label="Toggle menu">
                <i data-lucide="menu"></i>
            </button>
        </div>
    </nav>
    <div class="navbar-mobile-backdrop" id="navbarBackdrop"></div>
    `;
}

export function initNavbar() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            store.set('currentView', view);
            closeMobileMenu();
        });
    });

    // Logout button
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.logout();
        });
    }

    // Mobile toggle
    const toggle = document.getElementById('navbarToggle');
    const backdrop = document.getElementById('navbarBackdrop');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.getElementById('navbarLinks')?.classList.toggle('open');
            backdrop?.classList.toggle('open');
        });
    }
    if (backdrop) {
        backdrop.addEventListener('click', closeMobileMenu);
    }
}

function closeMobileMenu() {
    document.getElementById('navbarLinks')?.classList.remove('open');
    document.getElementById('navbarBackdrop')?.classList.remove('open');
}
