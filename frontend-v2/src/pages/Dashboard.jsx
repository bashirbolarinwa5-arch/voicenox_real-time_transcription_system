import React from "react";
import VoiceWorkspace from "../components/VoiceWorkspace";

function Dashboard({ onLogout, showToast }) {
    return (
        <VoiceWorkspace
            onLogout={onLogout}
            showToast={showToast}
        />
    );
}

export default Dashboard;