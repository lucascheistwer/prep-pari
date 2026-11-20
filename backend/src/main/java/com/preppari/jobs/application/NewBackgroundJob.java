package com.preppari.jobs.application;

import com.preppari.jobs.domain.JobType;
import java.time.Duration;
import java.util.UUID;

public record NewBackgroundJob(
    UUID householdId,
    JobType jobType,
    String aggregateType,
    UUID aggregateId,
    String payloadJson,
    String idempotencyKey,
    int priority,
    int maxAttempts,
    Duration availableIn,
    UUID retryOfJobId) {

  public NewBackgroundJob {
    if (householdId == null || jobType == null || aggregateId == null) {
      throw new IllegalArgumentException("householdId, jobType y aggregateId son obligatorios");
    }
    if (aggregateType == null || aggregateType.isBlank() || aggregateType.length() > 64) {
      throw new IllegalArgumentException("aggregateType inválido");
    }
    if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 200) {
      throw new IllegalArgumentException("idempotencyKey inválida");
    }
    if (payloadJson == null || payloadJson.isBlank()) {
      payloadJson = "{}";
    }
    if (payloadJson.length() > 16_384) {
      throw new IllegalArgumentException("payload demasiado grande");
    }
    if (priority < 0 || priority > Short.MAX_VALUE) {
      throw new IllegalArgumentException("priority fuera de rango");
    }
    if (maxAttempts < 1 || maxAttempts > 20) {
      throw new IllegalArgumentException("maxAttempts fuera de rango");
    }
    if (availableIn == null || availableIn.isNegative()) {
      throw new IllegalArgumentException("availableIn inválido");
    }
  }

  public static NewBackgroundJob pending(
      UUID householdId,
      JobType jobType,
      String aggregateType,
      UUID aggregateId,
      String payloadJson,
      String idempotencyKey) {
    return new NewBackgroundJob(
        householdId,
        jobType,
        aggregateType,
        aggregateId,
        payloadJson,
        idempotencyKey,
        0,
        5,
        Duration.ZERO,
        null);
  }
}
