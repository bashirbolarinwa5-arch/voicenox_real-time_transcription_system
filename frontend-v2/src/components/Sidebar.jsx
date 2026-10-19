
import React, { useRef, useState } from "react";
import { getAudioUrl } from "../services/api";

function Sidebar({
                     notes = [],
                     selectedNote,
                     onSelectNote,
                     onCreateNote,
                     onDeleteNote,
                     onRenameNote,
                     searchValue = "",
                     onSearchChange,
                     recordings = [],
                     onDeleteRecording,
                 }) {
    const [showAudioHistory, setShowAudioHistory] = useState(true);
    const [playingId, setPlayingId] = useState(null);

    function handlePlay(recordingId) {
        setPlayingId(recordingId);
    }

    function handlePause(recordingId) {
        setPlayingId((currentId) =>
            currentId === recordingId ? null : currentId
        );
    }

    return (
        <aside className="sidebar">
            {/* BRAND */}
            <div className="sidebar-brand">
                <div className="brand-mark" aria-hidden="true">
                    <span />
                </div>

                <div>
                    <h2>VoiceNox</h2>
                    <span>Voice workspace</span>
                </div>
            </div>

            {/* NOTES HEADER */}
            <div className="sidebar-header">
                <div>
                    <h3>My Notes</h3>
                    <span>
                        {notes.length} {notes.length === 1 ? "note" : "notes"}
                    </span>
                </div>

                <button
                    className="new-note-button"
                    type="button"
                    onClick={onCreateNote}
                    title="Create new note"
                    aria-label="Create new note"
                >
                    +
                </button>
            </div>

            {/* SEARCH */}
            <div className="search-box">
                <span aria-hidden="true">⌕</span>

                <input
                    type="search"
                    placeholder="Search notes..."
                    value={searchValue}
                    onChange={(event) =>
                        onSearchChange?.(event.target.value)
                    }
                    aria-label="Search notes"
                />
            </div>

            {/* NOTES LIST */}
            <div className="notes-list">
                {notes.length === 0 ? (
                    <div className="empty-notes">
                        <div className="empty-icon" aria-hidden="true">
                            ◇
                        </div>

                        <p>No notes yet</p>

                        <span>Create your first voice note</span>
                    </div>
                ) : (
                    notes.map((note) => {
                        const title = note.title || "Untitled Note";
                        const isSelected = selectedNote?.id === note.id;

                        return (
                            <div
                                key={note.id}
                                className={`note-item ${isSelected ? "active" : ""}`}
                                onClick={() => onSelectNote?.(note)}
                            >
                                <div className="note-icon" aria-hidden="true">
                                    ◇
                                </div>

                                <div className="note-information">
                                    <strong title={title}>{title}</strong>

                                    <span title={note.text || ""}>
                                        {note.text
                                            ? note.text.substring(0, 55)
                                            : "No transcription yet"}
                                    </span>
                                </div>

                                {/* NOTE ACTIONS: one Rename and one Delete */}
                                <div className="note-actions">
                                    <button
                                        className="note-rename"
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onRenameNote?.(note);
                                        }}
                                        title="Rename note"
                                        aria-label={`Rename ${title}`}
                                    >
                                        ✎
                                    </button>

                                    <button
                                        className="note-delete"
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onDeleteNote?.(note.id);
                                        }}
                                        title="Delete note"
                                        aria-label={`Delete ${title}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* AUDIO HISTORY */}
            <div className="audio-history">
                <button
                    className="audio-history-header"
                    type="button"
                    onClick={() =>
                        setShowAudioHistory((previous) => !previous)
                    }
                    aria-expanded={showAudioHistory}
                    aria-controls="voice-nox-audio-history-list"
                >
                    <div className="audio-history-title">
                        <span
                            className="audio-history-icon"
                            aria-hidden="true"
                        >
                            ◉
                        </span>

                        <div>
                            <strong>Audio History</strong>

                            <span>
                                {recordings.length}{" "}
                                {recordings.length === 1
                                    ? "recording"
                                    : "recordings"}
                            </span>
                        </div>
                    </div>

                    <span
                        className={`audio-history-chevron ${
                            showAudioHistory ? "open" : ""
                        }`}
                        aria-hidden="true"
                    >
                        ˅
                    </span>
                </button>

                {showAudioHistory && (
                    <div
                        className="audio-history-list"
                        id="voice-nox-audio-history-list"
                    >
                        {!selectedNote ? (
                            <div className="audio-history-empty">
                                <span>Select a note</span>
                                <small>Recordings will appear here</small>
                            </div>
                        ) : recordings.length === 0 ? (
                            <div className="audio-history-empty">
                                <span>No recordings yet</span>
                                <small>Start speaking to create one</small>
                            </div>
                        ) : (
                            recordings.map((recording, index) => (
                                <SidebarRecording
                                    key={recording.id}
                                    recording={recording}
                                    index={index}
                                    playingId={playingId}
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onDelete={onDeleteRecording}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

function SidebarRecording({
                              recording,
                              index,
                              playingId,
                              onPlay,
                              onPause,
                              onDelete,
                          }) {
    const audioRef = useRef(null);
    const audioUrl = getAudioUrl(recording.audioUrl);
    const isPlaying = playingId === recording.id;

    async function toggleAudio(event) {
        event.stopPropagation();

        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            try {
                await audio.play();
            } catch (error) {
                console.error("Could not play recording:", error);
            }
        } else {
            audio.pause();
        }
    }

    return (
        <div className="sidebar-recording">
            <audio
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                onPlay={() => onPlay(recording.id)}
                onPause={() => onPause(recording.id)}
                onEnded={() => onPause(recording.id)}
            />

            <button
                className={`sidebar-recording-play ${
                    isPlaying ? "playing" : ""
                }`}
                type="button"
                onClick={toggleAudio}
                title={isPlaying ? "Pause recording" : "Play recording"}
                aria-label={
                    isPlaying
                        ? `Pause recording ${index + 1}`
                        : `Play recording ${index + 1}`
                }
            >
                {isPlaying ? "❚❚" : "▶"}
            </button>

            <div className="sidebar-recording-info">
                <strong>Recording {index + 1}</strong>

                <span title={recording.transcription || ""}>
                    {recording.transcription
                        ? recording.transcription.substring(0, 42)
                        : "No transcription"}
                </span>
            </div>

            <button
                className="sidebar-recording-delete"
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete?.(recording.id);
                }}
                title="Delete recording"
                aria-label={`Delete recording ${index + 1}`}
            >
                ×
            </button>
        </div>
    );
}

export default Sidebar;
