#!/usr/bin/env bash
# PostgreSQL 17 logical backup (public schema only), encrypted before upload.
# Requires: DATABASE_URL, AGE_BACKUP_RECIPIENT and an rclone "pa-backups" Drive remote.
# NEVER logs the connection URL or uploads an unencrypted dump.
set -Eeuo pipefail
umask 077

for executable in docker age rclone sha256sum node mktemp; do
  command -v "$executable" >/dev/null || { echo "::error::Missing $executable" >&2; exit 2; }
done
: "${DATABASE_URL:?Database URL must be stored in GitHub Actions secrets}"
: "${AGE_BACKUP_RECIPIENT:?Missing age public recipient}"
: "${RCLONE_CONFIG:?Missing path to private rclone config}"

if [[ ! -f "$RCLONE_CONFIG" ]]; then echo "::error::Missing rclone configuration file" >&2; exit 2; fi
if [[ ! "$AGE_BACKUP_RECIPIENT" =~ ^age1[a-z0-9]{20,}$ ]]; then
  echo "::error::Invalid age recipient; expected an age1... public key" >&2; exit 2
fi
remote="${PA_BACKUP_REMOTE:-pa-backups}"
if [[ ! "$remote" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "::error::Invalid rclone remote" >&2; exit 2
fi

# Fail fast if OAuth failed or the configured remote isn't the dedicated backup folder.
folders="$(rclone lsf "${remote}:" --dirs-only --max-depth 1)"
for folder in daily weekly monthly manifests restore-tests; do
  if ! grep -Fxq "${folder}/" <<< "$folders"; then
    echo "::error::Expected dedicated Drive folder '${folder}/' was not found" >&2
    exit 2
  fi
done

work="$(mktemp -d)"
cleanup() { rm -rf "$work"; }
trap cleanup EXIT
timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
basename="pokemon-adventure-public-${timestamp}.dump"
mkdir -p "$work/encrypted" "$work/manifests"
dump="$work/$basename"
encrypted="$work/encrypted/${basename}.age"
manifest="$work/manifests/${basename}.manifest.json"

# GitHub-hosted Ubuntu runners already have Docker. Always use pg_dump 17 against
# Supabase PostgreSQL 17, even if the runner OS has another client version.
# Only public schema is included; auth/storage managed schemas are NOT backed up.
docker run --rm --network host -e DATABASE_URL postgres:17 \
  sh -ec 'pg_dump --schema=public --format=custom --no-owner --no-acl --dbname="$DATABASE_URL"' > "$dump"
test -s "$dump"
docker run --rm --network host -v "$work:/backup:ro" postgres:17 \
  pg_restore -l "/backup/$basename" >/dev/null

# Store backup ciphertext only. The age PRIVATE KEY is offline, never on GitHub.
age --recipient "$AGE_BACKUP_RECIPIENT" --output "$encrypted" "$dump"
test -s "$encrypted"
plaintext_sha="$(sha256sum "$dump" | cut -d ' ' -f 1)"
ciphertext_sha="$(sha256sum "$encrypted" | cut -d ' ' -f 1)"
ciphertext_bytes="$(stat -c %s "$encrypted")"
rm -f "$dump"

export BACKUP_TIMESTAMP="$timestamp" BACKUP_FILENAME="${basename}.age"
export BACKUP_PLAIN_SHA="$plaintext_sha" BACKUP_CIPHER_SHA="$ciphertext_sha"
export BACKUP_BYTES="$ciphertext_bytes"
node --input-type=module -e '
  import fs from "node:fs";
  const m = {
    schemaVersion: 1,
    createdAt: process.env.BACKUP_TIMESTAMP,
    database: "pokemon-adventure",
    scope: "PostgreSQL public schema only (includes policies and table data)",
    format: "pg_dump custom encrypted with age X25519",
    file: process.env.BACKUP_FILENAME,
    plaintextSha256: process.env.BACKUP_PLAIN_SHA,
    encryptedSha256: process.env.BACKUP_CIPHER_SHA,
    encryptedBytes: Number(process.env.BACKUP_BYTES),
    restoreVerified: false
  };
  fs.writeFileSync(process.argv[1], JSON.stringify(m, null, 2) + "\n", { mode: 0o600 });
' "$manifest"

# Never use sync or delete: old backup versions must survive new backups.
rclone copy "$work/encrypted" "${remote}:daily" --checkers=4 --transfers=1
rclone check "$work/encrypted" "${remote}:daily" --one-way --download --checkers=4
rclone copy "$work/manifests" "${remote}:manifests" --checkers=4 --transfers=1
rclone check "$work/manifests" "${remote}:manifests" --one-way --download --checkers=4

# Independent encrypted copies for weekly/monthly restore points.
if [[ "$(date -u +%u)" == "7" ]]; then
  rclone copyto "${remote}:daily/${basename}.age" "${remote}:weekly/${basename}.age"
fi
if [[ "$(date -u +%d)" == "01" ]]; then
  rclone copyto "${remote}:daily/${basename}.age" "${remote}:monthly/${basename}.age"
fi

echo "Encrypted public-schema backup uploaded and byte-compared: ${basename}.age"
echo "Restore verification remains PENDING until an independent restore test is performed."
