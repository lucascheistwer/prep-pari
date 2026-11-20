package com.preppari.jobs.application;

import com.preppari.jobs.domain.JobType;
import java.time.Instant;
import java.util.UUID;

public record ClaimedJob(
    UUID id,
    UUID householdId,
    JobType jobType,
    String aggregateType,
    UUID aggregateId,
    String payloadJson,
    int attempts,
    int maxAttempts,
    String lockedBy,
    Instant lockedUntil,
    String idempotencyKey) {}
