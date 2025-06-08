# Focus Tree Browser Extension

A productivity browser extension that combines website blocking with gamified focus sessions. Block distracting websites with a grayscale filter and grow a beautiful animated tree during focus sessions!

## Features

### 🌐 Website Filter
- **Grayscale Filter**: Automatically applies a black and white filter to specified websites to make them boring and less distracting
- **Easy Management**: Simple interface to add and remove websites from your block list
- **Smart Matching**: Automatically handles www prefixes and subdomains

### 🌱 Focus Tree Timer
- **Animated Tree Growth**: Watch a beautiful tree grow as you stay focused during timed sessions
- **Gamified Focus**: Set custom timer durations (minutes and seconds) for your focus sessions
- **Visual Feedback**: See your progress with real-time timer display and tree animations
- **Consequence System**: If you give up or visit blocked sites, your tree dies with a dramatic animation
- **Overlay Blocking**: When you visit blocked sites during active sessions, see a full-screen overlay with:
  - Live timer countdown
  - Animated growing tree
  - Option to give up (and kill the tree)
  - Motivational messaging

## How It Works

1. **Set Up Blocked Sites**: Use the "Website Filter" tab to add distracting websites
2. **Start Focus Session**: Switch to "Focus Tree" tab, set your desired time, and click "Start Focus"
3. **Watch Your Tree Grow**: The tree begins growing with beautiful animations
4. **Stay Focused**: If you visit blocked sites, you'll see the overlay with your progress
5. **Complete or Give Up**: Either complete the session successfully or give up (killing your tree)

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The Focus Tree extension will appear in your browser toolbar

## Usage

### Adding Websites to Block
1. Click the Focus Tree extension icon
2. Go to the "Website Filter" tab
3. Enter a website URL (e.g., `facebook.com`, `twitter.com`)
4. Click "Add Website"
5. The site will now appear grayscale and trigger the timer overlay during focus sessions

### Starting a Focus Session
1. Click the Focus Tree extension icon
2. Go to the "Focus Tree" tab
3. Set your desired time (default is 25 minutes)
4. Click "Start Focus" to begin
5. Watch your tree grow and stay away from blocked sites!

### During a Focus Session
- **Blocked Sites**: Will show a full-screen overlay with timer and tree
- **Timer Display**: Shows remaining time in MM:SS format
- **Give Up Option**: Red button to end session early (kills the tree)
- **Automatic Completion**: Tree fully grows when timer reaches zero

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `activeTab`, `storage`, `tabs`
- **Host Permissions**: `<all_urls>` (required for content script injection)
- **Storage**: Uses Chrome sync storage for websites and local storage for timer state
- **Background Script**: Handles cross-tab communication and timer persistence

## Files Structure

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface with tabs
- `popup.js` - Popup logic for both website management and timer
- `content.js` - Content script for filters and timer overlays  
- `background.js` - Background script for cross-tab communication
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons

## Animations

The extension features several beautiful CSS animations:

- **Tree Growing**: Smooth triangular tree growth animation
- **Tree Dying**: Dramatic tree death animation with color changes
- **Pulse Effect**: Subtle pulsing animation for active trees
- **UI Transitions**: Smooth button and tab transitions

## Privacy

This extension:
- Only processes data locally in your browser
- Does not send any data to external servers
- Stores website lists using Chrome's sync storage (syncs across your devices)
- Stores timer state locally for session persistence

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension!

## License

MIT License - feel free to use and modify as needed.
