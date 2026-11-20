package com.preppari.jobs.adapters.in.worker;

import com.preppari.bootstrap.configuration.WorkerProperties;
import com.preppari.jobs.application.BackgroundJobHandler;
import com.preppari.jobs.application.BackgroundJobRepositoryPort;
import com.preppari.jobs.application.ClaimedJob;
import com.preppari.jobs.application.JobDispatcher;
import com.preppari.jobs.domain.JobType;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "preppari.runtime.mode", havingValue = "worker")
public class BackgroundJobWorker implements SmartLifecycle {

  private static final Logger log = LoggerFactory.getLogger(BackgroundJobWorker.class);

  private final BackgroundJobRepositoryPort repository;
  private final WorkerProperties properties;
  private final Map<JobType, BackgroundJobHandler> handlers;
  private final JobDispatcher dispatcher = new JobDispatcher();
  private final String workerId = resolveWorkerId();

  private volatile boolean running;
  private Thread thread;

  public BackgroundJobWorker(
      BackgroundJobRepositoryPort repository,
      WorkerProperties properties,
      List<BackgroundJobHandler> handlers) {
    this.repository = repository;
    this.properties = properties;
    this.handlers =
        handlers.stream()
            .collect(
                Collectors.toUnmodifiableMap(
                    BackgroundJobHandler::supportedType, Function.identity()));
    validate(properties);
  }

  @Override
  public void start() {
    if (running) {
      return;
    }
    running = true;
    thread =
        new Thread(
            () -> {
              try {
                loop();
              } catch (Throwable error) {
                log.error("El worker se detuvo por un error", error);
                System.exit(1);
              }
            },
            "preppari-job-worker");
    thread.setDaemon(false);
    thread.start();
    log.info(
        "Worker PrepPari iniciado. id={} batch={} lease={} handlers={}",
        workerId,
        properties.getBatchSize(),
        properties.getLease(),
        handlers.keySet());
  }

  @Override
  public void stop() {
    running = false;
    Thread current = thread;
    if (current == null) {
      return;
    }
    current.interrupt();
    try {
      current.join(properties.getShutdownTimeout().toMillis());
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
    }
    log.info("Worker PrepPari detenido. id={}", workerId);
  }

  @Override
  public boolean isRunning() {
    return running;
  }

  private void loop() {
    Duration idle = properties.getMinPollInterval();
    while (running) {
      beat();
      try {
        int swept = repository.markExpiredLeasesDead();
        if (swept > 0) {
          log.info("Jobs marcados DEAD por lease agotado: {}", swept);
        }
        List<ClaimedJob> batch =
            repository.claimBatch(workerId, properties.getBatchSize(), properties.getLease());
        if (batch.isEmpty()) {
          sleep(jitter(idle));
          idle = grow(idle);
          continue;
        }
        idle = properties.getMinPollInterval();
        log.info("Worker {} reclamó {} jobs", workerId, batch.size());
        for (ClaimedJob job : batch) {
          if (!running) {
            break;
          }
          try {
            dispatcher.dispatch(
                job,
                handlers.get(job.jobType()),
                repository,
                workerId,
                properties.getRetryDelays(),
                ThreadLocalRandom.current().nextDouble(-1d, 1d));
          } catch (RuntimeException ex) {
            log.error("No se pudo cerrar el job {}", job.id(), ex);
          }
        }
        sleep(jitter(properties.getMinPollInterval()));
      } catch (RuntimeException ex) {
        log.error("Error en el ciclo del worker", ex);
        sleep(properties.getMaxPollInterval());
      }
    }
  }

  private Duration grow(Duration current) {
    Duration next = current.multipliedBy(2);
    if (next.compareTo(properties.getMaxPollInterval()) > 0) {
      return properties.getMaxPollInterval();
    }
    return next;
  }

  private Duration jitter(Duration base) {
    double factor = 1d + (0.2d * ThreadLocalRandom.current().nextDouble(-1d, 1d));
    long millis = Math.max(1000L, Math.round(base.toMillis() * factor));
    return Duration.ofMillis(millis);
  }

  private void sleep(Duration duration) {
    if (!running) {
      return;
    }
    try {
      Thread.sleep(duration.toMillis());
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      running = false;
    }
  }

  private void beat() {
    try {
      Path path = Path.of(properties.getHeartbeatPath());
      Files.writeString(path, Instant.now().toString());
    } catch (IOException ex) {
      log.warn("No se pudo escribir el heartbeat del worker", ex);
    }
  }

  private static String resolveWorkerId() {
    String configured = System.getenv("PREPPARI_WORKER_ID");
    if (configured == null || configured.isBlank()) {
      return "worker-" + UUID.randomUUID();
    }
    return configured.trim();
  }

  private static void validate(WorkerProperties properties) {
    if (properties.getBatchSize() < 1 || properties.getBatchSize() > 100) {
      throw new IllegalStateException("preppari.worker.batch-size fuera de rango");
    }
    if (properties.getLease() == null
        || properties.getLease().compareTo(Duration.ofSeconds(5)) < 0) {
      throw new IllegalStateException("preppari.worker.lease debe ser de al menos 5 segundos");
    }
    if (properties.getMinPollInterval() == null
        || properties.getMinPollInterval().compareTo(Duration.ofSeconds(1)) < 0) {
      throw new IllegalStateException(
          "preppari.worker.min-poll-interval debe ser de al menos 1 segundo");
    }
    if (properties.getMaxPollInterval() == null
        || properties.getMaxPollInterval().compareTo(properties.getMinPollInterval()) < 0) {
      throw new IllegalStateException("preppari.worker.max-poll-interval es menor que el mínimo");
    }
    if (properties.getRetryDelays() == null || properties.getRetryDelays().isEmpty()) {
      throw new IllegalStateException("preppari.worker.retry-delays está vacío");
    }
  }
}
