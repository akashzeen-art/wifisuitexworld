package com.wifiextender.config;

import com.wifiextender.dto.AuthDto;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@Hidden
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return respond(HttpStatus.BAD_REQUEST, "Validation Error", message);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        return respond(HttpStatus.BAD_REQUEST, "Missing Parameter", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return respond(HttpStatus.BAD_REQUEST, "Invalid Parameter",
                "Parameter '" + ex.getName() + "' has invalid value: " + ex.getValue());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return respond(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return respond(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return respond(HttpStatus.CONFLICT, "Conflict", ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return respond(HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to perform this action");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleAuthentication(AuthenticationException ex) {
        return respond(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication required");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthDto.ErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "An unexpected error occurred");
    }

    private ResponseEntity<AuthDto.ErrorResponse> respond(HttpStatus status, String error, String message) {
        return ResponseEntity.status(status)
                .body(new AuthDto.ErrorResponse(status.value(), error, message));
    }
}
