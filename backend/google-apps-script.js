// CODE FOR GOOGLE APPS SCRIPT
// 1. Go to https://script.google.com/
// 2. New Project -> Paste this code
// 3. Deploy -> New Deployment -> Web App -> execute as: "Me", who has access: "Anyone"
// 4. Copy the URL and paste it into the Warehouse App Settings

function doGet(e) {
    return handleRequest(e);
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        // Parse payload from form data or direct JSON
        let data = {};
        if (e.parameter && e.parameter.payload) {
            data = JSON.parse(e.parameter.payload);
        } else if (e.postData && e.postData.contents) {
            try {
                data = JSON.parse(e.postData.contents);
            } catch (err) {
                // Try to parse as form data
                const params = e.postData.contents.split('&');
                for (const param of params) {
                    const [key, value] = param.split('=');
                    if (key === 'payload') {
                        data = JSON.parse(decodeURIComponent(value));
                        break;
                    }
                }
            }
        }
        const action = data.action || e.parameter.action;

        if (action === 'getParcels') {
            return responseJSON(getAllParcels());
        }

        if (action === 'saveParcel') {
            return responseJSON(saveParcel(data.parcel, data.warehouseId));
        }

        if (action === 'saveParcels') {
            return responseJSON(saveParcels(data.parcels));
        }

        if (action === 'clearData') {
            clearAllData();
            return responseJSON({ success: true });
        }

        return responseJSON({ error: 'Unknown Action' });

    } catch (err) {
        return responseJSON({ error: err.toString() });
    } finally {
        lock.releaseLock();
    }
}

// --- Logic ---

// Get or Create the Database Spreadsheet
function getDbSpreadsheet() {
    const props = PropertiesService.getScriptProperties();
    let ssId = props.getProperty('DB_SPREADSHEET_ID');

    if (ssId) {
        try {
            return SpreadsheetApp.openById(ssId);
        } catch (e) {
            // Spreadsheet was deleted, create new one
            ssId = null;
        }
    }

    // Create new spreadsheet
    const ss = SpreadsheetApp.create('Warehouse_App_Database');
    props.setProperty('DB_SPREADSHEET_ID', ss.getId());
    console.log('Created new database spreadsheet: ' + ss.getUrl());
    return ss;
}

function getDbSheet() {
    const ss = getDbSpreadsheet();
    let sheet = ss.getSheetByName('DB_Parcels');
    if (!sheet) {
        sheet = ss.insertSheet('DB_Parcels');
        // Headers: "ID", "WarehouseID", "DataJSON", "LastUpdated"
        sheet.appendRow(['ID', 'WarehouseID', 'DataJSON', 'LastUpdated']);
    }
    return sheet;
}

function getImageFolder() {
    const folders = DriveApp.getFoldersByName('Warehouse_App_Images');
    if (folders.hasNext()) {
        return folders.next();
    } else {
        return DriveApp.createFolder('Warehouse_App_Images');
    }
}

function getAllParcels() {
    const sheet = getDbSheet();
    const rows = sheet.getDataRange().getValues();
    const warehouses = initializeWarehouses(); // Helper to structure default 34 warehouses

    // Skip Header (row 0)
    for (let i = 1; i < rows.length; i++) {
        const [id, whId, jsonStr] = rows[i];
        try {
            const parcel = JSON.parse(jsonStr);
            const wh = warehouses.find(w => w.id === whId);
            if (wh) {
                wh.parcels.push(parcel);
            }
        } catch (e) { }
    }

    // Also get Enums if we store them?
    // For simplicity, let's keep Enums in a separate sheet or PropertyService.
    // We'll stick to hardcoded + learnt enums in client for now or add 'MetaData' sheet later.
    // Let's rely on client to manage enums locally or push them. 

    return { warehouses };
}

function saveParcel(parcel, warehouseId) {
    const sheet = getDbSheet();

    // Image Handling: If photo is Base64, upload to Drive, replace with URL
    if (parcel.photo && parcel.photo.startsWith('data:image')) {
        const imageUrl = uploadImage(parcel.photo, parcel.id);
        parcel.photo = imageUrl;
    }

    const jsonStr = JSON.stringify(parcel);
    const rows = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Check if exists
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === parcel.id) {
            rowIndex = i + 1; // 1-based
            break;
        }
    }

    if (rowIndex > 0) {
        // Update
        sheet.getRange(rowIndex, 1, 1, 4).setValues([[parcel.id, warehouseId, jsonStr, new Date()]]);
    } else {
        // Insert
        sheet.appendRow([parcel.id, warehouseId, jsonStr, new Date()]);
    }

    return { success: true, parcel }; // Return updated parcel with Image URL
}

function saveParcels(items) {
    // items = [{ parcel: {}, warehouseId: 'wh-1' }, ...]
    // Optimization: Read all rows once, then append/update in batches?
    // For simplicity/reliability in v1, let's reuse saveParcel but carefully.
    // Ideally, we prepare a big array for appendRow to minimize I/O.

    // For now, let's just loop. It might be slow 500 items -> 500 secs if naive.
    // Apps Script is slow with individual calls. We MUST batch.

    const sheet = getDbSheet();
    const rows = sheet.getDataRange().getValues();
    const existingIds = new Map();
    rows.forEach((r, i) => { if (i > 0) existingIds.set(r[0], i + 1); }); // ID -> RowIndex

    const newRows = [];
    const updates = []; // { rowIndex, values }

    items.forEach(item => {
        const p = item.parcel;
        const wid = item.warehouseId;

        // Skip image upload for bulk import if empty/null to save time?
        // Excel import usually has no photos. 
        // If it DOES, we can't batch easily. Assume no photos for Bulk Excel Import.

        const jsonStr = JSON.stringify(p);
        const rowData = [p.id, wid, jsonStr, new Date()];

        if (existingIds.has(p.id)) {
            updates.push({ r: existingIds.get(p.id), val: rowData });
        } else {
            newRows.push(rowData);
        }
    });

    // Process Updates (One by one unfortunately unless contiguous, but usually import is NEW data)
    updates.forEach(u => {
        sheet.getRange(u.r, 1, 1, 4).setValues([u.val]);
    });

    // Process New (Batch Append)
    if (newRows.length > 0) {
        // appendRow only takes 1 row. getRange().setValues takes matrix.
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, newRows.length, 4).setValues(newRows);
    }

    return { success: true, count: items.length };
}

function uploadImage(base64Str, id) {
    const folder = getImageFolder();
    const contentType = base64Str.split(',')[0].split(':')[1].split(';')[0];
    const decoded = Utilities.base64Decode(base64Str.split(',')[1]);
    const blob = Utilities.newBlob(decoded, contentType, `img_${id}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
}

function clearAllData() {
    const sheet = getDbSheet();
    sheet.clearContents();
    sheet.appendRow(['ID', 'WarehouseID', 'DataJSON', 'LastUpdated']);
}

function initializeWarehouses() {
    return Array.from({ length: 34 }, (_, i) => ({
        id: `wh-${i + 1}`,
        name: `Warehouse ${i + 1}`,
        parcels: []
    }));
}

function responseJSON(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
