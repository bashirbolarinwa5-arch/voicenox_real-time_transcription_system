package org.example.voicenox.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Component;

import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component

public class JwtAuthenticationFilter
        extends OncePerRequestFilter {


    private final JwtService jwtService;


    public JwtAuthenticationFilter(
            JwtService jwtService
    ) {

        this.jwtService =
                jwtService;
    }


    @Override
    protected void doFilterInternal(

            HttpServletRequest request,

            HttpServletResponse response,

            FilterChain filterChain

    ) throws ServletException, IOException {


        String authorizationHeader =
                request.getHeader(
                        "Authorization"
                );


        if (
                authorizationHeader == null
                        ||
                        !authorizationHeader.startsWith(
                                "Bearer "
                        )
        ) {

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }


        String token =
                authorizationHeader.substring(7);


        try {

            if (
                    jwtService.isTokenValid(
                            token
                    )
            ) {

                String email =
                        jwtService.extractEmail(
                                token
                        );


                Long userId =
                        jwtService.extractUserId(
                                token
                        );


                UsernamePasswordAuthenticationToken authentication =

                        new UsernamePasswordAuthenticationToken(

                                email,

                                null,

                                null

                        );


                authentication.setDetails(
                        userId
                );


                SecurityContextHolder
                        .getContext()
                        .setAuthentication(
                                authentication
                        );
            }


        } catch (Exception e) {

            SecurityContextHolder
                    .clearContext();
        }


        filterChain.doFilter(
                request,
                response
        );
    }
}