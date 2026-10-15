import React from "react";
// Change this line to use a capital S:
import VoiceWorkspace from "../components/VoiceWorkSpace";

function Dashboard({ onLogout, showToast }) {
    return (
        <VoiceWorkspace
            onLogout={onLogout}
            showToast={showToast}
        />
    );
}

export default Dashboard;