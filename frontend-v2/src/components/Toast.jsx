import React, { useEffect } from "react";

function Toast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = setTimeout(() => {
            onClose();
        }, toast.duration || 3500);

        return () => clearTimeout(timer);
    }, [toast, onClose]);

    if (!toast) {
        return null;
    }

    return (
        <div className={`toast-container toast-${toast.type || "info"}`}>
            <div className="toast-icon">
                {toast.type === "success" && "✓"}
                {toast.type === "error" && "!"}
                {toast.type === "warning" && "⚠"}
                {toast.type === "info" && "i"}
            </div>

            <div className="toast-content">
                <strong>{toast.title || "VoiceNox"}</strong>
                <span>{toast.message}</span>
            </div>

            <button
                className="toast-close"
                onClick={onClose}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
}

export default Toast;