let isOneSignalInitialized = false;

// Add listener for service worker messages
if (typeof window !== 'undefined' && 'navigator' in window && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Received message from service worker:', event.data);
    
    // Handle navigation messages from service worker
    if (event.data && event.data.type === 'onesignal_navigate' && event.data.url) {
      const url = event.data.url;
      console.log('Navigating to URL from service worker message:', url);
      
      // Use setTimeout to ensure the page is ready
      setTimeout(() => {
        try {
          window.location.href = url;
        } catch (error) {
          console.error('Error navigating to URL:', error);
          window.open(url, '_self');
        }
      }, 300);
    }
  });
  console.log('Service worker message listener registered');
}

// Function to delete a specific user from OneSignal and re-register fresh
export async function deleteAndReRegisterOneSignalUser(userId) {
  if (typeof window === 'undefined' || !window.OneSignal) {
    console.error('❌ OneSignal SDK not loaded yet');
    return false;
  }

  const OneSignal = window.OneSignal;

  try {
    console.log('🗑️ Deleting OneSignal user:', userId);
    
    // Step 1: Logout current user (removes association)
    await OneSignal.logout();
    console.log('✅ Current user logged out');
    
    // Step 2: Remove all tags for this user
    try {
      await OneSignal.User.removeTag("userId");
      console.log('✅ User tags removed');
    } catch (tagError) {
      console.warn('⚠️ Could not remove tags:', tagError);
    }
    
    // Step 3: Clear local tracking
    window.__onesignalLastUserId = null;
    window.__onesignalClickHandlerBound = false;
    console.log('✅ Local OneSignal state cleared');
    
    // Step 4: Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Re-initialize OneSignal completely
    console.log('🔄 Re-initializing OneSignal...');
    await OneSignal.init({
      appId: '8b2b3548-5a59-4797-84b3-12e2189fd195',
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: true },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/' },
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "Would you like to receive important notifications?",
                acceptButton: "Allow",
                cancelButton: "Cancel"
              }
            }
          ]
        }
      }
    });
    
    // Step 6: Wait for re-initialization
    await new Promise(resolve => {
      OneSignal.push(() => resolve());
    });
    
    // Step 7: Re-login the user fresh
    console.log('🔐 Re-logging in user:', userId);
    await OneSignal.login(String(userId));
    window.__onesignalLastUserId = String(userId);
    
    // Step 8: Re-add tags
    await OneSignal.User.addTag("userId", String(userId));
    await OneSignal.User.addTag("app_type", "task");
    
    // Step 9: Re-bind notification handlers
    // (The main runOneSignal function will handle this when called next)
    
    console.log('✅ User deleted and re-registered successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting and re-registering user:', error);
    return false;
  }
}

export default async function runOneSignal(userId, forceReRegister = false) {
  if (typeof window === 'undefined' || !window.OneSignal) {
    console.error('❌ OneSignal SDK not loaded yet');
    return;
  }

  // Validate userId
  if (!userId || String(userId).trim() === '' || String(userId) === 'undefined' || Number.isNaN(Number(userId))) {
    console.error('❌ Invalid userId provided to OneSignal:', userId);
    return;
  }

  const OneSignal = window.OneSignal;
  
  // Initialize tracking variables if they don't exist
  if (!window.__onesignalLastUserId) window.__onesignalLastUserId = null;
  if (!window.__onesignalClickHandlerBound) window.__onesignalClickHandlerBound = false;

  // If already initialized with the same user AND not forcing re-register, do NOTHING
  if (isOneSignalInitialized && window.__onesignalLastUserId === String(userId) && !forceReRegister) {
    // Absolutely nothing happens here - just return immediately
    return;
  }

  // Handle force re-register case
  if (forceReRegister) {
    
    
    return;
  }

  try {
    // Initialize OneSignal
    await OneSignal.init({
      appId: '8b2b3548-5a59-4797-84b3-12e2189fd195',
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: true },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/' },
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "Would you like to receive important notifications?",
                acceptButton: "Allow",
                cancelButton: "Cancel"
              }
            }
          ]
        }
      }
    });

    // Wait for OneSignal to be fully initialized
    await new Promise(resolve => {
      OneSignal.push(() => resolve());
    });

    isOneSignalInitialized = true;

    const permission = Notification.permission;
   

    if (permission === 'default') {
      // Show the notification permission prompt
      await OneSignal.Notifications.requestPermission();
    }

    // Log in the user with external ID only if changed
    if (window.__onesignalLastUserId !== String(userId)) {
      if (window.__onesignalLastUserId) {
        try { await OneSignal.logout(); } catch {}
      }
     
      await OneSignal.login(String(userId));
      window.__onesignalLastUserId = String(userId);
      
    }

    // Add user tags
    await OneSignal.User.addTag("userId", String(userId));
    await OneSignal.User.addTag("app_type", "task");
   

    // Function to extract URL from notification data
    function extractUrlFromNotification(notification) {
      // Extract all possible data from the event
      const data = notification?.additionalData || {};
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
      else if (notification?.launchURL) {
        url = notification.launchURL;
       
      }
      else if (notification?.url) {
        url = notification.url;
        
      }
      
      // Check for URL in action buttons if available
      if (!url && notification?.actionButtons) {
        const actionButton = notification.actionButtons.find(btn => btn.url);
        if (actionButton) {
          url = actionButton.url;
         
        }
      }
      
      // Clean up URL if it contains backticks or extra spaces
      if (url && typeof url === 'string') {
        url = url.replace(/`/g, '').trim();
        console.log('Cleaned URL:', url);
      }
      
      return url;
    }
    
    // Function to navigate to URL safely
    function navigateToUrl(url) {
      if (!url) {
        
        return;
      }
      

      // Try multiple redirect methods with delay to ensure DOM is ready
      setTimeout(() => {
        try {
          window.location.href = url;
          
        } catch (error) {
        
          try {
            window.location.replace(url);
            console.log('Redirect initiated via location.replace');
          } catch (error2) {
          
            window.open(url, '_self');
          
          }
        }
      }, 1000);
    }
    
    // Handle notification display (bind once)
    if (!window.__onesignalClickHandlerBound) {
      window.__onesignalClickHandlerBound = true;
      OneSignal.Notifications.addEventListener('click', (event) => {
        
        
        // Log complete notification data for debugging
      
        
        // Extract URL from notification
        const url = extractUrlFromNotification(event?.notification);
      
        
        if (url) {
          // Store the URL for post-login redirect
          try {
            localStorage.setItem('postLoginRedirect', url);
        
          } catch (e) {
            
          }
          navigateToUrl(url);
        } else {
     
        }
      });
    }
    
    // Make functions available globally for service worker communication
    window.onesignalHelpers = {
      extractUrlFromNotification,
      navigateToUrl
    };
    
    // Register a global function to handle redirects from service worker
    window.handleOneSignalNotificationOpen = (url) => {
      if (url) {
       
        window.location.href = url;
      }
    };



  } catch (error) {

  }
}