import React from "react";

function RecordingControls({
                               isRecording,
                               isConnecting,
                               onStart,
                               onStop,
                               onSave,
                               disabled
                           }) {

    return (
        <div className="recording-controls">

            {!isRecording ? (

                <button
                    type="button"
                    className="main-record-button"
                    onClick={onStart}
                    disabled={disabled || isConnecting}
                >

                    <span className="record-icon"></span>

                    {isConnecting
                        ? "Connecting..."
                        : "Start Recording"}

                </button>

            ) : (

                <button
                    type="button"
                    className="main-stop-button"
                    onClick={onStop}
                >

                    <span className="stop-icon"></span>

                    Stop Recording

                </button>

            )}

            <button
                type="button"
                className="secondary-button"
                onClick={onSave}
                disabled={disabled}
            >
                Save Changes
            </button>

        </div>
    );
}

export default RecordingControls;