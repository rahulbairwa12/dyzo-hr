const cache = new Map();
const MAX_CACHE_SIZE = 500; // Adjust to your needs

function cleanupCache() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiry) {
      cache.delete(key);
    }
  }
}

setInterval(cleanupCache, 60000); // Cleanup every 60 seconds

export const cacheApi = {
  get: (key) => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  set: (key, data, ttl = 300000) => { // default TTL: 5 minutes
    // Optional check to limit cache size
    if (cache.size >= MAX_CACHE_SIZE) {
      cleanupCache();
      if (cache.size >= MAX_CACHE_SIZE) {
        // If still full, remove the oldest entry
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
    }
    cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  },
  
  clear: (key) => {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  },
  
  clearPattern: (pattern) => {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },

  // Clear dashboard related caches
  clearDashboard: () => {
    cacheApi.clearPattern('/api/employee-project-summary');
    cacheApi.clearPattern('/api/live-report');
  },

  // Clear project related caches
  clearProjects: () => {
    cacheApi.clearPattern('/employee/list');
    cacheApi.clearPattern('/api/project');
  },

};