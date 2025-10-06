/**
 * @file background.js
 * @description Service Worker for Duo Dictionary Lookup.
 * v3.0.0: Handles two distinct actions: Cambridge popup and WordReference new tab.
 */

const DEFAULT_OPTIONS = {
    cambridgeLangPair: 'english-french',
    wordrefLangPair: 'enfr',
};

// --- Initialization ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "lookup-cambridge-ctx",
        title: "Chercher \"%s\" sur Cambridge Dictionary",
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

// --- Event Handlers ---
function handleContextMenuClick(info, tab) {
    if (info.menuItemId === "lookup-cambridge-ctx" && info.selectionText) {
        processCambridgeRequest(info.selectionText, tab);
    }
}

function handleCommand(command, tab) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getSelectionOrWordUnderCursor
    }, (injectionResults) => {
        if (chrome.runtime.lastError || !injectionResults || !injectionResults[0] || !injectionResults[0].result) {
            console.warn(`Could not get selection programmatically.`);
            return;
        }
        const selectedText = injectionResults[0].result;
        
        if (command === "lookup-cambridge") {
            processCambridgeRequest(selectedText, tab);
        } else if (command === "lookup-wordreference-tab") {
            processWordReferenceRequest(selectedText, tab);
        }
    });
}

// --- Core Logic ---

async function processCambridgeRequest(text, tab) {
    const sanitizedText = text.trim();
    if (!sanitizedText) return;

    const options = await getOptions();
    const lookupUrl = `https://dictionary.cambridge.org/dictionary/${options.cambridgeLangPair}/${encodeURIComponent(sanitizedText)}`;

    await chrome.storage.local.set({ lastCambridgeUrl: lookupUrl });
    chrome.action.openPopup();
}

async function processWordReferenceRequest(text, tab) {
    const sanitizedText = text.trim();
    if (!sanitizedText) return;

    const options = await getOptions();
    const lookupUrl = `https://www.wordreference.com/${options.wordrefLangPair}/${encodeURIComponent(sanitizedText)}`;

    chrome.tabs.create({ url: lookupUrl });
}

function getOptions() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_OPTIONS, (items) => {
            resolve(items);
        });
    });
}

function getSelectionOrWordUnderCursor() {
    return window.getSelection().toString().trim();
}