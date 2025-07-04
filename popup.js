document.addEventListener("DOMContentLoaded", () => {
  const statusMessage = document.getElementById("status-message");

  function showStatus(msg, type = "info") {
    statusMessage.textContent = msg;
    statusMessage.className = type;
    statusMessage.style.display = "block";
    setTimeout(() => (statusMessage.style.display = "none"), 3000);
  }

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      tabContents.forEach((content) => content.classList.remove("active"));
      document.getElementById(`${tabName}-tab`).classList.add("active");

      if (tabName === 'stats') {
        loadCurrentStats();
        loadDetectionHistory();
      }
    });
  });

  // Load current session stats
  function loadCurrentStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' }, (response) => {
          if (response) {
            updateStatsDisplay(response.sessionStats);
            document.getElementById('domain-name').textContent = response.domain || 'Unknown Domain';
          } else {
            updateStatsDisplay({
              email: 0,
              phone: 0,
              creditCard: 0,
              apiKey: 0,
              entropy: 0,
              custom: 0,
              total: 0
            });
            document.getElementById('domain-name').textContent = 'No Data Available';
          }
        });
      }
    });
  }

  function updateStatsDisplay(stats) {
    document.getElementById('stat-email').textContent = stats.email || 0;
    document.getElementById('stat-phone').textContent = stats.phone || 0;
    document.getElementById('stat-creditCard').textContent = stats.creditCard || 0;
    document.getElementById('stat-apiKey').textContent = stats.apiKey || 0;
    document.getElementById('stat-entropy').textContent = stats.entropy || 0;
    document.getElementById('stat-custom').textContent = stats.custom || 0;
    document.getElementById('stat-total').textContent = stats.total || 0;
  }

  function loadDetectionHistory() {
    chrome.storage.local.get(['detectionHistory'], (result) => {
      const history = result.detectionHistory || {};
      const historyList = document.getElementById('history-list');
      
      const last7Days = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
      }

      const historyItems = [];
      
      Object.keys(history).forEach(domain => {
        last7Days.forEach(dateStr => {
          if (history[domain][dateStr] && history[domain][dateStr].total > 0) {
            historyItems.push({
              domain: domain,
              date: dateStr,
              count: history[domain][dateStr].total,
              details: history[domain][dateStr]
            });
          }
        });
      });

      historyItems.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (historyItems.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No detection history found</div>';
        return;
      }

      // Render history items
      historyList.innerHTML = historyItems.map(item => {
        const date = new Date(item.date);
        const isToday = item.date === new Date().toISOString().split('T')[0];
        const displayDate = isToday ? 'Today' : date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
        
        return `
          <div class="history-item">
            <div>
              <div class="history-domain">${escapeHtml(item.domain)}</div>
              <div class="history-date">${displayDate}</div>
            </div>
            <div class="history-count">${item.count}</div>
          </div>
        `;
      }).join('');
    });
  }

  document.getElementById('clear-history-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all detection history?')) {
      chrome.storage.local.set({ detectionHistory: {} }, () => {
        loadDetectionHistory();
        showStatus('Detection history cleared', 'success');
      });
    }
  });

  chrome.storage.sync.get(
    {
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
    },
    (settings) => {
      // Load toggle settings
      document.getElementById("extension-enabled").checked =
        settings.extensionEnabled;
      document.getElementById("emails-enabled").checked =
        settings.emailsEnabled;
      document.getElementById("phones-enabled").checked =
        settings.phonesEnabled;
      document.getElementById("creditcards-enabled").checked =
        settings.creditcardsEnabled;
      document.getElementById("api-keys-enabled").checked =
        settings.apiKeysEnabled;
      document.getElementById("entropy-enabled").checked =
        settings.entropyEnabled;
      document.getElementById("custom-regex-enabled").checked =
        settings.customRegexEnabled;
      document.getElementById("blur-enabled").checked = settings.blurEnabled;
      document.getElementById("blur-style").checked =
        settings.textRedactionStyle === "blur";
      document.getElementById("redacted-style").checked =
        settings.textRedactionStyle === "redacted";

      renderDomainList("blacklist", settings.blacklistDomains);
      renderDomainList("whitelist", settings.whitelistDomains);
      renderCustomRegexList(settings.customRegexPatterns);
    }
  );

  // Load initial stats if stats tab is already active
  if (document.querySelector('.tab-button[data-tab="stats"]').classList.contains('active')) {
    loadCurrentStats();
    loadDetectionHistory();
  }

  const inputs = [
    "extension-enabled",
    "emails-enabled",
    "phones-enabled",
    "creditcards-enabled",
    "api-keys-enabled",
    "entropy-enabled",
    "custom-regex-enabled",
    "blur-enabled",
  ];
  inputs.forEach((id) =>
    document.getElementById(id).addEventListener("change", saveSettings)
  );
  ["blur-style", "redacted-style"].forEach((id) =>
    document.getElementById(id).addEventListener("change", saveSettings)
  );

  function saveSettings() {
    const cfg = {
      extensionEnabled: document.getElementById("extension-enabled").checked,
      emailsEnabled: document.getElementById("emails-enabled").checked,
      phonesEnabled: document.getElementById("phones-enabled").checked,
      creditcardsEnabled: document.getElementById("creditcards-enabled")
        .checked,
      apiKeysEnabled: document.getElementById("api-keys-enabled").checked,
      entropyEnabled: document.getElementById("entropy-enabled").checked,
      customRegexEnabled: document.getElementById("custom-regex-enabled")
        .checked,
      blurEnabled: document.getElementById("blur-enabled").checked,
      textRedactionStyle: document.getElementById("blur-style").checked
        ? "blur"
        : "redacted",
    };

    showStatus("Saving settings...", "info");
    chrome.storage.sync.set(cfg, () => {
      showStatus("Settings saved. Refresh page to apply.", "success");
    });
  }

  function renderDomainList(type, domains) {
    const container = document.getElementById(`${type}-domains`);
    container.innerHTML = "";

    if (domains.length === 0) {
      container.innerHTML = `<div class="empty-list">No ${type}ed domains</div>`;
      return;
    }

    domains.forEach((domain) => {
      const item = document.createElement("div");
      item.className = "domain-item";
      item.innerHTML = `
        <span class="domain-name">${escapeHtml(domain)}</span>
        <button class="remove-domain-btn" data-domain="${escapeHtml(
          domain
        )}" data-type="${type}">
          Remove
        </button>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll(".remove-domain-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeDomain(btn.dataset.type, btn.dataset.domain);
      });
    });
  }

  function renderCustomRegexList(patterns) {
    const container = document.getElementById("custom-regex-list");
    container.innerHTML = "";

    if (patterns.length === 0) {
      container.innerHTML = `<div class="empty-list">No custom regex patterns</div>`;
      return;
    }

    patterns.forEach((pattern, index) => {
      const item = document.createElement("div");
      item.className = "domain-item";
      item.innerHTML = `
        <div>
          <div class="domain-name">${escapeHtml(
            pattern.name || `Pattern ${index + 1}`
          )}</div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">
            ${escapeHtml(pattern.regex)}
          </div>
        </div>
        <button class="remove-domain-btn" data-index="${index}">
          Remove
        </button>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll(".remove-domain-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeCustomRegex(parseInt(btn.dataset.index));
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function isValidDomain(domain) {
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  function isValidRegex(regexStr) {
    try {
      new RegExp(regexStr);
      return true;
    } catch (e) {
      return false;
    }
  }

  function addDomain(type, domain) {
    domain = domain.trim().toLowerCase();

    if (!domain) {
      showStatus("Please enter a domain", "error");
      return;
    }

    let extractedDomain;
    try {
      const url = new URL(domain);
      extractedDomain = url.hostname;
    } catch (e) {
      extractedDomain = domain;
    }

    domain = extractedDomain.toLowerCase();
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
      const updatedDomains = domains.filter((d) => d !== domain);

      chrome.storage.sync.set({ [`${type}Domains`]: updatedDomains }, () => {
        renderDomainList(type, updatedDomains);
        showStatus("Domain removed successfully", "success");
      });
    });
  }

  function addCustomRegex() {
    const nameInput = document.getElementById("regex-name-input");
    const regexInput = document.getElementById("regex-input");

    const name = nameInput.value.trim();
    const regexStr = regexInput.value.trim();

    if (!regexStr) {
      showStatus("Please enter a regex pattern", "error");
      return;
    }

    if (!isValidRegex(regexStr)) {
      showStatus("Please enter a valid regex pattern", "error");
      return;
    }

    chrome.storage.sync.get(["customRegexPatterns"], (result) => {
      const patterns = result.customRegexPatterns || [];

      // Check for duplicate regex patterns
      if (patterns.some((p) => p.regex === regexStr)) {
        showStatus("This regex pattern already exists", "error");
        return;
      }

      const newPattern = {
        name: name || `Custom Pattern ${patterns.length + 1}`,
        regex: regexStr,
        enabled: true,
      };

      patterns.push(newPattern);

      chrome.storage.sync.set({ customRegexPatterns: patterns }, () => {
        renderCustomRegexList(patterns);
        nameInput.value = "";
        regexInput.value = "";
        showStatus("Custom regex pattern added successfully", "success");
      });
    });
  }

  function removeCustomRegex(index) {
    chrome.storage.sync.get(["customRegexPatterns"], (result) => {
      const patterns = result.customRegexPatterns || [];
      patterns.splice(index, 1);

      chrome.storage.sync.set({ customRegexPatterns: patterns }, () => {
        renderCustomRegexList(patterns);
        showStatus("Custom regex pattern removed successfully", "success");
      });
    });
  }

  // Domain management event listeners
  document.getElementById("add-blacklist-btn").addEventListener("click", () => {
    const domain = document.getElementById("blacklist-input").value;
    addDomain("blacklist", domain);
  });

  document.getElementById("add-whitelist-btn").addEventListener("click", () => {
    const domain = document.getElementById("whitelist-input").value;
    addDomain("whitelist", domain);
  });

  document
    .getElementById("add-regex-btn")
    .addEventListener("click", addCustomRegex);

  document
    .getElementById("blacklist-input")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const domain = e.target.value;
        addDomain("blacklist", domain);
      }
    });

  document
    .getElementById("whitelist-input")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const domain = e.target.value;
        addDomain("whitelist", domain);
      }
    });

  document.getElementById("regex-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addCustomRegex();
    }
  });

  function updateAddButtonState(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    function updateButton() {
      button.disabled = !input.value.trim();
    }

    input.addEventListener("input", updateButton);
    updateButton();
  }

  updateAddButtonState("blacklist-input", "add-blacklist-btn");
  updateAddButtonState("whitelist-input", "add-whitelist-btn");
  updateAddButtonState("regex-input", "add-regex-btn");
});
