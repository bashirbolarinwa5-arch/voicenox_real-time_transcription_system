import React, { useState } from "react";
import {
    register,
    login
} from "../services/authApi";

import {
    saveAuthSession
} from "../services/auth";

function Register({
                      onRegister,
                      onLogin
                  }) {

    const [fullName, setFullName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(event) {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            await register(
                fullName,
                email,
                password
            );

            // Automatically log the user in
            // after successful registration.

            const data =
                await login(
                    email,
                    password
                );

            saveAuthSession(data);

            onRegister();

        } catch (error) {

            setError(
                error.message ||
                "Registration failed"
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
                        <h1>
                            VoiceNox
                        </h1>

                        <span>
                            Voice workspace
                        </span>
                    </div>

                </div>

                <div className="auth-heading">

                    <h2>
                        Create your account
                    </h2>

                    <p>
                        Start capturing your
                        thoughts with your voice.
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
                            Full name
                        </label>

                        <input
                            type="text"
                            value={fullName}
                            onChange={(event) =>
                                setFullName(
                                    event.target.value
                                )
                            }
                            placeholder="Your full name"
                            required
                        />

                    </div>

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

                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((previous) => !previous)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>
                        </div>

                    </div>

                    <button
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create account"}
                    </button>

                </form>

                <button
                    className="auth-switch"
                    onClick={onLogin}
                >
                    Already have an account?
                    {" "}
                    Sign in
                </button>

            </div>

        </div>
    );
}

export default Register;