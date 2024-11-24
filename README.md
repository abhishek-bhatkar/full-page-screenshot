# Full Page Screenshot Chrome Extension

A lightweight Chrome extension that captures full-page screenshots with minimal permissions. Built with Chrome's Manifest V3, this extension provides a simple and efficient way to capture entire web pages.

## Features

- **Full Page Capture**: Automatically scrolls and captures the entire webpage
- **Multiple Export Options**:
  - PNG (lossless quality)
  - JPEG (95% quality)
- **User-Friendly Interface**:
  - Preview window before download
  - Simple one-click download buttons
  - Clean, modern design

## Installation

1. Clone this repository:
   ```bash
   git clone [repository-url]
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any webpage you want to capture

2. Click the extension icon in your Chrome toolbar (or use keyboard shortcut)
   - Windows/Linux: `Alt+Shift+P`
   - macOS: `Command+Shift+S`

3. Allow screen capture permission when prompted

4. Preview your screenshot in the popup window

5. Choose your preferred download format:
   - Click "Download PNG" for lossless quality
   - Click "Download JPEG" for smaller file size

## Technical Details

### Architecture
- Built with Chrome Extension Manifest V3
- Uses modern JavaScript features
- Canvas-based screenshot generation
- Message passing for component communication

### Permissions
- `activeTab`: For capturing the current tab
- `scripting`: For content script injection
- `storage`: For future settings support
- `downloads`: For saving screenshots

### Files Structure
```
├── manifest.json        # Extension configuration
├── background.js       # Core screenshot logic
├── content.js         # Browser context bridge
├── screenshot.html    # Preview interface
├── screenshot.js      # Download handling
├── options.html      # Settings page
├── options.js       # Settings logic
└── icons/          # Extension icons
```

## Development

### Prerequisites
- Google Chrome Browser
- Basic knowledge of JavaScript and Chrome Extension APIs

### Local Development
1. Make changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test your changes

### Building for Production
1. Update version in `manifest.json`
2. Remove any development-only permissions
3. Zip the extension directory
4. Submit to Chrome Web Store

## Security

- Minimal permission requirements
- No external dependencies
- Data stays local to the user's machine
- CSP-compliant code

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

[Add your chosen license here]

## Acknowledgments

- Chrome Extension API Documentation
- Canvas API Documentation
- Chrome Extension Community
