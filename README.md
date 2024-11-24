# Full Page Screenshot Capture

A Chrome extension that captures full-page screenshots with minimal permissions. Take screenshots of entire web pages, including scrollable content and iframes, with just one click.

## Features

- Capture full-page screenshots with a single click
- Keyboard shortcut support (Alt+Shift+P)
- Export to PNG, JPEG, or PDF formats
- Configurable image quality settings
- Handles complex pages with scrollable elements and iframes
- No unnecessary permissions required
- Clean, bloat-free interface

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar (or press Alt+Shift+P)
2. Wait for the extension to capture the entire page
3. When complete, a new tab will open with your screenshot
4. Choose your preferred format (PNG, JPEG, or PDF) and download

## Configuration

Access the extension options by:
1. Right-clicking the extension icon
2. Select "Options"
3. Configure:
   - Default download format
   - JPEG quality
   - PDF paper size

## Technical Details

The extension uses Chrome's native APIs to capture the page content, requiring only the following permissions:
- `activeTab`: To access the current tab for screenshot capture
- `scripting`: To inject the capture script
- `storage`: To save user preferences

## Contributing

Found a bug or want to suggest a feature? Please open an issue or submit a pull request!

## License

MIT License - feel free to use this code in your own projects!
