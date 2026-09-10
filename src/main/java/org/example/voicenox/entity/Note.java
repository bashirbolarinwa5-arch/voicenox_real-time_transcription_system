package org.example.voicenox.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class Note {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String title;

        @Column(columnDefinition = "TEXT")
        private String text;

        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        @ManyToOne
        @JoinColumn(name = "user_id")
        private User user;

        @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true)
        @JsonManagedReference // <-- ADD THIS ANNOTATION HERE TO MANAGE RELATION RELATIONSHIPS CLEANLY
        private List<Recording> recordings;
}
