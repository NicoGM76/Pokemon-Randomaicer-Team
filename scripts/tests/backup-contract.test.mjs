import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const backup = readFileSync('scripts/db/backup-to-drive.sh','utf8');
const restore = readFileSync('scripts/db/restore-check.sh','utf8');
const workflow = readFileSync('.github/workflows/backup-postgres-drive.yml','utf8');

test('backup is a public-schema-only PostgreSQL 17 logical export, not a full Supabase project backup', () => {
  assert.match(backup, /postgres:17/);
  assert.match(backup, /--schema=public/);
  assert.match(backup, /--format=custom/);
  assert.match(backup, /pg_restore -l/);
});

test('encryption precedes upload; never publish unencrypted dump', () => {
  const encryptAt = backup.indexOf('age --recipient ');
  const uploadAt = backup.indexOf('rclone copy "$work/encrypted"');
  assert.ok(encryptAt > 0 && uploadAt > encryptAt);
  assert.match(backup, /rm -f "\$dump"/);
  assert.match(backup, /rclone check.*--download/);
  assert.doesNotMatch(backup, /rclone (sync|purge|delete) /);
});

test('scheduled workflow fails closed without GitHub secrets', () => {
  assert.match(workflow, /secrets\.PA_BACKUP_DATABASE_URL/);
  assert.match(workflow, /secrets\.PA_BACKUP_RCLONE_CONFIG_B64/);
  assert.match(workflow, /vars\.PA_BACKUP_AGE_RECIPIENT/);
  assert.match(workflow, /Backup NOT configured/);
  assert.doesNotMatch(workflow, /pull_request:/);
});

test('restore check requires an offline private key and isolated PostgreSQL', () => {
  assert.match(restore, /AGE_IDENTITY_FILE/);
  assert.match(restore, /age --decrypt --identity/);
  assert.match(restore, /postgres:17/);
  assert.match(restore, /--exit-on-error --single-transaction/);
  assert.match(restore, /relrowsecurity/);
});
