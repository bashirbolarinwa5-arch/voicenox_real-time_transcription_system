package org.example.voicenox.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.util.Map;
import java.util.Queue;

import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class DeepgramService {

    @Value("${deepgram.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, WebSocket> deepgramConnections =
            new ConcurrentHashMap<>();

    /*
     * Stores audio that arrives before Deepgram is ready.
     */
    private final Map<String, Queue<ByteBuffer>> pendingAudio =
            new ConcurrentHashMap<>();


    // CONNECT TO DEEPGRAM
    public void connect(WebSocketSession frontendSession) {

        String sessionId = frontendSession.getId();

        // Create an audio queue for this frontend session
        pendingAudio.putIfAbsent(
                sessionId,
                new ConcurrentLinkedQueue<>()
        );

        String url =
                "wss://api.deepgram.com/v1/listen"
                        + "?model=nova-3"
                        + "&language=en-US"
                        + "&smart_format=true"
                        + "&interim_results=true"
                        + "&endpointing=300";

        HttpClient client = HttpClient.newHttpClient();

        WebSocket.Listener listener =
                new WebSocket.Listener() {

                    @Override
                    public void onOpen(WebSocket webSocket) {

                        System.out.println(
                                "Connected to Deepgram"
                        );

                        // Save the connection
                        deepgramConnections.put(
                                sessionId,
                                webSocket
                        );

                        /*
                         * Deepgram is now ready.
                         * Send any audio that arrived earlier.
                         */
                        Queue<ByteBuffer> queuedAudio =
                                pendingAudio.get(sessionId);

                        if (queuedAudio != null) {

                            ByteBuffer audio;

                            while ((audio = queuedAudio.poll()) != null) {

                                System.out.println(
                                        "Sending queued audio to Deepgram: "
                                                + audio.remaining()
                                                + " bytes"
                                );

                                webSocket.sendBinary(
                                        audio,
                                        true
                                );
                            }
                        }

                        WebSocket.Listener.super.onOpen(
                                webSocket
                        );
                    }


                    @Override
                    public CompletionStage<?> onText(
                            WebSocket webSocket,
                            CharSequence data,
                            boolean last) {

                        try {

                            System.out.println(
                                    "Deepgram response: "
                                            + data
                            );

                            JsonNode root =
                                    objectMapper.readTree(
                                            data.toString()
                                    );

                            String type =
                                    root.path("type")
                                            .asText();

                            if ("Results".equals(type)) {

                                JsonNode alternatives =
                                        root.path("channel")
                                                .path("alternatives");

                                if (alternatives.isArray()
                                        && alternatives.size() > 0) {

                                    String transcript =
                                            alternatives
                                                    .get(0)
                                                    .path("transcript")
                                                    .asText();

                                    boolean isFinal =
                                            root.path("is_final")
                                                    .asBoolean(false);

                                    boolean speechFinal =
                                            root.path("speech_final")
                                                    .asBoolean(false);


                                    if (!transcript.isBlank()) {

                                        sendTranscript(
                                                frontendSession,
                                                transcript,
                                                isFinal,
                                                speechFinal
                                        );


                                    }
                                }
                            }


                        } catch (Exception e) {

                            System.out.println(
                                    "Error reading Deepgram response: "
                                            + e.getMessage()
                            );
                        }

                        return WebSocket.Listener.super.onText(
                                webSocket,
                                data,
                                last
                        );
                    }


                    @Override
                    public CompletionStage<?> onBinary(
                            WebSocket webSocket,
                            ByteBuffer data,
                            boolean last) {

                        return WebSocket.Listener.super.onBinary(
                                webSocket,
                                data,
                                last
                        );
                    }


                    @Override
                    public void onError(
                            WebSocket webSocket,
                            Throwable error) {

                        System.out.println(
                                "Deepgram WebSocket error: "
                                        + error.getMessage()
                        );
                    }


                    @Override
                    public CompletionStage<?> onClose(
                            WebSocket webSocket,
                            int statusCode,
                            String reason) {

                        System.out.println(
                                "Deepgram connection closed: "
                                        + reason
                        );

                        deepgramConnections.remove(
                                sessionId
                        );

                        return WebSocket.Listener.super.onClose(
                                webSocket,
                                statusCode,
                                reason
                        );
                    }
                };


        client.newWebSocketBuilder()
                .header(
                        "Authorization",
                        "Token " + apiKey
                )
                .buildAsync(
                        URI.create(url),
                        listener
                );
    }


    // SEND AUDIO TO DEEPGRAM
    public void sendAudio(
            WebSocketSession frontendSession,
            ByteBuffer audioData) {

        String sessionId =
                frontendSession.getId();

        WebSocket deepgram =
                deepgramConnections.get(sessionId);


        /*
         * Deepgram is not ready yet.
         * Store the audio instead of throwing it away.
         */
        if (deepgram == null) {

            System.out.println(
                    "Deepgram not ready - queuing audio"
            );

            /*
             * Make a copy of the ByteBuffer.
             * This is important because the original buffer
             * belongs to the incoming WebSocket message.
             */
            ByteBuffer copy =
                    ByteBuffer.allocate(
                            audioData.remaining()
                    );

            copy.put(audioData.duplicate());

            copy.flip();

            pendingAudio
                    .computeIfAbsent(
                            sessionId,
                            key -> new ConcurrentLinkedQueue<>()
                    )
                    .offer(copy);

            return;
        }


        /*
         * Deepgram is ready.
         * Send audio immediately.
         */
        System.out.println(
                "Sending audio to Deepgram: "
                        + audioData.remaining()
                        + " bytes"
        );

        deepgram.sendBinary(
                audioData,
                true
        );
    }


    // SEND TRANSCRIPT BACK TO FRONTEND
    private void sendTranscript(
            WebSocketSession frontendSession,
            String transcript,
            boolean isFinal,
            boolean speechFinal) {

        try {

            String json =
                    objectMapper.writeValueAsString(
                            Map.of(
                                    "type", "transcript",
                                    "text", transcript,
                                    "isFinal", isFinal,
                                    "speechFinal", speechFinal
                            )
                    );

            if (frontendSession.isOpen()) {

                frontendSession.sendMessage(
                        new TextMessage(json)
                );
            }

        } catch (IOException e) {

            System.out.println(
                    "Could not send transcript: "
                            + e.getMessage()
            );
        }
    }


    // CLOSE DEEPGRAM CONNECTION
    public void close(
            WebSocketSession frontendSession) {

        String sessionId =
                frontendSession.getId();

        WebSocket deepgram =
                deepgramConnections.remove(
                        sessionId
                );

        // Remove queued audio
        pendingAudio.remove(sessionId);


        if (deepgram != null) {

            deepgram.sendText(
                    "{\"type\":\"CloseStream\"}",
                    true
            );

            deepgram.sendClose(
                    WebSocket.NORMAL_CLOSURE,
                    "Frontend disconnected"
            );
        }
    }
}