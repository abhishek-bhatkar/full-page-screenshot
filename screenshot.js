// Get DOM elements
const screenshot = document.getElementById('screenshot');
const pngButton = document.getElementById('pngButton');
const jpegButton = document.getElementById('jpegButton');
const errorMessage = document.getElementById('error-message');
const loadingOverlay = document.getElementById('loading-overlay');

document.addEventListener('DOMContentLoaded', async () => {
    // Verify all elements are found
    if (!screenshot || !pngButton || !jpegButton || !errorMessage || !loadingOverlay) {
        console.error('Failed to find required DOM elements');
        return;
    }

    // Helper functions for UI state
    const showError = (message) => {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    };

    const setButtonLoading = (button, isLoading) => {
        if (!button) return;
        const spinner = button.querySelector('.spinner');
        const text = button.querySelector('.button-text');
        if (spinner && text) {
            button.disabled = isLoading;
            spinner.style.display = isLoading ? 'block' : 'none';
            text.style.opacity = isLoading ? '0.7' : '1';
        }
    };

    const showLoading = (show) => {
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    };

    // Get the screenshot data
    try {
        showLoading(true);
        const response = await chrome.runtime.sendMessage({ type: 'getScreenshot' });
        if (!response || !response.imageURL) {
            throw new Error('Failed to load screenshot data');
        }
        
        // Set up image load handler
        screenshot.onload = () => {
            showLoading(false);
        };
        
        screenshot.onerror = () => {
            showLoading(false);
            showError('Failed to load screenshot preview. Please try again.');
        };
        
        screenshot.src = response.imageURL;
    } catch (error) {
        showLoading(false);
        showError('Failed to load screenshot. Please try again.');
        console.error('Screenshot loading error:', error);
    }

    // Handle download buttons
    const handleDownload = async (format, quality = 0.95) => {
        const button = format === 'png' ? pngButton : jpegButton;
        try {
            setButtonLoading(button, true);

            // Create canvas to handle the conversion
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Wait for image to be loaded
            if (!screenshot.complete) {
                await new Promise((resolve, reject) => {
                    screenshot.onload = resolve;
                    screenshot.onerror = reject;
                });
            }
            
            canvas.width = screenshot.naturalWidth;
            canvas.height = screenshot.naturalHeight;
            ctx.drawImage(screenshot, 0, 0);

            // Convert to the desired format
            const mimeType = `image/${format}`;
            const dataUrl = canvas.toDataURL(mimeType, quality);

            // Get current date for filename
            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            const filename = `screenshot_${date}_${time}.${format}`;

            // Send download message to background script and wait for response
            const response = await chrome.runtime.sendMessage({
                type: 'download',
                dataUrl: dataUrl,
                filename: filename
            });

            // Check response
            if (!response.success) {
                throw new Error(response.error || 'Download failed');
            }

        } catch (error) {
            showError(`Failed to download ${format.toUpperCase()} file. Please try again.`);
            console.error('Download error:', error);
        } finally {
            setButtonLoading(button, false);
        }
    };

    // Add event listeners
    if (pngButton) {
        pngButton.addEventListener('click', () => handleDownload('png'));
    }
    if (jpegButton) {
        jpegButton.addEventListener('click', () => handleDownload('jpeg', 0.95));
    }

    // Handle image load error
    if (screenshot) {
        screenshot.addEventListener('error', () => {
            showError('Failed to load screenshot preview. Please try again.');
        });
    }
});
