package org.example.voicenox.exception;

import org.example.voicenox.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse> handleRuntime(RuntimeException e) {
        // This will print the actual error text directly to your IntelliJ console logs so we can see it!
        System.err.println("!!! GLOBAL EXCEPTION CAUGHT BY BACKEND !!!");
        e.printStackTrace();

        ApiResponse response = new ApiResponse(e.getMessage(), null);

        // Dynamically changes status based on error messages
        if (e.getMessage() != null && e.getMessage().contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        // Default to a 500 Server Error if it is a file or database crash instead of hiding it as a 404
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
