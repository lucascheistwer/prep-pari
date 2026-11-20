package com.preppari.bootstrap.configuration;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "preppari.worker")
public class WorkerProperties {

  private int batchSize = 5;

  private Duration lease = Duration.ofMinutes(1);

  private Duration minPollInterval = Duration.ofSeconds(2);

  private Duration maxPollInterval = Duration.ofSeconds(15);

  private Duration shutdownTimeout = Duration.ofSeconds(20);

  private String heartbeatPath = "/tmp/preppari-worker-heartbeat";

  private List<Duration> retryDelays =
      new ArrayList<>(
          List.of(
              Duration.ofSeconds(5),
              Duration.ofSeconds(30),
              Duration.ofMinutes(2),
              Duration.ofMinutes(10),
              Duration.ofMinutes(30)));

  public int getBatchSize() {
    return batchSize;
  }

  public void setBatchSize(int batchSize) {
    this.batchSize = batchSize;
  }

  public Duration getLease() {
    return lease;
  }

  public void setLease(Duration lease) {
    this.lease = lease;
  }

  public Duration getMinPollInterval() {
    return minPollInterval;
  }

  public void setMinPollInterval(Duration minPollInterval) {
    this.minPollInterval = minPollInterval;
  }

  public Duration getMaxPollInterval() {
    return maxPollInterval;
  }

  public void setMaxPollInterval(Duration maxPollInterval) {
    this.maxPollInterval = maxPollInterval;
  }

  public Duration getShutdownTimeout() {
    return shutdownTimeout;
  }

  public void setShutdownTimeout(Duration shutdownTimeout) {
    this.shutdownTimeout = shutdownTimeout;
  }

  public String getHeartbeatPath() {
    return heartbeatPath;
  }

  public void setHeartbeatPath(String heartbeatPath) {
    this.heartbeatPath = heartbeatPath;
  }

  public List<Duration> getRetryDelays() {
    return retryDelays;
  }

  public void setRetryDelays(List<Duration> retryDelays) {
    this.retryDelays = retryDelays;
  }
}
