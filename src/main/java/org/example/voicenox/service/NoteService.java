package org.example.voicenox.service;
import org.example.voicenox.entity.Note;

import org.example.voicenox.entity.User;
import org.example.voicenox.repository.NoteRepository;
import org.example.voicenox.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
@Service

public class NoteService {
    private final NoteRepository repo;
    private final UserRepository user;

    public NoteService(NoteRepository repo,UserRepository user) {
        this.repo = repo;
        this.user = user;
    }

    // GET ALL NOTE
    public List<Note> getAll() {
        return repo.findAll();
    }
    // GET NOTE BY ID
    public Note getById(Long id){
        return  repo.findById(id).orElseThrow(() -> new RuntimeException("id not found"));
    }
    // CREATE NOTE
    // 🎙️ SAFE CREATION MATRIX: Ensures new recordings bind tightly to your active account handle
    public Note createNote(Long userId, Note note) {
        User userEntity = user.findById(userId)
                .orElseThrow(() -> new RuntimeException("Active workspace User profile ID matching context token not found."));

        note.setUser(userEntity);

        LocalDateTime now = LocalDateTime.now();
        note.setCreatedAt(now);
        note.setUpdatedAt(now);

        // If title or text arrives bare from initialization buffers, ensure fallback properties exist
        if (note.getTitle() == null || note.getTitle().isBlank()) {
            note.setTitle("Voice Note — " + now.toString());
        }

        return repo.save(note);
    }

    // UPDATE NOTE
     public Note updateNote(Long id, Note note){
        Note existingNote = repo.findById(id).orElseThrow(() -> new RuntimeException("id not found"));

        existingNote.setText(note.getText());
         existingNote.setUpdatedAt(LocalDateTime.now());
        return repo.save(existingNote);
     }
     // DELETE NOTE
    public void deleteNote(Long id){
        repo.deleteById(id);
    }
    // RENAME NOTE ONLY
    public Note renameNote(Long id, String newTitle) {
        Note existingNote = repo.findById(id).orElseThrow(() -> new RuntimeException("Note not found"));
        existingNote.setTitle(newTitle);
        existingNote.setUpdatedAt(LocalDateTime.now());
        return repo.save(existingNote);
    }


    // SEARCH BY NAME OR TRANSCRIPT KEYWORD
    // UPGRADED ROBUST KEYWORD SEARCH
    // 🔍 UPGRADED SEARCH: Isolates keywords so users only search inside their own private text logs
    public List<Note> searchByKeyword(String keyword, Long userId) {
        String cleanKeyword = keyword.trim().toLowerCase();

        return repo.findAllByOrderByCreatedAtDesc().stream()
                .filter(note -> {
                    // 🛡️ SECURITY CHECK: The entry must belong to the active user session context token
                    return note.getUser() != null && note.getUser().getId().equals(userId);
                })
                .filter(note -> {
                    boolean titleMatches = note.getTitle() != null &&
                            note.getTitle().toLowerCase().contains(cleanKeyword);

                    boolean textMatches = note.getText() != null &&
                            note.getText().toLowerCase().contains(cleanKeyword);

                    return titleMatches || textMatches;
                })
                .toList();
    }

    // 📅 ISOLATED DATE FILTER: Keeps calendars locked to the active user's document history entries
    public List<Note> getNotesByDateRange(LocalDateTime start, LocalDateTime end, Long userId) {
        return repo.findByCreatedAtBetween(start, end).stream()
                .filter(note -> note.getUser() != null && note.getUser().getId().equals(userId))
                .toList();
    }


    // FILTER BY DATE RANGE
    public List<Note> getNotesByDateRange(LocalDateTime start, LocalDateTime end) {
        return repo.findByCreatedAtBetween(start, end);
    }

    // GET ALL SORTED BY NEWEST
    public List<Note> getAllSorted() {
        return repo.findAllByOrderByCreatedAtDesc();
    }


}


