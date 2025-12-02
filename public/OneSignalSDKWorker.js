// Chrome-optimized OneSignal service worker
self.importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Log initialization 


// Add comprehensive error handling
self.addEventListener('error', function(event) {
  console.error('Service Worker error:', event.message, event.filename, event.lineno);
  
  // Send the error to the main thread
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'onesignal_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    });
  });
});

// Ensure background sync for more reliable delivery in Chrome
self.addEventListener('sync', function(event) {

  
  if (event.tag === 'onesignal-notification-sync') {
    
  }
});

// Log all push events to help with debugging
self.addEventListener('push', function(event) {

  
  if (event.data) {
    try {
      const data = event.data.json();
  
      
      // Extract URL from push data if available
      let url = null;
      
      // Check in custom data 'u' field
      if (data.custom && data.custom.u) {
        url = data.custom.u;
     
      }
      // Check other common locations
      else if (data.url) {
        url = data.url;
      
      } 
      else if (data.launchURL) {
        url = data.launchURL;
     
      }
      
      // Store URL in IndexedDB for later use if needed
      if (url) {
        // Clean up URL if it contains backticks
        if (typeof url === 'string') {
          url = url.replace(/`/g, '').trim();
       
        }
        
        // Store the URL for later use
        self.lastNotificationUrl = url;
      }
    } catch (e) {
   
    }
  } else {
   
  }
});

// Add custom notification click handler for Chrome
self.addEventListener('notificationclick', function(event) {

  
  // Get notification data
  const notification = event.notification;
  const data = notification.data || {};
  
  // Extract URL from various possible locations
  let url = null;
  
  // Check in custom data 'u' field (as seen in user's data)
  if (data.custom && data.custom.u) {
    url = data.custom.u;
   
  }
  // Check other common locations
  else if (data.url) {
    url = data.url;
 
  } 
  else if (data.launchURL) {
    url = data.launchURL;
  
  }
  else if (notification.data && notification.data.url) {
    url = notification.data.url;
   
  }
  
  // Clean up URL if it contains backticks (as seen in user's data)
  if (url && typeof url === 'string') {
    url = url.replace(/`/g, '').trim();
    
  }
  
  // Focus existing window or open a new one with the URL
  event.waitUntil(
    self.clients.matchAll({type: 'window'}).then(clientList => {
      // Log all data for debugging

      
      // If we have a URL, use it
      if (url) {
        // Try to find an existing window to focus and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(() => {
              // Send message to client to navigate
              return client.postMessage({
                type: 'onesignal_navigate',
                url: url
              });
            });
          }
        }
        
        // If no window exists, open a new one with the URL
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      } else {
        // Fallback to default behavior if no URL found
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        
        // If no window exists, open a new one to home page
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      }
    })
  );
  
  // Close the notification
  event.notification.close();
});

// Check for installed status periodically
setInterval(() => {

}, 60000); // Log every minute

// Log service worker lifecycle events
self.addEventListener('install', event => {
 
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', event => {

  
  // Claim clients so the service worker is in control
  event.waitUntil(self.clients.claim());
});