(() => {
  "use strict";

  const MARK_ATTR = "data-secret-processed";

  // Default settings
  let settings = {
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
  };

  chrome.storage.sync.get(settings, (savedSettings) => {
    settings = savedSettings;
    if (
      settings.extensionEnabled &&
      isDomainAllowed() &&
      document.readyState !== "loading"
    ) {
      runInitialScan().catch((err) =>
        console.error("Error during initial scan:", err)
      );
    }
  });

  const emailPatterns = [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g];

  const phonePatterns = [
    /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b(?!\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})\+?(?:\d[-.\s]?){6,14}\d\b/g,
  ];

  const creditCardPatterns = [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b/g,
  ];

  const tokenPatterns = [
    /\b(apikey|secret|key|api|password|pass|pw|host)=[0-9a-zA-Z-_.{}]{4,120}\b/gi,
    /\bxox[baprs]-[0-9A-Za-z-]{10,72}\b/gi,
    /\b(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/g,
    /\bghp_[0-9a-zA-Z]{36}\b/g,
    /\bgho_[0-9a-zA-Z]{36}\b/g,
    /\bAIza[0-9A-Za-z\\\\-_]{35}\b/g,
    /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g,
    /\b[a-zA-Z0-9_-]{64,}\b/g,
  ];

  const genericHighEntropy = /[A-Za-z0-9_-]{32,}/;

  function getCustomRegexPatterns() {
    if (
      !settings.customRegexPatterns ||
      !Array.isArray(settings.customRegexPatterns)
    ) {
      return [];
    }

    return settings.customRegexPatterns
      .filter((pattern) => pattern.enabled !== false)
      .map((pattern) => {
        try {
          return new RegExp(pattern.regex, "g");
        } catch (e) {
          console.warn(`Invalid custom regex pattern: ${pattern.regex}`, e);
          return null;
        }
      })
      .filter((regex) => regex !== null);
  }

  function isDomainAllowed() {
    const url = window.location.hostname.toLowerCase();
    if (
      settings.blacklistDomains.some(
        (domain) => domain === url || url.endsWith("." + domain)
      )
    ) {
      return false;
    }

    if (settings.whitelistDomains.length > 0) {
      return settings.whitelistDomains.some(
        (domain) => url === domain || url.endsWith("." + domain)
      );
    }
    return true;
  }

  function isEditableElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    const tag = element.tagName.toLowerCase();

    if (tag === "input" || tag === "textarea") return true;

    if (element.hasAttribute("contenteditable")) {
      const contenteditable = element
        .getAttribute("contenteditable")
        .toLowerCase();
      return contenteditable === "true" || contenteditable === "";
    }

    let parent = element.parentElement;
    while (parent) {
      if (parent.hasAttribute("contenteditable")) {
        const contenteditable = parent
          .getAttribute("contenteditable")
          .toLowerCase();
        if (contenteditable === "true" || contenteditable === "") return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }

  function computeShannonEntropy(str) {
    const len = str.length;
    const freq = {};
    for (let ch of str) {
      freq[ch] = (freq[ch] || 0) + 1;
    }
    let entropy = 0;
    for (let ch in freq) {
      const p = freq[ch] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  function quickTest(text) {
    if (
      !settings.extensionEnabled ||
      !isDomainAllowed() ||
      !text ||
      !text.trim()
    )
      return false;

    if (settings.customRegexEnabled) {
      const customPatterns = getCustomRegexPatterns();
      for (let re of customPatterns) {
        re.lastIndex = 0;
        if (re.test(text)) {
          return true;
        }
      }
    }

    if (settings.apiKeysEnabled) {
      for (let re of tokenPatterns) {
        if (re.test(text)) {
          return true;
        }
      }
    }

    if (settings.emailsEnabled) {
      for (let re of emailPatterns) {
        if (re.test(text)) {
          return true;
        }
      }
    }

    if (settings.phonesEnabled) {
      for (let re of phonePatterns) {
        if (re.test(text)) {
          return true;
        }
      }
    }

    if (settings.creditcardsEnabled) {
      for (let re of creditCardPatterns) {
        if (re.test(text)) {
          return true;
        }
      }
    }

    if (settings.entropyEnabled) {
      const parts = text.split(/[\s\.\:\'\"!\?\(\)\[\]\{\}]/);
      for (let fragment of parts) {
        if (genericHighEntropy.test(fragment) && fragment.length >= 32) {
          const ent = computeShannonEntropy(fragment);
          if (ent > 4) return true;
        }
      }
    }

    return false;
  }

  function detectAndReplaceTextNode(textNode) {
    if (!settings.extensionEnabled) return;

    const parentElem = textNode.parentElement;
    if (!parentElem) return;
    if (textNode.nodeType !== Node.TEXT_NODE) return;

    if (isEditableElement(parentElem)) return;
    const txt = textNode.textContent || "";
    if (!txt.trim()) return;

    let matchInfo = null;
    let matchedPattern = null;
    let match = null;

    if (settings.customRegexEnabled) {
      const customPatterns = getCustomRegexPatterns();
      for (let re of customPatterns) {
        re.lastIndex = 0;
        if ((match = re.exec(txt))) {
          matchInfo = { value: match[0] };
          matchedPattern = re;
          break;
        }
      }
    }
    if (!matchInfo && settings.apiKeysEnabled) {
      for (let re of tokenPatterns) {
        re.lastIndex = 0;
        if ((match = re.exec(txt))) {
          matchInfo = { value: match[0] };
          matchedPattern = re;
          break;
        }
      }
    }

    if (!matchInfo && settings.emailsEnabled) {
      for (let re of emailPatterns) {
        re.lastIndex = 0;
        if ((match = re.exec(txt))) {
          matchInfo = { value: match[0] };
          matchedPattern = re;
          break;
        }
      }
    }

    if (!matchInfo && settings.phonesEnabled) {
      for (let re of phonePatterns) {
        re.lastIndex = 0;
        if ((match = re.exec(txt))) {
          matchInfo = { value: match[0] };
          matchedPattern = re;
          break;
        }
      }
    }

    if (!matchInfo && settings.creditcardsEnabled) {
      for (let re of creditCardPatterns) {
        re.lastIndex = 0;
        if ((match = re.exec(txt))) {
          matchInfo = { value: match[0] };
          matchedPattern = re;
          break;
        }
      }
    }

    if (!matchInfo && settings.entropyEnabled) {
      const parts = txt.split(/[\s\.\:\'\"!\?\(\)\[\]\{\}]/);
      for (let fragment of parts) {
        if (
          genericHighEntropy.test(fragment) &&
          fragment.length >= 32 &&
          computeShannonEntropy(fragment) > 4
        ) {
          matchInfo = { value: fragment };
          matchedPattern = new RegExp(
            fragment.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
            "g"
          );
          break;
        }
      }
    }

    if (!matchInfo) return;

    const globalRe = new RegExp(matchedPattern.source, matchedPattern.flags);

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let m;
    while ((m = globalRe.exec(txt))) {
      const idx = m.index;
      if (idx > lastIndex) {
        frag.appendChild(document.createTextNode(txt.slice(lastIndex, idx)));
      }
      const span = document.createElement("span");
      span.setAttribute(MARK_ATTR, "true");
      if (settings.textRedactionStyle === "blur") {
        span.textContent = m[0];
        span.style.filter = "blur(5px)";
        span.className = "hide-secrets-blurred";
      } else {
        span.textContent = "[REDACTED]";
        span.className = "hide-secrets-redacted";
      }
      frag.appendChild(span);
      lastIndex = idx + m[0].length;
    }
    if (lastIndex < txt.length) {
      frag.appendChild(document.createTextNode(txt.slice(lastIndex)));
    }

    parentElem.replaceChild(frag, textNode);
  }

  async function walkAndProcess(node) {
    if (!settings.extensionEnabled || !isDomainAllowed()) {
      console.log("Extension is disabled, skipping processing." + node.value);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.hasAttribute(MARK_ATTR)) return;

      const tag = node.tagName.toLowerCase();
      if (tag === "input") {
        try {
          const val = node.value || "";
          if (quickTest(val) && settings.blurEnabled) {
            console.log(`Redacting input value: ${val} in element: <${tag}>`);
            node.style.filter = "blur(5px)";
          }
          node.setAttribute(MARK_ATTR, "true");
        } catch (e) {
          console.log("Error processing input element");
        }
        return;
      }

      if (isEditableElement(node)) {
        node.setAttribute(MARK_ATTR, "true");
        return;
      }
      if (tag === "script" || tag === "style") return;

      for (const child of Array.from(node.childNodes)) {
        await walkAndProcess(child);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.textContent || "";
      if (quickTest(txt)) {
        detectAndReplaceTextNode(node);
      }
    }
  }

  async function runInitialScan() {
    if (!settings.extensionEnabled || !isDomainAllowed()) return;
    const root = document.body || document.documentElement;
    await walkAndProcess(root);
  }

  const observer = new MutationObserver((mutations) => {
    if (!settings.extensionEnabled || !isDomainAllowed()) return;

    for (const mutation of mutations) {
      (async () => {
        if (mutation.type === "childList") {
          for (const added of Array.from(mutation.addedNodes)) {
            if (
              added.nodeType === Node.ELEMENT_NODE &&
              added.hasAttribute(MARK_ATTR)
            ) {
              continue;
            }
            if (
              mutation.target.nodeType === Node.ELEMENT_NODE &&
              mutation.target.hasAttribute(MARK_ATTR)
            ) {
              continue;
            }
            await walkAndProcess(added);
          }
        } else if (
          mutation.type === "characterData" &&
          mutation.target.nodeType === Node.TEXT_NODE &&
          mutation.target.textContent
        ) {
          const txtNode = mutation.target;
          const parentElem = txtNode.parentElement;
          if (parentElem && parentElem.hasAttribute(MARK_ATTR)) return;

          if (isEditableElement(parentElem)) return;
          const txt = txtNode.textContent || "";
          if (quickTest(txt)) {
            detectAndReplaceTextNode(txtNode);
          }
        }
      })();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["value"],
  });
})();
