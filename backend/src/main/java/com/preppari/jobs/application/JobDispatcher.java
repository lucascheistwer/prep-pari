package com.preppari.jobs.application;

import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class JobDispatcher {

  private static final Logger log = LoggerFactory.getLogger(JobDispatcher.class);

  public void dispatch(
      ClaimedJob job,
      BackgroundJobHandler handler,
      BackgroundJobRepositoryPort repository,
      String workerId,
      List<Duration> retryDelays,
      double jitterUnit) {
    if (handler == null) {
      repository.markDead(
          job.id(),
          workerId,
          JobErrorCodes.NO_HANDLER,
          JobErrorMessages.sanitize("No hay handler para " + job.jobType()));
      return;
    }
    try {
      handler.handle(job);
      if (!repository.markSucceeded(job.id(), workerId)) {
        log.warn("No se pudo marcar SUCCEEDED el job {} para {}", job.id(), workerId);
      }
    } catch (PermanentJobException ex) {
      log.warn("Job {} falló de forma permanente", job.id(), ex);
      repository.markDead(job.id(), workerId, code(ex.code(), JobErrorCodes.PERMANENT), safe(ex));
    } catch (RuntimeException ex) {
      log.warn("Job {} falló y puede reintentarse", job.id(), ex);
      String code =
          ex instanceof TransientJobException transientFailure
              ? code(transientFailure.code(), JobErrorCodes.TRANSIENT)
              : JobErrorCodes.TRANSIENT;
      if (job.attempts() >= job.maxAttempts()) {
        repository.markDead(job.id(), workerId, code, safe(ex));
        return;
      }
      Duration delay =
          RetryBackoff.withJitter(
              RetryBackoff.delayForAttempt(job.attempts(), retryDelays), jitterUnit);
      repository.scheduleRetry(job.id(), workerId, delay, code, safe(ex));
    }
  }

  private static String code(String candidate, String fallback) {
    if (candidate == null || candidate.isBlank() || candidate.length() > 80) {
      return fallback;
    }
    return candidate;
  }

  private static String safe(RuntimeException ex) {
    return JobErrorMessages.sanitize(ex.getMessage());
  }
}
