#!/bin/bash
# Cloud sessions only. The headless browser used for app screenshots (scripts/screenshots.mjs)
# keeps its own certificate store, which starts empty, so pages that load
# Google Fonts fail with ERR_CERT_AUTHORITY_INVALID. Import the sandbox's
# CA bundle into that store so screenshots look the way the app really does.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

BUNDLE="${SSL_CERT_FILE:-/root/.ccr/ca-bundle.crt}"
NSSDB="$HOME/.pki/nssdb"
STAMP="$NSSDB/.imported-bundle.sha256"

if [ ! -f "$BUNDLE" ]; then
  echo "No CA bundle at $BUNDLE; browser certificate setup skipped."
  exit 0
fi

if ! command -v certutil >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y -q libnss3-tools >/dev/null 2>&1 \
    || { apt-get update -q >/dev/null && apt-get install -y -q libnss3-tools >/dev/null; }
fi

sum=$(sha256sum "$BUNDLE" | cut -d' ' -f1)
if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$sum" ]; then
  echo "Browser already trusts the sandbox certificates."
  exit 0
fi

mkdir -p "$NSSDB"
[ -f "$NSSDB/cert9.db" ] || certutil -N -d "sql:$NSSDB" --empty-password

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
awk -v d="$tmp" '/BEGIN CERT/{n++; f=sprintf("%s/%03d.pem", d, n); on=1}
  on{print > f} /END CERT/{on=0; close(f)}' "$BUNDLE"

added=0
for f in "$tmp"/*.pem; do
  # Name each certificate by its fingerprint, so re-imports never collide.
  fp=$(openssl x509 -noout -fingerprint -sha1 -in "$f" | cut -d= -f2 | tr -d :)
  certutil -A -d "sql:$NSSDB" -n "sandbox-$fp" -t "C,," -i "$f" && added=$((added + 1))
done
echo "$sum" > "$STAMP"
echo "Browser now trusts $added certificates from $BUNDLE."
