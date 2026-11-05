#!/usr/bin/env bash
# Operator-only restore check: use offline AGE IDENTITY and an encrypted Drive export.
# Usage: bash scripts/db/restore-check.sh backup.dump.age manifest.json /path/to/age-key.txt
# Local Docker only, never connects to production. Do not store the age identity in CI.
set -Eeuo pipefail
umask 077
if [[ $# -ne 3 ]]; then
  echo "Usage: $0 BACKUP.dump.age BACKUP.manifest.json AGE_IDENTITY_FILE" >&2
  exit 2
fi
backup="$1"; manifest="$2"; identity="$3"
test -f "$backup" && test -f "$manifest" && test -f "$identity"
for command in docker age sha256sum node mktemp; do
  command -v "$command" >/dev/null || { echo "Missing $command" >&2; exit 2; }
done

tmp="$(mktemp -d)"
container="pa-restore-$$"
cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  rm -rf "$tmp"
}
trap cleanup EXIT

# Compare hashes from the generated manifest before and after decryption.
encrypted_sha="$(sha256sum "$backup" | cut -d ' ' -f 1)"
expected_encrypted="$(node -e 'console.log(require(process.argv[1]).encryptedSha256)' "$(realpath "$manifest")")"
if [[ "$encrypted_sha" != "$expected_encrypted" ]]; then
  echo "Encrypted ciphertext hash mismatch" >&2; exit 1
fi
age --decrypt --identity "$identity" --output "$tmp/restore.dump" "$backup"
plain_sha="$(sha256sum "$tmp/restore.dump" | cut -d ' ' -f 1)"
expected_plain="$(node -e 'console.log(require(process.argv[1]).plaintextSha256)' "$(realpath "$manifest")")"
if [[ "$plain_sha" != "$expected_plain" ]]; then
  echo "Decrypted pg_dump hash mismatch" >&2; exit 1
fi

docker run -d --rm --name "$container" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17 > /dev/null
for _ in {1..30}; do
  if docker exec "$container" pg_isready -U postgres -q; then break; fi
  sleep 1
done
docker exec "$container" pg_isready -U postgres -q
cat "$tmp/restore.dump" | docker exec -i "$container" \
  pg_restore --exit-on-error --single-transaction --no-owner --no-acl -U postgres -d postgres
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -Atc "
SELECT 'species=' || count(*) FROM public.pokemon_species;
DO \$\$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM pg_class c
    JOIN pg_namespace s ON s.oid = c.relnamespace
    WHERE s.nspname='public' AND c.relkind='r' AND c.relrowsecurity;
  IF n < 15 THEN RAISE EXCEPTION 'Expected at least 15 RLS-enabled public tables: %', n; END IF;
END
\$\$;
"
echo "RESTORE VERIFIED locally: hashes match; pg_restore succeeded; RLS catalog checked."
