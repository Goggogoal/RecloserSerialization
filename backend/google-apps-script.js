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
        const action = e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action);
        const data = e.postData ? JSON.parse(e.postData.contents) : {};

        if (action === 'getParcels') {
            return responseJSON(getAllParcels());
        }

        if (action === 'saveParcel') {
            return responseJSON(saveParcel(data.parcel, data.warehouseId));
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

function getDbSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
