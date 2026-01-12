import { db } from '../services/mock-db.js';

export const renderDashboard = (container) => {
    const warehouses = db.getWarehouses();

    // Calculate Stats
    let totalParcels = 0;
    let pendingChecks = 0;
    let completedChecks = 0;

    warehouses.forEach(w => {
        totalParcels += w.parcels.length;
        pendingChecks += w.parcels.filter(p => !p.status || p.status === 'pending').length;
        completedChecks += w.parcels.filter(p => p.status === 'confirmed').length;
        // Note: 'checked' (Inspector done) is technically pending Manager approval. 
        // Or we can count 'checked' as completed for the Inspector. 
        // Let's count 'checked' + 'confirmed' as Inspector Progress? 
        // User asked "Pending Checks". 'checked' is waiting for Manager. 'pending' is waiting for Inspector.
        // Let's stick to: Pending = 'pending', Completed = 'confirmed'. 
        // And maybe show 'Waiting Appr' if we want.
        // For simple dashboard:
        // Pending = 'pending'
        // Completed = 'confirmed'
    });

    const html = `
        <div class="dashboard-header" style="margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>Dashboard</h1>
                <p style="color: var(--text-muted)">Overview of ${warehouses.length} Warehouses</p>
            </div>
            <div style="position: relative; display: flex; gap: 8px;">
                <input type="file" id="excel-upload" accept=".xlsx, .xls" style="display: none;">
                <button class="btn btn-primary" onclick="window.triggerExport()" style="background: var(--success);">
                    <i data-lucide="download" style="vertical-align: middle; margin-right: 8px;"></i>
                    Export
                </button>
                <button class="btn btn-primary" onclick="document.getElementById('excel-upload').click()">
                    <i data-lucide="file-spreadsheet" style="vertical-align: middle; margin-right: 8px;"></i>
                    Import
                </button>
                 <button class="btn btn-primary" id="settings-btn" style="background: rgba(255,255,255,0.1); color: var(--text-main);">
                    <i data-lucide="settings" style="vertical-align: middle;"></i>
                </button>
                <button class="btn btn-danger" id="clear-data-btn" style="background: var(--danger); color: white;">
                    <i data-lucide="trash-2" style="vertical-align: middle;"></i>
                </button>
            </div>
        </div>

        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-lg);">
             <div class="card">
                <h3>Total Parcels</h3>
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-light)">${totalParcels}</div>
             </div>
             <div class="card">
                <h3>Pending Checks</h3>
                <div style="font-size: 2rem; font-weight: 700; color: var(--warning)">${pendingChecks}</div>
             </div>
             <div class="card">
                <h3>Confirmed</h3>
                <div style="font-size: 2rem; font-weight: 700; color: var(--success)">${completedChecks}</div>
             </div>
        </div>

        <div class="warehouse-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-md);">
            ${warehouses.map(w => {
        const total = w.parcels.length;
        const confirmed = w.parcels.filter(p => p.status === 'confirmed').length;
        const progress = total > 0 ? (confirmed / total) * 100 : 0;

        return `
                <div class="card warehouse-card" data-id="${w.id}" style="cursor: pointer; position: relative; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-sm);">
                        <div style="background: rgba(59, 130, 246, 0.2); padding: 8px; border-radius: 8px;">
                            <i data-lucide="warehouse" style="color: var(--primary-light)"></i>
                        </div>
                        <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px;">
                            ${total} items
                        </span>
                    </div>
                    <h3 style="margin-bottom: 4px;">${w.name}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: var(--space-sm);">
                        ${confirmed} / ${total} Confirmed
                    </p>
                    <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background: var(--success); transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `}).join('')}
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons();

    // Add Click Handlers
    container.querySelectorAll('.warehouse-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            // console.log(`Navigating to Warehouse: ${id}`);
            window.appStore.setView('warehouse', { warehouseId: id });
        });
    });

    // Excel Upload Handler
    const excelInput = container.querySelector('#excel-upload');
    if (excelInput) {
        import('../services/excel-service.js').then(({ ExcelService }) => {
            excelInput.addEventListener('change', ExcelService.handleFileSelect);

            // Expose Export globally for the button onclick (or attach listener properly)
            window.triggerExport = ExcelService.exportToExcel;
        });
    }

    // Clear Data Handler
    const clearBtn = container.querySelector('#clear-data-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to CLEAR ALL DATA? This cannot be undone.')) {
                db.clearData();
            }
        });
    }
    // Settings Handler
    const settingsBtn = container.querySelector('#settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const currentUrl = db.getApiUrl() || '';
            const newUrl = prompt("Enter Google Apps Script API URL to Sync Data:", currentUrl);
            if (newUrl !== null) {
                const cleanUrl = newUrl.trim();
                db.setApiUrl(cleanUrl).then((success) => {
                    if (success) {
                        alert("Connected! Data synced from Cloud.");
                        location.reload();
                    } else if (cleanUrl) {
                        alert("Could not connect. Check URL.");
                    }
                });
            }
        });
    }
};
