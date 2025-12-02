/**
 * Utility to preload critical resources for better page performance
 */

/**
 * Preload critical CSS files
 * @param {string[]} cssFiles - Array of CSS file paths to preload
 */
export const preloadCriticalCSS = (cssFiles = []) => {
  cssFiles.forEach(file => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = file;
    document.head.appendChild(link);
  });
};

/**
 * Preload critical images
 * @param {string[]} imageUrls - Array of image URLs to preload
 */
export const preloadCriticalImages = (imageUrls = []) => {
  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  });
};

/**
 * Preload critical fonts
 * @param {Object[]} fonts - Array of font objects with url and type properties
 */
export const preloadCriticalFonts = (fonts = []) => {
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = font.url;
    link.type = font.type || 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

/**
 * Initialize preloading of critical resources
 * @param {Object} resources - Object containing arrays of resources to preload
 */
export const initPreloadResources = (resources = {}) => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback for non-blocking preloading
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      if (resources.css) preloadCriticalCSS(resources.css);
      if (resources.images) preloadCriticalImages(resources.images);
      if (resources.fonts) preloadCriticalFonts(resources.fonts);
    }, { timeout: 2000 });
  } else {
    // Fallback to setTimeout
    setTimeout(() => {
      if (resources.css) preloadCriticalCSS(resources.css);
      if (resources.images) preloadCriticalImages(resources.images);
      if (resources.fonts) preloadCriticalFonts(resources.fonts);
    }, 100);
  }
};

export default initPreloadResources; 