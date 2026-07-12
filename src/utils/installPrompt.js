// Captures the browser's native "install this app" event so we can trigger
// it from our own button in Settings instead of relying on the browser's
// own menu. This only fires on Chromium-based browsers (Chrome, Edge,
// Samsung Internet) on Android and desktop -- iOS Safari never fires this
// event at all, by Apple's own design, so there's a separate iOS path.
let deferredPrompt = null;
const listeners = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  listeners.forEach(fn => fn(true));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  listeners.forEach(fn => fn(false));
});

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

export function canPromptInstall() {
  return !!deferredPrompt;
}

export function onInstallAvailabilityChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function promptInstall() {
  if (!deferredPrompt) return { outcome: 'unavailable' };
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice; // { outcome: 'accepted' | 'dismissed' }
}
