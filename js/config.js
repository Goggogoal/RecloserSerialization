// ============================================================
// PEA-AIMS Configuration
// ============================================================

export const CONFIG = {
    // Set to false and provide GAS_URL to connect to real Google Sheets
    DEMO_MODE: false,

    // Google Apps Script Web App deployment URL
    // Replace with your actual GAS deployment URL when ready
    GAS_URL: 'https://script.google.com/macros/s/AKfycbya5VLg25hWevu4dDXLV8JN-4-CI_Lb9s35xjItEXqcIPhFkXan1wm8L5Sv2YfhSB_5gg/exec',

    // App metadata
    APP_NAME: 'PEA-AIMS',
    APP_TITLE: 'PEA Asset Inventory Management System',
    VERSION: '1.0.0',

    // Session storage key
    SESSION_KEY: 'pea_aims_session',
    DATA_KEY: 'pea_aims_data',

    // Material types
    MATERIAL_TYPES: ['Recloser', 'Control Cabinet', 'PT'],

    // Status values
    STATUS: {
        PENDING: 'Pending',
        INSPECTED: 'Inspected',
        APPROVED: 'Approved',
        REJECTED: 'Rejected'
    },

    // Batch types
    BATCH: {
        NEW: 'N',
        REFURBISHED: 'R'
    }
};
