// Store the screenshot data temporarily
let currentScreenshot = null;

// Listen for messages from the screenshot tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'download') {
    try {
      const { dataUrl, filename } = request;
      // Use data URL directly with chrome.downloads
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  } else if (request.type === 'getScreenshot') {
    try {
      if (!currentScreenshot) {
        sendResponse({ error: 'No screenshot data available' });
        return true;
      }
      sendResponse({ imageURL: currentScreenshot });
    } catch (error) {
      console.error('Get screenshot error:', error);
      sendResponse({ error: 'Failed to retrieve screenshot' });
    }
    return true;
  } else if (request.type === 'openScreenshot') {
    try {
      currentScreenshot = request.imageURL;
      chrome.windows.create({
        url: chrome.runtime.getURL('screenshot.html'),
        type: 'popup',
        width: 1024,
        height: 800
      }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('Window creation error:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.error('Open screenshot error:', error);
    }
    return true;
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Reset any previous screenshot data
    currentScreenshot = null;
    
    // Inject the content script to capture the full page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: captureFullPage,
    });
  } catch (err) {
    console.error('Failed to execute screenshot capture:', err);
    // Show error in popup if possible
    chrome.windows.create({
      url: chrome.runtime.getURL('error.html'),
      type: 'popup',
      width: 400,
      height: 200
    });
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
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.style.cssText = 'position:fixed;top:-10000px;left:-10000px;';
      
      video.oncanplay = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          // Stop all tracks to release the media stream
          video.srcObject.getTracks().forEach(track => track.stop());
          video.remove();
          resolve(canvas);
        } catch (error) {
          reject(error);
        }
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
        reject(err);
      });
    });
  }

  // Function to scroll and capture
  async function scrollAndCapture() {
    try {
      const viewportHeight = window.innerHeight;
      let yPosition = 0;

      // Request screen capture permission once at the start
      const initialCapture = await captureViewport();
      if (!initialCapture) {
        throw new Error('Failed to get screen capture permission');
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

      // Send message to background script to open screenshot
      const imageURL = canvas.toDataURL('image/png');
      chrome.runtime.sendMessage({
        type: 'openScreenshot',
        imageURL: imageURL
      });
    } catch (error) {
      console.error('Capture error:', error);
      throw error; // Re-throw to be caught by the main error handler
    }
  }

  scrollAndCapture().catch(error => {
    console.error('Screenshot capture failed:', error);
    // Notify user of error
    chrome.runtime.sendMessage({
      type: 'captureError',
      error: error.message || 'Failed to capture screenshot'
    });
  });
}
