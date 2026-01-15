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
        borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '900px', // Wider implementation
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
        html += `<option value="Other">Other (Add New)</option>`;
        return html;
    };

    modalContent.innerHTML = `
        <h2 style="margin-bottom: var(--space-md);">${isEdit ? 'Edit Parcel' : 'Add Parcel Detail'}</h2>
        <form id="parcel-form" style="display: grid; gap: var(--space-md);">
            
            <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                <!-- Main Photo -->
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px;">Parcel Photo</label>
                    <div id="drop-zone" style="border: 2px dashed var(--glass-border); padding: 10px; text-align: center; border-radius: var(--radius-md); cursor: pointer; transition: 0.2s; position: relative; overflow: hidden; min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.2);">
                        <i data-lucide="upload-cloud" style="margin-bottom: 8px;"></i>
                        <p style="font-size: 0.8rem; color: var(--text-muted)">Parcel Photo</p>
                        <button type="button" id="camera-btn" style="margin-top: 5px; font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.1); color: white;">
                             Camera
                        </button>
                        <input type="file" id="photo-input" accept="image/*" capture="environment" style="display: none;">
                        <img id="preview-img" src="${initialPhoto || ''}" style="max-width: 100%; max-height: 140px; margin-top: 5px; display: ${initialPhoto ? 'block' : 'none'}; border-radius: var(--radius-sm); object-fit: contain;">
                        
                        <!-- Camera Stream Overlay -->
                        <div id="camera-stream-container" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 10;">
                            <video id="camera-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                            <button type="button" id="capture-btn" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: white; border: none; width: 40px; height: 40px; border-radius: 50%; z-index: 20;"></button>
                            <button type="button" id="close-camera-btn" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; padding: 5px; border-radius: 50%; z-index: 20;"><i data-lucide="x" style="width: 16px;"></i></button>
                        </div>
                    </div>
                </div>

                <!-- PEA Photo -->
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px;">PEA No. Photo</label>
                    <div id="pea-drop-zone" style="border: 2px dashed var(--glass-border); padding: 10px; text-align: center; border-radius: var(--radius-md); cursor: pointer; transition: 0.2s; position: relative; overflow: hidden; min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.2);">
                        <i data-lucide="upload-cloud" style="margin-bottom: 8px;"></i>
                        <p style="font-size: 0.8rem; color: var(--text-muted)">PEA No. Photo</p>
                        <button type="button" id="pea-camera-btn" style="margin-top: 5px; font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.1); color: white;">
                             Camera
                        </button>
                        <input type="file" id="pea-photo-input" accept="image/*" capture="environment" style="display: none;">
                        <img id="pea-preview-img" src="${existingData?.peaPhoto || ''}" style="max-width: 100%; max-height: 140px; margin-top: 5px; display: ${existingData?.peaPhoto ? 'block' : 'none'}; border-radius: var(--radius-sm); object-fit: contain;">
                        
                        <!-- PEA Camera Stream Overlay -->
                        <div id="pea-camera-stream-container" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 10;">
                            <video id="pea-camera-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                            <button type="button" id="pea-capture-btn" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: white; border: none; width: 40px; height: 40px; border-radius: 50%; z-index: 20;"></button>
                            <button type="button" id="pea-close-camera-btn" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; padding: 5px; border-radius: 50%; z-index: 20;"><i data-lucide="x" style="width: 16px;"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>Parcel Type</label>
                <select id="type-select" name="type" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                    <option value="Recloser" ${existingData?.type === 'Recloser' ? 'selected' : ''}>Recloser</option>
                    <option value="VT" ${existingData?.type === 'VT' ? 'selected' : ''}>VT</option>
                    <option value="Control" ${existingData?.type === 'Control' ? 'selected' : ''}>Control</option>
                    <option value="Hanger" ${existingData?.type === 'Hanger' ? 'selected' : ''}>Hanger</option>
                </select>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-sm);">
                <div class="form-group">
                    <label>Serial Number</label>
                    <input type="text" id="input-serial" name="serial" value="${existingData?.serial || ''}" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
                </div>
                <div class="form-group">
                    <label>PEA No.</label>
                    <input type="text" id="input-pea" name="peaNo" value="${existingData?.peaNo || ''}" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: var(--radius-sm);">
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

    // Main Photo Handlers
    const photoInput = modalContent.querySelector('#photo-input');
    const dropZone = modalContent.querySelector('#drop-zone');
    const previewImg = modalContent.querySelector('#preview-img');
    const cameraBtn = modalContent.querySelector('#camera-btn');
    const cameraContainer = modalContent.querySelector('#camera-stream-container');
    const videoEl = modalContent.querySelector('#camera-video');
    const captureBtn = modalContent.querySelector('#capture-btn');
    const closeCameraBtn = modalContent.querySelector('#close-camera-btn');

    // PEA Photo Handlers
    const peaPhotoInput = modalContent.querySelector('#pea-photo-input');
    const peaDropZone = modalContent.querySelector('#pea-drop-zone');
    const peaPreviewImg = modalContent.querySelector('#pea-preview-img');
    const peaCameraBtn = modalContent.querySelector('#pea-camera-btn');
    const peaCameraContainer = modalContent.querySelector('#pea-camera-stream-container');
    const peaVideoEl = modalContent.querySelector('#pea-camera-video');
    const peaCaptureBtn = modalContent.querySelector('#pea-capture-btn');
    const peaCloseCameraBtn = modalContent.querySelector('#pea-close-camera-btn');

    const cancelBtn = modalContent.querySelector('#cancel-btn');

    let photoBase64 = initialPhoto;
    let peaPhotoBase64 = existingData?.peaPhoto || null;
    let cameraActive = false;

    // --- Validation Logic (Hanger) ---
    const typeSelect = modalContent.querySelector('#type-select');
    const inputSerial = modalContent.querySelector('#input-serial');
    const inputPea = modalContent.querySelector('#input-pea');
    const selectBrand = modalContent.querySelector('#brand-select');

    const updateValidation = () => {
        const isHanger = typeSelect.value === 'Hanger';
        if (isHanger) {
            inputSerial.required = false;
            inputPea.required = false;
            selectBrand.required = false;
            inputSerial.placeholder = "Optional for Hanger";
            inputPea.placeholder = "Optional for Hanger";
            // Optional styling cues could go here
        } else {
            inputSerial.required = true;
            inputPea.required = true;
            selectBrand.required = true;
            inputSerial.placeholder = "";
            inputPea.placeholder = "";
        }
    };

    typeSelect.addEventListener('change', updateValidation);
    updateValidation(); // Run on init

    // --- Media Handler Helper ---
    const setupMedia = (dZone, inp, prev, camBtn, camCont, vid, captBtn, closeCam, setter) => {
        dZone.addEventListener('click', (e) => {
            if (e.target.closest('button') || cameraActive) return;
            inp.click();
        });

        inp.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                prev.src = ev.target.result;
                prev.style.display = 'block';
                setter(ev.target.result);
            };
            reader.readAsDataURL(file);
        });

        camBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            import('../services/camera-service.js').then(async ({ CameraService }) => {
                const success = await CameraService.startCamera(vid);
                if (success) {
                    cameraActive = true;
                    camCont.style.display = 'block';

                    captBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        const res = CameraService.capturePhoto(vid);
                        prev.src = res;
                        prev.style.display = 'block';
                        setter(res);
                        CameraService.stopCamera();
                        camCont.style.display = 'none';
                        cameraActive = false;
                    };

                    closeCam.onclick = (ev) => {
                        ev.stopPropagation();
                        CameraService.stopCamera();
                        camCont.style.display = 'none';
                        cameraActive = false;
                    };
                }
            });
        });
    };

    setupMedia(dropZone, photoInput, previewImg, cameraBtn, cameraContainer, videoEl, captureBtn, closeCameraBtn, (v) => photoBase64 = v);
    setupMedia(peaDropZone, peaPhotoInput, peaPreviewImg, peaCameraBtn, peaCameraContainer, peaVideoEl, peaCaptureBtn, peaCloseCameraBtn, (v) => peaPhotoBase64 = v);

    // Dynamic Enum Logic
    const toggleOther = (selectId, inputId) => {
        const select = modalContent.querySelector(`#${selectId}`);
        const input = modalContent.querySelector(`#${inputId}`);
        select.addEventListener('change', () => {
            if (select.value === 'Other') {
                input.style.display = 'block';
                input.required = select.required; // Inherit requirement
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

        // Clean up data
        data.brand = finalBrand;
        data.model = finalModel;
        delete data['brand-select'];
        delete data['brand-other'];
        delete data['model-select'];
        delete data['model-other'];

        // Add Images & Status
        data.photo = photoBase64;
        data.peaPhoto = peaPhotoBase64;
        data.status = 'checked'; // Default to checked

        if (isEdit) {
            data.id = existingData.id;
            data.timestamp = existingData.timestamp;
        }

        // Save
        db.saveParcel(warehouseId, data);

        // Close
        document.body.removeChild(modalOverlay);
        onClose();
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
    }
};
