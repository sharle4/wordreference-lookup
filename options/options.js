/**
 * @file options.js
 * @description Handles logic for the extension's options page.
 * Saves and restores settings from chrome.storage.sync.
 */

const saveOptions = (e) => {
    e.preventDefault();
    const langPair = document.getElementById('langPair').value;
    const displayMode = document.getElementById('displayMode').value;
    const modalWidth = parseInt(document.getElementById('modalWidth').value, 10);
    const modalHeight = parseInt(document.getElementById('modalHeight').value, 10);

    chrome.storage.sync.set({
        langPair,
        displayMode,
        modalWidth,
        modalHeight
    }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Paramètres enregistrés.';
        status.style.opacity = 1;
        setTimeout(() => {
            status.style.opacity = 0;
            status.textContent = '';
        }, 1500);
    });
};

const restoreOptions = () => {
    const defaults = {
        langPair: 'enfr',
        displayMode: 'iframe',
        modalWidth: 700,
        modalHeight: 550
    };

    chrome.storage.sync.get(defaults, (items) => {
        document.getElementById('langPair').value = items.langPair;
        document.getElementById('displayMode').value = items.displayMode;
        document.getElementById('modalWidth').value = items.modalWidth;
        document.getElementById('modalHeight').value = items.modalHeight;
    });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);