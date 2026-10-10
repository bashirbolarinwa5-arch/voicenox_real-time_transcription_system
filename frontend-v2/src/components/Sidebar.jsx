import React, { useState, useRef } from "react";
import { getAudioUrl } from "../services/api";

function Sidebar({
                     notes,
                     selectedNote,
                     onSelectNote,
                     onCreateNote,
                     onDeleteNote,
                     onRenameNote,
                     searchValue,
                     onSearchChange,
                     recordings = [],
                     onDeleteRecording
                 }) {

    const [showAudioHistory, setShowAudioHistory] = useState(true);
    const [playingId, setPlayingId] = useState(null);

    function handlePlay(recordingId) {
        setPlayingId(recordingId);
    }

    function handlePause(recordingId) {
        setPlayingId((currentId) => {
            if (currentId === recordingId) {
                return null;
            }

            return currentId;
        });
    }

    return (
        <aside className="sidebar">

            {/* BRAND */}
            <div className="sidebar-brand">

                <div className="brand-mark">
                    <span></span>
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
                        {notes.length} notes
                    </span>
                </div>

                <button
                    className="new-note-button"
                    onClick={onCreateNote}
                    title="Create new note"
                >
                    +
                </button>

            </div>


            {/* SEARCH */}
            <div className="search-box">

                <span>⌕</span>

                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchValue}
                    onChange={(e) =>
                        onSearchChange(e.target.value)
                    }
                />

            </div>


            {/* NOTES */}
            <div className="notes-list">

                {notes.length === 0 ? (

                    <div className="empty-notes">

                        <div className="empty-icon">
                            ◇
                        </div>

                        <p>No notes yet</p>

                        <span>
                            Create your first voice note
                        </span>

                    </div>

                ) : (

                    notes.map((note) => (

                        <div
                            key={note.id}
                            className={`note-item ${
                                selectedNote?.id === note.id
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                onSelectNote(note)
                            }
                        >

                            <div className="note-icon">
                                ◇
                            </div>

                            <div className="note-information">

                                <strong>
                                    {note.title ||
                                        "Untitled Note"}
                                </strong>

                                <span>
                                    {note.text
                                        ? note.text.substring(
                                            0,
                                            55
                                        )
                                        : "No transcription yet"}
                                </span>

                            </div>


                            <div className="note-actions">

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRenameNote(note);
                                    }}
                                    title="Rename note"
                                >
                                    ✎
                                </button>


                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteNote(note.id);
                                    }}
                                    title="Delete note"
                                >
                                    ×
                                </button>

                            </div>

                        </div>

                    ))

                )}

            </div>


            {/* AUDIO HISTORY */}
            <div className="audio-history">

                <button
                    className="audio-history-header"
                    onClick={() =>
                        setShowAudioHistory(
                            (previous) => !previous
                        )
                    }
                >

                    <div className="audio-history-title">

                        <span className="audio-history-icon">
                            ◉
                        </span>

                        <div>

                            <strong>
                                Audio History
                            </strong>

                            <span>
                                {recordings.length} recording
                                {recordings.length !== 1
                                    ? "s"
                                    : ""}
                            </span>

                        </div>

                    </div>


                    <span
                        className={`audio-history-chevron ${
                            showAudioHistory
                                ? "open"
                                : ""
                        }`}
                    >
                        ˅
                    </span>

                </button>


                {showAudioHistory && (

                    <div className="audio-history-list">

                        {!selectedNote ? (

                            <div className="audio-history-empty">

                                <span>
                                    Select a note
                                </span>

                                <small>
                                    Recordings will appear here
                                </small>

                            </div>

                        ) : recordings.length === 0 ? (

                            <div className="audio-history-empty">

                                <span>
                                    No recordings yet
                                </span>

                                <small>
                                    Start speaking to create one
                                </small>

                            </div>

                        ) : (

                            recordings.map(
                                (recording, index) => (

                                    <SidebarRecording
                                        key={recording.id}
                                        recording={recording}
                                        index={index}
                                        playingId={playingId}
                                        onPlay={handlePlay}
                                        onPause={handlePause}
                                        onDelete={
                                            onDeleteRecording
                                        }
                                    />

                                )
                            )

                        )}

                    </div>

                )}

            </div>

        </aside>
    );
}


/*
 * Recording item inside Audio History
 */
function SidebarRecording({
                              recording,
                              index,
                              playingId,
                              onPlay,
                              onPause,
                              onDelete
                          }) {

    const audioUrl = getAudioUrl(
        recording.audioUrl
    );

    const audioRef = useRef(null);

    function toggleAudio(event) {

        event.stopPropagation();

        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        if (audio.paused) {

            /*
             * Start the actual audio.
             *
             * The onPlay event below will update
             * the React state.
             */
            audio.play().catch((error) => {

                console.error(
                    "Could not play recording:",
                    error
                );

                onPause(recording.id);

            });

        } else {

            /*
             * Pause the actual audio.
             *
             * The onPause event below will update
             * the React state.
             */
            audio.pause();
        }
    }


    function handlePlay() {
        onPlay(recording.id);
    }


    function handlePause() {
        onPause(recording.id);
    }


    function handleEnded() {

        onPause(recording.id);

    }


    return (
        <div className="sidebar-recording">

            <audio
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
            />


            <button
                className={`sidebar-recording-play ${
                    playingId === recording.id
                        ? "playing"
                        : ""
                }`}
                onClick={toggleAudio}
                type="button"
                title={
                    playingId === recording.id
                        ? "Pause recording"
                        : "Play recording"
                }
                aria-label={
                    playingId === recording.id
                        ? "Pause recording"
                        : "Play recording"
                }
            >

                {playingId === recording.id
                    ? "❚❚"
                    : "▶"}

            </button>


            <div className="sidebar-recording-info">

                <strong>
                    Recording {index + 1}
                </strong>

                <span>
                    {recording.transcription
                        ? recording.transcription.substring(
                            0,
                            42
                        )
                        : "No transcription"}
                </span>

            </div>


            <button
                className="sidebar-recording-delete"
                onClick={(event) => {

                    event.stopPropagation();

                    onDelete(recording.id);

                }}
                title="Delete recording"
                type="button"
            >
                ×
            </button>

        </div>
    );
}


export default Sidebar;