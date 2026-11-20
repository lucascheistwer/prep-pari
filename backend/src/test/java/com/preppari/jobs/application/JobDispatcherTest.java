package com.preppari.jobs.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.preppari.jobs.domain.JobType;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JobDispatcherTest {

  private final JobDispatcher dispatcher = new JobDispatcher();
  private final RecordingRepository repository = new RecordingRepository();
  private final List<Duration> delays = List.of(Duration.ofSeconds(5), Duration.ofSeconds(30));

  @Test
  void missingHandlerMarksTheJobDead() {
    dispatcher.dispatch(job(1, 5), null, repository, "worker-a", delays, 0);

    assertThat(repository.dead).containsExactly("NO_HANDLER");
    assertThat(repository.succeeded).isZero();
  }

  @Test
  void successMarksTheJobSucceeded() {
    dispatcher.dispatch(job(1, 5), handler(claimed -> {}), repository, "worker-a", delays, 0);

    assertThat(repository.succeeded).isEqualTo(1);
    assertThat(repository.dead).isEmpty();
  }

  @Test
  void transientFailureSchedulesARetryBeforeTheLastAttempt() {
    dispatcher.dispatch(
        job(1, 5),
        handler(
            claimed -> {
              throw new TransientJobException("RATE_LIMITED", "429");
            }),
        repository,
        "worker-a",
        delays,
        0);

    assertThat(repository.retries).containsExactly(Duration.ofSeconds(5));
    assertThat(repository.dead).isEmpty();
  }

  @Test
  void transientFailureOnTheLastAttemptMarksTheJobDead() {
    dispatcher.dispatch(
        job(5, 5),
        handler(
            claimed -> {
              throw new TransientJobException("RATE_LIMITED", "429");
            }),
        repository,
        "worker-a",
        delays,
        0);

    assertThat(repository.dead).containsExactly("RATE_LIMITED");
    assertThat(repository.retries).isEmpty();
  }

  @Test
  void permanentFailureDoesNotRetry() {
    dispatcher.dispatch(
        job(1, 5),
        handler(
            claimed -> {
              throw new PermanentJobException("INVALID_PAYLOAD", "no reintentar");
            }),
        repository,
        "worker-a",
        delays,
        0);

    assertThat(repository.dead).containsExactly("INVALID_PAYLOAD");
    assertThat(repository.retries).isEmpty();
  }

  private static BackgroundJobHandler handler(java.util.function.Consumer<ClaimedJob> body) {
    return new BackgroundJobHandler() {
      @Override
      public JobType supportedType() {
        return JobType.GENERATE_DISH_INGREDIENTS;
      }

      @Override
      public void handle(ClaimedJob job) {
        body.accept(job);
      }
    };
  }

  private static ClaimedJob job(int attempts, int maxAttempts) {
    return new ClaimedJob(
        UUID.randomUUID(),
        UUID.randomUUID(),
        JobType.GENERATE_DISH_INGREDIENTS,
        "DISH",
        UUID.randomUUID(),
        "{}",
        attempts,
        maxAttempts,
        "worker-a",
        Instant.now(),
        "key");
  }

  private static final class RecordingRepository implements BackgroundJobRepositoryPort {

    private final List<String> dead = new ArrayList<>();
    private final List<Duration> retries = new ArrayList<>();
    private int succeeded;

    @Override
    public EnqueueResult enqueue(NewBackgroundJob job) {
      throw new UnsupportedOperationException();
    }

    @Override
    public List<ClaimedJob> claimBatch(String workerId, int batchSize, Duration lease) {
      throw new UnsupportedOperationException();
    }

    @Override
    public boolean markSucceeded(UUID jobId, String workerId) {
      succeeded++;
      return true;
    }

    @Override
    public boolean scheduleRetry(
        UUID jobId, String workerId, Duration delay, String errorCode, String safeMessage) {
      retries.add(delay);
      return true;
    }

    @Override
    public boolean markDead(UUID jobId, String workerId, String errorCode, String safeMessage) {
      dead.add(errorCode);
      return true;
    }

    @Override
    public boolean extendLease(UUID jobId, String workerId, Duration lease) {
      throw new UnsupportedOperationException();
    }

    @Override
    public int markExpiredLeasesDead() {
      throw new UnsupportedOperationException();
    }
  }
}
