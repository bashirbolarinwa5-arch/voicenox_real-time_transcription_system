package org.example.voicenox.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Data
public class Recording {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String audioUrl;

    @Column(columnDefinition = "TEXT") // Safe fallback for high capacity transcripts
    private String transcription;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "note_id")
    @JsonBackReference // <-- ADD THIS ANNOTATION HERE TO BREAK INFINITE SERIALIZATION LOOPS
    private Note note;
}
