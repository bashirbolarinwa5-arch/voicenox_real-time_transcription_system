package org.example.voicenox.service;

import org.example.voicenox.entity.Note;
import org.example.voicenox.entity.Recording;
import org.example.voicenox.repository.RecordingRepository;
import org.example.voicenox.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RecordingService {
    private final RecordingRepository repo;
    private final NoteRepository note;

    public RecordingService(RecordingRepository repo, NoteRepository note) {
        this.repo = repo;
        this.note = note;
    }

    public List<Recording> getAll() {
        return repo.findAll();
    }

    public Recording createRecord(Long noteId, Recording record) {
        Note noteEntity = note.findById(noteId).orElseThrow(() -> new RuntimeException("id not found"));
        record.setNote(noteEntity);
        return repo.save(record);
    }

    public Recording getById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("id not found"));
    }

    public Recording uploadAudio(Long noteId, MultipartFile audioFile, String transcription) {
        Note noteEntity = note.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (audioFile == null || audioFile.isEmpty()) {
            throw new RuntimeException("Audio file is empty");
        }

        try {
            // Force a highly privileged absolute path inside your system profile space
            String userHome = System.getProperty("user.home");
            Path uploadPath = Paths.get(userHome, "voicenox_uploads", "recordings");
            Files.createDirectories(uploadPath);

            String originalName = audioFile.getOriginalFilename();
            String extension = ".webm";

            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(fileName);

            // Copy file securely with absolute overwrite rights
            Files.copy(audioFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved securely at absolute target location: " + filePath.toAbsolutePath());

            Recording recording = new Recording();
            recording.setNote(noteEntity);
            recording.setAudioUrl(fileName); // Save only the clean file key string to DB
            recording.setTranscription(transcription);
            recording.setCreatedAt(LocalDateTime.now());

            return repo.save(recording);

        } catch (IOException e) {
            System.err.println("CRITICAL FAILURE CAPTURING AUDIO STREAM ON DISK:");
            e.printStackTrace();
            throw new RuntimeException("Audio link failed inside internal operations: " + e.getMessage());
        }
    }

    public Recording updateTranscription(Long id, Recording record) {
        Recording existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recording not found"));
        existing.setTranscription(record.getTranscription());
        return repo.save(existing);
    }

    public void deleteRecord(Long id) {
        repo.deleteById(id);
    }
}
