BEGIN;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS patient_id TEXT;
CREATE TABLE IF NOT EXISTS care_workflows (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT NOT NULL, patient_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'intake', version INTEGER NOT NULL DEFAULT 1, author_id TEXT NOT NULL, clinician_id TEXT,
 uncertainty TEXT NOT NULL DEFAULT 'unassessed', missing_fields JSONB NOT NULL DEFAULT '[]', non_diagnostic BOOLEAN NOT NULL DEFAULT TRUE, retention_class TEXT NOT NULL,
 follow_up_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key), UNIQUE(tenant_id,patient_id,id));
CREATE TABLE IF NOT EXISTS care_observations (id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, patient_id TEXT NOT NULL, workflow_id UUID NOT NULL, source_type TEXT NOT NULL, source_record_id TEXT NOT NULL, observed_at TIMESTAMPTZ NOT NULL, value JSONB NOT NULL, uncertainty TEXT NOT NULL, missing_fields JSONB NOT NULL DEFAULT '[]', consent_reference TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,source_type,source_record_id));
CREATE TABLE IF NOT EXISTS care_deliveries (id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, patient_id TEXT NOT NULL, workflow_id UUID NOT NULL, provider_type TEXT NOT NULL, idempotency_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','acknowledged','retrying','dead_letter')), attempt_count INTEGER NOT NULL DEFAULT 0, next_attempt_at TIMESTAMPTZ, receipt JSONB, last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,provider_type,idempotency_key));
CREATE TABLE IF NOT EXISTS care_evaluations (id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, fixture_key TEXT NOT NULL, calibration JSONB NOT NULL, contraindications JSONB NOT NULL, missing_data JSONB NOT NULL, bias_slice TEXT NOT NULL, escalation_expected BOOLEAN NOT NULL, actual JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,fixture_key));
CREATE TABLE IF NOT EXISTS care_workflow_audit (id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, patient_id TEXT NOT NULL, workflow_id UUID NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, from_status TEXT, to_status TEXT, record_version INTEGER NOT NULL, evidence JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION reject_care_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'care audit is append-only'; END $$;
DROP TRIGGER IF EXISTS care_audit_append_only ON care_workflow_audit;
CREATE TRIGGER care_audit_append_only BEFORE UPDATE OR DELETE ON care_workflow_audit FOR EACH ROW EXECUTE FUNCTION reject_care_audit_mutation();
COMMIT;
