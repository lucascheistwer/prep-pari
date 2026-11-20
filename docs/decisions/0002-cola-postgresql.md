# Cola durable en PostgreSQL

Estado: aceptada.

`background_job` es la cola. No hay RabbitMQ, Kafka, SQS ni Vercel Queues. Redis no guarda jobs.

El claim es una transacción corta: selecciona pendientes con `available_at` vencido, o procesando con `locked_until` vencido, con `FOR UPDATE SKIP LOCKED`, y recién ahí pasa la fila a `PROCESSING`, incrementa `attempts` y escribe el lease. La transacción termina antes de ejecutar un handler. En la Fase 0 no hay handlers de producto: un job reclamado sin handler pasa a `DEAD` con código `NO_HANDLER`.

Un error transitorio reprograma el job si todavía quedan intentos. La demora sale de `preppari.worker.retry-delays` (5 s, 30 s, 2 min, 10 min, 30 min) más un jitter de ±20 %. No está escrita en los handlers. Si `attempts` ya alcanzó `max_attempts`, el job pasa a `DEAD`. Un barrido hace lo mismo con leases vencidos que ya no pueden reclamarse.

`extendLease` existe y solo lo puede renovar el `locked_by` actual. El loop de la Fase 0 no lo llama porque no hay trabajo de red. Los handlers largos de la Fase 2 tienen que renovar el lease ellos.

La idempotencia es un unique sobre `idempotency_key`, también para jobs terminados. Un reintento pedido por el usuario será un job nuevo con otra clave y `retry_of_job_id`.

El worker hace polling de 2 s a 15 s, con jitter, y ante SIGTERM deja de reclamar. No hay busy loop. Cada proceso tiene un id propio (`PREPPARI_WORKER_ID` o un UUID). El heartbeat en `/tmp/preppari-worker-heartbeat` alimenta el healthcheck de Docker. No es un servidor HTTP: la documentación de Daemons dice que un `livenessProbe` HTTP sin servidor reinicia la instancia sin parar, así que `vercel.json` no declara probe.
