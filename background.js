chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    extensionEnabled: true,
    emailsEnabled: true,
    phonesEnabled: true,
    creditcardsEnabled: true,
    apiKeysEnabled: true,
    entropyEnabled: true,
    blurEnabled: true,
    customRegexEnabled: false,
    textRedactionStyle: "blur",
    blacklistDomains: [],
    whitelistDomains: [],
    customRegexPatterns: [],
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBadge") {
    const count = message.count;
    const badgeText = count > 99 ? "99+" : count.toString();

    chrome.action.setBadgeText({
      text: badgeText,
      tabId: sender.tab.id,
    });

    chrome.action.setBadgeBackgroundColor({
      color: "#dc2626",
      tabId: sender.tab.id,
    });
  } else if (message.action === "clearBadge") {
    chrome.action.setBadgeText({
      text: "",
      tabId: sender.tab.id,
    });
  }

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({
      text: "",
      tabId: tabId,
    });
  }
});
