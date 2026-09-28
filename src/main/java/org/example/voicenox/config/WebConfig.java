package org.example.voicenox.config;

import org.example.voicenox.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@Configuration
public class WebConfig {


    private final JwtAuthenticationFilter jwtAuthenticationFilter;


    public WebConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {

        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {


        http

                .csrf(
                        csrf ->
                                csrf.disable()
                )


                .cors(
                        cors -> {}
                )


                .sessionManagement(
                        session ->

                                session.sessionCreationPolicy(

                                        SessionCreationPolicy
                                                .STATELESS

                                )
                )


                .authorizeHttpRequests(

                        auth -> auth

                                /*
                                 * Login/register
                                 */

                                .requestMatchers(
                                        "/api/auth/**"
                                )
                                .permitAll()


                                /*
                                 * Audio files
                                 */

                                .requestMatchers(
                                        "/uploads/**"
                                )
                                .permitAll()


                                /*
                                 * Temporarily leave
                                 * WebSocket open.
                                 *
                                 * We will secure this after
                                 * REST JWT works.
                                 */

                                .requestMatchers(
                                        "/ws/voice/**"
                                )
                                .permitAll()


                                /*
                                 * Everything else
                                 * requires JWT.
                                 */

                                .anyRequest()
                                .authenticated()
                )


                .addFilterBefore(

                        jwtAuthenticationFilter,

                        UsernamePasswordAuthenticationFilter.class

                );


        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();


        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://localhost:5174"
                )
        );


        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );


        configuration.setAllowedHeaders(
                List.of("*")
        );


        configuration.setAllowCredentials(
                false
        );


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();


        source.registerCorsConfiguration(
                "/**",
                configuration
        );


        return source;
    }
}