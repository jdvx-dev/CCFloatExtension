# CCFloat — YouTube Subtitle Floater

A Chrome extension that captures YouTube captions in real time and displays them in a small, movable popup window — so you can keep the subtitles on your working screen while the video plays on another monitor.

## Who is it for?

People who watch foreign-language YouTube series while working. Instead of switching back to the YouTube monitor to read subtitles, the float window lets you keep captions always in view wherever you are working.

## How it works

1. A content script observes YouTube's caption DOM using a `MutationObserver`.
2. Every time the active subtitle changes, it sends the text to a background service worker.
3. The service worker forwards the text to a small Chrome popup window (the "float window").
4. You drag that popup to whichever monitor or corner you prefer.

## Features

- Works with both manually uploaded subtitles and YouTube auto-generated captions
- Adjustable font size (A− / A+), persisted across sessions
- Handles YouTube's SPA navigation (switching between videos without reloading)
- Dark semi-transparent UI that stays out of the way

## Installation (developer mode)

No build step is required — this is plain HTML/CSS/JS.

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the root folder of this project (the folder containing `manifest.json`).
5. The **CCFloat** icon will appear in your Chrome toolbar.

## Usage

1. Open a YouTube video (`youtube.com/watch?v=...`).
2. Enable captions on the video using the **CC** button in the player.
3. Click the **CCFloat** toolbar icon and press **Open Float Window**.
4. Drag the float window to your working monitor.
5. Subtitles will appear automatically as the video plays.

> **Tip:** If you navigate to a different YouTube video (without reloading the tab), the extension reconnects automatically within about one second.

## Known limitations

| Limitation | Reason |
|---|---|
| Float window is not always-on-top at the OS level | Chrome extensions have no API to pin a window above all others |
| Subtitles stop after updating the extension | Chrome invalidates injected content scripts on update — reload the YouTube tab to reconnect |
| Multiple YouTube tabs play subtitles to the same float window | Last-write wins; a future version could track the active tab |

## Project structure

```
CCFloatExtension/
├── manifest.json               # Chrome Extension manifest (MV3)
└── src/
    ├── assets/
    │   └── icons/              # Extension icons (16, 32, 48, 128 px)
    ├── background/
    │   └── index.js            # Service worker: window management & message routing
    ├── content/
    │   └── index.js            # YouTube caption capture via MutationObserver
    ├── popup/
    │   ├── popup.html          # Toolbar popup UI
    │   ├── popup.js
    │   ├── float.html          # Floating subtitle window
    │   ├── float.js
    │   └── float.css
    └── utils/
        └── messages.js         # Shared message type constants
```

## License

BSD 3-Clause — see [LICENSE](LICENSE).
