package org.example.voicenox.security;

import org.example.voicenox.entity.User;

public record AuthResponse(
        String token,
        Long userId,
        String fullName,
        String email
) {

    public static AuthResponse from(
            String token,
            User user
    ) {

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail()
        );
    }
}