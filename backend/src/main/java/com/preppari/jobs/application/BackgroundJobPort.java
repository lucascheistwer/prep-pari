package com.preppari.jobs.application;

public interface BackgroundJobPort {

  EnqueueResult enqueue(NewBackgroundJob job);
}
