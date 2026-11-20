package com.preppari.jobs.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.preppari.dish.adapters.out.ai.FakeDishEnrichmentAdapter;
import com.preppari.dish.application.port.out.DishEnrichmentPort;
import com.preppari.jobs.application.BackgroundJobRepositoryPort;
import com.preppari.jobs.application.ClaimedJob;
import com.preppari.jobs.application.EnqueueResult;
import com.preppari.jobs.application.NewBackgroundJob;
import com.preppari.jobs.domain.JobType;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
@ActiveProfiles("test")
class BackgroundJobRepositoryTest {

  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16.16-alpine");

  static {
    POSTGRES.start();
  }

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
  }

  @Autowired private BackgroundJobRepositoryPort repository;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private DataSource dataSource;
  @Autowired private DishEnrichmentPort enrichment;

  @BeforeEach
  void clean() {
    jdbc.update("DELETE FROM background_job");
  }

  @Test
  void contextUsesTheFakeAiProvider() {
    assertThat(enrichment).isInstanceOf(FakeDishEnrichmentAdapter.class);
  }

  @Test
  void idempotencyKeyInsertsASingleJob() {
    NewBackgroundJob job = pending("misma-clave");

    EnqueueResult first = repository.enqueue(job);
    EnqueueResult second = repository.enqueue(job);

    assertThat(first.created()).isTrue();
    assertThat(second.created()).isFalse();
    assertThat(second.jobId()).isEqualTo(first.jobId());
    assertThat(countJobs()).isEqualTo(1);
  }

  @Test
  void rejectsAPayloadThatIsNotAJsonObject() {
    assertThatThrownBy(() -> repository.enqueue(pendingWithPayload("[]")))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> repository.enqueue(pendingWithPayload("no-es-json")))
        .isInstanceOf(IllegalArgumentException.class);
    assertThat(countJobs()).isZero();
  }

  @Test
  void claimsTheHighestPriorityFirst() {
    UUID low = enqueue(0);
    UUID high = enqueue(10);

    List<ClaimedJob> claimed = repository.claimBatch("worker-a", 1, Duration.ofMinutes(1));

    assertThat(claimed).extracting(ClaimedJob::id).containsExactly(high);
    assertThat(statusOf(low)).isEqualTo("PENDING");
    assertThat(statusOf(high)).isEqualTo("PROCESSING");
  }

  @Test
  void doesNotClaimAJobThatIsNotAvailableYet() {
    repository.enqueue(job(Duration.ofHours(1), 0, "mas-tarde-" + UUID.randomUUID(), "{}"));

    assertThat(repository.claimBatch("worker-a", 5, Duration.ofMinutes(1))).isEmpty();
  }

  @Test
  void skipLockedLeavesARowHeldByAnotherTransaction() throws Exception {
    UUID locked = enqueue(0);
    UUID free = enqueue(0);
    ExecutorService pool = Executors.newSingleThreadExecutor();
    try (Connection connection = dataSource.getConnection()) {
      connection.setAutoCommit(false);
      try (PreparedStatement statement =
          connection.prepareStatement("SELECT id FROM background_job WHERE id = ? FOR UPDATE")) {
        statement.setObject(1, locked);
        try (ResultSet rows = statement.executeQuery()) {
          assertThat(rows.next()).isTrue();
        }
        Future<List<ClaimedJob>> future =
            pool.submit(() -> repository.claimBatch("worker-b", 10, Duration.ofSeconds(30)));
        List<ClaimedJob> claimed = future.get(10, TimeUnit.SECONDS);
        assertThat(claimed).extracting(ClaimedJob::id).containsExactly(free);
      } finally {
        connection.rollback();
      }
    } finally {
      pool.shutdownNow();
    }

    assertThat(repository.claimBatch("worker-c", 10, Duration.ofSeconds(30)))
        .extracting(ClaimedJob::id)
        .containsExactly(locked);
  }

  @Test
  void twoWorkersNeverClaimTheSameJob() throws Exception {
    Set<UUID> inserted = new HashSet<>();
    for (int i = 0; i < 20; i++) {
      inserted.add(enqueue(0));
    }
    ExecutorService pool = Executors.newFixedThreadPool(2);
    CountDownLatch start = new CountDownLatch(1);
    try {
      Future<List<ClaimedJob>> first =
          pool.submit(
              () -> {
                start.await();
                return repository.claimBatch("worker-a", 20, Duration.ofMinutes(1));
              });
      Future<List<ClaimedJob>> second =
          pool.submit(
              () -> {
                start.await();
                return repository.claimBatch("worker-b", 20, Duration.ofMinutes(1));
              });
      start.countDown();
      List<UUID> ids = new ArrayList<>();
      ids.addAll(first.get(15, TimeUnit.SECONDS).stream().map(ClaimedJob::id).toList());
      ids.addAll(second.get(15, TimeUnit.SECONDS).stream().map(ClaimedJob::id).toList());
      assertThat(ids)
          .hasSize(20)
          .doesNotHaveDuplicates()
          .containsExactlyInAnyOrderElementsOf(inserted);
    } finally {
      pool.shutdownNow();
    }
  }

  @Test
  void expiredLeaseCanBeClaimedAgainUntilAttemptsRunOut() {
    UUID id = enqueue(0);
    ClaimedJob first = repository.claimBatch("worker-a", 1, Duration.ofMinutes(1)).getFirst();
    assertThat(first.attempts()).isEqualTo(1);
    jdbc.update(
        "UPDATE background_job SET locked_until = now() - interval '1 second' WHERE id = ?", id);
    assertThat(repository.markExpiredLeasesDead()).isZero();

    ClaimedJob recovered = repository.claimBatch("worker-b", 1, Duration.ofMinutes(1)).getFirst();

    assertThat(recovered.id()).isEqualTo(id);
    assertThat(recovered.lockedBy()).isEqualTo("worker-b");
    assertThat(recovered.attempts()).isEqualTo(2);
  }

  @Test
  void exhaustedExpiredLeaseBecomesDeadAndIsNotClaimed() {
    UUID id = enqueue(0);
    jdbc.update(
        """
        UPDATE background_job
        SET status = 'PROCESSING', attempts = max_attempts, locked_by = 'viejo',
            locked_until = now() - interval '1 minute'
        WHERE id = ?
        """,
        id);

    assertThat(repository.claimBatch("worker-b", 5, Duration.ofMinutes(1))).isEmpty();
    assertThat(repository.markExpiredLeasesDead()).isEqualTo(1);
    assertThat(statusOf(id)).isEqualTo("DEAD");
    assertThat(repository.claimBatch("worker-c", 5, Duration.ofMinutes(1))).isEmpty();
  }

  @Test
  void onlyTheLockOwnerCanExtendTheLeaseOrFinishTheJob() {
    UUID id = enqueue(0);
    repository.claimBatch("worker-a", 1, Duration.ofMinutes(1));

    assertThat(repository.extendLease(id, "worker-b", Duration.ofMinutes(2))).isFalse();
    assertThat(repository.markSucceeded(id, "worker-b")).isFalse();
    assertThat(statusOf(id)).isEqualTo("PROCESSING");
    assertThat(repository.extendLease(id, "worker-a", Duration.ofMinutes(2))).isTrue();
    assertThat(repository.markSucceeded(id, "worker-a")).isTrue();
    assertThat(statusOf(id)).isEqualTo("SUCCEEDED");
  }

  @Test
  void retryWaitsUntilTheDelayElapses() {
    UUID id = enqueue(0);
    repository.claimBatch("worker-a", 1, Duration.ofMinutes(1));

    assertThat(repository.scheduleRetry(id, "worker-b", Duration.ofHours(1), "TRANSIENT", "no"))
        .isFalse();
    assertThat(
            repository.scheduleRetry(
                id, "worker-a", Duration.ofHours(1), "TRANSIENT", "rate limit"))
        .isTrue();
    assertThat(repository.claimBatch("worker-c", 5, Duration.ofMinutes(1))).isEmpty();

    jdbc.update(
        "UPDATE background_job SET available_at = now() - interval '1 second' WHERE id = ?", id);
    ClaimedJob again = repository.claimBatch("worker-c", 5, Duration.ofMinutes(1)).getFirst();

    assertThat(again.id()).isEqualTo(id);
    assertThat(again.attempts()).isEqualTo(2);
  }

  private UUID enqueue(int priority) {
    return repository
        .enqueue(job(Duration.ZERO, priority, "key-" + UUID.randomUUID(), "{}"))
        .jobId();
  }

  private NewBackgroundJob pending(String key) {
    return job(Duration.ZERO, 0, key, "{}");
  }

  private NewBackgroundJob pendingWithPayload(String payload) {
    return job(Duration.ZERO, 0, "key-" + UUID.randomUUID(), payload);
  }

  private NewBackgroundJob job(Duration availableIn, int priority, String key, String payload) {
    return new NewBackgroundJob(
        UUID.randomUUID(),
        JobType.GENERATE_DISH_INGREDIENTS,
        "DISH",
        UUID.randomUUID(),
        payload,
        key,
        priority,
        5,
        availableIn,
        null);
  }

  private int countJobs() {
    Integer count = jdbc.queryForObject("SELECT count(*) FROM background_job", Integer.class);
    return count == null ? 0 : count;
  }

  private String statusOf(UUID id) {
    return jdbc.queryForObject("SELECT status FROM background_job WHERE id = ?", String.class, id);
  }
}
