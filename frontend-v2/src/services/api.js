import { apiFetch } from "./http";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:1999";


/*
|--------------------------------------------------------------------------
| NOTES
|--------------------------------------------------------------------------
*/

export async function getNotes(userId) {
    const response = await apiFetch(
        `/note/sorted?userId=${encodeURIComponent(userId)}`
    );

    if (!response.ok) {
        throw new Error("Failed to load notes");
    }

    return response.json();
}


export async function createNote(
    userId,
    title = "Untitled Note"
) {
    const response = await apiFetch(
        `/note/${encodeURIComponent(userId)}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title,
                text: ""
            })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create note");
    }

    return response.json();
}


export async function deleteNote(noteId) {
    const response = await apiFetch(
        `/note/${encodeURIComponent(noteId)}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete note");
    }
}


/*
|--------------------------------------------------------------------------
| RENAME NOTE
|--------------------------------------------------------------------------
*/

export async function renameNote(
    noteId,
    title
) {
    const response = await apiFetch(
        `/note/rename/${encodeURIComponent(noteId)}?title=${encodeURIComponent(title)}`,
        {
            method: "PATCH"
        }
    );

    if (!response.ok) {
        throw new Error("Failed to rename note");
    }

    return response.json();
}


/*
|--------------------------------------------------------------------------
| UPDATE NOTE TEXT
|--------------------------------------------------------------------------
*/

export async function updateNote(
    noteId,
    text
) {
    const response = await apiFetch(
        `/note/update/${encodeURIComponent(noteId)}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text
            })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update note");
    }

    return response.json();
}


/*
|--------------------------------------------------------------------------
| SEARCH NOTES
|--------------------------------------------------------------------------
*/

export async function searchNotes(
    keyword,
    userId
) {
    const response = await apiFetch(
        `/note/search?keyword=${encodeURIComponent(keyword)}&userId=${encodeURIComponent(userId)}`
    );

    if (!response.ok) {
        throw new Error("Failed to search notes");
    }

    return response.json();
}


/*
|--------------------------------------------------------------------------
| DATE FILTER
|--------------------------------------------------------------------------
*/

export async function filterNotesByDate(
    startIso,
    endIso,
    userId
) {
    const response = await apiFetch(
        `/note/filter/date?startIso=${encodeURIComponent(startIso)}&endIso=${encodeURIComponent(endIso)}&userId=${encodeURIComponent(userId)}`
    );

    if (!response.ok) {
        throw new Error("Failed to filter notes by date");
    }

    return response.json();
}


/*
|--------------------------------------------------------------------------
| RECORDINGS
|--------------------------------------------------------------------------
*/

export async function saveRecording(
    noteId,
    audioBlob,
    transcription
) {
    if (!audioBlob) {
        throw new Error("Audio recording is missing");
    }

    const formData = new FormData();

    formData.append(
        "audio",
        audioBlob,
        `recording-${Date.now()}.webm`
    );

    formData.append(
        "transcription",
        transcription || ""
    );

    const response = await apiFetch(
        `/recording/${encodeURIComponent(noteId)}`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error(
            "Failed to save recording"
        );
    }

    return response.json();
}


export async function getRecordings(
    noteId
) {
    const response = await apiFetch(
        `/recording/note/${encodeURIComponent(noteId)}`
    );

    if (!response.ok) {
        throw new Error(
            "Failed to load recordings"
        );
    }

    return response.json();
}


export async function deleteRecording(
    recordingId
) {
    const response = await apiFetch(
        `/recording/${encodeURIComponent(recordingId)}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error(
            "Failed to delete recording"
        );
    }
}


/*
|--------------------------------------------------------------------------
| AUDIO URL
|--------------------------------------------------------------------------
*/

export function getAudioUrl(filename) {
    if (!filename) {
        return "";
    }

    return `${API_BASE_URL}/uploads/recordings/${encodeURIComponent(filename)}`;
}