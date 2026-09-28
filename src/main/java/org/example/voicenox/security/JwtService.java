package org.example.voicenox.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.access-token-expiration}")
    private long accessTokenExpiration;


    private SecretKey getSigningKey() {

        return Keys.hmacShaKeyFor(
                secretKey.getBytes(StandardCharsets.UTF_8)
        );
    }


    public String generateToken(Long userId, String email) {

        Date now = new Date();

        Date expiration =
                new Date(
                        now.getTime()
                                + accessTokenExpiration
                );


        return Jwts.builder()

                .subject(email)

                .claim(
                        "userId",
                        userId
                )

                .issuedAt(now)

                .expiration(expiration)

                .signWith(
                        getSigningKey()
                )

                .compact();
    }


    public String extractEmail(
            String token
    ) {

        return getClaims(token)
                .getSubject();
    }


    public Long extractUserId(
            String token
    ) {

        return getClaims(token)
                .get("userId", Long.class);
    }


    public boolean isTokenValid(
            String token
    ) {

        try {

            getClaims(token);

            return true;

        } catch (Exception e) {

            return false;

        }
    }


    private Claims getClaims(
            String token
    ) {

        return Jwts.parser()

                .verifyWith(
                        getSigningKey()
                )

                .build()

                .parseSignedClaims(token)

                .getPayload();
    }
}