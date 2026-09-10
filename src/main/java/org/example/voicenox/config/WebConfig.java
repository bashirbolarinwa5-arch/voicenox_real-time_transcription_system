package org.example.voicenox.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class WebConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF protection for standard local REST testing
                .authorizeHttpRequests(auth -> auth
                        // ⚡ ALIGNED WHITELIST: Permits public web operations to pass both Auth routes and your Note lifecycle routes
                        .requestMatchers("/api/auth/**", "/note/**", "/recording/**", "/ws/voice/**").permitAll()
                         .requestMatchers("/voice.html", "/static/**", "/uploads/**").permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(basic -> basic.disable());

        return http.build();
    }
}
