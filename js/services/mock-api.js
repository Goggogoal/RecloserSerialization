// ============================================================
// PEA-AIMS Mock API (Demo Mode) — v2 with SLoc support
// ============================================================

import { CONFIG } from '../config.js';

const MOCK_USERS = [
    { username: 'admin', password: '1234', role: 'Admin', zone: 'ALL', fullName: 'System Administrator' },
    { username: 'manager_a', password: '1234', role: 'Manager', zone: 'A', fullName: 'สมชาย ผู้จัดการ' },
    { username: 'manager_b', password: '1234', role: 'Manager', zone: 'B', fullName: 'สมหญิง ผู้จัดการ' },
    { username: 'inspector_a', password: '1234', role: 'Inspector', zone: 'A', fullName: 'สมศักดิ์ ผู้ตรวจ' },
    { username: 'inspector_b', password: '1234', role: 'Inspector', zone: 'B', fullName: 'สมปอง ผู้ตรวจ' }
];

const MOCK_WAREHOUSES = [
    { name: 'คลังพัสดุ กฟจ.นครราชสีมา', code: 'WH-NMA01', sloc: 'SL01', zone: 'A' },
    { name: 'คลังพัสดุ กฟจ.นครราชสีมา', code: 'WH-NMA01', sloc: 'SL02', zone: 'A' },
    { name: 'คลังพัสดุ กฟจ.บุรีรัมย์', code: 'WH-BRM01', sloc: 'SL01', zone: 'A' },
    { name: 'คลังพัสดุ กฟจ.บุรีรัมย์', code: 'WH-BRM01', sloc: 'SL03', zone: 'A' },
    { name: 'คลังพัสดุ กฟจ.สุรินทร์', code: 'WH-SRN01', sloc: 'SL01', zone: 'A' },
    { name: 'คลังพัสดุ กฟจ.ขอนแก่น', code: 'WH-KKN01', sloc: 'SL01', zone: 'B' },
    { name: 'คลังพัสดุ กฟจ.ขอนแก่น', code: 'WH-KKN01', sloc: 'SL02', zone: 'B' },
    { name: 'คลังพัสดุ กฟจ.อุดรธานี', code: 'WH-UDN01', sloc: 'SL01', zone: 'B' },
    { name: 'คลังพัสดุ กฟจ.มหาสารคาม', code: 'WH-MKM01', sloc: 'SL01', zone: 'B' }
];

// Now MB52 includes SLoc — each row = unique (whCode + sloc + materialType + batch)
const MOCK_MB52 = [
    // WH-NMA01 / SL01
    { materialCode: 'MAT-REC-001', whName: 'คลังพัสดุ กฟจ.นครราชสีมา', whCode: 'WH-NMA01', sloc: 'SL01', batch: 'N', qty: 15, materialType: 'Recloser' },
    { materialCode: 'MAT-REC-002', whName: 'คลังพัสดุ กฟจ.นครราชสีมา', whCode: 'WH-NMA01', sloc: 'SL01', batch: 'R', qty: 5, materialType: 'Recloser' },
    { materialCode: 'MAT-CTL-001', whName: 'คลังพัสดุ กฟจ.นครราชสีมา', whCode: 'WH-NMA01', sloc: 'SL01', batch: 'N', qty: 12, materialType: 'Control Cabinet' },
    { materialCode: 'MAT-PT-001', whName: 'คลังพัสดุ กฟจ.นครราชสีมา', whCode: 'WH-NMA01', sloc: 'SL01', batch: 'N', qty: 8, materialType: 'PT' },
    // WH-NMA01 / SL02
    { materialCode: 'MAT-REC-008', whName: 'คลังพัสดุ กฟจ.นครราชสีมา', whCode: 'WH-NMA01', sloc: 'SL02', batch: 'N', qty: 10, materialType: 'Recloser' },
    { materialCode: 'MAT-CTL-008', whName: 'คลังพัสดุ กฟจ.นครราชสีมา', whCode: 'WH-NMA01', sloc: 'SL02', batch: 'N', qty: 6, materialType: 'Control Cabinet' },
    // WH-BRM01 / SL01
    { materialCode: 'MAT-REC-003', whName: 'คลังพัสดุ กฟจ.บุรีรัมย์', whCode: 'WH-BRM01', sloc: 'SL01', batch: 'N', qty: 10, materialType: 'Recloser' },
    { materialCode: 'MAT-CTL-002', whName: 'คลังพัสดุ กฟจ.บุรีรัมย์', whCode: 'WH-BRM01', sloc: 'SL01', batch: 'N', qty: 7, materialType: 'Control Cabinet' },
    { materialCode: 'MAT-PT-002', whName: 'คลังพัสดุ กฟจ.บุรีรัมย์', whCode: 'WH-BRM01', sloc: 'SL01', batch: 'R', qty: 4, materialType: 'PT' },
    // WH-BRM01 / SL03
    { materialCode: 'MAT-REC-009', whName: 'คลังพัสดุ กฟจ.บุรีรัมย์', whCode: 'WH-BRM01', sloc: 'SL03', batch: 'N', qty: 6, materialType: 'Recloser' },
    { materialCode: 'MAT-PT-007', whName: 'คลังพัสดุ กฟจ.บุรีรัมย์', whCode: 'WH-BRM01', sloc: 'SL03', batch: 'N', qty: 3, materialType: 'PT' },
    // WH-SRN01 / SL01
    { materialCode: 'MAT-REC-004', whName: 'คลังพัสดุ กฟจ.สุรินทร์', whCode: 'WH-SRN01', sloc: 'SL01', batch: 'N', qty: 8, materialType: 'Recloser' },
    { materialCode: 'MAT-CTL-003', whName: 'คลังพัสดุ กฟจ.สุรินทร์', whCode: 'WH-SRN01', sloc: 'SL01', batch: 'N', qty: 6, materialType: 'Control Cabinet' },
    { materialCode: 'MAT-PT-003', whName: 'คลังพัสดุ กฟจ.สุรินทร์', whCode: 'WH-SRN01', sloc: 'SL01', batch: 'N', qty: 5, materialType: 'PT' },
    // WH-KKN01 / SL01
    { materialCode: 'MAT-REC-005', whName: 'คลังพัสดุ กฟจ.ขอนแก่น', whCode: 'WH-KKN01', sloc: 'SL01', batch: 'N', qty: 20, materialType: 'Recloser' },
    { materialCode: 'MAT-CTL-004', whName: 'คลังพัสดุ กฟจ.ขอนแก่น', whCode: 'WH-KKN01', sloc: 'SL01', batch: 'N', qty: 14, materialType: 'Control Cabinet' },
    // WH-KKN01 / SL02
    { materialCode: 'MAT-PT-004', whName: 'คลังพัสดุ กฟจ.ขอนแก่น', whCode: 'WH-KKN01', sloc: 'SL02', batch: 'N', qty: 10, materialType: 'PT' },
    { materialCode: 'MAT-REC-010', whName: 'คลังพัสดุ กฟจ.ขอนแก่น', whCode: 'WH-KKN01', sloc: 'SL02', batch: 'R', qty: 8, materialType: 'Recloser' },
    // WH-UDN01 / SL01
    { materialCode: 'MAT-REC-006', whName: 'คลังพัสดุ กฟจ.อุดรธานี', whCode: 'WH-UDN01', sloc: 'SL01', batch: 'N', qty: 12, materialType: 'Recloser' },
    { materialCode: 'MAT-CTL-005', whName: 'คลังพัสดุ กฟจ.อุดรธานี', whCode: 'WH-UDN01', sloc: 'SL01', batch: 'R', qty: 9, materialType: 'Control Cabinet' },
    { materialCode: 'MAT-PT-005', whName: 'คลังพัสดุ กฟจ.อุดรธานี', whCode: 'WH-UDN01', sloc: 'SL01', batch: 'N', qty: 6, materialType: 'PT' },
    // WH-MKM01 / SL01
    { materialCode: 'MAT-REC-007', whName: 'คลังพัสดุ กฟจ.มหาสารคาม', whCode: 'WH-MKM01', sloc: 'SL01', batch: 'N', qty: 7, materialType: 'Recloser' },
    { materialCode: 'MAT-CTL-006', whName: 'คลังพัสดุ กฟจ.มหาสารคาม', whCode: 'WH-MKM01', sloc: 'SL01', batch: 'N', qty: 5, materialType: 'Control Cabinet' },
    { materialCode: 'MAT-PT-006', whName: 'คลังพัสดุ กฟจ.มหาสารคาม', whCode: 'WH-MKM01', sloc: 'SL01', batch: 'R', qty: 3, materialType: 'PT' }
];

const MOCK_CONTRACTS = [
    { contractNo: 'CTR-2024-001', poNo: 'PO-2024-0100', equipType: 'Recloser', peaStart: 'PEA-R-0001', peaEnd: 'PEA-R-0050', brand: 'ABB' },
    { contractNo: 'CTR-2024-002', poNo: 'PO-2024-0200', equipType: 'Recloser', peaStart: 'PEA-R-0051', peaEnd: 'PEA-R-0100', brand: 'Schneider' },
    { contractNo: 'CTR-2024-003', poNo: 'PO-2024-0300', equipType: 'Control Cabinet', peaStart: 'PEA-C-0001', peaEnd: 'PEA-C-0030', brand: 'Siemens' },
    { contractNo: 'CTR-2024-004', poNo: 'PO-2024-0400', equipType: 'PT', peaStart: 'PEA-T-0001', peaEnd: 'PEA-T-0025', brand: 'GE' },
    { contractNo: 'CTR-2024-005', poNo: 'PO-2024-0500', equipType: 'Recloser', peaStart: 'PEA-R-0101', peaEnd: 'PEA-R-0200', brand: 'Entec' },
    { contractNo: 'CTR-2024-006', poNo: 'PO-2024-0600', equipType: 'Control Cabinet', peaStart: 'PEA-C-0031', peaEnd: 'PEA-C-0080', brand: 'ABB' }
];

const MOCK_EQUIPMENT = [
    { materialNo: 'MAT-REC-001', equipType: 'Recloser', equipGroup: 'Switchgear' },
    { materialNo: 'MAT-CTL-001', equipType: 'Control Cabinet', equipGroup: 'Control' },
    { materialNo: 'MAT-PT-001', equipType: 'PT', equipGroup: 'Transformer' }
];

// Multiple PR pages
const MOCK_PR_IMAGES = [
    'https://placehold.co/600x400/103889/FFD700?text=PEA+News+1',
    'https://placehold.co/600x400/0b2660/FFE44D?text=PEA+Update+2',
    'https://placehold.co/600x400/5F1089/FFD700?text=PEA+Promo+3'
];

// Sample mock inspections data
const INITIAL_INSPECTIONS = [
    {
        id: 'INS-001', timestamp: '2024-12-01 10:30', inspectorId: 'inspector_a',
        warehouseCode: 'WH-NMA01', sloc: 'SL01', materialType: 'Recloser', batch: 'N',
        imageOverview: '', serialNo: 'SN-R-00012', peaNo: 'PEA-R-0012',
        imageNameplate: '', contractNo: 'CTR-2024-001', brand: 'ABB', model: 'OVR-III',
        remarks: 'Good condition', status: 'Inspected', managerComment: ''
    },
    {
        id: 'INS-002', timestamp: '2024-12-01 11:15', inspectorId: 'inspector_a',
        warehouseCode: 'WH-NMA01', sloc: 'SL01', materialType: 'Control Cabinet', batch: 'N',
        imageOverview: '', serialNo: 'SN-C-00005', peaNo: 'PEA-C-0005',
        imageNameplate: '', contractNo: 'CTR-2024-003', brand: 'Siemens', model: 'SC-200',
        remarks: '', status: 'Pending', managerComment: ''
    },
    {
        id: 'INS-003', timestamp: '2024-12-02 09:00', inspectorId: 'inspector_a',
        warehouseCode: 'WH-BRM01', sloc: 'SL01', materialType: 'Recloser', batch: 'N',
        imageOverview: '', serialNo: 'SN-R-00055', peaNo: 'PEA-R-0055',
        imageNameplate: '', contractNo: 'CTR-2024-002', brand: 'Schneider', model: 'RE-100',
        remarks: 'Minor scratches', status: 'Approved', managerComment: 'Verified OK'
    },
    {
        id: 'INS-004', timestamp: '2024-12-03 14:20', inspectorId: 'inspector_b',
        warehouseCode: 'WH-KKN01', sloc: 'SL01', materialType: 'PT', batch: 'N',
        imageOverview: '', serialNo: 'SN-T-00008', peaNo: 'PEA-T-0008',
        imageNameplate: '', contractNo: 'CTR-2024-004', brand: 'GE', model: 'PT-50',
        remarks: '', status: 'Inspected', managerComment: ''
    }
];

function getInspections() {
    const saved = localStorage.getItem(CONFIG.DATA_KEY + '_inspections');
    if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    localStorage.setItem(CONFIG.DATA_KEY + '_inspections', JSON.stringify(INITIAL_INSPECTIONS));
    return [...INITIAL_INSPECTIONS];
}

function saveInspections(data) {
    localStorage.setItem(CONFIG.DATA_KEY + '_inspections', JSON.stringify(data));
}

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export const mockApi = {
    async login({ username, password }) {
        await delay(500);
        const user = MOCK_USERS.find(u => u.username === username && u.password === password);
        if (user) return { success: true, user: { username: user.username, role: user.role, zone: user.zone, fullName: user.fullName } };
        return { success: false, message: 'Invalid username or password' };
    },

    async getPR() {
        await delay(200);
        return { success: true, images: MOCK_PR_IMAGES };
    },

    async getMasterData() {
        await delay(400);
        return { success: true, warehouses: MOCK_WAREHOUSES, contracts: MOCK_CONTRACTS, equipment: MOCK_EQUIPMENT, mb52: MOCK_MB52 };
    },

    async getDashboardStats({ zone }) {
        await delay(300);
        const inspections = getInspections();
        let mb52 = MOCK_MB52;
        let insp = inspections;

        if (zone && zone !== 'ALL') {
            const zoneCodes = [...new Set(MOCK_WAREHOUSES.filter(w => w.zone === zone).map(w => w.code))];
            mb52 = MOCK_MB52.filter(m => zoneCodes.includes(m.whCode));
            insp = inspections.filter(i => zoneCodes.includes(i.warehouseCode));
        }

        const totalStock = mb52.reduce((s, m) => s + m.qty, 0);
        const inspected = insp.filter(i => i.status === 'Inspected' || i.status === 'Approved').length;
        const approved = insp.filter(i => i.status === 'Approved').length;
        const pending = insp.filter(i => i.status === 'Pending').length;
        const progress = totalStock > 0 ? Math.round((inspected / totalStock) * 100) : 0;

        // Unique warehouses (deduplicated by code)
        const uniqueWHCodes = [...new Set(MOCK_WAREHOUSES.filter(w => !zone || zone === 'ALL' || w.zone === zone).map(w => w.code))];
        const warehouseStats = uniqueWHCodes.map(code => {
            const wh = MOCK_WAREHOUSES.find(w => w.code === code);
            const whMb52 = MOCK_MB52.filter(m => m.whCode === code);
            const whInsp = inspections.filter(i => i.warehouseCode === code);
            const types = CONFIG.MATERIAL_TYPES.map(type => {
                const stock = whMb52.filter(m => m.materialType === type).reduce((s, m) => s + m.qty, 0);
                const done = whInsp.filter(i => i.materialType === type && (i.status === 'Inspected' || i.status === 'Approved')).length;
                return { type, stock, done, progress: stock > 0 ? Math.round((done / stock) * 100) : 0 };
            });
            const totalWh = whMb52.reduce((s, m) => s + m.qty, 0);
            const doneWh = whInsp.filter(i => i.status === 'Inspected' || i.status === 'Approved').length;
            // Get SLocs for this warehouse
            const slocs = [...new Set(MOCK_WAREHOUSES.filter(w => w.code === code).map(w => w.sloc))];
            return {
                name: wh.name, code, zone: wh.zone, slocs,
                totalStock: totalWh, inspected: doneWh,
                progress: totalWh > 0 ? Math.round((doneWh / totalWh) * 100) : 0,
                types
            };
        });

        return { success: true, totalStock, inspected, approved, pending, progress, warehouseStats };
    },

    async getSLocStats({ warehouseCode }) {
        await delay(300);
        const inspections = getInspections();
        const wh = MOCK_WAREHOUSES.find(w => w.code === warehouseCode);
        if (!wh) return { success: false, message: 'Warehouse not found' };
        const slocs = [...new Set(MOCK_WAREHOUSES.filter(w => w.code === warehouseCode).map(w => w.sloc))];
        const slocStats = slocs.map(sloc => {
            const slocMb52 = MOCK_MB52.filter(m => m.whCode === warehouseCode && m.sloc === sloc);
            const slocInsp = inspections.filter(i => i.warehouseCode === warehouseCode && i.sloc === sloc);
            const types = CONFIG.MATERIAL_TYPES.map(type => {
                const stock = slocMb52.filter(m => m.materialType === type).reduce((s, m) => s + m.qty, 0);
                const done = slocInsp.filter(i => i.materialType === type && (i.status === 'Inspected' || i.status === 'Approved')).length;
                return { type, stock, done, progress: stock > 0 ? Math.round((done / stock) * 100) : 0 };
            });
            const total = slocMb52.reduce((s, m) => s + m.qty, 0);
            const done = slocInsp.filter(i => i.status === 'Inspected' || i.status === 'Approved').length;
            return { sloc, types, totalStock: total, inspected: done, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
        });
        return { success: true, warehouseName: wh.name, warehouseCode, slocStats };
    },

    async getInspections({ warehouseCode, sloc, materialType, zone, status }) {
        await delay(300);
        let data = getInspections();
        if (zone && zone !== 'ALL') {
            const zoneCodes = [...new Set(MOCK_WAREHOUSES.filter(w => w.zone === zone).map(w => w.code))];
            data = data.filter(i => zoneCodes.includes(i.warehouseCode));
        }
        if (warehouseCode) data = data.filter(i => i.warehouseCode === warehouseCode);
        if (sloc) data = data.filter(i => i.sloc === sloc);
        if (materialType) data = data.filter(i => i.materialType === materialType);
        if (status) data = data.filter(i => i.status === status);
        return { success: true, inspections: data };
    },

    async getInspectionById({ id }) {
        await delay(200);
        const data = getInspections();
        const item = data.find(i => i.id === id);
        if (!item) return { success: false, message: 'Not found' };
        return { success: true, inspection: item };
    },

    async submitInspection(inspection) {
        await delay(500);
        const data = getInspections();
        const newItem = {
            ...inspection,
            id: 'INS-' + String(data.length + 1).padStart(3, '0'),
            timestamp: new Date().toLocaleString('th-TH'),
            status: 'Inspected'
        };
        data.push(newItem);
        saveInspections(data);
        return { success: true, inspection: newItem };
    },

    async updateInspection({ id, updates }) {
        await delay(400);
        const data = getInspections();
        const idx = data.findIndex(i => i.id === id);
        if (idx === -1) return { success: false, message: 'Inspection not found' };
        data[idx] = { ...data[idx], ...updates };
        saveInspections(data);
        return { success: true, inspection: data[idx] };
    },

    async approveInspection({ id, comment }) {
        await delay(400);
        const data = getInspections();
        const idx = data.findIndex(i => i.id === id);
        if (idx === -1) return { success: false, message: 'Inspection not found' };
        data[idx].status = 'Approved';
        if (comment) data[idx].managerComment = comment;
        saveInspections(data);
        return { success: true, inspection: data[idx] };
    },

    async rejectInspection({ id, comment }) {
        await delay(400);
        const data = getInspections();
        const idx = data.findIndex(i => i.id === id);
        if (idx === -1) return { success: false, message: 'Inspection not found' };
        data[idx].status = 'Rejected';
        data[idx].managerComment = comment || 'Rejected by manager';
        saveInspections(data);
        return { success: true, inspection: data[idx] };
    }
};
