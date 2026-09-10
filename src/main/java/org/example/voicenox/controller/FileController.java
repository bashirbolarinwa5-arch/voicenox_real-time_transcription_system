package org.example.voicenox.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads") // Aligned directly with the voice.html network mapping paths
@CrossOrigin(origins = "*")
public class FileController {

    @GetMapping("/recordings/{filename}")
    public ResponseEntity<Resource> getAudio(@PathVariable String filename) {
        try {
            // Locates file logs securely inside the target uploads subfolder layout
            Path path = Paths.get(System.getProperty("user.home"))
                    .resolve("voicenox_uploads/recordings")
                    .resolve(filename);

            Resource resource = new UrlResource(path.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                // Fallback check matching local root projects build tracking path vectors
                path = Paths.get("uploads/recordings").resolve(filename);
                resource = new UrlResource(path.toUri());
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/webm")) // Matches default opus webm layouts seamlessly
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("File track not found within physical node drives.");
        }
    }
}
