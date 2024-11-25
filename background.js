// Function to inject and execute content script
async function injectContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    function: setupScreenshotCapture
  });
}

// Content script functionality
function setupScreenshotCapture() {
  let totalHeight = 0;
  let totalWidth = 0;
  let viewportHeight = 0;
  let viewportWidth = 0;
  let canvas = null;
  let ctx = null;

  function getScrollMetrics() {
    const body = document.body;
    const html = document.documentElement;

    totalHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    totalWidth = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );

    viewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;
  }

  function scrollTo(x, y) {
    window.scrollTo(x, y);
    return new Promise(resolve => setTimeout(resolve, 150));
  }

  // Function to temporarily hide fixed elements
  function handleFixedElements(hide = true) {
    const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.position === 'fixed' || style.position === 'sticky';
    });

    fixedElements.forEach(el => {
      if (hide) {
        el.dataset.originalDisplay = el.style.display;
        el.style.display = 'none';
      } else {
        el.style.display = el.dataset.originalDisplay || '';
        delete el.dataset.originalDisplay;
      }
    });
  }

  async function captureVisibleTab() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        preferCurrentTab: true,
        video: {
          width: viewportWidth,
          height: viewportHeight
        }
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      
      await new Promise(resolve => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      tempCtx.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());
      
      return tempCanvas;
    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw error;
    }
  }

  async function captureFullPage() {
    try {
      // Get page dimensions
      getScrollMetrics();

      // Create canvas for the full page
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Save original scroll position
      const originalX = window.scrollX;
      const originalY = window.scrollY;

      // Calculate number of segments needed
      const numSegmentsY = Math.ceil(totalHeight / viewportHeight);
      const numSegmentsX = Math.ceil(totalWidth / viewportWidth);

      // Show fixed elements only for the first segment
      let isFirstSegment = true;

      // Capture each segment
      for (let y = 0; y < numSegmentsY; y++) {
        for (let x = 0; x < numSegmentsX; x++) {
          // Handle fixed elements
          if (!isFirstSegment) {
            handleFixedElements(true); // Hide fixed elements
          }

          // Scroll to the segment
          const scrollX = x * viewportWidth;
          const scrollY = y * viewportHeight;
          await scrollTo(scrollX, scrollY);

          // Wait for any dynamic content to load
          await new Promise(resolve => setTimeout(resolve, 100));

          // Capture the segment
          const segmentCanvas = await captureVisibleTab();

          // Calculate the actual size of this segment
          const segmentWidth = Math.min(viewportWidth, totalWidth - scrollX);
          const segmentHeight = Math.min(viewportHeight, totalHeight - scrollY);

          // Draw the segment onto the main canvas
          ctx.drawImage(
            segmentCanvas,
            0, 0, segmentWidth, segmentHeight,  // Source rectangle
            scrollX, scrollY, segmentWidth, segmentHeight  // Destination rectangle
          );

          // Restore fixed elements
          if (!isFirstSegment) {
            handleFixedElements(false); // Show fixed elements
          }

          isFirstSegment = false;
        }
      }

      // Restore original scroll position
      await scrollTo(originalX, originalY);

      // Ensure all fixed elements are restored
      handleFixedElements(false);

      // Convert the final canvas to data URL
      const screenshot = canvas.toDataURL('image/png');

      // Send the screenshot data back to the background script
      chrome.runtime.sendMessage({
        type: 'screenshotCaptured',
        imageURL: screenshot,
        dimensions: {
          width: totalWidth,
          height: totalHeight
        }
      });

    } catch (error) {
      console.error('Full page capture error:', error);
      // Ensure fixed elements are restored even if there's an error
      handleFixedElements(false);
      chrome.runtime.sendMessage({
        type: 'screenshotError',
        error: error.message
      });
    }
  }

  // Start the capture process immediately
  captureFullPage();
}

// Store the screenshot data temporarily
let currentScreenshot = null;

// Handle extension button click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Reset screenshot data
    currentScreenshot = null;
    
    // Inject content script
    await injectContentScript(tab.id);
    
  } catch (error) {
    console.error('Extension error:', error);
  }
});

// Handle messages from content script and screenshot page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'screenshotCaptured':
      // Store the screenshot data
      currentScreenshot = request;
      // Open the preview window
      chrome.windows.create({
        url: chrome.runtime.getURL('screenshot.html'),
        type: 'popup',
        width: 800,
        height: 600
      });
      break;

    case 'screenshotError':
      console.error('Screenshot error:', request.error);
      break;

    case 'getScreenshot':
      if (currentScreenshot) {
        sendResponse(currentScreenshot);
      } else {
        sendResponse({ error: 'No screenshot data available' });
      }
      return true;

    case 'download':
      chrome.downloads.download({
        url: request.dataUrl,
        filename: request.filename,
        saveAs: true
      })
      .then(downloadId => {
        sendResponse({ success: true, downloadId });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
  }
});
