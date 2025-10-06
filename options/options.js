/**
 * @file options.js
 * @description Handles logic for the extension's options page.
 * Saves and restores settings from chrome.storage.sync.
 */

const saveOptions = (e) => {
    e.preventDefault();
    const langPair = document.getElementById('langPair').value;

    chrome.storage.sync.set({
        langPair,
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
        langPair: 'enfr'
    };

    chrome.storage.sync.get(defaults, (items) => {
        document.getElementById('langPair').value = items.langPair;
    });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);