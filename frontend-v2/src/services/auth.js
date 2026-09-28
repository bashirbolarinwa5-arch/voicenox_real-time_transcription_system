const TOKEN_KEY = "voicenox_token";
const USER_KEY = "voicenox_user";

export function saveAuthSession(data) {
    if (!data) {
        throw new Error(
            "Invalid authentication response"
        );
    }

    localStorage.setItem(
        TOKEN_KEY,
        data.token || ""
    );

    localStorage.setItem(
        USER_KEY,
        JSON.stringify({
            id: data.userId ?? data.id,
            fullName: data.fullName,
            email: data.email
        })
    );
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
    const user =
        localStorage.getItem(USER_KEY);

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Also clear old V1 session keys if they exist
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
}

export function isAuthenticated() {
    return !!getToken();
}