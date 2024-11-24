// Store the screenshot data temporarily
let currentScreenshot = null;

// Listen for messages from the screenshot tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'download') {
    const { dataUrl, filename } = request;
    // Convert data URL to blob
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        }, () => {
          URL.revokeObjectURL(url);
        });
      });
    return true;
  } else if (request.type === 'getScreenshot') {
    sendResponse({ imageURL: currentScreenshot });
    return true;
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Inject the content script to capture the full page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: captureFullPage,
    });
  } catch (err) {
    console.error('Failed to execute screenshot capture:', err);
  }
});

async function captureFullPage() {
  const body = document.body;
  const html = document.documentElement;
  
  // Get the maximum scroll dimensions
  const maxHeight = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
  );
  
  const maxWidth = Math.max(
    body.scrollWidth,
    body.offsetWidth,
    html.clientWidth,
    html.scrollWidth,
    html.offsetWidth
  );

  // Save original scroll position
  const originalScrollPos = window.scrollY;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = maxWidth;
  canvas.height = maxHeight;

  // Function to capture viewport
  async function captureViewport() {
    return new Promise(resolve => {
      const video = document.createElement('video');
      video.style.cssText = 'position:fixed;top:-10000px;left:-10000px;';
      
      video.oncanplay = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Stop all tracks to release the media stream
        video.srcObject.getTracks().forEach(track => track.stop());
        video.remove();
        resolve(canvas);
      };
      
      navigator.mediaDevices.getDisplayMedia({ 
        preferCurrentTab: true,
        video: {
          width: maxWidth,
          height: window.innerHeight
        }
      })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error('Error capturing screen:', err);
        resolve(null);
      });
    });
  }

  // Function to scroll and capture
  async function scrollAndCapture() {
    const viewportHeight = window.innerHeight;
    let yPosition = 0;

    // Request screen capture permission once at the start
    const initialCapture = await captureViewport();
    if (!initialCapture) {
      console.error('Failed to get screen capture permission');
      return;
    }

    while (yPosition < maxHeight) {
      window.scrollTo(0, yPosition);
      
      // Wait for any lazy-loaded content and animations
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const viewportCanvas = await captureViewport();
      if (viewportCanvas) {
        ctx.drawImage(viewportCanvas, 0, yPosition);
      }
      
      yPosition += viewportHeight;
    }

    // Restore original scroll position
    window.scrollTo(0, originalScrollPos);

    // Store the screenshot data
    const imageURL = canvas.toDataURL('image/png');
    currentScreenshot = imageURL;

    // Open the screenshot in a new tab
    chrome.windows.create({
      url: chrome.runtime.getURL('screenshot.html'),
      type: 'popup',
      width: 1024,
      height: 800
    });
  }

  scrollAndCapture();
}
