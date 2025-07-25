# Hide Secret Extension

A browser extension that automatically detects and masks high-entropy secrets and personally identifiable information in webpages— Tokens, API keys, emails, phone numbers, credit cards and any other high-entropy strings—by blurring or replacing them with `[REDACTED]`.

---
## Features

* **Automatic Page Scan**
  On each page load, the extension scans all text and input fields for secrets based on configurable regex patterns.

* **Dynamic Content Handling**
  Watches for DOM mutations (new text or inputs) and applies masking in real time.

* **Popup Settings**
  Toggle individual filters and choose between blur vs. redacted styles. Settings are saved per browser and applied on the next page load.

* **No Data Collection**
  All processing is client-side; no content is sent to any server.
  ![image](https://github.com/user-attachments/assets/19551d93-c711-4f53-9827-b1decf0aea43)

## Usage
Use directly from the [chrome web store](https://chromewebstore.google.com/detail/ldenkldeajffnnopcglkejofffefohio?utm_source=item-share-cb)

1. **Install** the extension (see “Running Locally” below).

2. **Navigate** to any webpage. If secrets are found, they will be blurred or replaced immediately after the page loads.

3. **Open the popup** by clicking the extension icon in your toolbar to:

   * **Enable/Disable** the entire extension.
   * **Toggle Filters** for Emails, Phones, Credit Cards, API Keys & Token and generic High-Entropy strings.
   * **Choose Style**: Blur (`••••`) or Redacted (`[REDACTED]`).

   <p align="center">
     <img src="https://github.com/user-attachments/assets/d68a8466-a91e-4723-a173-cb26a93c4583" alt="Popup Settings" width="400">
  </p>

4. **Refresh** the page to apply any new settings.

---

## Configuration

All filters and style preferences are stored in `chrome.storage.sync`. Changing any setting in the popup will take effect on the next page load.

| Setting                   | Default | Description                                                            |
| ------------------------- | :-----: | ---------------------------------------------------------------------- |
| Extension Enabled         |    ✓    | Master on/off switch                                                   |
| Hide Emails               |    ✓    | Mask email addresses                                                   |
| Hide Phone Numbers        |    ✓    | Mask international and local phone numbers                            |
| Hide Credit Cards         |    ✓    | Mask common credit-card number patterns                                |
| Hide API Keys & Tokens    |    ✓    | Mask JWTs, API keys, and other high-entropy alphanumeric strings       |
| Hide High-Entropy Strings |    ✓    | Mask any 32+ character base-62 strings with Shannon entropy > 4        |
| Blur Inputs               |    ✓    | Blur secrets inside `<input>`/`<textarea>` fields instead of redacting |
| Masking Style             |   Blur  | Choose between `Blur` (CSS blur) or `Redacted` (`[REDACTED]`)          |

---

## Running Locally

1. Download the latest release:

   ```bash
   https://github.com/Ved235/hide-secrets/releases
   ```

2. **Load as an unpacked extension** in Chrome/Edge/Brave:
   * Unzip the folder 
   * Visit `chrome://extensions/` (or `edge://extensions/`).
   * Enable **Developer mode**.
   * Click **Load unpacked**, then select this project’s directory.

3. **Verify** that the extension icon appears in your toolbar. Navigate to any page to see it in action.

---

## Extension Structure

```
secret-hider-extension/
├── content.js       
├── popup.html         
├── popup.js           
├── manifest.json      
└── patterns.js       
```

* **`content.js`**

  * Reads settings from `chrome.storage.sync` on load
  * Scans the DOM once per page load
  * Observes mutations to handle dynamic content

* **`popup.html` & `popup.js`**

  * Renders checkboxes and radio buttons for each filter
  * Persists changes to `chrome.storage.sync`

* **`patterns.js`**

  * DB to define and tweak regex patterns for various secret types

---

If you find this extension useful, please give it a ⭐ on GitHub!
