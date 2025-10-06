/**
 * @file content_script.js
 * @description Injected into the page to display the WordReference modal.
 * Listens for messages from the background script to activate.
 */

const WR_LOOKUP = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'show_modal') {
        if (document.getElementById('wrlookup-modal-container')) {
            return;
        }
        createModal(request.word, request.url, request.options);
        sendResponse({ status: "modal shown" });
    }
    return true;
});


/**
 * Fetches modal HTML/CSS and injects them into the page.
 * @param {string} word - The word being looked up.
 * @param {string} url - The WordReference URL.
 * @param {object} options - User settings.
 */
async function createModal(word, url, options) {
    try {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'wrlookup-modal-container';
        modalContainer.attachShadow({ mode: 'open' });

        const cssUrl = chrome.runtime.getURL('content/modal.css');
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = cssUrl;
        modalContainer.shadowRoot.appendChild(styleLink);

        const htmlUrl = chrome.runtime.getURL('content/modal.html');
        const response = await fetch(htmlUrl);
        const modalHtml = await response.text();
        const modalContent = document.createElement('div');
        modalContent.innerHTML = modalHtml;
        modalContainer.shadowRoot.appendChild(modalContent);
        
        document.body.appendChild(modalContainer);

        const shadow = modalContainer.shadowRoot;
        const modal = shadow.querySelector('.wrlookup-modal');
        modal.style.width = `${options.modalWidth}px`;
        modal.style.height = `${options.modalHeight}px`;

        shadow.querySelector('.wrlookup-word').textContent = word;

        const iframe = shadow.querySelector('.wrlookup-iframe');
        const spinner = shadow.querySelector('.wrlookup-spinner');

        iframe.onload = () => {
            spinner.style.display = 'none';
            try {
                const x = iframe.contentWindow.document;
            } catch (e) {
                console.warn('WordReference iframe blocked. Triggering fallback.');
                chrome.runtime.sendMessage({ type: 'trigger_fallback', url, options });
                closeModal();
            }
        };
        iframe.onerror = () => {
             spinner.style.display = 'none';
             console.error('WordReference iframe failed to load. Triggering fallback.');
             chrome.runtime.sendMessage({ type: 'trigger_fallback', url, options });
             closeModal();
        };

        iframe.src = url;

        shadow.querySelector('#wrlookup-close-btn').addEventListener('click', closeModal);
        shadow.querySelector('#wrlookup-newtab-btn').addEventListener('click', () => {
            window.open(url, '_blank');
        });

        const overlay = shadow.querySelector('.wrlookup-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        WR_LOOKUP.escapeKeyListener = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        document.addEventListener('keydown', WR_LOOKUP.escapeKeyListener);

        setupFocusTrap(modal);
        
        document.body.classList.add('wrlookup-modal-open');

    } catch (error) {
        console.error('Error creating WordReference modal:', error);
    }
}

/**
 * Removes the modal and all its event listeners from the page.
 */
function closeModal() {
    const modalContainer = document.getElementById('wrlookup-modal-container');
    if (modalContainer) {
        modalContainer.remove();
    }
    document.removeEventListener('keydown', WR_LOOKUP.escapeKeyListener);
    document.body.classList.remove('wrlookup-modal-open');
}

/**
 * Implements an accessible focus trap within the modal.
 * @param {HTMLElement} modalElement - The root element of the modal.
 */
function setupFocusTrap(modalElement) {
    const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    WR_LOOKUP.focusTrapListener = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement || modalElement.shadowRoot.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else if (document.activeElement === lastElement || modalElement.shadowRoot.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    };
    modalElement.addEventListener('keydown', WR_LOOKUP.focusTrapListener);
}