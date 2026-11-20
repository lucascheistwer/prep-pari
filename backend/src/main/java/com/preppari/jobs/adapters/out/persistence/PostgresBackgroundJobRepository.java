package com.preppari.jobs.adapters.out.persistence;

import com.preppari.jobs.application.BackgroundJobRepositoryPort;
import com.preppari.jobs.application.ClaimedJob;
import com.preppari.jobs.application.EnqueueResult;
import com.preppari.jobs.application.JobErrorCodes;
import com.preppari.jobs.application.JobErrorMessages;
import com.preppari.jobs.application.NewBackgroundJob;
import com.preppari.jobs.domain.JobType;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public class PostgresBackgroundJobRepository implements BackgroundJobRepositoryPort {

  private static final int MAX_BATCH = 100;

  private static final String INSERT =
      """
      INSERT INTO background_job (
          id, household_id, job_type, aggregate_type, aggregate_id, payload,
          status, priority, attempts, max_attempts, available_at, idempotency_key,
          retry_of_job_id, created_at, updated_at
      ) VALUES (
          ?, ?, ?, ?, ?, CAST(? AS jsonb),
          'PENDING', ?, 0, ?, now() + (? * interval '1 millisecond'), ?,
          ?, now(), now()
      )
      ON CONFLICT (idempotency_key) DO NOTHING
      """;

  private static final String CLAIM_SQL =
      """
      WITH candidates AS (
          SELECT id
          FROM background_job
          WHERE attempts < max_attempts
            AND (
              (status = 'PENDING' AND available_at <= now())
              OR (status = 'PROCESSING' AND locked_until < now())
            )
          ORDER BY priority DESC, available_at ASC, created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT __BATCH__
      )
      UPDATE background_job AS job
      SET status = 'PROCESSING',
          attempts = job.attempts + 1,
          locked_by = ?,
          locked_until = now() + (? * interval '1 millisecond'),
          started_at = COALESCE(job.started_at, now()),
          updated_at = now()
      FROM candidates
      WHERE job.id = candidates.id
      RETURNING job.id, job.household_id, job.job_type, job.aggregate_type, job.aggregate_id,
                job.payload::text AS payload_json, job.attempts, job.max_attempts, job.locked_by,
                job.locked_until, job.idempotency_key
      """;

  private final JdbcTemplate jdbc;

  public PostgresBackgroundJobRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public EnqueueResult enqueue(NewBackgroundJob job) {
    UUID id = UUID.randomUUID();
    try {
      int inserted =
          jdbc.update(
              INSERT,
              ps -> {
                ps.setObject(1, id);
                ps.setObject(2, job.householdId());
                ps.setString(3, job.jobType().name());
                ps.setString(4, job.aggregateType().trim());
                ps.setObject(5, job.aggregateId());
                ps.setString(6, job.payloadJson());
                ps.setInt(7, job.priority());
                ps.setInt(8, job.maxAttempts());
                ps.setLong(9, job.availableIn().toMillis());
                ps.setString(10, job.idempotencyKey());
                if (job.retryOfJobId() == null) {
                  ps.setNull(11, Types.OTHER);
                } else {
                  ps.setObject(11, job.retryOfJobId());
                }
              });
      if (inserted == 1) {
        return new EnqueueResult(id, true);
      }
    } catch (DataAccessException ex) {
      if (isPayloadError(ex)) {
        throw new IllegalArgumentException("El payload debe ser un objeto JSON", ex);
      }
      throw ex;
    }
    UUID existing =
        jdbc.queryForObject(
            "SELECT id FROM background_job WHERE idempotency_key = ?",
            UUID.class,
            job.idempotencyKey());
    return new EnqueueResult(existing, false);
  }

  @Override
  public List<ClaimedJob> claimBatch(String workerId, int batchSize, Duration lease) {
    requireWorkerId(workerId);
    if (batchSize < 1 || batchSize > MAX_BATCH) {
      throw new IllegalArgumentException("batchSize fuera de rango");
    }
    requirePositive(lease, "lease");
    String sql = CLAIM_SQL.replace("__BATCH__", Integer.toString(batchSize));
    return jdbc.execute(
        (ConnectionCallback<List<ClaimedJob>>)
            connection -> queryClaim(connection, sql, workerId, lease.toMillis()));
  }

  @Override
  public boolean markSucceeded(UUID jobId, String workerId) {
    requireWorkerId(workerId);
    int updated =
        jdbc.update(
            """
            UPDATE background_job
            SET status = 'SUCCEEDED',
                locked_by = NULL,
                locked_until = NULL,
                completed_at = now(),
                updated_at = now(),
                last_error_code = NULL,
                last_error_message = NULL
            WHERE id = ? AND locked_by = ? AND status = 'PROCESSING'
            """,
            jobId,
            workerId);
    return updated == 1;
  }

  @Override
  public boolean scheduleRetry(
      UUID jobId, String workerId, Duration delay, String errorCode, String safeMessage) {
    requireWorkerId(workerId);
    if (delay == null || delay.isNegative()) {
      throw new IllegalArgumentException("delay inválido");
    }
    int updated =
        jdbc.update(
            """
            UPDATE background_job
            SET status = 'PENDING',
                available_at = now() + (? * interval '1 millisecond'),
                locked_by = NULL,
                locked_until = NULL,
                last_error_code = ?,
                last_error_message = ?,
                updated_at = now()
            WHERE id = ? AND locked_by = ? AND status = 'PROCESSING' AND attempts < max_attempts
            """,
            delay.toMillis(),
            boundCode(errorCode),
            JobErrorMessages.sanitize(safeMessage),
            jobId,
            workerId);
    return updated == 1;
  }

  @Override
  public boolean markDead(UUID jobId, String workerId, String errorCode, String safeMessage) {
    requireWorkerId(workerId);
    int updated =
        jdbc.update(
            """
            UPDATE background_job
            SET status = 'DEAD',
                locked_by = NULL,
                locked_until = NULL,
                completed_at = now(),
                updated_at = now(),
                last_error_code = ?,
                last_error_message = ?
            WHERE id = ? AND locked_by = ? AND status = 'PROCESSING'
            """,
            boundCode(errorCode),
            JobErrorMessages.sanitize(safeMessage),
            jobId,
            workerId);
    return updated == 1;
  }

  @Override
  public boolean extendLease(UUID jobId, String workerId, Duration lease) {
    requireWorkerId(workerId);
    requirePositive(lease, "lease");
    int updated =
        jdbc.update(
            """
            UPDATE background_job
            SET locked_until = now() + (? * interval '1 millisecond'),
                updated_at = now()
            WHERE id = ? AND locked_by = ? AND status = 'PROCESSING'
            """,
            lease.toMillis(),
            jobId,
            workerId);
    return updated == 1;
  }

  @Override
  public int markExpiredLeasesDead() {
    return jdbc.update(
        """
        UPDATE background_job
        SET status = 'DEAD',
            last_error_code = ?,
            last_error_message = ?,
            completed_at = now(),
            updated_at = now(),
            locked_by = NULL,
            locked_until = NULL
        WHERE status = 'PROCESSING'
          AND locked_until < now()
          AND attempts >= max_attempts
        """,
        JobErrorCodes.LEASE_EXHAUSTED,
        "El lease venció y se agotaron los intentos.");
  }

  private static List<ClaimedJob> queryClaim(
      Connection connection, String sql, String workerId, long leaseMillis) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, workerId);
      statement.setLong(2, leaseMillis);
      if (!statement.execute()) {
        return List.of();
      }
      try (ResultSet rows = statement.getResultSet()) {
        List<ClaimedJob> claimed = new ArrayList<>();
        while (rows.next()) {
          claimed.add(map(rows));
        }
        return claimed;
      }
    }
  }

  private static ClaimedJob map(ResultSet rows) throws SQLException {
    OffsetDateTime lockedUntil = rows.getObject("locked_until", OffsetDateTime.class);
    return new ClaimedJob(
        rows.getObject("id", UUID.class),
        rows.getObject("household_id", UUID.class),
        JobType.valueOf(rows.getString("job_type")),
        rows.getString("aggregate_type"),
        rows.getObject("aggregate_id", UUID.class),
        rows.getString("payload_json"),
        rows.getInt("attempts"),
        rows.getInt("max_attempts"),
        rows.getString("locked_by"),
        lockedUntil == null ? null : lockedUntil.toInstant(),
        rows.getString("idempotency_key"));
  }

  private static void requireWorkerId(String workerId) {
    if (workerId == null || workerId.isBlank() || workerId.length() > 120) {
      throw new IllegalArgumentException("workerId inválido");
    }
  }

  private static void requirePositive(Duration duration, String name) {
    if (duration == null || duration.isZero() || duration.isNegative()) {
      throw new IllegalArgumentException(name + " inválido");
    }
  }

  private static String boundCode(String errorCode) {
    if (errorCode == null || errorCode.isBlank()) {
      return JobErrorCodes.TRANSIENT;
    }
    String trimmed = errorCode.trim();
    return trimmed.length() <= 80 ? trimmed : trimmed.substring(0, 80);
  }

  private static boolean isPayloadError(DataAccessException exception) {
    Throwable current = exception;
    while (current != null) {
      if (current instanceof SQLException sql) {
        String state = sql.getSQLState();
        if ("22P02".equals(state) || "23514".equals(state)) {
          return true;
        }
      }
      current = current.getCause();
    }
    return false;
  }
}
