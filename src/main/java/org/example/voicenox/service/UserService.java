package org.example.voicenox.service;

import org.example.voicenox.entity.User;
import org.example.voicenox.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;


@Service
public class UserService {


    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;


    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {

        this.userRepository =
                userRepository;

        this.passwordEncoder =
                passwordEncoder;
    }


    // ==========================================
    // CREATE USER
    // ==========================================

    public User createUser(
            User user
    ) {

        if (
                userRepository
                        .findByEmail(
                                user.getEmail()
                        )
                        .isPresent()
        ) {

            throw new RuntimeException(
                    "Email already exists."
            );
        }


        user.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );


        LocalDateTime now =
                LocalDateTime.now();


        user.setCreatedAt(now);

        user.setUpdatedAt(now);


        return userRepository.save(
                user
        );
    }


    // ==========================================
    // LOGIN
    // ==========================================

    public User login(
            String email,
            String password
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Invalid email or password."
                                        )
                        );


        boolean passwordMatches =
                passwordEncoder.matches(
                        password,
                        user.getPassword()
                );


        if (!passwordMatches) {

            throw new RuntimeException(
                    "Invalid email or password."
            );
        }


        return user;
    }


    // ==========================================
    // GET ALL USERS
    // ==========================================

    public List<User> getAllUsers() {

        return userRepository.findAll();
    }


    // ==========================================
    // GET USER
    // ==========================================

    public User getUserById(
            Long id
    ) {

        return userRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new RuntimeException(
                                        "User not found."
                                )
                );
    }


    // ==========================================
    // DELETE USER
    // ==========================================

    public void deleteUser(
            Long id
    ) {

        userRepository.deleteById(
                id
        );
    }


    // ==========================================
    // UPDATE USER
    // ==========================================

    public User updateUser(
            Long id,
            User updatedUser
    ) {

        User existingUser =
                getUserById(id);


        existingUser.setFullName(
                updatedUser.getFullName()
        );


        existingUser.setEmail(
                updatedUser.getEmail()
        );


        /*
         * Only change password if one
         * was actually supplied.
         */

        if (
                updatedUser.getPassword() != null
                        &&
                        !updatedUser
                                .getPassword()
                                .isBlank()
        ) {

            existingUser.setPassword(

                    passwordEncoder.encode(
                            updatedUser.getPassword()
                    )

            );
        }


        existingUser.setUpdatedAt(
                LocalDateTime.now()
        );


        return userRepository.save(
                existingUser
        );
    }
}