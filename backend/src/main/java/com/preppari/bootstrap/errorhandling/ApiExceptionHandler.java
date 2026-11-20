package com.preppari.bootstrap.errorhandling;

import com.preppari.shared.adapters.observability.TraceIds;
import com.preppari.shared.domain.DomainException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(DomainException.class)
  public ResponseEntity<ApiError> domain(DomainException exception) {
    return ResponseEntity.unprocessableEntity()
        .body(
            new ApiError(exception.code(), exception.getMessage(), List.of(), TraceIds.current()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> unexpected(Exception exception) {
    log.error("Error no controlado", exception);
    return ResponseEntity.internalServerError()
        .body(
            new ApiError(
                "INTERNAL_ERROR", "Ocurrió un error inesperado.", List.of(), TraceIds.current()));
  }
}
