const Auth = (() => {
    const CONFIG_KEY = 'tiktok_printer_config';
    const SESSION_KEY = 'tp_auth_session';
    const DEFAULT_CODE = '260913';

    // Obtener la clave actual configurada
    const getStoredCode = () => {
        const configRaw = localStorage.getItem(CONFIG_KEY);
        if (configRaw) {
            const config = JSON.parse(configRaw);
            return config.accessCode || DEFAULT_CODE;
        }
        return DEFAULT_CODE;
    };

    // Verificar si el usuario está logueado
    const isLoggedIn = () => {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    };

    // Intentar login
    const login = (code) => {
        if (code === getStoredCode()) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            return true;
        }
        return false;
    };

    // Logout
    const logout = () => {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    };

    // Proteger página (redigir si no está logueado)
    const protect = () => {
        const isLoginPage = window.location.pathname.endsWith('login.html');
        if (!isLoggedIn() && !isLoginPage) {
            window.location.href = 'login.html';
        }
    };

    return {
        login,
        logout,
        isLoggedIn,
        protect
    };
})();

// Ejecutar protección inmediatamente si no es la página de login
if (!window.location.pathname.endsWith('login.html')) {
    Auth.protect();
}
