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
        // Headers
        const headers = [
            'ID', 'WarehouseID', 'Type', 'Serial', 'PEA', 'Brand', 'Model',
            'Remarks', 'Inspector', 'Tel', 'Photo', 'PEA Photo', 'Status', 'LastUpdated', 'DataJSON'
        ];
        sheet.appendRow(headers);
    }
    return sheet;
}

function getImageFolder() {
    const folders = DriveApp.getFoldersByName('RecloserSerializePhoto');
    if (folders.hasNext()) {
        return folders.next();
    } else {
        return DriveApp.createFolder('RecloserSerializePhoto');
    }
}

function getAllParcels() {
    const sheet = getDbSheet();
    const rows = sheet.getDataRange().getValues();
    const warehouses = initializeWarehouses(); // Helper to structure default 34 warehouses

    // Skip Header (row 0)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Schema: [ID, WarehouseID, Type ... DataJSON]
        // DataJSON is at index 14 (15th column)
        const id = row[0];
        const whId = row[1];
        const jsonStr = row[14];

        try {
            if (jsonStr) {
                const parcel = JSON.parse(jsonStr);
                const wh = warehouses.find(w => w.id === whId);
                if (wh) {
                    wh.parcels.push(parcel);
                }
            }
        } catch (e) {
            // Fallback: If JSON is invalid, maybe reconstruct from columns? 
            // For now, mostly rely on JSON.
        }
    }

    return { warehouses };
}

function saveParcel(parcel, warehouseId) {
    const sheet = getDbSheet();

    // Image Handling: Upload Parcel Photo
    if (parcel.photo && parcel.photo.startsWith('data:image')) {
        const imageUrl = uploadImage(parcel.photo, parcel.id + "_main");
        parcel.photo = imageUrl;
    }

    // Image Handling: Upload PEA Photo
    if (parcel.peaPhoto && parcel.peaPhoto.startsWith('data:image')) {
        const imageUrl = uploadImage(parcel.peaPhoto, parcel.id + "_pea");
        parcel.peaPhoto = imageUrl;
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

    // Schema: 
    // [ID, WarehouseID, Type, Serial, PEA, Brand, Model, Remarks, Inspector, Tel, Photo, PEA Photo, Status, LastUpdated, DataJSON]
    const rowData = [
        parcel.id,
        warehouseId,
        parcel.type || '',
        parcel.serial || '',
        parcel.peaNo || '',
        parcel.brand || '',
        parcel.model || '',
        parcel.remarks || '',
        parcel.inspectorName || '',
        parcel.inspectorTel || '',
        parcel.photo || '',
        parcel.peaPhoto || '',
        parcel.status || 'pending',
        new Date(),
        jsonStr
    ];

    if (rowIndex > 0) {
        // Update
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
        // Insert
        sheet.appendRow(rowData);
    }

    return { success: true, parcel }; // Return updated parcel with Image URL
}

function saveParcels(items) {
    // items = [{ parcel: {}, warehouseId: 'wh-1' }, ...]
    const sheet = getDbSheet();
    const rows = sheet.getDataRange().getValues();
    const existingIds = new Map();
    rows.forEach((r, i) => { if (i > 0) existingIds.set(r[0], i + 1); }); // ID -> RowIndex

    const newRows = [];
    const updates = []; // { rowIndex, values }

    items.forEach(item => {
        const p = item.parcel;
        const wid = item.warehouseId;

        const jsonStr = JSON.stringify(p);

        // Schema: 
        // [ID, WarehouseID, Type, Serial, PEA, Brand, Model, Remarks, Inspector, Tel, Photo, PEA Photo, Status, LastUpdated, DataJSON]
        const rowData = [
            p.id,
            wid,
            p.type || '',
            p.serial || '',
            p.peaNo || '',
            p.brand || '',
            p.model || '',
            p.remarks || '',
            p.inspectorName || '',
            p.inspectorTel || '',
            p.photo || '',
            p.peaPhoto || '',
            p.status || 'pending',
            new Date(),
            jsonStr
        ];

        if (existingIds.has(p.id)) {
            updates.push({ r: existingIds.get(p.id), val: rowData });
        } else {
            newRows.push(rowData);
        }
    });

    // Process Updates
    updates.forEach(u => {
        sheet.getRange(u.r, 1, 1, u.val.length).setValues([u.val]);
    });

    // Process New (Batch Append)
    if (newRows.length > 0) {
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
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
    // Headers
    const headers = [
        'ID', 'WarehouseID', 'Type', 'Serial', 'PEA', 'Brand', 'Model',
        'Remarks', 'Inspector', 'Tel', 'Photo', 'PEA Photo', 'Status', 'LastUpdated', 'DataJSON'
    ];
    sheet.appendRow(headers);
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
