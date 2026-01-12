import { db } from '../services/mock-db.js';

export const renderWarehouseView = (container, warehouseId, currentFilter = 'All') => {
    const warehouse = db.getWarehouse(warehouseId);

    // Safety check
    if (!warehouse) {
        container.innerHTML = `<div class="error">Warehouse not found</div>`;
        return;
    }

    // Filter Logic
    const filteredParcels = currentFilter === 'All'
        ? warehouse.parcels
        : warehouse.parcels.filter(p => p.type === currentFilter);

    const html = `
        <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
            <button id="back-btn" class="btn" style="background: rgba(255,255,255,0.1); color: var(--text-main);">
                <i data-lucide="arrow-left"></i>
            </button>
            <div>
                 <h1 style="font-size: 1.5rem; margin-bottom: 0;">${warehouse.name}</h1>
                 <p style="color: var(--text-muted); font-size: 0.9rem;">Inspect Inventory</p>
            </div>
            <div style="margin-left: auto;">
                 <button id="add-parcel-btn" class="btn btn-primary" style="display: flex; gap: 8px; align-items: center;">
                    <i data-lucide="plus"></i> Add Parcel
                 </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="glass-bg filter-bar" style="padding: var(--space-sm); border-radius: var(--radius-md); border: var(--glass-border); margin-bottom: var(--space-md); display: flex; gap: var(--space-sm); overflow-x: auto;">
            <button class="btn filter-btn ${currentFilter === 'All' ? 'active' : ''}" data-filter="All" style="${currentFilter === 'All' ? 'background: var(--primary); color: white;' : 'background: transparent; color: var(--text-muted);'}">All</button>
            <button class="btn filter-btn ${currentFilter === 'Recloser' ? 'active' : ''}" data-filter="Recloser" style="${currentFilter === 'Recloser' ? 'background: var(--primary); color: white;' : 'background: transparent; color: var(--text-muted);'}">Recloser</button>
            <button class="btn filter-btn ${currentFilter === 'VT' ? 'active' : ''}" data-filter="VT" style="${currentFilter === 'VT' ? 'background: var(--primary); color: white;' : 'background: transparent; color: var(--text-muted);'}">VT</button>
            <button class="btn filter-btn ${currentFilter === 'Control' ? 'active' : ''}" data-filter="Control" style="${currentFilter === 'Control' ? 'background: var(--primary); color: white;' : 'background: transparent; color: var(--text-muted);'}">Control</button>
            <button class="btn filter-btn ${currentFilter === 'Hanger' ? 'active' : ''}" data-filter="Hanger" style="${currentFilter === 'Hanger' ? 'background: var(--primary); color: white;' : 'background: transparent; color: var(--text-muted);'}">Hanger</button>
        </div>

        <!-- Parcel List -->
        <div class="parcel-list" style="display: grid; gap: var(--space-sm);">
            ${filteredParcels.length === 0 ? `
                <div style="text-align: center; padding: var(--space-xl); color: var(--text-muted); background: var(--glass-bg); border-radius: var(--radius-md);">
                    <i data-lucide="box-select" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: var(--space-sm);"></i>
                    <p>No parcels found for this filter.</p>
                </div>
            ` : filteredParcels.map(p => `
                <div class="card" style="display: flex; gap: var(--space-md); align-items: center;">
                    <div style="width: 60px; height: 60px; background: rgba(0,0,0,0.3); border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0;">
                        ${p.photo ? `<img src="${p.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);"><i data-lucide="image"></i></div>`}
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 2px;">${p.brand || 'Unknown'} - ${p.model || 'Unknown'}</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: var(--space-sm); font-size: 0.85rem; color: var(--text-muted);">
                            <span><i data-lucide="hashtag" style="width: 12px;"></i> ${p.serial || '-'}</span>
                            <span><i data-lucide="tag" style="width: 12px;"></i> ${p.type}</span>
                        </div>
                        ${(p.inspectorName || p.inspectorTel) ? `
                            <div style="margin-top: 4px; font-size: 0.8rem; color: var(--text-main); opacity: 0.8;">
                                <i data-lucide="user" style="width: 12px; vertical-align: middle;"></i> ${p.inspectorName || '-'} 
                                <span style="margin: 0 4px;">|</span>
                                <i data-lucide="phone" style="width: 12px; vertical-align: middle;"></i> ${p.inspectorTel || '-'}
                            </div>
                        ` : ''}
                    </div>
                    <div class="status-badge" style="padding: 4px 12px; border-radius: 12px; background: rgba(255,255,255,0.1); font-size: 0.8rem; margin-left: auto;">
                        ${p.status || 'Pending'}
                    </div>
                    ${(window.appStore && window.appStore.state.role === 'inspector') ? `
                        <button class="btn btn-icon edit-btn" data-id="${p.id}" style="background: transparent; color: var(--text-muted); margin-left: 8px; padding: 4px;">
                            <i data-lucide="edit-2"></i>
                        </button>
                    ` : ''}
                </div>
                ${(window.appStore && window.appStore.state.role === 'manager' && p.status === 'checked') ? `
                    <div style="text-align: right; margin-top: 8px;">
                         <button class="btn confirm-btn" data-id="${p.id}" style="background: var(--success); color: white; padding: 4px 12px; font-size: 0.8rem;">
                            <i data-lucide="check-circle" style="width: 14px; vertical-align: middle;"></i> Confirm
                         </button>
                    </div>
                ` : ''}
            `).join('')}
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons();

    // Event Handlers
    document.getElementById('back-btn').addEventListener('click', () => {
        window.appStore.setView('dashboard');
    });

    document.getElementById('add-parcel-btn').addEventListener('click', () => {
        import('./parcel-form.js').then(module => {
            module.createParcelModal(warehouseId, () => {
                // Refresh View
                renderWarehouseView(container, warehouseId, currentFilter);
            });
        });
    });

    // Filter Handlers
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            renderWarehouseView(container, warehouseId, filter);
        });
    });

    // Manager Actions
    container.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const parcelId = btn.dataset.id;
            const parcel = warehouse.parcels.find(p => p.id === parcelId);
            if (parcel) {
                parcel.status = 'confirmed';
                db.saveParcel(warehouseId, parcel);
                renderWarehouseView(container, warehouseId, currentFilter); // Refresh with current filter
            }
        });
    });

    // Inspector Edit Actions
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const parcelId = btn.dataset.id;
            const parcel = warehouse.parcels.find(p => p.id === parcelId);
            if (parcel) {
                import('./parcel-form.js').then(module => {
                    module.createParcelModal(warehouseId, () => {
                        renderWarehouseView(container, warehouseId, currentFilter);
                    }, parcel);
                });
            }
        });
    });
};
