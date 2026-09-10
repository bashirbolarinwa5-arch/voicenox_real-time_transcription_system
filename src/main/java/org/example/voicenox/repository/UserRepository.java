package org.example.voicenox.repository;

import org.example.voicenox.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 🔍 Finds an existing workspace profile account by their unique handle.
     * This query is critical for the authenticating filter verification pipeline.
     */
    Optional<User> findByEmail(String email);
}
