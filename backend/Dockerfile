FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21.0.9_10-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 preppari
WORKDIR /app
COPY --from=build /src/target/app.jar /app/app.jar
COPY docker/api-entrypoint.sh /app/entrypoint.sh
RUN chmod 755 /app/entrypoint.sh
USER preppari
ENV PORT=8080
EXPOSE 8080
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
    CMD sh -c 'curl -fsS "http://127.0.0.1:${PORT}/actuator/health"'
ENTRYPOINT ["/app/entrypoint.sh"]
