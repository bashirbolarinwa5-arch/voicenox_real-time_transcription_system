package org.example.voicenox.repository;

import org.example.voicenox.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    // FIX: Ensure this exact derived naming convention is declared to map title and text inputs properly
    List<Note> findByTitleContainingIgnoreCaseOrTextContainingIgnoreCase(String title, String text);

    List<Note> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Note> findAllByOrderByCreatedAtDesc();
}
