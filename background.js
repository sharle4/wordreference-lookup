/**
 * @file background.js
 * @description Service Worker for the WordReference Lookup extension.
 * Handles context menu creation, command listeners, and orchestrates the lookup process.
 */

// --- Default Settings ---
const DEFAULT_OPTIONS = {
    langPair: 'enfr',
    displayMode: 'iframe',
    modalWidth: 700,
    modalHeight: 550
};

// --- Initialization ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "wordreference-lookup",
        title: "Chercher \"%s\" sur WordReference",
        contexts: ["selection"]
    });
    chrome.storage.sync.get(null, (items) => {
        if (Object.keys(items).length === 0) {
            chrome.storage.sync.set(DEFAULT_OPTIONS);
        }
    });
});

// --- Event Listeners ---
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
chrome.commands.onCommand.addListener(handleCommand);
chrome.runtime.onMessage.addListener(handleMessages);


// --- Event Handlers ---

/**
 * Handles clicks on the context menu item.
 * @param {object} info - Information about the clicked menu item.
 * @param {object} tab - The tab where the click occurred.
 */
function handleContextMenuClick(info, tab) {
    if (info.menuItemId === "wordreference-lookup" && info.selectionText) {
        processLookupRequest(info.selectionText, tab);
    }
}

/**
 * Handles keyboard shortcut commands.
 * @param {string} command - The name of the command that was executed.
 * @param {object} tab - The tab where the command was executed.
 */
function handleCommand(command, tab) {
    if (command === "lookup-selection") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getSelectionOrWordUnderCursor
        }, (injectionResults) => {
            if (chrome.runtime.lastError) {
                console.error(`Script injection failed: ${chrome.runtime.lastError.message}`);
                return;
            }
            if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                processLookupRequest(injectionResults[0].result, tab);
            }
        });
    }
}

/**
 * Handles messages from content scripts (e.g., for fallback).
 * @param {object} request - The message payload.
 * @param {object} sender - Information about the message sender.
 * @param {function} sendResponse - Function to call to send a response.
 * @returns {boolean} - True to indicate an async response.
 */
function handleMessages(request, sender, sendResponse) {
    if (request.type === 'trigger_fallback') {
        openInNewWindowOrTab(request.url, request.options);
        sendResponse({ status: "fallback triggered" });
    }
    return true;
}


// --- Core Logic ---

/**
 * Cleans the text and triggers the appropriate display method based on user settings.
 * @param {string} text - The text to look up.
 * @param {object} tab - The active tab.
 */
async function processLookupRequest(text, tab) {
    const sanitizedText = text.trim();
    if (!sanitizedText) return;

    const options = await getOptions();
    const lookupUrl = `https://www.wordreference.com/${options.langPair}/${encodeURIComponent(sanitizedText)}`;

    switch (options.displayMode) {
        case 'iframe':
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content/content_script.js']
            }).catch(err => console.error("Failed to inject content script:", err));
            
            chrome.tabs.sendMessage(tab.id, {
                type: 'show_modal',
                word: sanitizedText,
                url: lookupUrl,
                options: options
            });
            break;
        case 'popup':
            openInNewWindowOrTab(lookupUrl, options, 'popup');
            break;
        case 'tab':
            openInNewWindowOrTab(lookupUrl, options, 'tab');
            break;
    }
}

/**
 * Opens the URL in a new popup window or tab.
 * @param {string} url - The URL to open.
 * @param {object} options - User-defined options (width, height).
 * @param {string} type - 'popup' or 'tab'.
 */
function openInNewWindowOrTab(url, options, type = 'popup') {
    if (type === 'popup') {
        chrome.windows.create({
            url: url,
            type: 'popup',
            width: options.modalWidth,
            height: options.modalHeight
        });
    } else {
        chrome.tabs.create({ url: url });
    }
}

/**
 * Retrieves user options from storage, falling back to defaults.
 * @returns {Promise<object>} A promise that resolves with the user's options.
 */
function getOptions() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
            resolve(items);
        });
    });
}

/**
 * This function is injected into the page to get the selected text.
 * @returns {string} The selected text or the word under the cursor.
 */
function getSelectionOrWordUnderCursor() {
    const selection = window.getSelection();
    let text = selection.toString().trim();

    if (text) {
        return text;
    }

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent;
                const start = range.startOffset;

                let wordStart = textContent.lastIndexOf(' ', start) + 1;
                let wordEnd = textContent.indexOf(' ', start);
                if (wordEnd === -1) {
                    wordEnd = textContent.length;
                }
                text = textContent.substring(wordStart, wordEnd).replace(/[^a-zA-Z0-9'-]/g, '');
            }
        }
    }
    return text;
}