# Operations

Copy `.env.example` to `.env`, replace placeholders, provision PostgreSQL/dependencies, then run `cd server && npm run migrate`. Start with `./start.sh`.

Startup is non-mutating and fails closed on missing secrets/schema. Run `npm test` in `server`. The authoritative flow is non-diagnostic, records uncertainty/missing data, and requires independent clinician approval. EHR/FHIR, labs, imaging, devices, pharmacies, payers, and notifications are typed delivery records only until a separately configured adapter verifies them. This is not clinical validation or veterinary advice; configure consent, retention, incident response, and professional review locally.

The legacy seed drops demo tables and is guarded by `ALLOW_DESTRUCTIVE_DEMO_SEED=true`; use it only for an isolated disposable database.
