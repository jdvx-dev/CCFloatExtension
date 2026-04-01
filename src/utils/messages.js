// Shared message type constants.
// Loaded via importScripts() in the service worker,
// as a content_scripts entry in manifest.json,
// and via <script> tag in popup HTML pages.

const MSG = {
  SUBTITLE_UPDATE:      'SUBTITLE_UPDATE',
  CONTENT_SCRIPT_READY: 'CONTENT_SCRIPT_READY',
  OPEN_FLOAT_WINDOW:    'OPEN_FLOAT_WINDOW',
  CLOSE_FLOAT_WINDOW:   'CLOSE_FLOAT_WINDOW',
  GET_STATUS:           'GET_STATUS',
  FLOAT_READY:          'FLOAT_READY',
};
