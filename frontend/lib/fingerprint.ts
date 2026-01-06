/**
 * Device Fingerprint Utility
 * Uses FingerprintJS for browser fingerprinting
 */

let fpPromise: Promise<any> | null = null;
let cachedVisitorId: string | null = null;

/**
 * Get device fingerprint ID
 * This ID stays consistent even if user clears cookies or uses incognito
 */
export async function getDeviceId(): Promise<string> {
  // Return cached if available
  if (cachedVisitorId) {
    return cachedVisitorId;
  }

  try {
    // Dynamic import to reduce bundle size
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
    
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    
    const fp = await fpPromise;
    const result = await fp.get();
    
    cachedVisitorId = result.visitorId;
    return result.visitorId;
    
  } catch (error) {
    console.error('Failed to get device fingerprint:', error);
    // Fallback to a random ID stored in localStorage
    return getFallbackDeviceId();
  }
}

/**
 * Fallback device ID using localStorage
 */
function getFallbackDeviceId(): string {
  const STORAGE_KEY = 'rv_device_id';
  
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    deviceId = 'fb_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Get device info for logging
 */
export function getDeviceInfo(): object {
  if (typeof window === 'undefined') {
    return {};
  }
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
