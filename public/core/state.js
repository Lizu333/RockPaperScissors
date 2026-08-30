export const appState = {
    currentUser: null,
    csrfToken: null,

    currentLanguage: "hu",
    currentTheme: "pink-brown",

    soundEnabled: true,

    activeProfileGame: "rps",

    statistics: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rock: 0,
        paper: 0,
        scissors: 0,
        matches2048: 0,
        maxScore2048: 0,
        undosUsed2048: 0
    }
};


(function setupCsrfFetchWrapper() {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
        const method = (init.method || "GET").toUpperCase();

        if (
            appState.csrfToken &&
            ["POST", "PUT", "DELETE", "PATCH"].includes(method)
        ) {
            init = {
                ...init,
                headers: {
                    ...(init.headers || {}),
                    "X-CSRF-Token": appState.csrfToken
                }
            };
        }

        return originalFetch(input, init);
    };
})();


export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}