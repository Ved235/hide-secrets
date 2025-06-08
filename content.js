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
    textRedactionStyle: "blur", 
  };

  // Load saved settings
  chrome.storage.sync.get(settings, (savedSettings) => {
    settings = savedSettings;
    if (settings.extensionEnabled && document.readyState !== "loading") {
      runInitialScan().catch((err) =>
        console.error("Error during initial scan:", err)
      );
    }
  });

  const emailPatterns = [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/];

  const phonePatterns = [
    /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\b\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,9}[-.\s]?\d{1,9}\b/,
  ];

  const creditCardPatterns = [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/,
    /\b[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/,
  ];

  const tokenPatterns = [
    /xox[baprs]-[0-9A-Za-z-]{10,72}/i,
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/,
    /\b[a-zA-Z0-9-]{40,}\b/,
    /\b[a-zA-Z0-9_-]{64,}\b/,
  ];

  const genericHighEntropy = /[A-Za-z0-9_-]{32,}/;

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
    if (!settings.extensionEnabled || !text || !text.trim()) return false;

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

    if (settings.apiKeysEnabled) {
      for (let re of tokenPatterns) {
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

    const txt = textNode.textContent || "";
    if (!txt.trim()) return;

    let matchInfo = null;
    let matchedPattern = null;
    let match = null;

    if (settings.emailsEnabled) {
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

    const flags = matchedPattern.flags.includes("g")
      ? matchedPattern.flags
      : matchedPattern.flags + "g";
    const globalRe = new RegExp(matchedPattern.source, flags);

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
    if (!settings.extensionEnabled){
      console.log("Extension is disabled, skipping processing."+ node.value);
      return;}

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.hasAttribute(MARK_ATTR)) return;

      const tag = node.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        try {
          const val = node.value || "";
          if (quickTest(val) && settings.blurEnabled) {
            console.log(
              `Redacting input value: ${val} in element: <${tag}>` );
            node.style.filter = "blur(5px)";
          }
          node.setAttribute(MARK_ATTR, "true");
        } catch (e) {
          // Ignore errors
        }
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
    if (!settings.extensionEnabled) return;
    const root = document.body || document.documentElement;
    await walkAndProcess(root);
  }

 

  const observer = new MutationObserver((mutations) => {
    if (!settings.extensionEnabled) return;

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
