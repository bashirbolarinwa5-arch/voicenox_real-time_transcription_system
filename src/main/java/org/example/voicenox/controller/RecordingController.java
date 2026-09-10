package org.example.voicenox.controller;

import org.example.voicenox.entity.Recording;
import org.example.voicenox.service.RecordingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/recording")
@CrossOrigin(origins = "*")
public class RecordingController {

    private final RecordingService recordingService;

    public RecordingController(RecordingService recordingService) {
        this.recordingService = recordingService;
    }

    // Explicitly matches multi-part requests from your frontend script
    @PostMapping("/{noteId}")
    public ResponseEntity<Recording> uploadRecording(
            @PathVariable Long noteId,
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("transcription") String transcription) {

        Recording saved = recordingService.uploadAudio(noteId, audioFile, transcription);
        return ResponseEntity.ok(saved);
    }
    // GET ALL RECORDS
    @GetMapping
    public ResponseEntity<List<Recording>> getAll() {
        return ResponseEntity.ok(recordingService.getAll());
    }
    // GET RECORD A  BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Recording> getById(@PathVariable Long id) {
        return ResponseEntity.ok(recordingService.getById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        recordingService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }
    // GET ALL RECORDINGS BELONGING TO A SPECIFIC NOTE
    @GetMapping("/note/{noteId}")
    public ResponseEntity<List<Recording>> getRecordingsByNote(@PathVariable Long noteId) {
        // We look up the note's child list. If your service doesn't have a direct query for this,
        // you can filter them from recordingService.getAll() or add a query to RecordingRepository.
        List<Recording> allRecordings = recordingService.getAll();
        List<Recording> filtered = allRecordings.stream()
                .filter(r -> r.getNote() != null && r.getNote().getId().equals(noteId))
                .toList();
        return ResponseEntity.ok(filtered);
    }

}
