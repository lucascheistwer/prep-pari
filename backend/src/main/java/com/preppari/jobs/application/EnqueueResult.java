package com.preppari.jobs.application;

import java.util.UUID;

public record EnqueueResult(UUID jobId, boolean created) {}
