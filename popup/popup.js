document.addEventListener('DOMContentLoaded', async () => {
    const iframe = document.getElementById('lookup-iframe');
    const spinner = document.getElementById('spinner');
    const container = document.getElementById('container');

    const data = await chrome.storage.local.get('lastCambridgeUrl');

    if (data.lastCambridgeUrl) {
        iframe.src = data.lastCambridgeUrl;

        iframe.onload = () => {
            spinner.style.display = 'none';
            iframe.style.opacity = '1';
        };

        iframe.onerror = () => {
             handleError();
        };

        setTimeout(() => {
            if (spinner.style.display !== 'none') {
                handleError();
            }
        }, 3000);

    } else {
        spinner.style.display = 'none';
        container.innerHTML = '<p class="info">Sélectionnez du texte et utilisez le raccourci (Ctrl+Shift+W) pour faire une recherche.</p>';
    }
});

function handleError() {
    const spinner = document.getElementById('spinner');
    const container = document.getElementById('container');
    spinner.style.display = 'none';
    container.innerHTML = '<p class="error">Cambridge Dictionary n\'autorise pas la connexion dans cette fenêtre. Veuillez essayer la recherche via un nouvel onglet.</p>';
}