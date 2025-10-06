document.addEventListener('DOMContentLoaded', async () => {
    const iframe = document.getElementById('wr-iframe');
    const spinner = document.getElementById('spinner');
    const container = document.getElementById('container');

    const data = await chrome.storage.local.get('lastUrl');

    if (data.lastUrl) {
        iframe.src = data.lastUrl;

        iframe.onload = () => {
            spinner.style.display = 'none';
            iframe.style.opacity = '1';
        };

        iframe.onerror = () => {
             spinner.style.display = 'none';
             container.innerHTML = '<p class="error">Impossible de charger la page. Vérifiez votre connexion internet.</p>';
        };

    } else {
        spinner.style.display = 'none';
        container.innerHTML = '<p class="info">Sélectionnez du texte sur une page et utilisez le raccourci (Ctrl+Shift+W) ou le clic-droit pour faire une recherche.</p>';
    }
});