import React, { useState } from "react";
import { login } from "../services/authApi";
import { saveAuthSession } from "../services/auth";

function Login({ onLogin, onRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await login(email, password);

            saveAuthSession(data);

            onLogin();

        } catch (error) {
            setError(
                error.message || "Login failed"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-glow glow-one"></div>
            <div className="auth-glow glow-two"></div>

            <div className="auth-card">

                <div className="auth-logo">
                    <div className="auth-logo-orb">
                        ◉
                    </div>

                    <div>
                        <h1>VoiceNox</h1>
                        <span>
                            Voice workspace
                        </span>
                    </div>
                </div>

                <div className="auth-heading">
                    <h2>Welcome back</h2>

                    <p>
                        Continue where your voice
                        notes left off.
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="auth-field">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            placeholder="you@example.com"
                            required
                        />

                    </div>

                    <div className="auth-field">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            placeholder="••••••••"
                            required
                        />

                    </div>

                    <button
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign in"}
                    </button>

                </form>

                <button
                    className="auth-switch"
                    onClick={onRegister}
                >
                    Don't have an account?
                    {" "}
                    Create one
                </button>

            </div>

        </div>
    );
}

export default Login;