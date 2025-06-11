// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const statusMessage = document.getElementById("status-message");

  function showStatus(msg, type="info") {
    statusMessage.textContent = msg;
    statusMessage.className = type;
    statusMessage.style.display = "block";
    setTimeout(() => statusMessage.style.display = "none", 3000);
  }

  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      
      // Update active tab content
      tabContents.forEach(content => content.classList.remove("active"));
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });

  // Load settings and domains
  chrome.storage.sync.get({
    extensionEnabled: true,
    emailsEnabled: true,
    phonesEnabled: true,
    creditcardsEnabled: true,
    apiKeysEnabled: true,
    entropyEnabled: true,
    blurEnabled: true,
    textRedactionStyle: "blur",
    blacklistDomains: [],
    whitelistDomains: []
  }, settings => {
    // Load toggle settings
    document.getElementById("extension-enabled").checked = settings.extensionEnabled;
    document.getElementById("emails-enabled").checked = settings.emailsEnabled;
    document.getElementById("phones-enabled").checked = settings.phonesEnabled;
    document.getElementById("creditcards-enabled").checked = settings.creditcardsEnabled;
    document.getElementById("api-keys-enabled").checked = settings.apiKeysEnabled;
    document.getElementById("entropy-enabled").checked = settings.entropyEnabled;
    document.getElementById("blur-enabled").checked = settings.blurEnabled;
    document.getElementById("blur-style").checked = settings.textRedactionStyle === "blur";
    document.getElementById("redacted-style").checked = settings.textRedactionStyle === "redacted";
    
    // Load domain lists
    renderDomainList("blacklist", settings.blacklistDomains);
    renderDomainList("whitelist", settings.whitelistDomains);
  });

  // Settings event listeners
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

  // Domain management functions
  function renderDomainList(type, domains) {
    const container = document.getElementById(`${type}-domains`);
    container.innerHTML = "";
    
    if (domains.length === 0) {
      container.innerHTML = `<div class="empty-list">No ${type}ed domains</div>`;
      return;
    }
    
    domains.forEach(domain => {
      const item = document.createElement("div");
      item.className = "domain-item";
      item.innerHTML = `
        <span class="domain-name">${escapeHtml(domain)}</span>
        <button class="remove-domain-btn" data-domain="${escapeHtml(domain)}" data-type="${type}">
          Remove
        </button>
      `;
      container.appendChild(item);
    });
    
    // Add event listeners to remove buttons
    container.querySelectorAll(".remove-domain-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        removeDomain(btn.dataset.type, btn.dataset.domain);
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function isValidDomain(domain) {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  function addDomain(type, domain) {
    domain = domain.trim().toLowerCase();
    
    if (!domain) {
      showStatus("Please enter a domain", "error");
      return;
    }
    
    if (!isValidDomain(domain)) {
      showStatus("Please enter a valid domain", "error");
      return;
    }
    
    chrome.storage.sync.get([`${type}Domains`], (result) => {
      const domains = result[`${type}Domains`] || [];
      
      if (domains.includes(domain)) {
        showStatus("Domain already exists", "error");
        return;
      }
      
      domains.push(domain);
      domains.sort();
      
      chrome.storage.sync.set({ [`${type}Domains`]: domains }, () => {
        renderDomainList(type, domains);
        document.getElementById(`${type}-input`).value = "";
        showStatus("Domain added successfully", "success");
      });
    });
  }

  function removeDomain(type, domain) {
    chrome.storage.sync.get([`${type}Domains`], (result) => {
      const domains = result[`${type}Domains`] || [];
      const updatedDomains = domains.filter(d => d !== domain);
      
      chrome.storage.sync.set({ [`${type}Domains`]: updatedDomains }, () => {
        renderDomainList(type, updatedDomains);
        showStatus("Domain removed successfully", "success");
      });
    });
  }

  // Domain input event listeners
  document.getElementById("add-blacklist-btn").addEventListener("click", () => {
    const domain = document.getElementById("blacklist-input").value;
    addDomain("blacklist", domain);
  });

  document.getElementById("add-whitelist-btn").addEventListener("click", () => {
    const domain = document.getElementById("whitelist-input").value;
    addDomain("whitelist", domain);
  });

  // Allow adding domains with Enter key
  document.getElementById("blacklist-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const domain = e.target.value;
      addDomain("blacklist", domain);
    }
  });

  document.getElementById("whitelist-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const domain = e.target.value;
      addDomain("whitelist", domain);
    }
  });

  // Enable/disable add buttons based on input
  function updateAddButtonState(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    
    function updateButton() {
      button.disabled = !input.value.trim();
    }
    
    input.addEventListener("input", updateButton);
    updateButton(); // Initial state
  }

  updateAddButtonState("blacklist-input", "add-blacklist-btn");
  updateAddButtonState("whitelist-input", "add-whitelist-btn");
});