#!/bin/sh
set -eu

export PREPPARI_RUNTIME_MODE=worker
export PREPPARI_RUN_MIGRATIONS=false

if [ -z "${SPRING_PROFILES_ACTIVE:-}" ]; then
  export SPRING_PROFILES_ACTIVE=worker
else
  case ",${SPRING_PROFILES_ACTIVE}," in
    *,worker,*) ;;
    *) export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE},worker" ;;
  esac
fi

exec java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -Djava.security.egd=file:/dev/urandom \
  -jar /app/app.jar
