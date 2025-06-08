// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const statusMessage = document.getElementById("status-message");

  function showStatus(msg, type="info") {
    statusMessage.textContent = msg;
    statusMessage.className = type;
    statusMessage.style.display = "block";
    setTimeout(() => statusMessage.style.display = "none", 3000);
  }

  chrome.storage.sync.get({
    extensionEnabled: true,
    emailsEnabled: true,
    phonesEnabled: false,
    creditcardsEnabled: true,
    apiKeysEnabled: true,
    entropyEnabled: true,
    blurEnabled: true,
    textRedactionStyle: "blur"
  }, settings => {
    document.getElementById("extension-enabled").checked = settings.extensionEnabled;
    document.getElementById("emails-enabled").checked = settings.emailsEnabled;
    document.getElementById("phones-enabled").checked = settings.phonesEnabled;
    document.getElementById("creditcards-enabled").checked = settings.creditcardsEnabled;
    document.getElementById("api-keys-enabled").checked = settings.apiKeysEnabled;
    document.getElementById("entropy-enabled").checked = settings.entropyEnabled;
    document.getElementById("blur-enabled").checked = settings.blurEnabled;
    document.getElementById("blur-style").checked     = settings.textRedactionStyle === "blur";
    document.getElementById("redacted-style").checked = settings.textRedactionStyle === "redacted";
  });

  const inputs = [
    "extension-enabled","emails-enabled","phones-enabled",
    "creditcards-enabled","api-keys-enabled","entropy-enabled","blur-enabled"
  ];
  inputs.forEach(id =>
    document.getElementById(id).addEventListener("change", saveSettings)
  );
  ["blur-style","redacted-style"].forEach(id =>
    document.getElementById(id).addEventListener("change", saveSettings)
  );

  function saveSettings() {
    const cfg = {
      extensionEnabled:   document.getElementById("extension-enabled").checked,
      emailsEnabled:      document.getElementById("emails-enabled").checked,
      phonesEnabled:      document.getElementById("phones-enabled").checked,
      creditcardsEnabled: document.getElementById("creditcards-enabled").checked,
      apiKeysEnabled:     document.getElementById("api-keys-enabled").checked,
      entropyEnabled:     document.getElementById("entropy-enabled").checked,
      blurEnabled:        document.getElementById("blur-enabled").checked,
      textRedactionStyle: document.getElementById("blur-style").checked
                            ? "blur"
                            : "redacted"
    };

    showStatus("Saving settings...", "info");
    chrome.storage.sync.set(cfg, () => {
      showStatus("Settings saved. Refresh page to apply.", "success");
    });
  }
});
