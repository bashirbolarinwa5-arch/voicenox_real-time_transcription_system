import { getToken } from "./auth";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:1999";


export async function apiFetch(
    endpoint,
    options = {}
) {
    const token = getToken();

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    return fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );
}