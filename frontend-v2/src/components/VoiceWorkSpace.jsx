import React, {
    useEffect,
    useRef,
    useState
} from "react";

import {
    getNotes,
    createNote,
    deleteNote,
    renameNote,
    updateNote,
    saveRecording,
    getRecordings,
    deleteRecording,
    searchNotes
} from "../services/api";

import {
    getCurrentUser,
    logout
} from "../services/auth";

import AnimatedOrb from "./AnimatedOrb";
import Sidebar from "./Sidebar";


/*
|--------------------------------------------------------------------------
| WEBSOCKET CONFIGURATION
|--------------------------------------------------------------------------
|
| Your backend WebSocket endpoint is:
|
| /ws/voice
|
| Therefore the base URL should be:
|
| ws://localhost:1999
|
| NOT:
|
| ws://localhost:1999/ws/voice
|
| because /ws/voice is added below.
|
|--------------------------------------------------------------------------
*/

const configuredWebSocketUrl =
    import.meta.env.VITE_WS_URL?.trim();


function buildWebSocketBaseUrl() {

    /*
    |--------------------------------------------------------------------------
    | Use local backend when no environment variable exists
    |--------------------------------------------------------------------------
    */

    if (!configuredWebSocketUrl) {

        return "ws://localhost:1999";
    }


    let url =
        configuredWebSocketUrl;


    /*
    |--------------------------------------------------------------------------
    | Protect against someone putting http:// in VITE_WS_URL
    |--------------------------------------------------------------------------
    */

    if (
        url.startsWith("http://")
    ) {

        url =
            url.replace(
                "http://",
                "ws://"
            );
    }


    if (
        url.startsWith("https://")
    ) {

        url =
            url.replace(
                "https://",
                "wss://"
            );
    }


    /*
    |--------------------------------------------------------------------------
    | Remove trailing slash
    |--------------------------------------------------------------------------
    */

    url =
        url.replace(
            /\/+$/,
            ""
        );


    /*
    |--------------------------------------------------------------------------
    | If the environment variable already contains /ws/voice,
    | remove it because we add the endpoint ourselves.
    |--------------------------------------------------------------------------
    */

    if (
        url.endsWith("/ws/voice")
    ) {

        url =
            url.substring(
                0,
                url.length -
                "/ws/voice".length
            );
    }


    return url;
}


const WS_BASE_URL =
    buildWebSocketBaseUrl();


function VoiceWorkspace({
                            onLogout,
                            showToast
                        }) {

    // =====================================================
    // USER
    // =====================================================

    const [user] =
        useState(
            getCurrentUser()
        );


    // =====================================================
    // NOTES
    // =====================================================



    const [selectedNote, setSelectedNote] =
        useState(null);

    const [noteText, setNoteText] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [loadingNotes, setLoadingNotes] =
        useState(false);

    const [notes, setNotes] = useState([]);

    /*
    |--------------------------------------------------------------------------
    | Tracks whether the selected note already has at least
    | one saved recording.
    |
    | This controls whether the user sees:
    |
    | Start Recording
    |
    | or:
    |
    | Append Audio
    |--------------------------------------------------------------------------
    */

    const [hasRecording, setHasRecording] =
        useState(false);


    // =====================================================
    // RECORDING
    // =====================================================

    const [recording, setRecording] =
        useState(false);

    const [connecting, setConnecting] =
        useState(false);

    const [streamOnline, setStreamOnline] =
        useState(false);

    const [statusMessage, setStatusMessage] =
        useState("Ready to record");

    const [appendMode, setAppendMode] =
        useState(false);


    // =====================================================
    // TRANSCRIPTION
    // =====================================================

    const [transcript, setTranscript] =
        useState("");

    const [interimTranscript, setInterimTranscript] =
        useState("");

    const [message, setMessage] =
        useState("");


    // =====================================================
    // RECORDINGS
    // =====================================================

    const [recordings, setRecordings] =
        useState([]);


    // =====================================================
    // REFS
    // =====================================================

    const socketRef =
        useRef(null);

    const mediaRecorderRef =
        useRef(null);

    const mediaStreamRef =
        useRef(null);

    const audioChunksRef =
        useRef([]);

    const sessionTranscriptRef =
        useRef("");

    const transcriptRef =
        useRef("");

    const selectedNoteRef =
        useRef(null);


    // =====================================================
    // KEEP TRANSCRIPT REF UPDATED
    // =====================================================

    useEffect(() => {

        transcriptRef.current =
            transcript;

    }, [transcript]);


    // =====================================================
    // KEEP SELECTED NOTE REF UPDATED
    // =====================================================

    useEffect(() => {

        selectedNoteRef.current =
            selectedNote;

    }, [selectedNote]);


    // =====================================================
    // LOAD NOTES
    // =====================================================

    useEffect(() => {

        if (!user?.id) {

            setMessage(
                "No logged-in user found."
            );

            return;
        }


        loadNotes();

    }, [user?.id]);


    async function loadNotes() {

        try {

            setLoadingNotes(
                true
            );


            const data =
                await getNotes(
                    user.id
                );


            /*
            |--------------------------------------------------------------------------
            | Keep notes as an array.
            |--------------------------------------------------------------------------
            */

            setNotes(
                data || []
            );


            if (
                data &&
                data.length > 0 &&
                !selectedNoteRef.current
            ) {

                await handleSelectNote(
                    data[0]
                );
            }

        } catch (error) {

            console.error(
                "Could not load notes:",
                error
            );


            setMessage(
                "Unable to load your notes."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Notes unavailable",
                    message:
                        "VoiceNox could not load your notes."
                });
            }

        } finally {

            setLoadingNotes(
                false
            );
        }
    }


    // =====================================================
    // SELECT NOTE
    // =====================================================

    async function handleSelectNote(
        note
    ) {

        if (!note) {
            return;
        }


        if (
            recording ||
            connecting
        ) {

            setMessage(
                "Stop the current recording before changing notes."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "Recording in progress",
                    message:
                        "Stop the current recording before changing notes."
                });
            }


            return;
        }


        setSelectedNote(
            note
        );


        selectedNoteRef.current =
            note;


        const text =
            note.text || "";


        setNoteText(
            text
        );


        setTranscript(
            text
        );


        transcriptRef.current =
            text;


        setInterimTranscript(
            ""
        );


        setMessage(
            ""
        );


        setAppendMode(
            false
        );


        /*
        |--------------------------------------------------------------------------
        | Load this note's recording history.
        |
        | The existence of at least one recording determines
        | whether the UI shows Start Recording or Append Audio.
        |--------------------------------------------------------------------------
        */

        try {

            const data =
                await getRecordings(
                    note.id
                );


            const loadedRecordings =
                data || [];


            setRecordings(
                loadedRecordings
            );


            setHasRecording(
                loadedRecordings.length > 0
            );

        } catch (error) {

            console.error(
                "Could not load recordings:",
                error
            );


            setRecordings(
                []
            );


            /*
            |--------------------------------------------------------------------------
            | If recordings could not be loaded, we do not know that
            | the note has a recording. Keep the UI in the initial
            | recording state rather than pretending recordings exist.
            |--------------------------------------------------------------------------
            */

            setHasRecording(
                false
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Recordings unavailable",
                    message:
                        "Could not load the audio history for this note."
                });
            }
        }
    }


    // =====================================================
    // CREATE NOTE
    // =====================================================

    async function handleCreateNote() {

        if (!user?.id) {
            return;
        }


        if (
            recording ||
            connecting
        ) {

            setMessage(
                "Stop the current recording before creating a new note."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "Recording in progress",
                    message:
                        "Stop the current recording before creating a new note."
                });
            }


            return;
        }


        try {

            const note =
                await createNote(
                    user.id,
                    "Untitled Note"
                );


            setNotes(
                previous => [
                    note,
                    ...previous
                ]
            );


            await handleSelectNote(
                note
            );


            /*
            |--------------------------------------------------------------------------
            | A newly created note has no recordings yet.
            |--------------------------------------------------------------------------
            */

            setHasRecording(
                false
            );


            setMessage(
                "New note created."
            );


            if (showToast) {

                showToast({
                    type: "success",
                    title: "Note created",
                    message:
                        "Your new voice note is ready."
                });
            }

        } catch (error) {

            console.error(
                "Could not create note:",
                error
            );


            setMessage(
                "Could not create note."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Note creation failed",
                    message:
                        "VoiceNox could not create the note."
                });
            }
        }
    }


    // =====================================================
    // DELETE NOTE
    // =====================================================

    async function handleDeleteNote(
        noteId
    ) {

        if (
            recording ||
            connecting
        ) {

            setMessage(
                "Stop the current recording before deleting a note."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "Recording in progress",
                    message:
                        "Stop the current recording before deleting the note."
                });
            }


            return;
        }


        const note =
            notes.find(
                item =>
                    item.id === noteId
            );


        if (!note) {

            if (showToast) {

                showToast({
                    type: "warning",
                    title: "Note not found",
                    message:
                        "The selected note could not be found."
                });
            }


            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${note.title || "Untitled Note"}" and its recordings?`
            );


        if (!confirmed) {

            if (showToast) {

                showToast({
                    type: "info",
                    title: "Delete cancelled",
                    message:
                        "The note was not deleted."
                });
            }


            return;
        }


        try {

            setMessage(
                "Deleting note..."
            );


            await deleteNote(
                noteId
            );


            const remaining =
                notes.filter(
                    item =>
                        item.id !== noteId
                );


            setNotes(
                remaining
            );


            if (
                selectedNoteRef.current?.id ===
                noteId
            ) {

                if (
                    remaining.length > 0
                ) {

                    setSelectedNote(
                        null
                    );

                    selectedNoteRef.current =
                        null;

                    setNoteText(
                        ""
                    );

                    setTranscript(
                        ""
                    );

                    transcriptRef.current =
                        "";

                    setRecordings(
                        []
                    );

                    setHasRecording(
                        false
                    );

                    setInterimTranscript(
                        ""
                    );


                    await handleSelectNote(
                        remaining[0]
                    );

                } else {

                    setSelectedNote(
                        null
                    );

                    selectedNoteRef.current =
                        null;

                    setNoteText(
                        ""
                    );

                    setTranscript(
                        ""
                    );

                    transcriptRef.current =
                        "";

                    setRecordings(
                        []
                    );

                    setHasRecording(
                        false
                    );

                    setInterimTranscript(
                        ""
                    );
                }
            }


            setMessage(
                "Note deleted."
            );


            if (showToast) {

                showToast({
                    type: "success",
                    title: "Note deleted",
                    message:
                        `"${note.title || "Untitled Note"}" was successfully deleted.`
                });
            }

        } catch (error) {

            console.error(
                "Could not delete note:",
                error
            );


            setMessage(
                "Could not delete note."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Delete failed",
                    message:
                        error.message ||
                        "VoiceNox could not delete the note."
                });
            }
        }
    }


    // =====================================================
    // RENAME NOTE
    // =====================================================

    async function handleRenameNote(
        note
    ) {

        if (!note) {
            return;
        }


        if (
            recording ||
            connecting
        ) {

            setMessage(
                "Stop the current recording before renaming a note."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "Recording in progress",
                    message:
                        "Stop the current recording before renaming the note."
                });
            }


            return;
        }


        const newTitle =
            window.prompt(
                "Enter a new note title:",
                note.title ||
                "Untitled Note"
            );


        if (
            newTitle === null ||
            !newTitle.trim()
        ) {

            return;
        }


        try {

            const updated =
                await renameNote(
                    note.id,
                    newTitle.trim()
                );


            setNotes(
                previous =>
                    previous.map(
                        item =>
                            item.id === updated.id
                                ? updated
                                : item
                    )
            );


            if (
                selectedNoteRef.current?.id ===
                updated.id
            ) {

                setSelectedNote(
                    updated
                );

                selectedNoteRef.current =
                    updated;
            }


            setMessage(
                "Note renamed."
            );


            if (showToast) {

                showToast({
                    type: "success",
                    title: "Note renamed",
                    message:
                        "The note title has been updated."
                });
            }

        } catch (error) {

            console.error(
                "Could not rename note:",
                error
            );


            setMessage(
                "Could not rename note."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Rename failed",
                    message:
                        "VoiceNox could not rename the note."
                });
            }
        }
    }


    // =====================================================
    // SAVE CHANGES
    // =====================================================

    async function handleSaveChanges() {

        if (!selectedNote) {

            setMessage(
                "Select a note first."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "No note selected",
                    message:
                        "Select a note before saving changes."
                });
            }


            return;
        }


        if (
            recording ||
            connecting
        ) {

            setMessage(
                "Stop the current recording before saving changes."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "Recording in progress",
                    message:
                        "Stop the recording before saving changes."
                });
            }


            return;
        }


        try {

            const updated =
                await updateNote(
                    selectedNote.id,
                    noteText
                );


            setSelectedNote(
                updated
            );


            selectedNoteRef.current =
                updated;


            setTranscript(
                updated.text || ""
            );


            transcriptRef.current =
                updated.text || "";


            setNotes(
                previous =>
                    previous.map(
                        note =>
                            note.id === updated.id
                                ? updated
                                : note
                    )
            );


            setMessage(
                "Changes saved."
            );


            if (showToast) {

                showToast({
                    type: "success",
                    title: "Changes saved",
                    message:
                        "Your transcription has been saved."
                });
            }

        } catch (error) {

            console.error(
                "Could not save changes:",
                error
            );


            setMessage(
                "Could not save changes."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Save failed",
                    message:
                        "VoiceNox could not save your changes."
                });
            }
        }
    }


    // =====================================================
    // SEARCH
    // =====================================================

    async function handleSearch(
        value
    ) {

        setSearch(
            value
        );


        if (!value.trim()) {

            await loadNotes();

            return;
        }


        if (!user?.id) {
            return;
        }


        try {

            const results =
                await searchNotes(
                    value,
                    user.id
                );


            setNotes(
                results || []
            );

        } catch (error) {

            console.error(
                "Search failed:",
                error
            );


            setMessage(
                "Search failed."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Search failed",
                    message:
                        "VoiceNox could not search your notes."
                });
            }
        }
    }


    // =====================================================
    // START RECORDING
    // =====================================================

    async function startRecording(
        isAppend = false
    ) {

        console.log(
            "=========================================="
        );

        console.log(
            "🔥 VOICENOX START RECORDING"
        );

        console.log(
            "=========================================="
        );


        const currentNote =
            selectedNoteRef.current;


        console.log(
            "Selected note:",
            currentNote
        );


        console.log(
            "WebSocket base URL:",
            WS_BASE_URL
        );


        if (!currentNote) {

            console.error(
                "No selected note."
            );


            setMessage(
                "Create or select a note first."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "No note selected",
                    message:
                        "Create or select a note before recording."
                });
            }


            return;
        }


        if (
            recording ||
            connecting
        ) {

            console.log(
                "Recording or connection already active."
            );


            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Safety rule:
        |
        | Once a note already has a recording, recording sessions
        | must be append sessions.
        |
        | This prevents Start Recording from accidentally becoming
        | another way to append audio.
        |--------------------------------------------------------------------------
        */

        const actualAppendMode =
            hasRecording
                ? true
                : isAppend;


        try {

            setMessage(
                ""
            );


            setConnecting(
                true
            );


            setAppendMode(
                actualAppendMode
            );


            setStatusMessage(
                "Requesting microphone..."
            );


            sessionTranscriptRef.current =
                "";


            audioChunksRef.current =
                [];


            /*
            |--------------------------------------------------------------------------
            | CHECK BROWSER MICROPHONE SUPPORT
            |--------------------------------------------------------------------------
            */

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                throw new Error(
                    "Your browser does not provide microphone access. Use localhost or HTTPS."
                );
            }


            console.log(
                "Requesting microphone..."
            );


            /*
            |--------------------------------------------------------------------------
            | GET MICROPHONE
            |--------------------------------------------------------------------------
            */

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });


            console.log(
                "Microphone access granted."
            );


            mediaStreamRef.current =
                stream;


            /*
            |--------------------------------------------------------------------------
            | BUILD WEBSOCKET URL
            |--------------------------------------------------------------------------
            */

            const noteId =
                currentNote.id;


            const wsUrl =
                `${WS_BASE_URL}/ws/voice?noteId=${encodeURIComponent(noteId)}`;


            console.log(
                "=========================================="
            );

            console.log(
                "OPENING VOICENOX WEBSOCKET"
            );

            console.log(
                "Note ID:",
                noteId
            );

            console.log(
                "WebSocket URL:",
                wsUrl
            );

            console.log(
                "=========================================="
            );


            /*
            |--------------------------------------------------------------------------
            | CREATE WEBSOCKET
            |--------------------------------------------------------------------------
            */

            const socket =
                new WebSocket(
                    wsUrl
                );


            socket.binaryType =
                "arraybuffer";


            socketRef.current =
                socket;


            console.log(
                "WebSocket object created."
            );


            /*
            |--------------------------------------------------------------------------
            | OPEN
            |--------------------------------------------------------------------------
            */

            socket.onopen = () => {

                console.log(
                    "=========================================="
                );

                console.log(
                    "🔥🔥🔥 VOICENOX WEBSOCKET CONNECTED 🔥🔥🔥"
                );

                console.log(
                    "Connected URL:",
                    wsUrl
                );

                console.log(
                    "Ready state:",
                    socket.readyState
                );

                console.log(
                    "=========================================="
                );


                setConnecting(
                    false
                );


                setStreamOnline(
                    true
                );


                setRecording(
                    true
                );


                setStatusMessage(
                    actualAppendMode
                        ? "Appending audio..."
                        : "Listening..."
                );


                /*
                |--------------------------------------------------------------------------
                | START MEDIA RECORDER ONLY AFTER SOCKET OPENS
                |--------------------------------------------------------------------------
                */

                startMediaRecorder(
                    stream,
                    socket
                );
            };


            /*
            |--------------------------------------------------------------------------
            | MESSAGE
            |--------------------------------------------------------------------------
            */

            socket.onmessage = (
                event
            ) => {

                console.log(
                    "WebSocket message received:",
                    event.data
                );


                try {

                    const data =
                        JSON.parse(
                            event.data
                        );


                    console.log(
                        "Parsed backend message:",
                        data
                    );


                    if (
                        data.type !==
                        "transcript"
                    ) {

                        return;
                    }


                    const text =
                        (
                            data.text ||
                            ""
                        ).trim();


                    if (!text) {
                        return;
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | FINAL TRANSCRIPT
                    |--------------------------------------------------------------------------
                    */

                    if (
                        data.isFinal
                    ) {

                        sessionTranscriptRef.current =
                            appendText(
                                sessionTranscriptRef.current,
                                text
                            );


                        setTranscript(
                            previous => {

                                const updated =
                                    appendText(
                                        previous,
                                        text
                                    );


                                transcriptRef.current =
                                    updated;


                                return updated;
                            }
                        );


                        setNoteText(
                            previous =>
                                appendText(
                                    previous,
                                    text
                                )
                        );


                        setInterimTranscript(
                            ""
                        );


                        console.log(
                            "Final transcript:",
                            text
                        );

                    } else {

                        /*
                        |--------------------------------------------------------------------------
                        | INTERIM TRANSCRIPT
                        |--------------------------------------------------------------------------
                        */

                        setInterimTranscript(
                            text
                        );


                        console.log(
                            "Interim transcript:",
                            text
                        );
                    }

                } catch (error) {

                    console.error(
                        "Could not parse WebSocket message:",
                        error
                    );


                    console.error(
                        "Raw message:",
                        event.data
                    );
                }
            };


            /*
            |--------------------------------------------------------------------------
            | ERROR
            |--------------------------------------------------------------------------
            */

            socket.onerror = (
                error
            ) => {

                console.error(
                    "=========================================="
                );

                console.error(
                    "🔥🔥🔥 VOICENOX WEBSOCKET ERROR 🔥🔥🔥"
                );

                console.error(
                    "WebSocket URL:",
                    wsUrl
                );

                console.error(
                    "Ready state:",
                    socket.readyState
                );

                console.error(
                    "Error:",
                    error
                );

                console.error(
                    "=========================================="
                );


                setConnecting(
                    false
                );


                setStreamOnline(
                    false
                );


                setRecording(
                    false
                );


                setStatusMessage(
                    "Voice connection error"
                );


                setMessage(
                    "Could not connect to the transcription service."
                );


                if (showToast) {

                    showToast({
                        type: "error",
                        title: "Voice connection failed",
                        message:
                            "Could not connect to the transcription service."
                    });
                }
            };


            /*
            |--------------------------------------------------------------------------
            | CLOSE
            |--------------------------------------------------------------------------
            */

            socket.onclose = (
                event
            ) => {

                console.log(
                    "=========================================="
                );

                console.log(
                    "VOICENOX WEBSOCKET CLOSED"
                );

                console.log(
                    "Close code:",
                    event.code
                );

                console.log(
                    "Close reason:",
                    event.reason
                );

                console.log(
                    "Clean:",
                    event.wasClean
                );

                console.log(
                    "URL:",
                    wsUrl
                );

                console.log(
                    "=========================================="
                );


                setConnecting(
                    false
                );


                setStreamOnline(
                    false
                );


                /*
                |--------------------------------------------------------------------------
                | Do not overwrite the save status while a recording
                | is finishing.
                |--------------------------------------------------------------------------
                */

                if (!mediaRecorderRef.current) {

                    setStatusMessage(
                        "Stream offline"
                    );
                }
            };

        } catch (error) {

            console.error(
                "=========================================="
            );

            console.error(
                "COULD NOT START VOICENOX RECORDING"
            );

            console.error(
                error
            );

            console.error(
                "=========================================="
            );


            if (
                mediaStreamRef.current
            ) {

                mediaStreamRef.current
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );


                mediaStreamRef.current =
                    null;
            }


            setConnecting(
                false
            );


            setRecording(
                false
            );


            setStreamOnline(
                false
            );


            setAppendMode(
                false
            );


            setStatusMessage(
                "Microphone unavailable"
            );


            setMessage(
                error.message ||
                "Microphone permission is required."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Microphone unavailable",
                    message:
                        error.message ||
                        "Microphone permission is required."
                });
            }
        }
    }


    // =====================================================
    // APPEND TEXT
    // =====================================================

    function appendText(
        existing,
        incoming
    ) {

        if (!existing) {

            return incoming;
        }


        if (!incoming) {

            return existing;
        }


        const left =
            existing.endsWith(" ")
                ? existing
                : existing + " ";


        return left + incoming;
    }


    // =====================================================
    // MEDIA RECORDER
    // =====================================================

    function startMediaRecorder(
        stream,
        socket
    ) {

        let recorder;


        try {

            if (
                MediaRecorder.isTypeSupported(
                    "audio/webm;codecs=opus"
                )
            ) {

                recorder =
                    new MediaRecorder(
                        stream,
                        {
                            mimeType:
                                "audio/webm;codecs=opus"
                        }
                    );

            } else {

                recorder =
                    new MediaRecorder(
                        stream
                    );
            }

        } catch (error) {

            console.error(
                "Preferred MediaRecorder failed:",
                error
            );


            try {

                recorder =
                    new MediaRecorder(
                        stream
                    );

            } catch (fallbackError) {

                console.error(
                    "MediaRecorder failed:",
                    fallbackError
                );


                if (
                    mediaStreamRef.current
                ) {

                    mediaStreamRef.current
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                    mediaStreamRef.current =
                        null;
                }


                setRecording(
                    false
                );


                setConnecting(
                    false
                );


                setStatusMessage(
                    "Recording unavailable"
                );


                setMessage(
                    "Your browser could not start audio recording."
                );


                if (showToast) {

                    showToast({
                        type: "error",
                        title: "Recording unavailable",
                        message:
                            "Your browser could not start audio recording."
                    });
                }


                return;
            }
        }


        mediaRecorderRef.current =
            recorder;


        /*
        |--------------------------------------------------------------------------
        | AUDIO CHUNKS
        |--------------------------------------------------------------------------
        */

        recorder.ondataavailable =
            event => {

                if (
                    !event.data ||
                    event.data.size === 0
                ) {

                    return;
                }


                console.log(
                    "Audio chunk received:",
                    event.data.size,
                    "bytes"
                );


                audioChunksRef.current.push(
                    event.data
                );


                /*
                |--------------------------------------------------------------------------
                | Send audio to Spring Boot WebSocket
                |--------------------------------------------------------------------------
                */

                if (
                    socket &&
                    socket.readyState ===
                    WebSocket.OPEN
                ) {

                    socket.send(
                        event.data
                    );


                    console.log(
                        "Audio chunk sent to backend:",
                        event.data.size,
                        "bytes"
                    );

                } else {

                    console.warn(
                        "Audio chunk was not sent because WebSocket is not open.",
                        {
                            readyState:
                            socket?.readyState
                        }
                    );
                }
            };


        /*
        |--------------------------------------------------------------------------
        | MEDIA RECORDER ERROR
        |--------------------------------------------------------------------------
        */

        recorder.onerror =
            event => {

                console.error(
                    "MediaRecorder error:",
                    event
                );


                setMessage(
                    "Microphone recording error."
                );


                if (showToast) {

                    showToast({
                        type: "error",
                        title: "Recording error",
                        message:
                            "The microphone recording encountered an error."
                    });
                }
            };


        /*
        |--------------------------------------------------------------------------
        | RECORDING STOPPED
        |--------------------------------------------------------------------------
        */

        recorder.onstop =
            async () => {

                console.log(
                    "MediaRecorder stopped."
                );


                const audioBlob =
                    new Blob(
                        audioChunksRef.current,
                        {
                            type:
                                recorder.mimeType ||
                                "audio/webm"
                        }
                    );


                console.log(
                    "Final audio size:",
                    audioBlob.size,
                    "bytes"
                );


                const note =
                    selectedNoteRef.current;


                const newTranscription =
                    sessionTranscriptRef.current;


                /*
                |--------------------------------------------------------------------------
                | Stop microphone
                |--------------------------------------------------------------------------
                */

                if (
                    mediaStreamRef.current
                ) {

                    mediaStreamRef.current
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );


                    mediaStreamRef.current =
                        null;
                }


                /*
                |--------------------------------------------------------------------------
                | Save recording
                |--------------------------------------------------------------------------
                */

                if (
                    audioBlob.size > 0 &&
                    note
                ) {

                    try {

                        setStatusMessage(
                            "Saving recording..."
                        );


                        const saved =
                            await saveRecording(
                                note.id,
                                audioBlob,
                                newTranscription
                            );


                        setRecordings(
                            previous => [
                                ...previous,
                                saved
                            ]
                        );


                        /*
                        |--------------------------------------------------------------------------
                        | The note now definitely has at least one recording.
                        |--------------------------------------------------------------------------
                        */

                        setHasRecording(
                            true
                        );


                        /*
                        |--------------------------------------------------------------------------
                        | Save complete transcription into note
                        |--------------------------------------------------------------------------
                        */

                        const completeText =
                            transcriptRef.current;


                        const updated =
                            await updateNote(
                                note.id,
                                completeText
                            );


                        setSelectedNote(
                            updated
                        );


                        selectedNoteRef.current =
                            updated;


                        setNoteText(
                            updated.text || ""
                        );


                        setTranscript(
                            updated.text || ""
                        );


                        transcriptRef.current =
                            updated.text || "";


                        setNotes(
                            previous =>
                                previous.map(
                                    item =>
                                        item.id ===
                                        updated.id
                                            ? updated
                                            : item
                                )
                        );


                        setStatusMessage(
                            appendMode
                                ? "Audio appended successfully"
                                : "Recording saved"
                        );


                        if (showToast) {

                            showToast({
                                type:
                                    appendMode
                                        ? "success"
                                        : "success",
                                title:
                                    appendMode
                                        ? "Audio appended"
                                        : "Recording saved",
                                message:
                                    appendMode
                                        ? "The new audio and transcription were added to this note."
                                        : "Your recording and transcription have been saved."
                            });
                        }

                    } catch (error) {

                        console.error(
                            "Recording save failed:",
                            error
                        );


                        setMessage(
                            "The recording could not be saved."
                        );


                        setStatusMessage(
                            "Recording save failed"
                        );


                        if (showToast) {

                            showToast({
                                type: "error",
                                title:
                                    "Recording save failed",
                                message:
                                    error.message ||
                                    "The recording could not be saved."
                            });
                        }
                    }

                } else {

                    console.warn(
                        "Recording stopped without audio or selected note."
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | Clear recording data
                |--------------------------------------------------------------------------
                */

                audioChunksRef.current =
                    [];


                sessionTranscriptRef.current =
                    "";


                mediaRecorderRef.current =
                    null;


                setAppendMode(
                    false
                );


                /*
                |--------------------------------------------------------------------------
                | Close WebSocket AFTER recorder has stopped
                |--------------------------------------------------------------------------
                */

                if (
                    socketRef.current === socket
                ) {

                    try {

                        if (
                            socket.readyState ===
                            WebSocket.OPEN ||
                            socket.readyState ===
                            WebSocket.CONNECTING
                        ) {

                            console.log(
                                "Closing VoiceNox WebSocket after recording finished."
                            );


                            socket.close(
                                1000,
                                "Recording finished"
                            );
                        }

                    } catch (error) {

                        console.error(
                            "Could not close WebSocket:",
                            error
                        );
                    }


                    socketRef.current =
                        null;
                }


                setRecording(
                    false
                );


                setConnecting(
                    false
                );


                setStreamOnline(
                    false
                );
            };


        /*
        |--------------------------------------------------------------------------
        | START RECORDING
        |--------------------------------------------------------------------------
        */

        recorder.start(
            250
        );


        console.log(
            "MediaRecorder started."
        );
    }


    // =====================================================
    // STOP RECORDING
    // =====================================================

    function stopRecording() {

        console.log(
            "Stopping VoiceNox recording..."
        );


        const recorder =
            mediaRecorderRef.current;


        /*
        |--------------------------------------------------------------------------
        | IMPORTANT:
        |
        | Do NOT immediately close the WebSocket here.
        |
        | recorder.stop() causes the final audio data event
        | to be emitted. The WebSocket is closed inside
        | recorder.onstop after that process.
        |--------------------------------------------------------------------------
        */

        if (
            recorder &&
            recorder.state !==
            "inactive"
        ) {

            recorder.stop();


            setStatusMessage(
                "Finishing recording..."
            );


            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Fallback if MediaRecorder is already inactive
        |--------------------------------------------------------------------------
        */

        if (
            mediaStreamRef.current
        ) {

            mediaStreamRef.current
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );


            mediaStreamRef.current =
                null;
        }


        if (
            socketRef.current
        ) {

            try {

                socketRef.current.close(
                    1000,
                    "Recording finished"
                );

            } catch (error) {

                console.error(
                    "Could not close WebSocket:",
                    error
                );
            }


            socketRef.current =
                null;
        }


        mediaRecorderRef.current =
            null;


        setRecording(
            false
        );


        setConnecting(
            false
        );


        setStreamOnline(
            false
        );


        setInterimTranscript(
            ""
        );


        setStatusMessage(
            "Stream offline"
        );
    }


    // =====================================================
    // DELETE RECORDING
    // =====================================================

    async function handleDeleteRecording(
        recordingId
    ) {

        if (
            recording ||
            connecting
        ) {

            setMessage(
                "Stop the current recording before deleting a recording."
            );


            if (showToast) {

                showToast({
                    type: "warning",
                    title: "Recording in progress",
                    message:
                        "Stop the current recording before deleting the recording."
                });
            }


            return;
        }


        const confirmed =
            window.confirm(
                "Remove this recording?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await deleteRecording(
                recordingId
            );


            const updatedRecordings =
                recordings.filter(
                    recording =>
                        recording.id !==
                        recordingId
                );


            setRecordings(
                updatedRecordings
            );


            /*
            |--------------------------------------------------------------------------
            | If no recordings remain, this note becomes a fresh
            | recording state again.
            |--------------------------------------------------------------------------
            */

            setHasRecording(
                updatedRecordings.length > 0
            );


            setMessage(
                "Recording removed."
            );


            if (showToast) {

                showToast({
                    type: "success",
                    title: "Recording deleted",
                    message:
                        "The recording was removed from this note."
                });
            }

        } catch (error) {

            console.error(
                "Could not delete recording:",
                error
            );


            setMessage(
                "Could not remove recording."
            );


            if (showToast) {

                showToast({
                    type: "error",
                    title: "Delete failed",
                    message:
                        "VoiceNox could not remove the recording."
                });
            }
        }
    }


    // =====================================================
    // CLEANUP
    // =====================================================

    useEffect(() => {

        return () => {

            const recorder =
                mediaRecorderRef.current;


            if (
                recorder &&
                recorder.state !==
                "inactive"
            ) {

                try {

                    recorder.stop();

                } catch (error) {

                    console.error(
                        "Could not stop recorder during cleanup:",
                        error
                    );
                }
            }


            if (
                mediaStreamRef.current
            ) {

                mediaStreamRef.current
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );


                mediaStreamRef.current =
                    null;
            }


            if (
                socketRef.current
            ) {

                try {

                    socketRef.current.close(
                        1000,
                        "VoiceNox component closed"
                    );

                } catch (error) {

                    console.error(
                        "Could not close WebSocket during cleanup:",
                        error
                    );
                }


                socketRef.current =
                    null;
            }
        };

    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    function handleLogout() {

        stopRecording();

        logout();


        if (onLogout) {

            onLogout();

        } else {

            window.location.reload();
        }
    }


    // =====================================================
    // DISPLAY TEXT
    // =====================================================

    const displayedText =
        transcript +
        (
            interimTranscript
                ? (
                    transcript
                        ? " "
                        : ""
                ) +
                interimTranscript
                : ""
        );


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="voice-workspace">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <Sidebar
                notes={notes}
                selectedNote={selectedNote}
                onSelectNote={
                    handleSelectNote
                }
                onCreateNote={
                    handleCreateNote
                }
                onDeleteNote={
                    handleDeleteNote
                }
                onRenameNote={
                    handleRenameNote
                }
                searchValue={
                    search
                }
                onSearchChange={
                    handleSearch
                }
                recordings={
                    recordings
                }
                onDeleteRecording={
                    handleDeleteRecording
                }
            />


            {/* =================================================
                MAIN WORKSPACE
            ================================================= */}

            <main className="workspace-main">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="workspace-header">

                    <div>

                        <span className="header-label">
                            CURRENT NOTE
                        </span>

                        <h1>
                            {
                                selectedNote?.title ||
                                "Start speaking"
                            }
                        </h1>

                    </div>


                    <div className="header-actions">

                        {
                            selectedNote && (
                                <>
                                    <button
                                        className="header-button"
                                        onClick={() =>
                                            handleRenameNote(
                                                selectedNote
                                            )
                                        }
                                    >
                                        Rename
                                    </button>


                                    <button
                                        className="header-button danger"
                                        onClick={() =>
                                            handleDeleteNote(
                                                selectedNote.id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>
                                </>
                            )
                        }


                        <button
                            className="header-button logout-header"
                            onClick={
                                handleLogout
                            }
                        >
                            Logout
                        </button>

                    </div>

                </header>


                {/* =================================================
                    STATUS BAR
                ================================================= */}

                <div className="voice-status-bar">

                    <div className="status-left">

                        <span
                            className={
                                "status-dot " +
                                (
                                    recording
                                        ? "recording"
                                        : ""
                                )
                            }
                        />

                        <span>
                            {
                                statusMessage
                            }
                        </span>

                    </div>


                    <div className="status-right">

                        <span
                            className={
                                streamOnline
                                    ? "stream-live"
                                    : ""
                            }
                        >
                            {
                                streamOnline
                                    ? "● Stream live"
                                    : "● Stream offline"
                            }
                        </span>

                    </div>

                </div>


                {/* =================================================
                    MESSAGE
                ================================================= */}

                {
                    message && (
                        <div className="workspace-message">
                            {
                                message
                            }
                        </div>
                    )
                }


                {/* =================================================
                    ANIMATED ORB
                ================================================= */}

                <section className="orb-section">

                    <AnimatedOrb
                        active={
                            recording ||
                            connecting
                        }
                    />


                    <div className="orb-status">

                        {
                            connecting
                                ? "Connecting..."
                                : recording
                                    ? (
                                        appendMode
                                            ? "Appending audio..."
                                            : "Listening..."
                                    )
                                    : "Ready"
                        }

                    </div>

                </section>


                {/* =================================================
                    TRANSCRIPT
                ================================================= */}

                <section className="transcript-card">

                    <div className="transcript-card-header">

                        <div>

                            <span>
                                LIVE TRANSCRIPTION
                            </span>


                            <h2>

                                {
                                    recording
                                        ? (
                                            appendMode
                                                ? "Appending to your note..."
                                                : "Listening to you..."
                                        )
                                        : displayedText
                                            ? "Your transcription"
                                            : "Start speaking"
                                }

                            </h2>

                        </div>


                        {
                            recording && (
                                <div className="live-badge">
                                    LIVE
                                </div>
                            )
                        }

                    </div>


                    <textarea
                        value={
                            displayedText
                        }
                        onChange={
                            event => {

                                const value =
                                    event.target.value;


                                setTranscript(
                                    value
                                );


                                transcriptRef.current =
                                    value;


                                setNoteText(
                                    value
                                );


                                setInterimTranscript(
                                    ""
                                );
                            }
                        }
                        placeholder="Your transcription will appear here..."
                    />

                </section>


                {/* =================================================
                    RECORDING CONTROLS
                ================================================= */}

                <div className="recording-controls">

                    {
                        !recording ? (

                            /*
                            |--------------------------------------------------------------------------
                            | NEW NOTE / NO RECORDING YET
                            |--------------------------------------------------------------------------
                            */

                            !hasRecording ? (

                                <button
                                    className="start-recording-button"
                                    onClick={() =>
                                        startRecording(
                                            false
                                        )
                                    }
                                    disabled={
                                        !selectedNote ||
                                        connecting
                                    }
                                >

                                    <span>
                                        ●
                                    </span>

                                    {
                                        connecting
                                            ? "Connecting..."
                                            : "Start Recording"
                                    }

                                </button>

                            ) : (

                                /*
                                |--------------------------------------------------------------------------
                                | NOTE ALREADY HAS RECORDING
                                |--------------------------------------------------------------------------
                                */

                                <button
                                    className="append-recording-button"
                                    onClick={() =>
                                        startRecording(
                                            true
                                        )
                                    }
                                    disabled={
                                        !selectedNote ||
                                        connecting
                                    }
                                >

                                    <span>
                                        ＋
                                    </span>

                                    Append Audio

                                </button>
                            )

                        ) : (

                            /*
                            |--------------------------------------------------------------------------
                            | CURRENTLY RECORDING
                            |--------------------------------------------------------------------------
                            */

                            <button
                                className="stop-recording-button"
                                onClick={
                                    stopRecording
                                }
                            >

                                <span>
                                    ■
                                </span>

                                Stop Recording

                            </button>
                        )
                    }


                    <button
                        className="save-button"
                        onClick={
                            handleSaveChanges
                        }
                        disabled={
                            !selectedNote ||
                            recording ||
                            connecting
                        }
                    >
                        Save Changes
                    </button>

                </div>

            </main>

        </div>
    );
}


export default VoiceWorkspace;