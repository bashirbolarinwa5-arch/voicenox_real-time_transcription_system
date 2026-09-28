import React from "react";
import AnimatedOrb from "./AnimatedOrb";

function TranscriptPanel({
                             note,
                             transcript,
                             setTranscript,
                             isRecording
                         }) {

    return (
        <section className="transcript-panel">

            <div className="live-status">

                <span
                    className={`status-dot ${
                        isRecording ? "recording" : ""
                    }`}
                ></span>

                {isRecording
                    ? "Listening..."
                    : "Ready to record"}

            </div>

            <AnimatedOrb />

            <div className="transcript-header">

                <div>
                    <span className="eyebrow">
                        LIVE TRANSCRIPTION
                    </span>

                    <h2>
                        {note?.title || "Start speaking"}
                    </h2>
                </div>

                <div className="stream-indicator">

                    <span></span>

                    {isRecording
                        ? "Live stream"
                        : "Stream offline"}

                </div>

            </div>

            <textarea
                className="transcript-editor"
                value={transcript}
                onChange={(e) =>
                    setTranscript(e.target.value)
                }
                placeholder="Your transcription will appear here..."
            />

        </section>
    );
}

export default TranscriptPanel;