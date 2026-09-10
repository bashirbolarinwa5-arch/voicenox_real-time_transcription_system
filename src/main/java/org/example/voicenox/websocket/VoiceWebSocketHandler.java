package org.example.voicenox.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

@Component
public class VoiceWebSocketHandler extends BinaryWebSocketHandler {

    private final DeepgramService deepgramService;

    public VoiceWebSocketHandler(DeepgramService deepgramService) {
        this.deepgramService = deepgramService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {

        System.out.println(
                "Frontend WebSocket connected: "
                        + session.getId()
        );

        deepgramService.connect(session);
    }

    @Override
    protected void handleBinaryMessage(
            WebSocketSession session,
            BinaryMessage message) {

        System.out.println(
                "Received audio from frontend: "
                        + message.getPayloadLength()
                        + " bytes"
        );

        deepgramService.sendAudio(
                session,
                message.getPayload()
        );
    }

    @Override
    protected void handleTextMessage(
            WebSocketSession session,
            TextMessage message) {

        System.out.println(
                "Received text message: "
                        + message.getPayload()
        );
    }

    @Override
    public void afterConnectionClosed(
            WebSocketSession session,
            CloseStatus status) {

        System.out.println(
                "Frontend WebSocket closed: "
                        + session.getId()
        );

        deepgramService.close(session);
    }

    @Override
    public void handleTransportError(
            WebSocketSession session,
            Throwable exception) {

        System.out.println(
                "WebSocket error: "
                        + exception.getMessage()
        );

        deepgramService.close(session);
    }
}