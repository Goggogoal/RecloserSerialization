export const CameraService = {
    stream: null,

    startCamera: async (videoElement) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            videoElement.srcObject = stream;
            CameraService.stream = stream;
            return true;
        } catch (err) {
            console.error("Camera Error:", err);
            alert("Could not access camera. Please ensure permissions are granted.");
            return false;
        }
    },

    stopCamera: () => {
        if (CameraService.stream) {
            CameraService.stream.getTracks().forEach(track => track.stop());
            CameraService.stream = null;
        }
    },

    capturePhoto: (videoElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    }
};
