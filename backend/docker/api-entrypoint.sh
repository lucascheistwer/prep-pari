#!/bin/sh
set -eu

export PREPPARI_RUNTIME_MODE=api
export PORT="${PORT:-8080}"

exec java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -Djava.security.egd=file:/dev/urandom \
  -jar /app/app.jar
