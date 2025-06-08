chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    extensionEnabled: true,
    emailsEnabled: true,
    phonesEnabled: false,
    creditcardsEnabled: true,
    apiKeysEnabled: true,
    entropyEnabled: true,
    blurEnabled: true,
    textRedactionStyle: "blur"
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return true; 
});