-- Cola durable de PrepPari. Una sola tabla para todos los tipos de job.
-- Las tablas de dominio (hogar, comidas, plan, lista) se agregan en la fase
-- que las implementa. household_id todavía no tiene FK: la tabla household
-- no existe hasta la Fase 1.

CREATE TABLE background_job (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL,
    job_type VARCHAR(64) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL,
    priority SMALLINT NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    available_at TIMESTAMPTZ NOT NULL,
    locked_by VARCHAR(120),
    locked_until TIMESTAMPTZ,
    idempotency_key VARCHAR(200) NOT NULL,
    last_error_code VARCHAR(80),
    last_error_message VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    retry_of_job_id UUID,
    CONSTRAINT uq_background_job_idempotency UNIQUE (idempotency_key),
    CONSTRAINT fk_background_job_retry_of
        FOREIGN KEY (retry_of_job_id) REFERENCES background_job (id),
    CONSTRAINT ck_background_job_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'DEAD')),
    CONSTRAINT ck_background_job_type
        CHECK (job_type IN ('GENERATE_DISH_INGREDIENTS', 'GENERATE_DISH_IMAGE')),
    CONSTRAINT ck_background_job_attempts
        CHECK (attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts),
    CONSTRAINT ck_background_job_priority
        CHECK (priority >= 0),
    CONSTRAINT ck_background_job_payload_object
        CHECK (jsonb_typeof(payload) = 'object')
);

COMMENT ON TABLE background_job IS
    'Cola durable. Redis no participa. Entrega at-least-once con claim SKIP LOCKED.';

-- Pendientes listos para reclamar, por prioridad y antigüedad.
CREATE INDEX idx_background_job_pending
    ON background_job (priority DESC, available_at ASC, created_at ASC)
    WHERE status = 'PENDING';

-- Leases vencidos que el worker puede recuperar o pasar a DEAD.
CREATE INDEX idx_background_job_processing_lease
    ON background_job (locked_until)
    WHERE status = 'PROCESSING';

CREATE INDEX idx_background_job_household_created
    ON background_job (household_id, created_at DESC);

CREATE INDEX idx_background_job_aggregate
    ON background_job (aggregate_type, aggregate_id);

CREATE INDEX idx_background_job_type
    ON background_job (job_type);
