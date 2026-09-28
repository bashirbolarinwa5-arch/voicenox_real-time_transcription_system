import React, { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Toast from "./components/Toast";

import { isAuthenticated } from "./services/auth";
import { useToast } from "./services/useToast";

function App() {
    const [authenticated, setAuthenticated] = useState(
        isAuthenticated()
    );

    const [page, setPage] = useState("login");

    const {
        toast,
        showToast,
        hideToast
    } = useToast();

    function handleLogin() {
        setAuthenticated(true);

        showToast({
            type: "success",
            title: "Welcome back",
            message: "You are now inside your VoiceNox workspace."
        });
    }

    function handleLogout() {
        setAuthenticated(false);
        setPage("login");

        showToast({
            type: "info",
            title: "Signed out",
            message: "Your VoiceNox session has ended."
        });
    }

    function handleRegister() {
        setAuthenticated(true);

        showToast({
            type: "success",
            title: "Account created",
            message: "Welcome to VoiceNox."
        });
    }

    let pageContent;

    if (authenticated) {
        pageContent = (
            <Dashboard
                onLogout={handleLogout}
                showToast={showToast}
            />
        );
    } else if (page === "register") {
        pageContent = (
            <Register
                onRegister={handleRegister}
                onLogin={() => setPage("login")}
            />
        );
    } else {
        pageContent = (
            <Login
                onLogin={handleLogin}
                onRegister={() => setPage("register")}
            />
        );
    }

    return (
        <>
            {pageContent}

            <Toast
                toast={toast}
                onClose={hideToast}
            />
        </>
    );


    return (
        <>
            {pageContent}

            <Toast
                toast={toast}
                onClose={hideToast}
            />

            <button
                onClick={() =>
                    showToast({
                        type: "success",
                        title: "Toast test",
                        message: "VoiceNox notifications are working."
                    })
                }
                style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "20px",
                    zIndex: 99999
                }}
            >
                Test Toast
            </button>
        </>
    );
}

export default App;