// ============================================================
// PEA-AIMS PR Popup — Multi-Page Carousel
// ============================================================

import { api } from '../services/api.js';

export async function showPRPopup() {
    try {
        const result = await api.call('getPR');
        if (!result.success) return;
        const images = result.images || (result.imageUrl ? [result.imageUrl] : []);
        if (!images.length) return;

        let current = 0;

        const overlay = document.createElement('div');
        overlay.className = 'pr-popup-overlay';
        overlay.id = 'prPopupOverlay';
        overlay.innerHTML = `
            <div class="pr-popup-modal">
                <button class="pr-popup-close" id="prPopupClose"><i data-lucide="x"></i></button>
                <div class="pr-carousel">
                    <div class="pr-carousel-track" id="prCarouselTrack">
                        ${images.map((url, i) => `<div class="pr-slide ${i === 0 ? 'active' : ''}"><img src="${url}" alt="PEA PR ${i + 1}" class="pr-popup-image" onerror="this.src='https://placehold.co/600x400/103889/FFD700?text=PEA+AIMS'" /></div>`).join('')}
                    </div>
                    ${images.length > 1 ? `
                    <div class="pr-carousel-controls">
                        <button class="pr-nav-btn pr-prev" id="prPrev"><i data-lucide="chevron-left"></i></button>
                        <div class="pr-dots" id="prDots">
                            ${images.map((_, i) => `<span class="pr-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></span>`).join('')}
                        </div>
                        <button class="pr-nav-btn pr-next" id="prNext"><i data-lucide="chevron-right"></i></button>
                    </div>
                    ` : ''}
                </div>
                <button class="btn btn-primary pr-popup-btn" id="prPopupCloseBtn">
                    <i data-lucide="arrow-right"></i>
                    <span>เข้าสู่ระบบ</span>
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('visible'));
        if (window.lucide) lucide.createIcons();

        const close = () => { overlay.classList.remove('visible'); setTimeout(() => overlay.remove(), 300); };
        document.getElementById('prPopupClose')?.addEventListener('click', close);
        document.getElementById('prPopupCloseBtn')?.addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

        if (images.length > 1) {
            const goTo = (idx) => {
                current = idx;
                document.querySelectorAll('.pr-slide').forEach((s, i) => s.classList.toggle('active', i === idx));
                document.querySelectorAll('.pr-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
            };
            document.getElementById('prPrev')?.addEventListener('click', () => goTo((current - 1 + images.length) % images.length));
            document.getElementById('prNext')?.addEventListener('click', () => goTo((current + 1) % images.length));
            document.querySelectorAll('.pr-dot').forEach(d => d.addEventListener('click', () => goTo(parseInt(d.dataset.idx))));
        }
    } catch (err) {
        console.warn('PR popup failed:', err);
    }
}
