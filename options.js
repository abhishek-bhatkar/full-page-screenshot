// Saves options to chrome.storage
function saveOptions() {
  const defaultFormat = document.getElementById('defaultFormat').value;
  const jpegQuality = document.getElementById('jpegQuality').value;
  const pdfFormat = document.getElementById('pdfFormat').value;
  
  chrome.storage.sync.set({
    defaultFormat: defaultFormat,
    jpegQuality: jpegQuality,
    pdfFormat: pdfFormat
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get({
    defaultFormat: 'png',
    jpegQuality: '90',
    pdfFormat: 'fit'
  }, (items) => {
    document.getElementById('defaultFormat').value = items.defaultFormat;
    document.getElementById('jpegQuality').value = items.jpegQuality;
    document.getElementById('pdfFormat').value = items.pdfFormat;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
