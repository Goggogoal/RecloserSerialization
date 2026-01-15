import { db } from './mock-db.js';

export const ExcelService = {
    handleFileSelect: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        ExcelService.processFile(file);
        e.target.value = ''; // Reset input to allow re-selecting the same file
    },

    processFile: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Assume first sheet contains the data
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

            console.log('Parsed Excel Data:', jsonData);

            // TODO: Map to app structure
            // We assume a simple structure: Warehouse Name | Recloser | VT | Control | Hanger
            // OR checks against an existing template. 
            // For this prototype, we will perform a "Best Guess" map or just log it.

            ExcelService.importToDb(jsonData);
        };
        reader.readAsArrayBuffer(file);
    },

    importToDb: (rows) => {
        // Simple logic: Look for Warehouse name in column 0, and quantities in next columns
        // This is a placeholder logic that can be refined based on the actual Excel format

        let importCount = 0;
        const warehouses = db.getWarehouses(); // Read only for lookup
        const itemsToSave = []; // { parcel, warehouseId }

        rows.forEach((row, index) => {
            if (index < 1) return; // Skip header

            // Heuristic matching
            const whNameCandidate = row[0]; // e.g., "Warehouse 1"
            if (!whNameCandidate) return;

            const existingWh = warehouses.find(w => w.name.toLowerCase().includes(String(whNameCandidate).toLowerCase()));

            if (existingWh) {
                // Column Mapping based on sample generator:
                // 0: Name, 1: Recloser, 2: VT, 3: Control, 4: Hanger
                const types = ['Recloser', 'VT', 'Control', 'Hanger'];
                const counts = [row[1], row[2], row[3], row[4]];

                types.forEach((type, typeIdx) => {
                    const qty = parseInt(counts[typeIdx]) || 0;
                    for (let i = 0; i < qty; i++) {
                        const newParcel = {
                            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            type: type,
                            status: 'pending',
                            timestamp: new Date().toISOString(),
                            serial: '', peaNo: '', brand: '', model: '', remarks: '', photo: null
                        };

                        itemsToSave.push({
                            parcel: newParcel,
                            warehouseId: existingWh.id
                        });
                    }
                });
            }
        });

        if (itemsToSave.length > 0) {
            importCount = itemsToSave.length;
            // Use Bulk Save
            db.saveParcels(itemsToSave).then(() => {
                alert(`Successfully imported ${importCount} new pending parcels and synced to cloud.`);
                location.reload();
            });
        } else {
            alert("No matching data found to import.");
        }
    },



    exportToExcel: () => {
        const warehouses = db.getWarehouses();
        const exportData = [];

        // Header
        exportData.push(['Warehouse', 'Parcel Type', 'Serial No', 'PEA No', 'Brand', 'Model', 'Status', 'Inspector', 'Telephone', 'Remarks', 'Last Updated']);

        warehouses.forEach(w => {
            if (w.parcels.length === 0) {
                // empty (optional)
            } else {
                w.parcels.forEach(p => {
                    exportData.push([
                        w.name,
                        p.type || '',
                        p.serial || '',
                        p.peaNo || '',
                        p.brand || '',
                        p.model || '',
                        p.status || 'Pending',
                        p.inspectorName || '',
                        p.inspectorTel || '',
                        p.remarks || '',
                        p.timestamp || ''
                    ]);
                });
            }
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Inspection Data");

        // Generate filename with date
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `inspection_export_${dateStr}.xlsx`);
    }
};
