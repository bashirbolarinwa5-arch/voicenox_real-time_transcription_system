package org.example.voicenox.controller;

import org.example.voicenox.entity.Note;
import org.example.voicenox.service.NoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/note")
@CrossOrigin(origins = "*")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    // GET ALL NOTES
    @GetMapping
    public ResponseEntity<List<Note>> getAll() {
        return ResponseEntity.ok(noteService.getAll());
    }

    // GET NOTE BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Note> getById(@PathVariable Long id) {
        return ResponseEntity.ok(noteService.getById(id));
    }

    // ⚡ FIX: Added explicit error block checks to catch database binding anomalies instantly
    @PostMapping("/{userId}")
    public ResponseEntity<?> createNote(@PathVariable Long userId, @RequestBody Note note) {
        try {
            Note savedNote = noteService.createNote(userId, note);
            return ResponseEntity.ok(savedNote);
        } catch (Exception e) {
            e.printStackTrace(); // Logs path validation bugs straight into your IntelliJ console terminal
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Database creation matrix execution error: " + e.getMessage());
        }
    }

    // UPDATE NOTE
    @PutMapping("/update/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @RequestBody Note note) {
        Note updatedNote = noteService.updateNote(id, note);
        return ResponseEntity.ok(updatedNote);
    }

    // DELETE NOTE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        noteService.deleteNote(id);
        return ResponseEntity.noContent().build();
    }

    // PATCH: RENAME NOTE TITLE ONLY
    @PatchMapping("/rename/{id}")
    public ResponseEntity<Note> renameNote(@PathVariable Long id, @RequestParam String title) {
        return ResponseEntity.ok(noteService.renameNote(id, title));
    }

    // GET: FILTER BY SPECIFIC DAY/DATE RANGE
    @GetMapping("/filter/date")
    public ResponseEntity<List<Note>> filterByDate(
            @RequestParam String startIso,
            @RequestParam String endIso,
            @RequestParam(value = "userId", required = false) Long userId) {
        LocalDateTime start = LocalDateTime.parse(startIso);
        LocalDateTime end = LocalDateTime.parse(endIso);
        return ResponseEntity.ok(noteService.getNotesByDateRange(start, end, userId));
    }

    // ⚡ FIX: Dynamically screens and filters streams by active session owners, completely clearing Jackson serialization leaks
    // ⚡ FALLBACK REPAIR: Safe mapping handles both legacy notes (NULL users) and isolated user records
    @GetMapping("/sorted")
    public ResponseEntity<?> getAllNotesSorted(@RequestParam(value = "userId", required = false) Long userId) {
        try {
            // Retrieve all raw data entries from local database repositories
            List<Note> allSorted = noteService.getAllSorted();

            if (userId != null) {
                List<Note> filteredUserNotes = allSorted.stream()
                        .filter(note -> {
                            // 🛡️ SECURITY SAFEGUARD: Skip processing any entry with empty relationships to avoid server crashes
                            if (note == null) {
                                return false;
                            }
                            // 📂 LEGACY FALLBACK: If an old note has no user assigned, let it load cleanly instead of crashing
                            if (note.getUser() == null) {
                                return true;
                            }
                            // Direct verification mapping lookup match validation
                            return note.getUser().getId().equals(userId);
                        })
                        .toList();

                // Break recursive serialization loop paths instantly
                filteredUserNotes.forEach(note -> {
                    if (note.getUser() != null) {
                        note.getUser().setPassword(null);
                    }
                    if (note.getRecordings() != null) {
                        note.getRecordings().forEach(rec -> rec.setNote(null));
                    }
                });

                return ResponseEntity.ok(filteredUserNotes);
            }

            return ResponseEntity.ok(allSorted);
        } catch (Exception e) {
            System.err.println("CRITICAL FAILURE FILTERING HISTORICAL STREAM:");
            e.printStackTrace(); // Prints the underlying error stack directly to your terminal screen
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Sync Failure: " + e.getMessage());
        }
    }



    // GET: SEARCH ENTRIES BY KEYWORD MATCHES
    @GetMapping("/search")
    public ResponseEntity<List<Note>> searchNotes(
            @RequestParam("keyword") String keyword,
            @RequestParam(value = "userId", required = false) Long userId) {
        return ResponseEntity.ok(noteService.searchByKeyword(keyword, userId));
    }
}
