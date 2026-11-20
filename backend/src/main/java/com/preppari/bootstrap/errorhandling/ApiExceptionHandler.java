package com.preppari.bootstrap.errorhandling;

import com.preppari.shared.adapters.observability.TraceIds;
import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.ForbiddenException;
import com.preppari.shared.domain.NotFoundException;
import com.preppari.shared.domain.UnauthorizedException;
import com.preppari.shared.domain.UnavailableException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ApiError> notFound(NotFoundException exception) {
    return status(HttpStatus.NOT_FOUND, exception);
  }

  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ApiError> forbidden(ForbiddenException exception) {
    return status(HttpStatus.FORBIDDEN, exception);
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiError> unauthorized(UnauthorizedException exception) {
    return status(HttpStatus.UNAUTHORIZED, exception);
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ApiError> conflict(ConflictException exception) {
    return status(HttpStatus.CONFLICT, exception);
  }

  @ExceptionHandler(UnavailableException.class)
  public ResponseEntity<ApiError> unavailable(UnavailableException exception) {
    return status(HttpStatus.SERVICE_UNAVAILABLE, exception);
  }

  @ExceptionHandler(DomainException.class)
  public ResponseEntity<ApiError> domain(DomainException exception) {
    return status(HttpStatus.UNPROCESSABLE_CONTENT, exception);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> invalid(MethodArgumentNotValidException exception) {
    List<String> details =
        exception.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toList();
    return ResponseEntity.badRequest()
        .body(new ApiError("VALIDATION_ERROR", "Revisá los datos.", details, TraceIds.current()));
  }

  @ExceptionHandler({
    HttpMessageNotReadableException.class,
    MethodArgumentTypeMismatchException.class
  })
  public ResponseEntity<ApiError> malformed() {
    return ResponseEntity.badRequest()
        .body(new ApiError("VALIDATION_ERROR", "Revisá los datos.", List.of(), TraceIds.current()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> unexpected(Exception exception) {
    log.error("Error no controlado", exception);
    return ResponseEntity.internalServerError()
        .body(
            new ApiError(
                "INTERNAL_ERROR", "Ocurrió un error inesperado.", List.of(), TraceIds.current()));
  }

  private static ResponseEntity<ApiError> status(HttpStatus status, DomainException exception) {
    return ResponseEntity.status(status)
        .body(
            new ApiError(exception.code(), exception.getMessage(), List.of(), TraceIds.current()));
  }
}
