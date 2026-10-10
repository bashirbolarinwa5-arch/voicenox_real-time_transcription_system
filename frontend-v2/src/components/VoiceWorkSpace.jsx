import React, { useEffect, useRef, useState } from "react";
import { getNotes, createNote, deleteNote, renameNote, updateNote, saveRecording, getRecordings, deleteRecording, searchNotes } from "../services/api";
import { getCurrentUser, logout } from "../services/auth";
import AnimatedOrb from "./AnimatedOrb";
import Sidebar from "./Sidebar";

const configuredWebSocketUrl = import.meta.env.VITE_WS_URL?.trim();
function buildWebSocketBaseUrl() {
    if (!configuredWebSocketUrl) return "ws://localhost:1999";
    let url = configuredWebSocketUrl;
    if (url.startsWith("http://")) url = url.replace("http://", "ws://");
    if (url.startsWith("https://")) url = url.replace("https://", "wss://");
    url = url.replace(/\/+$/, "");
    if (url.endsWith("/ws/voice")) url = url.substring(0, url.length - "/ws/voice".length);
    return url;
}
const WS_BASE_URL = buildWebSocketBaseUrl();

function VoiceWorkspace({ onLogout, showToast }) {
    const [user] = useState(getCurrentUser());
    const [selectedNote, setSelectedNote] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [search, setSearch] = useState("");
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [notes, setNotes] = useState([]);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [renameNoteId, setRenameNoteId] = useState(null);
    const [renameTitle, setRenameTitle] = useState("");
    const [renameSaving, setRenameSaving] = useState(false);
    const [hasRecording, setHasRecording] = useState(false);
    const [recording, setRecording] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [streamOnline, setStreamOnline] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Ready to record");
    const [appendMode, setAppendMode] = useState(false);
    const [audioSource, setAudioSource] = useState("mic");
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [message, setMessage] = useState("");
    const [recordings, setRecordings] = useState([]);
    const socketRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const sessionTranscriptRef = useRef("");
    const transcriptRef = useRef("");
    const selectedNoteRef = useRef(null);

    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
    useEffect(() => { selectedNoteRef.current = selectedNote; }, [selectedNote]);
    useEffect(() => { if (!user?.id) { setMessage("No logged-in user found."); return; } loadNotes(); }, [user?.id]);

    async function loadNotes() {
        try {
            setLoadingNotes(true);
            const data = await getNotes(user.id);
            setNotes(data || []);
            if (data && data.length > 0 &&!selectedNoteRef.current) await handleSelectNote(data[0]);
        } catch (error) {
            console.error("Could not load notes:", error);
            setMessage("Unable to load your notes.");
            if (showToast) showToast({ type: "error", title: "Notes unavailable", message: "VoiceNox could not load your notes." });
        } finally { setLoadingNotes(false); }
    }

    async function handleSelectNote(note) {
        if (!note) return;
        if (recording || connecting) { setMessage("Stop the current recording before changing notes."); if (showToast) showToast({ type: "warning", title: "Recording in progress", message: "Stop the current recording before changing notes." }); return; }
        setSelectedNote(note); selectedNoteRef.current = note;
        const text = note.text || ""; setNoteText(text); setTranscript(text); transcriptRef.current = text; setInterimTranscript(""); setMessage(""); setAppendMode(false);
        try {
            const data = await getRecordings(note.id); const loaded = data || []; setRecordings(loaded); setHasRecording(loaded.length > 0);
        } catch (error) { console.error(error); setRecordings([]); setHasRecording(false); if (showToast) showToast({ type: "error", title: "Recordings unavailable", message: "Could not load the audio history for this note." }); }
    }

    async function handleCreateNote() {
        if (!user?.id) return;
        if (recording || connecting) { setMessage("Stop the current recording before creating a new note."); if (showToast) showToast({ type: "warning", title: "Recording in progress", message: "Stop the current recording before creating a new note." }); return; }
        try {
            const note = await createNote(user.id, "Untitled Note");
            setNotes(p => [note,...p]); await handleSelectNote(note); setHasRecording(false); setMessage("New note created.");
            if (showToast) showToast({ type: "success", title: "Note created", message: "Your new voice note is ready." });
        } catch (error) { console.error(error); setMessage("Could not create note."); if (showToast) showToast({ type: "error", title: "Note creation failed", message: "VoiceNox could not create the note." }); }
    }

    async function handleDeleteNote(noteId) {
        if (recording || connecting) { setMessage("Stop the current recording before deleting a note."); if (showToast) showToast({ type: "warning", title: "Recording in progress", message: "Stop the current recording before deleting the note." }); return; }
        const note = notes.find(i => i.id === noteId); if (!note) { if (showToast) showToast({ type: "warning", title: "Note not found", message: "The selected note could not be found." }); return; }
        const confirmed = window.confirm(`Delete "${note.title || "Untitled Note"}" and its recordings?`); if (!confirmed) { if (showToast) showToast({ type: "info", title: "Delete cancelled", message: "The note was not deleted." }); return; }
        try {
            setMessage("Deleting note..."); await deleteNote(noteId);
            const remaining = notes.filter(i => i.id!== noteId); setNotes(remaining);
            if (selectedNoteRef.current?.id === noteId) {
                if (remaining.length > 0) { setSelectedNote(null); selectedNoteRef.current = null; setNoteText(""); setTranscript(""); transcriptRef.current = ""; setRecordings([]); setHasRecording(false); setInterimTranscript(""); await handleSelectNote(remaining[0]); }
                else { setSelectedNote(null); selectedNoteRef.current = null; setNoteText(""); setTranscript(""); transcriptRef.current = ""; setRecordings([]); setHasRecording(false); setInterimTranscript(""); }
            }
            setMessage("Note deleted."); if (showToast) showToast({ type: "success", title: "Note deleted", message: `"${note.title || "Untitled Note"}" was successfully deleted.` });
        } catch (error) { console.error(error); setMessage("Could not delete note."); if (showToast) showToast({ type: "error", title: "Delete failed", message: error.message || "VoiceNox could not delete the note." }); }
    }

    function handleRenameNote(note) {
        if (!note) return;
        if (recording || connecting) { setMessage("Stop the current recording before renaming a note."); if (showToast) showToast({ type: "warning", title: "Recording in progress", message: "Stop the current recording before renaming the note." }); return; }
        setRenameNoteId(note.id); setRenameTitle(note.title || ""); setRenameModalOpen(true);
    }

    async function handleRenameSubmit(event) {
        event.preventDefault(); const trimmed = renameTitle.trim(); if (!trimmed ||!renameNoteId) return;
        try {
            setRenameSaving(true); const updated = await renameNote(renameNoteId, trimmed);
            setNotes(p => p.map(i => i.id === updated.id? updated : i));
            if (selectedNoteRef.current?.id === updated.id) { setSelectedNote(updated); selectedNoteRef.current = updated; }
            setRenameModalOpen(false); setRenameNoteId(null); setRenameTitle(""); setMessage("Note renamed.");
            if (showToast) showToast({ type: "success", title: "Note renamed", message: "The note title has been updated." });
        } catch (error) { console.error(error); setMessage("Could not rename note."); if (showToast) showToast({ type: "error", title: "Rename failed", message: "VoiceNox could not rename the note." }); }
        finally { setRenameSaving(false); }
    }

    function handleRenameCancel() { if (renameSaving) return; setRenameModalOpen(false); setRenameNoteId(null); setRenameTitle(""); }

    async function handleSaveChanges() {
        if (!selectedNote) { setMessage("Select a note first."); if (showToast) showToast({ type: "warning", title: "No note selected", message: "Select a note before saving changes." }); return; }
        if (recording || connecting) { setMessage("Stop the current recording before saving changes."); if (showToast) showToast({ type: "warning", title: "Recording in progress", message: "Stop the recording before saving changes." }); return; }
        try {
            const updated = await updateNote(selectedNote.id, noteText);
            setSelectedNote(updated); selectedNoteRef.current = updated; setTranscript(updated.text || ""); transcriptRef.current = updated.text || ""; setNotes(p => p.map(n => n.id === updated.id? updated : n));
            setMessage("Changes saved."); if (showToast) showToast({ type: "success", title: "Changes saved", message: "Your transcription has been saved." });
        } catch (error) { console.error(error); setMessage("Could not save changes."); if (showToast) showToast({ type: "error", title: "Save failed", message: "VoiceNox could not save your changes." }); }
    }

    async function handleSearch(value) {
        setSearch(value); if (!value.trim()) { await loadNotes(); return; } if (!user?.id) return;
        try { const results = await searchNotes(value, user.id); setNotes(results || []); } catch (error) { console.error(error); setMessage("Search failed."); if (showToast) showToast({ type: "error", title: "Search failed", message: "VoiceNox could not search your notes." }); }
    }

    async function startRecording(isAppend = false) {
        const currentNote = selectedNoteRef.current;
        if (!currentNote) { setMessage("Create or select a note first."); if (showToast) showToast({ type: "warning", title: "No note selected", message: "Create or select a note before recording." }); return; }
        if (recording || connecting) return;
        const actualAppendMode = hasRecording? true : isAppend;
        try {
            setMessage(""); setConnecting(true); setAppendMode(actualAppendMode);
            setStatusMessage(audioSource === "system"? "Requesting system audio..." : "Requesting microphone...");
            sessionTranscriptRef.current = ""; audioChunksRef.current = [];
            if (!navigator.mediaDevices ||!navigator.mediaDevices.getUserMedia) throw new Error("Your browser does not provide microphone access. Use localhost or HTTPS.");

            let stream;
            if (audioSource === "system") {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
                const audioTracks = displayStream.getAudioTracks();
                if (audioTracks.length === 0) { displayStream.getTracks().forEach(t => t.stop()); throw new Error("No system audio found. Share a tab and check 'Share tab audio'."); }
                displayStream.getVideoTracks().forEach(t => t.stop());
                stream = new MediaStream(audioTracks);
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            mediaStreamRef.current = stream;
            const noteId = currentNote.id;
            const wsUrl = `${WS_BASE_URL}/ws/voice?noteId=${encodeURIComponent(noteId)}`;
            const socket = new WebSocket(wsUrl);
            socket.binaryType = "arraybuffer"; socketRef.current = socket;

            socket.onopen = () => { setConnecting(false); setStreamOnline(true); setRecording(true); setStatusMessage(actualAppendMode? "Appending audio..." : (audioSource === "system"? "Listening to system..." : "Listening...")); startMediaRecorder(stream, socket); };
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data); if (data.type!== "transcript") return;
                    const text = (data.text || "").trim(); if (!text) return;
                    if (data.isFinal) {
                        sessionTranscriptRef.current = appendText(sessionTranscriptRef.current, text);
                        setTranscript(prev => { const u = appendText(prev, text); transcriptRef.current = u; return u; });
                        setNoteText(prev => appendText(prev, text)); setInterimTranscript("");
                    } else setInterimTranscript(text);
                } catch (e) { console.error(e); }
            };
            socket.onerror = () => { setConnecting(false); setStreamOnline(false); setRecording(false); setStatusMessage("Voice connection error"); setMessage("Could not connect to the transcription service."); if (showToast) showToast({ type: "error", title: "Voice connection failed", message: "Could not connect to the transcription service." }); };
            socket.onclose = () => { setConnecting(false); setStreamOnline(false); if (!mediaRecorderRef.current) setStatusMessage("Stream offline"); };
        } catch (error) {
            console.error(error); if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
            setConnecting(false); setRecording(false); setStreamOnline(false); setAppendMode(false);
            setStatusMessage(audioSource === "system"? "System audio unavailable" : "Microphone unavailable"); setMessage(error.message || "Audio permission is required.");
            if (showToast) showToast({ type: "error", title: audioSource === "system"? "System audio unavailable" : "Microphone unavailable", message: error.message || "Permission is required." });
        }
    }

    function appendText(existing, incoming) { if (!existing) return incoming; if (!incoming) return existing; const left = existing.endsWith(" ")? existing : existing + " "; return left + incoming; }

    function startMediaRecorder(stream, socket) {
        let recorder;
        try { if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" }); else recorder = new MediaRecorder(stream); }
        catch (error) { try { recorder = new MediaRecorder(stream); } catch (e) { console.error(e); if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; } setRecording(false); setConnecting(false); setStatusMessage("Recording unavailable"); setMessage("Your browser could not start audio recording."); if (showToast) showToast({ type: "error", title: "Recording unavailable", message: "Your browser could not start audio recording." }); return; } }
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = event => { if (!event.data || event.data.size === 0) return; audioChunksRef.current.push(event.data); if (socket && socket.readyState === WebSocket.OPEN) socket.send(event.data); };
        recorder.onerror = () => { setMessage("Microphone recording error."); if (showToast) showToast({ type: "error", title: "Recording error", message: "The microphone recording encountered an error." }); };
        recorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }); const note = selectedNoteRef.current; const newTranscription = sessionTranscriptRef.current;
            if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
            if (audioBlob.size > 0 && note) {
                try {
                    setStatusMessage("Saving recording..."); const saved = await saveRecording(note.id, audioBlob, newTranscription);
                    setRecordings(prev => [...prev, saved]); setHasRecording(true);
                    const completeText = transcriptRef.current; const updated = await updateNote(note.id, completeText);
                    setSelectedNote(updated); selectedNoteRef.current = updated; setNoteText(updated.text || ""); setTranscript(updated.text || ""); transcriptRef.current = updated.text || ""; setNotes(prev => prev.map(i => i.id === updated.id? updated : i));
                    setStatusMessage(appendMode? "Audio appended successfully" : "Recording saved");
                    if (showToast) showToast({ type: "success", title: appendMode? "Audio appended" : "Recording saved", message: appendMode? "The new audio and transcription were added to this note." : "Your recording and transcription have been saved." });
                } catch (error) { console.error(error); setMessage("The recording could not be saved."); setStatusMessage("Recording save failed"); if (showToast) showToast({ type: "error", title: "Recording save failed", message: error.message || "The recording could not be saved." }); }
            }
            audioChunksRef.current = []; sessionTranscriptRef.current = ""; mediaRecorderRef.current = null; setAppendMode(false);
            if (socketRef.current === socket) { try { if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close(1000, "Recording finished"); } catch (e) { console.error(e); } socketRef.current = null; }
            setRecording(false); setConnecting(false); setStreamOnline(false);
        };
        recorder.start(250);
    }

    function stopRecording() {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state!== "inactive") { recorder.stop(); setStatusMessage("Finishing recording..."); return; }
        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
        if (socketRef.current) { try { socketRef.current.close(1000, "Recording finished"); } catch (e) { console.error(e); } socketRef.current = null; }
        mediaRecorderRef.current = null; setRecording(false); setConnecting(false); setStreamOnline(false); setInterimTranscript(""); setStatusMessage("Stream offline");
    }

    async function handleDeleteRecording(recordingId) {
        if (recording || connecting) { setMessage("Stop the current recording before deleting a recording."); if (showToast) showToast({ type: "warning", title: "Recording in progress", message: "Stop the current recording before deleting the recording." }); return; }
        const confirmed = window.confirm("Remove this recording?"); if (!confirmed) return;
        try { await deleteRecording(recordingId); const updated = recordings.filter(r => r.id!== recordingId); setRecordings(updated); setHasRecording(updated.length > 0); setMessage("Recording removed."); if (showToast) showToast({ type: "success", title: "Recording deleted", message: "The recording was removed from this note." }); }
        catch (error) { console.error(error); setMessage("Could not remove recording."); if (showToast) showToast({ type: "error", title: "Delete failed", message: "VoiceNox could not remove the recording." }); }
    }

    useEffect(() => {
        return () => {
            const r = mediaRecorderRef.current; if (r && r.state!== "inactive") { try { r.stop(); } catch (e) { console.error(e); } }
            if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
            if (socketRef.current) { try { socketRef.current.close(1000, "VoiceNox component closed"); } catch (e) { console.error(e); } socketRef.current = null; }
        };
    }, []);

    function handleLogout() { stopRecording(); logout(); if (onLogout) onLogout(); else window.location.reload(); }

    const displayedText = transcript + (interimTranscript? (transcript? " " : "") + interimTranscript : "");

    return (
        <div className="voice-workspace">
            <Sidebar notes={notes} selectedNote={selectedNote} onSelectNote={handleSelectNote} onCreateNote={handleCreateNote} onDeleteNote={handleDeleteNote} onRenameNote={handleRenameNote} searchValue={search} onSearchChange={handleSearch} recordings={recordings} onDeleteRecording={handleDeleteRecording} />

            <main className="workspace-main">
                <div className="workspace-header">
                    <div className="current-note"><span className="header-label">CURRENT NOTE</span><h1>{selectedNote?.title || "No note selected"}</h1></div>
                    <div className="header-actions">
                        <button className="header-button" onClick={() => selectedNote && handleRenameNote(selectedNote)}>Rename</button>
                        <button className="header-button danger" onClick={() => selectedNote && handleDeleteNote(selectedNote.id)}>Delete</button>
                        <button className="header-button logout-header" onClick={handleLogout}>Logout</button>
                    </div>
                </div>

                <div className="workspace-scroll">
                    <div className="voice-status-bar">
                        <div className="status-left"><span className={`status-dot ${recording? "recording" : ""}`}></span><span>{statusMessage}</span>{streamOnline && <span className="stream-live">• Live</span>}</div>
                        <div className="status-right"><span>{audioSource === "mic"? "Mic mode" : "System mode"}</span></div>
                    </div>

                    {message && <div className="workspace-message"><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}

                    <div className="orb-section">
                        <AnimatedOrb recording={recording} connecting={connecting} online={streamOnline} />
                        <div className="orb-status"><span className={`orb-status-dot ${recording || connecting? "active" : ""}`}></span><span>{recording? "Recording" : connecting? "Connecting" : "Ready"}</span></div>

                        {/* NEW TOGGLE - THIS MAKES IT LOOK LIKE THE IMAGE */}
                        <div className="audio-source-toggle">
                            <button className={`audio-source-btn ${audioSource==="mic"? "active" : ""}`} onClick={()=>setAudioSource("mic")} disabled={recording || connecting}>🎤 Microphone</button>
                            <button className={`audio-source-btn ${audioSource==="system"? "active" : ""}`} onClick={()=>setAudioSource("system")} disabled={recording || connecting}>🔊 System Audio</button>
                        </div>
                    </div>

                    <div className="transcript-card">
                        <div className="transcript-card-header"><div><span className="section-label">LIVE TRANSCRIPTION</span><h2>Your transcription</h2></div>{recording && <div className="live-badge"><span></span>LIVE</div>}</div>
                        <textarea value={displayedText} onChange={(e) => { setNoteText(e.target.value); setTranscript(e.target.value); }} placeholder="Your transcription will appear here..." />
                    </div>

                    <div className="recording-controls">
                        {!hasRecording? (
                            <button className="start-recording-button" onClick={() => startRecording(false)} disabled={recording || connecting ||!selectedNote}><span>●</span>{connecting? "Connecting..." : recording? "Recording..." : "Start Recording"}</button>
                        ) : (
                            <button className="append-recording-button" onClick={() => startRecording(true)} disabled={recording || connecting ||!selectedNote}><span>+</span>{connecting? "Connecting..." : recording? "Appending..." : "Append Audio"}</button>
                        )}
                        {(recording || connecting) && <button className="stop-recording-button" onClick={stopRecording}><span>■</span>Stop</button>}
                        <button className="save-button" onClick={handleSaveChanges} disabled={!selectedNote || recording || connecting}>Save Changes</button>
                    </div>
                </div>

                {renameModalOpen && (
                    <div className="rename-modal-overlay">
                        <div className="rename-modal">
                            <div className="rename-modal-header"><div><span className="rename-modal-label">RENAME NOTE</span><h2>Edit title</h2></div><button className="rename-modal-close" onClick={handleRenameCancel} disabled={renameSaving}>×</button></div>
                            <form onSubmit={handleRenameSubmit}><label>Note title</label><input value={renameTitle} onChange={(e)=>setRenameTitle(e.target.value)} placeholder="Untitled Note" autoFocus disabled={renameSaving} /><div className="rename-modal-actions"><button type="button" className="rename-cancel-button" onClick={handleRenameCancel} disabled={renameSaving}>Cancel</button><button type="submit" className="rename-save-button" disabled={renameSaving ||!renameTitle.trim()}>{renameSaving? "Saving..." : "Save"}</button></div></form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
export default VoiceWorkspace;