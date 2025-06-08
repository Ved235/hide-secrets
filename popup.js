document.addEventListener('DOMContentLoaded', function() {
  const statusMessage = document.getElementById('status-message');

  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  // Load saved settings or use defaults
  chrome.storage.sync.get({
    extensionEnabled: true,
    emailsEnabled: true,
    phonesEnabled: true,
    creditcardsEnabled: true,
    apiKeysEnabled: true,
    entropyEnabled: true,
    blurEnabled: true
  }, function(settings) {
    // Set toggle states based on saved settings
    document.getElementById('extension-enabled').checked = settings.extensionEnabled;
    document.getElementById('emails-enabled').checked = settings.emailsEnabled;
    document.getElementById('phones-enabled').checked = settings.phonesEnabled;
    document.getElementById('creditcards-enabled').checked = settings.creditcardsEnabled;
    document.getElementById('api-keys-enabled').checked = settings.apiKeysEnabled;
    document.getElementById('entropy-enabled').checked = settings.entropyEnabled;
    document.getElementById('blur-enabled').checked = settings.blurEnabled;
  });

  // Save settings when toggles change
  document.getElementById('extension-enabled').addEventListener('change', saveSettings);
  document.getElementById('emails-enabled').addEventListener('change', saveSettings);
  document.getElementById('phones-enabled').addEventListener('change', saveSettings);
  document.getElementById('creditcards-enabled').addEventListener('change', saveSettings);
  document.getElementById('api-keys-enabled').addEventListener('change', saveSettings);
  document.getElementById('entropy-enabled').addEventListener('change', saveSettings);
  document.getElementById('blur-enabled').addEventListener('change', saveSettings);

  // Scan page button
  document.getElementById('scan-page').addEventListener('click', function() {
    showStatus('Scanning page...', 'info');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        showStatus('No active tab found', 'error');
        return;
      }
      
      // Safely send message to the tab with error handling
      try {
        chrome.tabs.sendMessage(tabs[0].id, {action: "rescan"}, function(response) {
          // Check for error
          if (chrome.runtime.lastError) {
            console.log("Error sending message:", chrome.runtime.lastError.message);
            
            showStatus('Initializing extension on this page...', 'info');
            
            // Try injecting the content script if it's not loaded
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ["content.js"]
            }).then(() => {
              // Try again after a short delay
              setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id, {action: "rescan"}, function(resp) {
                  if (chrome.runtime.lastError) {
                    showStatus('Could not scan this page', 'error');
                  } else {
                    showStatus('Page scanned successfully', 'success');
                  }
                });
              }, 500);
            }).catch(err => {
              console.error("Failed to inject content script:", err);
              showStatus('Failed to scan page', 'error');
            });
          } else {
            showStatus('Page scanned successfully', 'success');
          }
        });
      } catch (error) {
        console.error("Error sending message:", error);
        showStatus('Error scanning page', 'error');
      }
    });
  });

  function saveSettings() {
    const settings = {
      extensionEnabled: document.getElementById('extension-enabled').checked,
      emailsEnabled: document.getElementById('emails-enabled').checked,
      phonesEnabled: document.getElementById('phones-enabled').checked,
      creditcardsEnabled: document.getElementById('creditcards-enabled').checked,
      apiKeysEnabled: document.getElementById('api-keys-enabled').checked,
      entropyEnabled: document.getElementById('entropy-enabled').checked,
      blurEnabled: document.getElementById('blur-enabled').checked
    };
    
    showStatus('Saving settings...', 'info');
    
    chrome.storage.sync.set(settings, function() {
      // Notify content script about the setting changes
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
          showStatus('Settings saved', 'success');
          return;
        }
        
        // Safely send message with error handling
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSettings",
          settings: settings
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error updating settings:", chrome.runtime.lastError.message);
            // Settings were still saved to storage even if content script couldn't be notified
            showStatus('Settings saved', 'success');
          } else {
            showStatus('Settings saved and applied', 'success');
          }
        });
      });
    });
  }
});