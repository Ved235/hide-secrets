chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    extensionEnabled: true,
    emailsEnabled: true,
    phonesEnabled: true,
    creditcardsEnabled: true,
    apiKeysEnabled: true,
    entropyEnabled: true,
    blurEnabled: true,
    textRedactionStyle: "blur",
    blacklistDomains: [],
    whitelistDomains: [],
    customRegexPatterns: []
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return true; 
});