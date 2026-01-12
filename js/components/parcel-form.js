import { db } from '../services/mock-db.js';

export const createParcelModal = (warehouseId, onClose, existingData = null) => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    Object.assign(modalOverlay.style, {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    });

    const modalContent = document.createElement('div');
    modalContent.className = 'glass-bg';
    Object.assign(modalContent.style, {
        background: 'var(--bg-card)', padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '500px',
        border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)',
        maxHeight: '90vh', overflowY: 'auto'
    });

    const isEdit = !!existingData;
    const initialPhoto = isEdit ? existingData.photo : null;

    const enums = db.getEnums();

    // Helper to generate options
    const generateOptions = (list, currentVal) => {
        let html = `<option value="" disabled ${!currentVal ? 'selected' : ''}>Select Option</option>`;
        list.forEach(item => {
            html += `<option value="${item}" ${currentVal === item ? 'selected' : ''}>${item}</option>`;
        });
        // If currentVal is not in list (legacy or manual entry), add it? Or let 'Other' handle it?
        // If it's not in list, maybe it was an "Other" entry from before that should be in list now.
        // But if we just loaded, it should be in list.
        html += `<option value="Other">Other (Add New)</option>`;
        return html;
    };

    modalContent.innerHTML = `
        <h2 style="margin-bottom: var(--space-md);">${isEdit ? 'Edit Parcel' : 'Add Parcel Detail'}</h2>
        <form id="parcel-form" style="display: grid; gap: var(--space-md);">
            <!-- Image Upload -->
            <div class="form-group">
                <label style="display: block; margin-bottom: 8px;">Parcel Photo</label>
                <div id="drop-zone" style="border: 2px dashed var(--glass-border); padding: 20px; text-align: center; border-radius: var(--radius-md); cursor: pointer; transition: 0.2s; position: relative; overflow: hidden;">
                    <i data-lucide="upload-cloud" style="margin-bottom: 8px;"></i>
                    <p style="font-size: 0.9rem; color: var(--text-muted)">Click to Upload or Drag photo</p>
                    
                    <button type="button" id="camera-btn" style="margin-top: 10px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--text-muted); padding: 6px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="camera"></i> Use Camera
                    </button>

                    <input type="file" id="photo-input" accept="image/*" capture="environment" style="display: none;">
                    
                    <div id="camera-stream-container" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 10;">
                        <video id="camera-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                        <button type="button" id="capture-btn" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: white; border: none; width: 50px; height: 50px; border-radius: 50%; z-index: 20;"></button>
                        <button type="button" id="close-camera-btn" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; border: none; padding: 5px; border-radius: 50%; z-index: 20;"><i data-lucide="x"></i></button>
                    </div>

                    <img id="preview-img" src="${initialPhoto || ''}" style="max-width: 100%; margin-top: 10px; display: ${initialPhoto ? 'block' : 'none'}; border-radius: var(--radius-sm);">
                </div>
            </div>

            <div class="form-group">
                <label>Parcel Type</label>
                <select name="type" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                    <option value="Recloser" ${existingData?.type === 'Recloser' ? 'selected' : ''}>Recloser</option>
                    <option value="VT" ${existingData?.type === 'VT' ? 'selected' : ''}>VT</option>
                    <option value="Control" ${existingData?.type === 'Control' ? 'selected' : ''}>Control</option>
                    <option value="Hanger" ${existingData?.type === 'Hanger' ? 'selected' : ''}>Hanger</option>
                </select>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-sm);">
                <div class="form-group">
                    <label>Serial Number</label>
                    <input type="text" name="serial" value="${existingData?.serial || ''}" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                </div>
                <div class="form-group">
                    <label>PEA No.</label>
                    <input type="text" name="peaNo" value="${existingData?.peaNo || ''}" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-sm);">
                <div class="form-group">
                    <label>Brand</label>
                    <select id="brand-select" name="brand-select" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                        ${generateOptions(enums.brands, existingData?.brand)}
                    </select>
                    <input type="text" id="brand-other" name="brand-other" placeholder="Enter New Brand" style="display: none; margin-top: 8px; width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                </div>
                <div class="form-group">
                    <label>Model</label>
                    <select id="model-select" name="model-select" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                        ${generateOptions(enums.models, existingData?.model)}
                    </select>
                    <input type="text" id="model-other" name="model-other" placeholder="Enter New Model" style="display: none; margin-top: 8px; width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                </div>
            </div>

             <div class="form-group">
                <label>Remarks</label>
                <textarea name="remarks" rows="3" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">${existingData?.remarks || ''}</textarea>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-sm);">
                <div class="form-group">
                    <label>Inspector Name</label>
                    <input type="text" name="inspectorName" value="${existingData?.inspectorName || ''}" placeholder="Optional" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                </div>
                <div class="form-group">
                    <label>Telephone</label>
                    <input type="text" name="inspectorTel" value="${existingData?.inspectorTel || ''}" placeholder="Optional" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                </div>
            </div>

            <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-sm);">
                <button type="button" id="cancel-btn" class="btn" style="flex: 1; background: rgba(255,255,255,0.1);">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex: 1;">${isEdit ? 'Update' : 'Save'} Parcel</button>
            </div>
        </form>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    lucide.createIcons();

    // Event Handling
    const form = modalContent.querySelector('form');
    const photoInput = modalContent.querySelector('#photo-input');
    const dropZone = modalContent.querySelector('#drop-zone');
    const previewImg = modalContent.querySelector('#preview-img');
    const cameraBtn = modalContent.querySelector('#camera-btn');
    const cameraContainer = modalContent.querySelector('#camera-stream-container');
    const videoEl = modalContent.querySelector('#camera-video');
    const captureBtn = modalContent.querySelector('#capture-btn');
    const closeCameraBtn = modalContent.querySelector('#close-camera-btn');
    const cancelBtn = modalContent.querySelector('#cancel-btn'); // Select within modal

    let photoBase64 = initialPhoto;
    let cameraActive = false;

    // File Upload Logic
    if (dropZone) {
        dropZone.addEventListener('click', (e) => {
            // Prevent click if clicking camera buttons
            if (e.target.closest('button') || cameraActive) return;
            photoInput.click();
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    }

    // Camera Logic
    if (cameraBtn) {
        cameraBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            import('../services/camera-service.js').then(async ({ CameraService }) => {
                const success = await CameraService.startCamera(videoEl);
                if (success) {
                    cameraActive = true;
                    cameraContainer.style.display = 'block';

                    // Attach Capture
                    captureBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        photoBase64 = CameraService.capturePhoto(videoEl);
                        previewImg.src = photoBase64;
                        previewImg.style.display = 'block';
                        CameraService.stopCamera();
                        cameraContainer.style.display = 'none';
                        cameraActive = false;
                    };

                    // Attach Close
                    closeCameraBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        CameraService.stopCamera();
                        cameraContainer.style.display = 'none';
                        cameraActive = false;
                    };
                }
            });
        });
    }

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            photoBase64 = e.target.result;
            previewImg.src = photoBase64;
            previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    // Dynamic Enum Logic
    const toggleOther = (selectId, inputId) => {
        const select = modalContent.querySelector(`#${selectId}`);
        const input = modalContent.querySelector(`#${inputId}`);
        select.addEventListener('change', () => {
            if (select.value === 'Other') {
                input.style.display = 'block';
                input.required = true;
                input.focus();
            } else {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        });
    };

    toggleOther('brand-select', 'brand-other');
    toggleOther('model-select', 'model-other');

    // Submit Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Handle Dynamic Enums
        let finalBrand = data['brand-select'];
        if (finalBrand === 'Other') {
            finalBrand = data['brand-other'].trim();
            if (finalBrand) db.addEnum('brands', finalBrand);
        }

        let finalModel = data['model-select'];
        if (finalModel === 'Other') {
            finalModel = data['model-other'].trim();
            if (finalModel) db.addEnum('models', finalModel);
        }

        // Clean up data object
        data.brand = finalBrand;
        data.model = finalModel;
        delete data['brand-select'];
        delete data['brand-other'];
        delete data['model-select'];
        delete data['model-other'];

        // Add photo and status
        data.photo = photoBase64;
        data.status = 'checked'; // Default status for new inspector entries

        if (isEdit) {
            data.id = existingData.id;
            data.timestamp = existingData.timestamp;
        } else {
            // Ensure ID is generated in db.saveParcel if missing, but we handle it there
        }

        // Save
        db.saveParcel(warehouseId, data);

        // Close and Refresh
        document.body.removeChild(modalOverlay);
        onClose();
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
    }
};
