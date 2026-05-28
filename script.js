document.addEventListener('DOMContentLoaded', () => {
            // ----- DYNAMIC CUSTOM GLASSMORPHISM MODAL -----
            const customModal = document.getElementById('custom-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalMessage = document.getElementById('modal-message');
            const modalIcon = document.getElementById('modal-icon');
            const modalCancelBtn = document.getElementById('modal-cancel-btn');
            const modalConfirmBtn = document.getElementById('modal-confirm-btn');

            let modalResolve = null;

            function showCustomModal({ title, message, type = 'warning', showCancel = true, confirmText = 'Confirm', cancelText = 'Cancel' }) {
                return new Promise((resolve) => {
                    modalResolve = resolve;

                    // Set title and message
                    modalTitle.textContent = title;
                    modalMessage.textContent = message;

                    // Set cancel button visibility
                    modalCancelBtn.style.display = showCancel ? 'block' : 'none';
                    modalCancelBtn.textContent = cancelText;

                    // Set confirm button text and classes
                    modalConfirmBtn.textContent = confirmText;

                    // Configure icon and primary button style based on type
                    modalIcon.className = `modal-icon ${type}`;
                    modalIcon.innerHTML = '';

                    if (type === 'danger') {
                        modalIcon.innerHTML = '<i class="bi bi-trash-fill"></i>';
                        modalConfirmBtn.className = 'modal-btn btn-primary';
                    } else if (type === 'warning') {
                        modalIcon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
                        modalConfirmBtn.className = 'modal-btn btn-primary';
                    } else { // info
                        modalIcon.innerHTML = '<i class="bi bi-info-circle-fill"></i>';
                        modalConfirmBtn.className = 'modal-btn btn-primary info-style';
                    }

                    // Display modal
                    customModal.style.display = 'flex';
                    // Force reflow
                    customModal.offsetHeight;
                    customModal.classList.add('active');
                });
            }

            function closeModal(result) {
                customModal.classList.remove('active');
                setTimeout(() => {
                    customModal.style.display = 'none';
                    if (modalResolve) {
                        modalResolve(result);
                        modalResolve = null;
                    }
                }, 300); // match CSS transitions
            }

            modalConfirmBtn.addEventListener('click', () => closeModal(true));
            modalCancelBtn.addEventListener('click', () => closeModal(false));

            // Close on escape key
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && customModal.classList.contains('active')) {
                    closeModal(false);
                }
            });

            // ----- NATIVE SHARING UTILITY (WEB SHARE API) -----
            async function shareContent({ title, text, url, base64Image, filename }) {
                if (!navigator.share) {
                    showCustomModal({
                        title: 'Sharing Not Supported',
                        message: 'Berbagi langsung tidak didukung di peramban ini. Silakan salin teks atau unduh QR Code Anda sebagai gantinya!',
                        type: 'info',
                        showCancel: false,
                        confirmText: 'OK'
                    });
                    return;
                }

                try {
                    const shareData = { title, text };
                    if (url) shareData.url = url;

                    if (base64Image) {
                        try {
                            const res = await fetch(base64Image);
                            const blob = await res.blob();
                            const file = new File([blob], filename || 'qrcode.png', { type: blob.type });
                            
                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                shareData.files = [file];
                            }
                        } catch (fileErr) {
                            console.error('Error preparing file for sharing:', fileErr);
                        }
                    }

                    await navigator.share(shareData);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Sharing failed:', err);
                        try {
                            await navigator.share({ title, text, url });
                        } catch (fallbackErr) {
                            console.error('Fallback sharing failed:', fallbackErr);
                        }
                    }
                }
            }

            // ----- QR GENERATOR ELEMENTS & DYNAMIC FORMS -----
            const textInput = document.getElementById('text-input');
            const qrContainer = document.getElementById('qrcode-container');
            const downloadBtn = document.getElementById('download-btn');
            const shareBtn = document.getElementById('share-btn');
            let qrCode = null;

            // Wifi Inputs
            const wifiSsid = document.getElementById('wifi-ssid');
            const wifiPassword = document.getElementById('wifi-password');
            const wifiSecurity = document.getElementById('wifi-security');

            // Contact Inputs
            const contactName = document.getElementById('contact-name');
            const contactPhone = document.getElementById('contact-phone');
            const contactEmail = document.getElementById('contact-email');

            // Form Toggles
            const typeBtns = document.querySelectorAll('.type-btn');
            const generatorForms = document.querySelectorAll('.input-form-group');
            let activeType = 'text';

            typeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    typeBtns.forEach(b => b.classList.remove('active'));
                    generatorForms.forEach(f => f.style.display = 'none');

                    btn.classList.add('active');
                    activeType = btn.getAttribute('data-type');
                    document.getElementById(`form-${activeType}`).style.display = 'flex';

                    autoGenerateQR();
                });
            });

            // Escape special characters for Wi-Fi configurations according to ZXing specifications
            function escapeWifiString(val) {
                return val.replace(/\\/g, '\\\\')
                    .replace(/;/g, '\\;')
                    .replace(/:/g, '\\:')
                    .replace(/,/g, '\\,')
                    .replace(/"/g, '\\"');
            }

            // Gather compiled string for QR based on selected type
            function getCompiledQRText() {
                if (activeType === 'text') {
                    return textInput.value.trim();
                } else if (activeType === 'wifi') {
                    const ssid = wifiSsid.value.trim();
                    const password = wifiPassword.value.trim();
                    const security = wifiSecurity.value;
                    if (!ssid) return "";

                    const escapedSsid = escapeWifiString(ssid);
                    const escapedPassword = escapeWifiString(password);
                    return `WIFI:S:${escapedSsid};T:${security};P:${escapedPassword};;`;
                } else if (activeType === 'contact') {
                    const name = contactName.value.trim();
                    const phone = contactPhone.value.trim();
                    const email = contactEmail.value.trim();
                    if (!name && !phone && !email) return "";
                    return `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${name}\r\nTEL:${phone}\r\nEMAIL:${email}\r\nEND:VCARD`;
                }
                return "";
            }

            // Generate dummy/placeholder QR code on initial load
            qrCode = new QRCode(qrContainer, {
                text: "https://example.com",
                width: 200,
                height: 200,
                colorDark: "#cbd5e1", // Faded gray color
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.L
            });

            // Reusable debounce utility function
            function debounce(func, delay) {
                let timeout;
                return function (...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), delay);
                };
            }

            const debouncedAutoGenerateQR = debounce(autoGenerateQR, 250); // 250ms typing delay to eliminate CPU lag and flickering

            // Auto Generate function when user types
            function autoGenerateQR() {
                const text = getCompiledQRText();
                qrContainer.innerHTML = '';

                if (!text) {
                    qrCode = new QRCode(qrContainer, {
                        text: "https://example.com",
                        width: 200,
                        height: 200,
                        colorDark: "#cbd5e1",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.L
                    });
                    downloadBtn.classList.remove('active');
                    shareBtn.classList.remove('active');
                    return;
                }

                qrCode = new QRCode(qrContainer, {
                    text: text,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.L
                });

                downloadBtn.classList.add('active');
                shareBtn.classList.add('active');

                // Auto save generator history with debouncing!
                saveGeneratorHistoryDebounced(text, activeType);
            }

            // Bind listeners for keyboard typing inputs (debounced for smooth typing)
            textInput.addEventListener('input', debouncedAutoGenerateQR);
            [wifiSsid, wifiPassword, contactName, contactPhone, contactEmail].forEach(input => {
                input.addEventListener('input', debouncedAutoGenerateQR);
            });

            // Bind listeners for instant selectors/change events (instant response)
            wifiSecurity.addEventListener('change', autoGenerateQR);

            // Function to download QR Code
            function createDownloadLink(canvas) {
                const dataURL = canvas.toDataURL("image/png");
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = 'QRCode_Result.png';
                link.click();
            }

            function downloadQRCode() {
                const sourceElement = qrContainer.querySelector('img') || qrContainer.querySelector('canvas');
                if (!sourceElement) return;

                const borderSize = 8;
                const originalWidth = sourceElement.naturalWidth || sourceElement.width || 200;
                const originalHeight = sourceElement.naturalHeight || sourceElement.height || 200;

                const newWidth = originalWidth + (borderSize * 2);
                const newHeight = originalHeight + (borderSize * 2);

                const newCanvas = document.createElement('canvas');
                newCanvas.width = newWidth;
                newCanvas.height = newHeight;
                const ctx = newCanvas.getContext('2d');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, newWidth, newHeight);

                if (sourceElement.tagName === 'IMG') {
                    const img = new Image();
                    img.onload = function () {
                        ctx.drawImage(img, borderSize, borderSize, originalWidth, originalHeight);
                        createDownloadLink(newCanvas);
                    };
                    img.src = sourceElement.src;
                } else if (sourceElement.tagName === 'CANVAS') {
                    ctx.drawImage(sourceElement, borderSize, borderSize, originalWidth, originalHeight);
                    createDownloadLink(newCanvas);
                }
            }

            downloadBtn.addEventListener('click', downloadQRCode);

            function shareQRCode() {
                const sourceElement = qrContainer.querySelector('img') || qrContainer.querySelector('canvas');
                if (!sourceElement) return;

                const borderSize = 8;
                const originalWidth = sourceElement.naturalWidth || sourceElement.width || 200;
                const originalHeight = sourceElement.naturalHeight || sourceElement.height || 200;

                const newWidth = originalWidth + (borderSize * 2);
                const newHeight = originalHeight + (borderSize * 2);

                const newCanvas = document.createElement('canvas');
                newCanvas.width = newWidth;
                newCanvas.height = newHeight;
                const ctx = newCanvas.getContext('2d');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, newWidth, newHeight);

                function executeShare(canvas) {
                    const dataURL = canvas.toDataURL("image/png");
                    const text = getCompiledQRText() || 'https://example.com';
                    shareContent({
                        title: 'Share QR Code',
                        text: `Pindai QR Code ini untuk melihat konten: "${text}"`,
                        base64Image: dataURL,
                        filename: 'QRCode.png'
                    });
                }

                if (sourceElement.tagName === 'IMG') {
                    const img = new Image();
                    img.onload = function () {
                        ctx.drawImage(img, borderSize, borderSize, originalWidth, originalHeight);
                        executeShare(newCanvas);
                    };
                    img.src = sourceElement.src;
                } else if (sourceElement.tagName === 'CANVAS') {
                    ctx.drawImage(sourceElement, borderSize, borderSize, originalWidth, originalHeight);
                    executeShare(newCanvas);
                }
            }

            shareBtn.addEventListener('click', shareQRCode);


            // ----- QR SCANNER ELEMENTS -----
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            const selectUpload = document.getElementById('select-upload');
            const selectCamera = document.getElementById('select-camera');
            const uploadPanel = document.getElementById('upload-panel');
            const cameraPanel = document.getElementById('camera-panel');

            // Upload Elements
            const dropZone = document.getElementById('drop-zone');
            const qrFileInput = document.getElementById('qr-file-input');
            const previewContainer = document.getElementById('preview-container');
            const previewImg = document.getElementById('preview-img');
            const resetUploadBtn = document.getElementById('reset-upload-btn');

            // Camera Elements
            const startCameraBtn = document.getElementById('start-camera-btn');
            const stopCameraBtn = document.getElementById('stop-camera-btn');
            const cameraWrapper = document.getElementById('camera-wrapper');
            const scannerVideo = document.getElementById('scanner-video');
            const torchBtn = document.getElementById('torch-btn');

            // Results Panel Elements
            const resultsPlaceholder = document.getElementById('results-placeholder');
            const resultsContent = document.getElementById('results-content');
            const scanResultText = document.getElementById('scan-result-text');
            const copyScanBtn = document.getElementById('copy-scan-btn');
            const openLinkBtn = document.getElementById('open-link-btn');
            const shareScanBtn = document.getElementById('share-scan-btn');

            // Hidden Canvas for jsQR processing
            const scanCanvas = document.createElement('canvas');
            const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

            let cameraStream = null;
            let animationFrameId = null;
            let isCameraScanning = false;
            let videoDevices = [];
            let currentDeviceIndex = 0;

            // ----- TAB SWITCHER LOGIC -----
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('data-tab');

                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));

                    btn.classList.add('active');
                    document.getElementById(`${tabId}-content`).classList.add('active');

                    // Stop camera if switching away from scanner tab
                    if (tabId !== 'scanner') {
                        stopCameraScanning();
                    }

                    // Render history list when entering History tab
                    if (tabId === 'history') {
                        renderHistoryList();
                    }
                });
            });

            // ----- SCANNER SELECTOR LOGIC (Upload vs Camera) -----
            selectUpload.addEventListener('click', () => {
                selectUpload.classList.add('active');
                selectCamera.classList.remove('active');
                uploadPanel.style.display = 'block';
                cameraPanel.style.display = 'none';
                stopCameraScanning();
            });

            selectCamera.addEventListener('click', () => {
                selectCamera.classList.add('active');
                selectUpload.classList.remove('active');
                uploadPanel.style.display = 'none';
                cameraPanel.style.display = 'flex';
                resetUploadState();
            });


            // ----- MICRO-INTERACTIONS: SUCCESS BEEP SOUND -----
            function playBeepSound() {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    oscillator.type = "sine";
                    oscillator.frequency.setValueAtTime(650, audioCtx.currentTime); // Crisp and pleasant (650Hz)
                    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.12);
                } catch (e) {
                    console.warn("Audio Context beep disabled by browser policy:", e);
                }
            }


            // ----- URL DETECTION -----
            function isURLValid(str) {
                try {
                    const url = new URL(str);
                    return url.protocol === "http:" || url.protocol === "https:";
                } catch (_) {
                    return false;
                }
            }


            // ----- Clipboard Fallback -----
            function copyTextToClipboard(text) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(text);
                } else {
                    return new Promise((resolve, reject) => {
                        const textArea = document.createElement("textarea");
                        textArea.value = text;
                        textArea.style.position = "fixed";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textArea);
                            if (successful) resolve();
                            else reject(new Error("Failed to copy text"));
                        } catch (err) {
                            document.body.removeChild(textArea);
                            reject(err);
                        }
                    });
                }
            }


            // ----- COPY & OPEN LINK LOGIC -----
            copyScanBtn.addEventListener('click', () => {
                const text = scanResultText.textContent;
                if (!text) return;

                copyTextToClipboard(text)
                    .then(() => {
                        const originalHTML = copyScanBtn.innerHTML;
                        copyScanBtn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
                        copyScanBtn.style.background = '#10b981';
                        copyScanBtn.style.borderColor = '#10b981';

                        setTimeout(() => {
                            copyScanBtn.innerHTML = originalHTML;
                            copyScanBtn.style.background = '';
                            copyScanBtn.style.borderColor = '';
                        }, 2000);
                    })
                    .catch(err => {
                        alert("Failed to copy text: " + err);
                    });
            });


            // ----- SCAN SUCCESS HANDLING LOGIC -----
            function handleScanSuccess(decodedText) {
                playBeepSound();

                resultsPlaceholder.style.display = 'none';
                resultsContent.style.display = 'flex';
                scanResultText.textContent = decodedText;

                if (isURLValid(decodedText)) {
                    openLinkBtn.href = decodedText;
                    openLinkBtn.style.display = 'flex';
                } else {
                    openLinkBtn.style.display = 'none';
                }

                // Instant save to scan history!
                saveHistoryItem('scanner', 'text', decodedText);
            }

            function handleScanFailure(errorMessage) {
                resultsPlaceholder.style.display = 'flex';
                resultsContent.style.display = 'none';

                const titleNode = resultsPlaceholder.querySelector('div');
                const iconNode = resultsPlaceholder.querySelector('i');

                titleNode.textContent = errorMessage;
                iconNode.style.color = '#f87171';
                iconNode.className = 'bi bi-exclamation-triangle-fill';

                setTimeout(() => {
                    titleNode.textContent = 'Waiting for QR Code...';
                    iconNode.style.color = '';
                    iconNode.className = 'bi bi-qr-code-scan text-slate';
                }, 3500);
            }


            // ----- FILE UPLOAD METHOD LOGIC -----
            dropZone.addEventListener('click', () => qrFileInput.click());

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            ['dragleave', 'dragend'].forEach(type => {
                dropZone.addEventListener(type, () => {
                    dropZone.classList.remove('dragover');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    scanImageFile(e.dataTransfer.files[0]);
                }
            });

            qrFileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    scanImageFile(e.target.files[0]);
                }
            });

            resetUploadBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening file explorer
                resetUploadState();
            });

            function resetUploadState() {
                qrFileInput.value = '';
                previewContainer.style.display = 'none';
                previewImg.src = '';

                // Return to initial placeholder
                resultsPlaceholder.style.display = 'flex';
                resultsContent.style.display = 'none';
            }

            function scanImageFile(file) {
                if (!file.type.startsWith("image/")) {
                    handleScanFailure("File format not supported!");
                    return;
                }

                // Reset file input value so that the change event triggers on the same file if needed
                qrFileInput.value = '';

                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImg.src = e.target.result;
                    previewContainer.style.display = 'flex';

                    const img = new Image();
                    img.onload = function () {
                        scanCanvas.width = img.width;
                        scanCanvas.height = img.height;
                        scanCtx.drawImage(img, 0, 0, img.width, img.height);

                        const imgData = scanCtx.getImageData(0, 0, img.width, img.height);
                        const code = jsQR(imgData.data, imgData.width, imgData.height);

                        if (code) {
                            handleScanSuccess(code.data);
                        } else {
                            handleScanFailure("No QR Code detected");
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }


            // ----- CAMERA SCANNING LOGIC -----
            startCameraBtn.addEventListener('click', startCameraScanning);
            stopCameraBtn.addEventListener('click', stopCameraScanning);

            let isTorchOn = false;

            torchBtn.addEventListener('click', async () => {
                if (!cameraStream) return;

                const track = cameraStream.getVideoTracks()[0];
                if (!track) return;

                try {
                    isTorchOn = !isTorchOn;
                    await track.applyConstraints({
                        advanced: [{ torch: isTorchOn }]
                    });

                    if (isTorchOn) {
                        torchBtn.classList.add('active');
                        torchBtn.querySelector('i').className = 'bi bi-lightning-fill';
                        torchBtn.title = 'Turn Off Flashlight';
                    } else {
                        torchBtn.classList.remove('active');
                        torchBtn.querySelector('i').className = 'bi bi-lightning';
                        torchBtn.title = 'Turn On Flashlight';
                    }
                } catch (e) {
                    console.error('Failed to toggle torch:', e);
                    isTorchOn = false;
                    torchBtn.classList.remove('active');
                    torchBtn.querySelector('i').className = 'bi bi-lightning';
                }
            });

            function checkTorchCapability(streamInstance) {
                if (!streamInstance) return;
                const track = streamInstance.getVideoTracks()[0];
                if (!track) return;

                try {
                    const capabilities = track.getCapabilities();
                    if (capabilities && capabilities.torch) {
                        torchBtn.style.display = 'flex';
                    } else {
                        torchBtn.style.display = 'none';
                    }
                } catch (e) {
                    console.warn('Torch capabilities check failed:', e);
                    torchBtn.style.display = 'none';
                }
            }

            async function startCameraScanning() {
                if (isCameraScanning) return;

                // 1. Show the camera wrapper immediately BEFORE requesting the camera stream!
                // This ensures the video element is fully visible in the DOM layout tree,
                // which is required by mobile browsers (Brave/Chrome) to initialize the stream.
                startCameraBtn.style.display = 'none';
                cameraWrapper.style.display = 'flex';
                stopCameraBtn.style.display = 'flex';

                resultsPlaceholder.style.display = 'flex';
                resultsContent.style.display = 'none';

                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    resetCameraBtn();
                    showCustomModal({
                        title: 'Camera Not Supported',
                        message: 'Your browser does not support camera access. Please try using Chrome or Safari.',
                        type: 'warning',
                        showCancel: false,
                        confirmText: 'OK'
                    });
                    return;
                }

                // 2. Open camera using the safest baseline { video: true } constraints
                // This is guaranteed to succeed and securely ask the user for permission.
                let stream = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (e) {
                    console.error('Safe camera initialization failed:', e);
                }

                if (!stream) {
                    resetCameraBtn();
                    showCustomModal({
                        title: 'Camera Not Available',
                        message: 'Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin akses kamera ke browser di Pengaturan HP Anda.',
                        type: 'warning',
                        showCancel: false,
                        confirmText: 'OK'
                    });
                    return;
                }

                try {
                    cameraStream = stream;
                    scannerVideo.srcObject = stream;

                    isCameraScanning = true;
                    animationFrameId = requestAnimationFrame(tickCamera);

                    // 3. Now that permission is granted, enumerate all camera devices!
                    try {
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        videoDevices = devices.filter(d => d.kind === 'videoinput');

                        // Check if the current track supports senter (flashlight)
                        checkTorchCapability(stream);

                        // Set active index to match currently running camera track label
                        const activeTrack = stream.getVideoTracks()[0];
                        const activeLabel = activeTrack ? activeTrack.label.toLowerCase() : '';
                        if (activeLabel) {
                            const activeIdx = videoDevices.findIndex(d => d.label.toLowerCase() === activeLabel);
                            if (activeIdx !== -1) currentDeviceIndex = activeIdx;
                        }

                        // 4. Auto-switch to the rear camera if we aren't using it yet
                        const isCurrentlyBack = activeLabel.includes('back') || activeLabel.includes('rear') || activeLabel.includes('environment') || activeLabel.includes('belakang') || activeLabel.includes('main');
                        if (!isCurrentlyBack) {
                            const backCamIdx = videoDevices.findIndex(d => {
                                const lbl = d.label.toLowerCase();
                                return lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment') || lbl.includes('belakang') || lbl.includes('main');
                            });

                            if (backCamIdx !== -1 && backCamIdx !== currentDeviceIndex) {
                                console.log('Auto-switching to rear camera...');
                                await switchCamera(backCamIdx);
                            }
                        }
                    } catch (enumErr) {
                        console.warn('Enumerate devices or auto-switch failed:', enumErr);
                    }

                } catch (playErr) {
                    console.error('Camera assignment failed:', playErr);
                    stopCameraScanning();
                    resetCameraBtn();
                }
            }

            async function switchCamera(targetIndex) {
                if (!videoDevices.length || targetIndex >= videoDevices.length) return;

                // Stop current stream first
                if (cameraStream) {
                    cameraStream.getTracks().forEach(t => t.stop());
                    cameraStream = null;
                }

                // Wait 450ms to allow the camera driver to fully release the hardware
                await new Promise(resolve => setTimeout(resolve, 450));

                try {
                    // Use soft constraints (ideal instead of exact) to bypass fingerprinting / Brave shield blocks
                    const constraints = {
                        video: { deviceId: { ideal: videoDevices[targetIndex].deviceId } }
                    };
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);

                    cameraStream = stream;
                    scannerVideo.srcObject = stream;
                    currentDeviceIndex = targetIndex;

                    // Recheck torch capabilities for the newly switched camera
                    checkTorchCapability(stream);
                } catch (err) {
                    console.warn('Failed to switch to camera index ' + targetIndex + ', reverting to default...', err);
                    // Revert to default safe video: true
                    try {
                        await new Promise(resolve => setTimeout(resolve, 450));
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        cameraStream = stream;
                        scannerVideo.srcObject = stream;
                    } catch (revertErr) {
                        console.error('Revert to safe video failed:', revertErr);
                        stopCameraScanning();
                        resetCameraBtn();
                    }
                }
            }

            function resetCameraBtn() {
                startCameraBtn.innerHTML = '<i class="bi bi-camera-fill"></i> Start Camera';
                startCameraBtn.style.pointerEvents = '';
                startCameraBtn.style.opacity = '';
                startCameraBtn.style.display = 'flex';
                cameraWrapper.style.display = 'none';
                stopCameraBtn.style.display = 'none';
                torchBtn.style.display = 'none';
            }

            function stopCameraScanning() {
                isCameraScanning = false;

                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }

                if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                    cameraStream = null;
                }

                scannerVideo.srcObject = null;

                // Reset button to default state
                startCameraBtn.innerHTML = '<i class="bi bi-camera-fill"></i> Start Camera';
                startCameraBtn.style.pointerEvents = '';
                startCameraBtn.style.opacity = '';
                startCameraBtn.style.display = 'flex';
                cameraWrapper.style.display = 'none';
                stopCameraBtn.style.display = 'none';

                // Reset torch senter state
                isTorchOn = false;
                torchBtn.classList.remove('active');
                torchBtn.querySelector('i').className = 'bi bi-lightning';
                torchBtn.style.display = 'none';
            }

            // continuous canvas check loop
            function tickCamera() {
                if (!isCameraScanning) return;

                if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
                    const videoWidth = scannerVideo.videoWidth;
                    const videoHeight = scannerVideo.videoHeight;

                    scanCanvas.width = videoWidth;
                    scanCanvas.height = videoHeight;
                    scanCtx.drawImage(scannerVideo, 0, 0, videoWidth, videoHeight);

                    const imgData = scanCtx.getImageData(0, 0, videoWidth, videoHeight);
                    const code = jsQR(imgData.data, imgData.width, imgData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        handleScanSuccess(code.data);
                        stopCameraScanning();
                        return;
                    }
                }

                animationFrameId = requestAnimationFrame(tickCamera);
            }


            // ----- HISTORY MANAGEMENT LOGIC -----
            const historyList = document.getElementById('history-list');
            const historyDetailPlaceholder = document.getElementById('history-detail-placeholder');
            const historyDetailContent = document.getElementById('history-detail-content');
            const detailTypeBadge = document.getElementById('detail-type-badge');
            const historyQrcodeContainer = document.getElementById('history-qrcode-container');
            const historyDetailText = document.getElementById('history-detail-text');
            const historyCopyBtn = document.getElementById('history-copy-btn');
            const historyOpenBtn = document.getElementById('history-open-btn');
            const historyDownloadBtn = document.getElementById('history-download-btn');
            const historyShareBtn = document.getElementById('history-share-btn');
            const clearAllHistoryBtn = document.getElementById('clear-all-history');

            let activeHistoryItem = null;
            let historyQrCode = null;

            // Retrieve history from localstorage
            function getHistory() {
                const historyJSON = localStorage.getItem('qr_history');
                return historyJSON ? JSON.parse(historyJSON) : [];
            }

            // Save history list
            function saveHistoryList(historyArray) {
                localStorage.setItem('qr_history', JSON.stringify(historyArray));
            }

            // Add item to history
            function saveHistoryItem(type, subType, content) {
                if (!content) return;
                const history = getHistory();

                // Avoid duplicating the exact same content consecutively
                if (history.length > 0 && history[0].content === content && history[0].type === type) {
                    return;
                }

                const newItem = {
                    id: Date.now().toString(),
                    type: type, // 'generator' or 'scanner'
                    subType: subType, // 'text', 'wifi', 'contact'
                    content: content,
                    timestamp: Date.now()
                };

                history.unshift(newItem); // Add to beginning
                // Limit history to 50 items to keep it clean
                if (history.length > 50) history.pop();

                saveHistoryList(history);
                renderHistoryList();
            }

            // Debouncing timeout
            let historyDebounceTimeout = null;
            function saveGeneratorHistoryDebounced(content, subType) {
                if (historyDebounceTimeout) clearTimeout(historyDebounceTimeout);
                historyDebounceTimeout = setTimeout(() => {
                    saveHistoryItem('generator', subType, content);
                }, 1500); // 1.5 seconds debounce
            }

            // Render timeline items
            function renderHistoryList() {
                const history = getHistory();
                historyList.innerHTML = '';

                if (history.length === 0) {
                    historyList.innerHTML = `
                        <div style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 30px 10px;">
                            <i class="bi bi-clock-history" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 8px;"></i>
                            No history items found.<br>Create or scan a QR code to start.
                        </div>
                    `;
                    historyDetailPlaceholder.style.display = 'flex';
                    historyDetailContent.style.display = 'none';
                    return;
                }

                history.forEach(item => {
                    const card = document.createElement('div');
                    card.className = `history-card ${item.type === 'scanner' ? 'scanned-type' : ''}`;
                    if (activeHistoryItem && activeHistoryItem.id === item.id) {
                        card.classList.add('active');
                    }

                    // Choose icon based on type
                    let iconClass = 'bi-link-45deg';
                    if (item.subType === 'wifi') iconClass = 'bi-wifi';
                    else if (item.subType === 'contact') iconClass = 'bi-person-badge';
                    else if (item.type === 'scanner') iconClass = 'bi-qr-code-scan';

                    // Human-readable date & time
                    const date = new Date(item.timestamp);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

                    // Short title preview
                    let titlePreview = item.content;
                    if (item.subType === 'wifi') {
                        const ssidMatch = item.content.match(/WIFI:S:([^;]+);/);
                        titlePreview = ssidMatch ? `Wi-Fi: ${ssidMatch[1]}` : 'Wi-Fi Network';
                    } else if (item.subType === 'contact') {
                        const nameMatch = item.content.match(/FN:([^\n]+)/);
                        titlePreview = nameMatch ? `Contact: ${nameMatch[1]}` : 'Contact Card';
                    }

                    card.innerHTML = `
                        <div class="history-card-left">
                            <div class="history-card-icon">
                                <i class="bi ${iconClass}"></i>
                            </div>
                            <div class="history-card-info">
                                <div class="history-card-title">${titlePreview}</div>
                                <div class="history-card-date">${dateString} at ${timeString}</div>
                            </div>
                        </div>
                        <button class="delete-item-btn" title="Delete from history">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;

                    // Card select event
                    card.addEventListener('click', () => {
                        showHistoryDetail(item);
                        document.querySelectorAll('.history-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                    });

                    // Single item delete click
                    card.querySelector('.delete-item-btn').addEventListener('click', async (e) => {
                        e.stopPropagation(); // Stop trigger select item
                        const confirmed = await showCustomModal({
                            title: 'Delete History Item',
                            message: 'Are you sure you want to delete this item from your history?',
                            type: 'danger',
                            confirmText: 'Delete',
                            cancelText: 'Cancel'
                        });
                        if (confirmed) {
                            deleteHistoryItem(item.id);
                        }
                    });

                    historyList.appendChild(card);
                });
            }

            // Show right panel detail
            function showHistoryDetail(item) {
                activeHistoryItem = item;

                historyDetailPlaceholder.style.display = 'none';
                historyDetailContent.style.display = 'flex';

                // Setup badge
                if (item.type === 'generator') {
                    detailTypeBadge.textContent = 'Generated';
                    detailTypeBadge.className = 'detail-badge generated';
                } else {
                    detailTypeBadge.textContent = 'Scanned';
                    detailTypeBadge.className = 'detail-badge scanned';
                }

                // Setup raw text
                historyDetailText.textContent = item.content;

                // Setup open link btn
                if (isURLValid(item.content)) {
                    historyOpenBtn.href = item.content;
                    historyOpenBtn.style.display = 'flex';
                } else {
                    historyOpenBtn.style.display = 'none';
                }

                // Re-draw QR Code
                historyQrcodeContainer.innerHTML = '';
                historyQrCode = new QRCode(historyQrcodeContainer, {
                    text: item.content,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.L
                });
            }

            // Delete single item
            function deleteHistoryItem(id) {
                const history = getHistory();
                const filteredHistory = history.filter(item => item.id !== id);
                saveHistoryList(filteredHistory);

                if (activeHistoryItem && activeHistoryItem.id === id) {
                    activeHistoryItem = null;
                    historyDetailPlaceholder.style.display = 'flex';
                    historyDetailContent.style.display = 'none';
                }

                renderHistoryList();
            }

            // Clear all items
            clearAllHistoryBtn.addEventListener('click', async () => {
                const confirmed = await showCustomModal({
                    title: 'Clear Activity History',
                    message: 'Are you sure you want to clear your entire activity history? This action cannot be undone.',
                    type: 'danger',
                    confirmText: 'Clear All',
                    cancelText: 'Cancel'
                });
                if (confirmed) {
                    saveHistoryList([]);
                    activeHistoryItem = null;
                    renderHistoryList();
                }
            });

            // Clipboard Copy for History Detail View
            historyCopyBtn.addEventListener('click', () => {
                if (!activeHistoryItem) return;
                copyTextToClipboard(activeHistoryItem.content)
                    .then(() => {
                        const originalHTML = historyCopyBtn.innerHTML;
                        historyCopyBtn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
                        historyCopyBtn.style.background = '#10b981';
                        historyCopyBtn.style.borderColor = '#10b981';

                        setTimeout(() => {
                            historyCopyBtn.innerHTML = originalHTML;
                            historyCopyBtn.style.background = '';
                            historyCopyBtn.style.borderColor = '';
                        }, 2000);
                    });
            });

            // Download QR Code from History Detail Panel
            historyDownloadBtn.addEventListener('click', () => {
                const sourceElement = historyQrcodeContainer.querySelector('img') || historyQrcodeContainer.querySelector('canvas');
                if (!sourceElement) return;

                const borderSize = 8;
                const originalWidth = sourceElement.naturalWidth || sourceElement.width || 200;
                const originalHeight = sourceElement.naturalHeight || sourceElement.height || 200;

                const newWidth = originalWidth + (borderSize * 2);
                const newHeight = originalHeight + (borderSize * 2);

                const newCanvas = document.createElement('canvas');
                newCanvas.width = newWidth;
                newCanvas.height = newHeight;
                const ctx = newCanvas.getContext('2d');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, newWidth, newHeight);

                if (sourceElement.tagName === 'IMG') {
                    const img = new Image();
                    img.onload = function () {
                        ctx.drawImage(img, borderSize, borderSize, originalWidth, originalHeight);
                        createDownloadLink(newCanvas);
                    };
                    img.src = sourceElement.src;
                } else if (sourceElement.tagName === 'CANVAS') {
                    ctx.drawImage(sourceElement, borderSize, borderSize, originalWidth, originalHeight);
                    createDownloadLink(newCanvas);
                }
            });

            // Share QR/Content from History Detail Panel
            historyShareBtn.addEventListener('click', () => {
                if (!activeHistoryItem) return;
                
                const text = activeHistoryItem.content;
                const isUrl = isURLValid(text);
                
                const sourceElement = historyQrcodeContainer.querySelector('img') || historyQrcodeContainer.querySelector('canvas');
                if (!sourceElement) return;

                const borderSize = 8;
                const originalWidth = sourceElement.naturalWidth || sourceElement.width || 200;
                const originalHeight = sourceElement.naturalHeight || sourceElement.height || 200;

                const newCanvas = document.createElement('canvas');
                newCanvas.width = originalWidth + (borderSize * 2);
                newCanvas.height = originalHeight + (borderSize * 2);
                const ctx = newCanvas.getContext('2d');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

                function executeHistoryShare(canvas) {
                    const dataURL = canvas.toDataURL("image/png");
                    shareContent({
                        title: 'Share History QR Code',
                        text: isUrl ? `Pindai tautan ini: ${text}` : `Konten riwayat: "${text}"`,
                        url: isUrl ? text : undefined,
                        base64Image: dataURL,
                        filename: 'QRCode_History.png'
                    });
                }

                if (sourceElement.tagName === 'IMG') {
                    const img = new Image();
                    img.onload = function () {
                        ctx.drawImage(img, borderSize, borderSize, originalWidth, originalHeight);
                        executeHistoryShare(newCanvas);
                    };
                    img.src = sourceElement.src;
                } else if (sourceElement.tagName === 'CANVAS') {
                    ctx.drawImage(sourceElement, borderSize, borderSize, originalWidth, originalHeight);
                    executeHistoryShare(newCanvas);
                }
            });

            // Share Scanned Text from Scanner Panel
            shareScanBtn.addEventListener('click', () => {
                const text = scanResultText.textContent;
                if (!text) return;
                
                const isUrl = text.startsWith('http://') || text.startsWith('https://');
                shareContent({
                    title: 'Hasil Pindai QR Code',
                    text: isUrl ? `Membagikan tautan yang dipindai: ${text}` : text,
                    url: isUrl ? text : undefined
                });
            });

            // Initialize rendering on load
            renderHistoryList();
        });