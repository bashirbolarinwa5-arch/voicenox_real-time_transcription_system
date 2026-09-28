const WS_BASE_URL =
    import.meta.env.VITE_WS_URL ||
    "ws://localhost:1999";


/*
|--------------------------------------------------------------------------
| CREATE VOICE WEBSOCKET
|--------------------------------------------------------------------------
|
| This function creates the WebSocket connection between:
|
| React frontend
|       ↓
| Spring Boot
|       ↓
| Deepgram
|
| The actual backend WebSocket endpoint is:
|
| /ws/voice
|
|--------------------------------------------------------------------------
*/

export function createVoiceSocket({
                                      noteId,
                                      onOpen,
                                      onMessage,
                                      onClose,
                                      onError,
                                  }) {

    /*
    |--------------------------------------------------------------------------
    | Validate note ID
    |--------------------------------------------------------------------------
    */

    if (!noteId) {

        console.error(
            "VoiceNox WebSocket: noteId is required."
        );

        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | Build WebSocket URL
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | ws://localhost:1999/ws/voice?noteId=1
    |
    */

    const wsUrl =
        `${WS_BASE_URL}/ws/voice?noteId=${encodeURIComponent(noteId)}`;


    console.log(
        "=========================================="
    );

    console.log(
        "VOICE NOX WEBSOCKET"
    );

    console.log(
        "WebSocket URL:",
        wsUrl
    );

    console.log(
        "Note ID:",
        noteId
    );

    console.log(
        "=========================================="
    );


    /*
    |--------------------------------------------------------------------------
    | Create WebSocket
    |--------------------------------------------------------------------------
    */

    const socket =
        new WebSocket(
            wsUrl
        );


    /*
    |--------------------------------------------------------------------------
    | WebSocket binary type
    |--------------------------------------------------------------------------
    |
    | Voice audio will be sent as binary data.
    |
    */

    socket.binaryType =
        "arraybuffer";


    /*
    |--------------------------------------------------------------------------
    | CONNECTION OPENED
    |--------------------------------------------------------------------------
    */

    socket.onopen = () => {

        console.log(
            "=========================================="
        );

        console.log(
            "🔥 VOICENOX WEBSOCKET CONNECTED"
        );

        console.log(
            "WebSocket connection opened successfully."
        );

        console.log(
            "URL:",
            wsUrl
        );

        console.log(
            "Ready state:",
            socket.readyState
        );

        console.log(
            "=========================================="
        );


        if (onOpen) {

            onOpen(
                socket
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | MESSAGE RECEIVED
    |--------------------------------------------------------------------------
    |
    | Spring Boot will send transcript messages back
    | to the React application.
    |
    */

    socket.onmessage = (
        event
    ) => {

        console.log(
            "=========================================="
        );

        console.log(
            "VOICE NOX MESSAGE RECEIVED"
        );

        console.log(
            event.data
        );

        console.log(
            "=========================================="
        );


        if (onMessage) {

            onMessage(
                event
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | WEBSOCKET ERROR
    |--------------------------------------------------------------------------
    */

    socket.onerror = (
        error
    ) => {

        console.error(
            "=========================================="
        );

        console.error(
            "🔥 VOICENOX WEBSOCKET ERROR"
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


        if (onError) {

            onError(
                error
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | WEBSOCKET CLOSED
    |--------------------------------------------------------------------------
    */

    socket.onclose = (
        event
    ) => {

        console.log(
            "=========================================="
        );

        console.log(
            "VOICE NOX WEBSOCKET DISCONNECTED"
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
            "Was clean:",
            event.wasClean
        );

        console.log(
            "=========================================="
        );


        if (onClose) {

            onClose(
                event
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | RETURN SOCKET
    |--------------------------------------------------------------------------
    */

    return socket;
}