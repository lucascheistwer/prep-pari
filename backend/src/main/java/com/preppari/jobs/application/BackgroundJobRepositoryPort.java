package com.preppari.jobs.application;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

public interface BackgroundJobRepositoryPort extends BackgroundJobPort {

  List<ClaimedJob> claimBatch(String workerId, int batchSize, Duration lease);

  boolean markSucceeded(UUID jobId, String workerId);

  boolean scheduleRetry(
      UUID jobId, String workerId, Duration delay, String errorCode, String safeMessage);

  boolean markDead(UUID jobId, String workerId, String errorCode, String safeMessage);

  boolean extendLease(UUID jobId, String workerId, Duration lease);

  int markExpiredLeasesDead();
}
