/**
 * @file options.js
 * @description Handles logic for the extension's options page.
 */

const saveOptions = (e) => {
    e.preventDefault();
    const cambridgeLangPair = document.getElementById('cambridgeLangPair').value;
    const wordrefLangPair = document.getElementById('wordrefLangPair').value;

    chrome.storage.sync.set({
        cambridgeLangPair,
        wordrefLangPair
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
        cambridgeLangPair: 'english-french',
        wordrefLangPair: 'enfr'
    };

    chrome.storage.sync.get(defaults, (items) => {
        document.getElementById('cambridgeLangPair').value = items.cambridgeLangPair;
        document.getElementById('wordrefLangPair').value = items.wordrefLangPair;
    });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);