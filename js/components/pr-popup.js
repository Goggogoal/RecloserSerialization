// ============================================================
// PEA-AIMS PR Popup Component
// ============================================================

import { api } from '../services/api.js';

export async function showPRPopup() {
    try {
        const result = await api.call('getPR');
        if (!result.success || !result.imageUrl) return;

        const overlay = document.createElement('div');
        overlay.className = 'pr-popup-overlay';
        overlay.id = 'prPopupOverlay';
        overlay.innerHTML = `
            <div class="pr-popup-modal">
                <button class="pr-popup-close" id="prPopupClose">
                    <i data-lucide="x"></i>
                </button>
                <div class="pr-popup-image-wrapper">
                    <img src="${result.imageUrl}" alt="PEA Promotion" class="pr-popup-image" 
                         onerror="this.src='https://placehold.co/600x400/103889/FFD700?text=PEA+AIMS'" />
                </div>
                <button class="btn btn-primary pr-popup-btn" id="prPopupCloseBtn">
                    <i data-lucide="arrow-right"></i>
                    <span>เข้าสู่ระบบ</span>
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Trigger animation
        requestAnimationFrame(() => overlay.classList.add('visible'));

        // Initialize lucide icons in the popup
        if (window.lucide) lucide.createIcons();

        // Close handlers
        const close = () => {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
        };

        document.getElementById('prPopupClose')?.addEventListener('click', close);
        document.getElementById('prPopupCloseBtn')?.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    } catch (err) {
        console.warn('PR popup failed:', err);
    }
}
