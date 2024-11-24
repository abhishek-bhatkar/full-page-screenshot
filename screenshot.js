// Get DOM elements
const screenshotImage = document.getElementById('screenshotImage');
const pngButton = document.getElementById('pngButton');
const jpegButton = document.getElementById('jpegButton');

// Request screenshot data when page loads
chrome.runtime.sendMessage({ type: 'getScreenshot' }, response => {
    if (response && response.imageURL) {
        screenshotImage.src = response.imageURL;
    }
});

// Function to download image
function downloadImage(type) {
    const canvas = document.createElement('canvas');
    canvas.width = screenshotImage.naturalWidth;
    canvas.height = screenshotImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(screenshotImage, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/' + type, type === 'jpeg' ? 0.95 : 1.0);
    chrome.runtime.sendMessage({
        type: 'download',
        dataUrl: dataUrl,
        filename: 'screenshot.' + type
    });
}

// Add event listeners
pngButton.addEventListener('click', () => downloadImage('png'));
jpegButton.addEventListener('click', () => downloadImage('jpeg'));
