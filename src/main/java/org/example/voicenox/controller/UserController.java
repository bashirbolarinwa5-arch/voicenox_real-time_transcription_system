package org.example.voicenox.controller;

import org.example.voicenox.entity.User;
import org.example.voicenox.security.AuthResponse;
import org.example.voicenox.security.JwtService;
import org.example.voicenox.service.UserService;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class UserController {


    private final UserService userService;

    private final JwtService jwtService;


    public UserController(
            UserService userService,
            JwtService jwtService
    ) {

        this.userService =
                userService;

        this.jwtService =
                jwtService;
    }


    // ==========================================
    // REGISTER
    // ==========================================

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody User user
    ) {

        User createdUser =
                userService.createUser(
                        user
                );


        String token =
                jwtService.generateToken(
                        createdUser.getId(),
                        createdUser.getEmail()
                );


        return ResponseEntity.ok(

                AuthResponse.from(
                        token,
                        createdUser
                )

        );
    }


    // ==========================================
    // LOGIN
    // ==========================================

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody User user
    ) {

        User authenticatedUser =
                userService.login(
                        user.getEmail(),
                        user.getPassword()
                );


        String token =
                jwtService.generateToken(
                        authenticatedUser.getId(),
                        authenticatedUser.getEmail()
                );


        return ResponseEntity.ok(

                AuthResponse.from(
                        token,
                        authenticatedUser
                )

        );
    }
}