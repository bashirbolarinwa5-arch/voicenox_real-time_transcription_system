const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:1999";


export async function login(
    email,
    password
) {
    const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            "Invalid email or password."
        );
    }

    return response.json();
}


export async function register(
    fullName,
    email,
    password
) {
    const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                fullName,
                email,
                password
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            "Registration failed."
        );
    }

    return response.json();
}