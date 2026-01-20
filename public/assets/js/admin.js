$(document).ready(() => {
    // Keys para LocalStorage
    const CONFIG_KEY = 'tiktok_printer_config';

    // Cargar config actual
    function loadConfig() {
        const configRaw = localStorage.getItem(CONFIG_KEY);
        if (configRaw) {
            const config = JSON.parse(configRaw);

            $('#tiktokId').val(config.tiktokId || '');
            $('#sessionId').val(config.sessionId || '');
            $('#confComment').prop('checked', config.confComment !== false);
            $('#confLike').prop('checked', config.confLike !== false);
            $('#confShare').prop('checked', config.confShare !== false);
            $('#confJoin').prop('checked', config.confJoin !== false);
            $('#msgGift').val(config.msgGift || '|username| envió un regalo!');
            $('#msgWinner').val(config.msgWinner || '¡Felicidades |username|!');
            // Password update removed for security
        } else {
            // Valores por defecto
            $('#confComment').prop('checked', true);
            $('#confLike').prop('checked', true);
            $('#confShare').prop('checked', true);
            $('#confJoin').prop('checked', true);
        }
    }

    // Guardar config
    $('#adminForm').submit((e) => {
        e.preventDefault();

        const config = {
            tiktokId: $('#tiktokId').val().trim(),
            sessionId: $('#sessionId').val().trim(),
            confComment: $('#confComment').is(':checked'),
            confLike: $('#confLike').is(':checked'),
            confShare: $('#confShare').is(':checked'),
            confJoin: $('#confJoin').is(':checked'),
            msgGift: $('#msgGift').val().trim(),
            msgWinner: $('#msgWinner').val().trim(),
            accessCode: '260913', // Fixed/Default internal code since UI was removed
            lastUpdated: new Date().getTime()
        };

        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

        // Toast feedback & Redirect
        console.log("Config submitted. Redirecting in 1.5s...");
        $('#toast').fadeIn();

        setTimeout(() => {
            console.log("Redirecting now...");
            window.location.href = 'menu.html';
        }, 1500);
    });

    // Logout
    $('#logoutBtn').click(() => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            Auth.logout();
        }
    });

    // Iniciar
    loadConfig();
});
