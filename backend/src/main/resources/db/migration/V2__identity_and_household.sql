-- Identidad y hogares. El token de invitación se guarda hasheado.
-- household_id de la cola pasa a referenciar household.

CREATE TABLE app_user (
    id UUID PRIMARY KEY,
    external_subject VARCHAR(320) NOT NULL,
    email VARCHAR(320),
    display_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_app_user_external_subject UNIQUE (external_subject),
    CONSTRAINT ck_app_user_display_name CHECK (char_length(btrim(display_name)) > 0)
);

CREATE TABLE household (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_household_created_by FOREIGN KEY (created_by) REFERENCES app_user (id),
    CONSTRAINT ck_household_name CHECK (char_length(btrim(name)) BETWEEN 1 AND 80)
);

CREATE TABLE household_membership (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_membership_household FOREIGN KEY (household_id) REFERENCES household (id),
    CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT uq_membership_household_user UNIQUE (household_id, user_id),
    CONSTRAINT ck_membership_role CHECK (role IN ('OWNER', 'MEMBER')),
    CONSTRAINT ck_membership_status CHECK (status IN ('ACTIVE', 'REMOVED'))
);

CREATE INDEX idx_household_membership_user_status
    ON household_membership (user_id, status);

CREATE TABLE household_invitation (
    id UUID PRIMARY KEY,
    household_id UUID NOT NULL,
    email VARCHAR(320),
    token_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_invitation_household FOREIGN KEY (household_id) REFERENCES household (id),
    CONSTRAINT fk_invitation_created_by FOREIGN KEY (created_by) REFERENCES app_user (id),
    CONSTRAINT uq_invitation_token_hash UNIQUE (token_hash),
    CONSTRAINT ck_invitation_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
    CONSTRAINT ck_invitation_token_hash CHECK (token_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_invitation_household_status
    ON household_invitation (household_id, status);

ALTER TABLE background_job
    ADD CONSTRAINT fk_background_job_household
    FOREIGN KEY (household_id) REFERENCES household (id);
