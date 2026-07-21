import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

let pool;

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('Explicit bootstrap acknowledgement is required');
  }
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = (process.env.PROVISION_ADMIN_NAME || '').trim();
  if (!email || !name || password.length < 12) {
    throw new Error('Admin email, name, and a 12+ character password are required');
  }

  ({ default: pool } = await import('../db.js'));
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (email, password, name, role, tenant_id, patient_id)
     VALUES ($1, $2, $3, 'admin', $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       password = EXCLUDED.password,
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       tenant_id = COALESCE(users.tenant_id, EXCLUDED.tenant_id),
       patient_id = COALESCE(users.patient_id, EXCLUDED.patient_id)`,
    [email, passwordHash, name, crypto.randomUUID(), crypto.randomUUID()]
  );
  console.log('Administrator provisioned.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool?.end());
