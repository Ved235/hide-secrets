(() => {
  "use strict";

  const MARK_ATTR = "data-secret-processed";

  const emailPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
  ];

  const phonePatterns = [
    /\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/,
    /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/
  ];

  const creditCardPatterns = [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/,
    /\b[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/
  ];

  const ssnPatterns = [
    /\b[0-9]{3}[-\s]?[0-9]{2}[-\s]?[0-9]{4}\b/
  ];

  const tokenPatterns = [
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/,
    /\b[a-zA-Z0-9]{40,}\b/,
    /\b[a-zA-Z0-9_-]{64,}\b/
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

  function detectAndReplaceTextNode(textNode) {
    const parentElem = textNode.parentElement;
    if (!parentElem || parentElem.hasAttribute(MARK_ATTR)) {
      return;
    }

    const txt = textNode.textContent || "";
    if (!txt.trim()) {
      parentElem.setAttribute(MARK_ATTR, "true");
      return;
    }

    let matchInfo = null;
    let matchedPattern = null;
    let match = null;
    
      for (let re of emailPatterns) {
        re.lastIndex = 0;
        match = re.exec(txt);
        if (match) {
          matchInfo = { value: match[0] };
          matchedPattern = re;
          break;
        }
      }
     
        for (let re of phonePatterns) {
          re.lastIndex = 0;
          match = re.exec(txt);
          if (match) {
            matchInfo = { value: match[0] };
            matchedPattern = re;
            break;
          }
        }
      
        for (let re of creditCardPatterns) {
          re.lastIndex = 0;
          match = re.exec(txt);
          if (match) {
            matchInfo = { value: match[0] };
            matchedPattern = re;
            break;
          }
        }
      
        for (let re of ssnPatterns) {
          re.lastIndex = 0;
          match = re.exec(txt);
          if (match) {
            matchInfo = { value: match[0] };
            matchedPattern = re;
            break;
          }
        }
      
        for (let re of tokenPatterns) {
          re.lastIndex = 0;
          match = re.exec(txt);
          if (match) {
            matchInfo = { value: match[0] };
            matchedPattern = re;
            break;
          }
        }
      
        const parts = txt.split(/[\s\.\:\'\"!\?\(\)\[\]\{\}]/);
        for (let fragment of parts) {
          if (genericHighEntropy.test(fragment) && fragment.length >= 32) {
            const ent = computeShannonEntropy(fragment);
            if (ent > 4) {
              matchInfo = { value: fragment };
              matchedPattern = new RegExp(fragment.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
              break;
            }
          }
        }

    if (!matchInfo) {
      parentElem.setAttribute(MARK_ATTR, "true");
      return;
    }
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
      frag.appendChild(document.createTextNode("[REDACTED]"));
      lastIndex = idx + m[0].length;
    }
    if (lastIndex < txt.length) {
      frag.appendChild(document.createTextNode(txt.slice(lastIndex)));
    }

    parentElem.replaceChild(frag, textNode);
    parentElem.setAttribute(MARK_ATTR, "true");
  }

  function walkAndProcess(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      detectAndReplaceTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      if (tag === "script" || tag === "style") return;
      if (node.hasAttribute(MARK_ATTR)) return;
      for (const child of Array.from(node.childNodes)) {
        walkAndProcess(child);
      }
    }
  }

  function runInitialScan() {
    const root = document.body || document.documentElement;
    walkAndProcess(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runInitialScan, { once: true });
  } else {
    runInitialScan();
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const added of mutation.addedNodes) {
          if (added.nodeType === Node.ELEMENT_NODE) {
            walkAndProcess(added);
          } else if (added.nodeType === Node.TEXT_NODE) {
            detectAndReplaceTextNode(added);
          }
        }
      } else if (mutation.type === "characterData") {
        const txtNode = mutation.target;
        if (txtNode.nodeType === Node.TEXT_NODE && txtNode.textContent) {
          detectAndReplaceTextNode(txtNode);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
