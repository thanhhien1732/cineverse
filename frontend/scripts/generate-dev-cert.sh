#!/usr/bin/env sh
set -eu
LAN_IP="${1:-192.168.160.124}"
ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT_DIR/certs"
mkdir -p "$CERT_DIR"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cat > "$TMP_DIR/server-ext.cnf" <<EOF_INNER
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$LAN_IP
EOF_INNER

openssl genrsa -out "$CERT_DIR/cineverse-local-ca.key" 3072
openssl req -x509 -new -nodes -key "$CERT_DIR/cineverse-local-ca.key" -sha256 -days 3650 \
  -subj "/C=VN/O=CINEVERSE Local Development/CN=CINEVERSE Local CA" \
  -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
  -addext "keyUsage=critical,keyCertSign,cRLSign" \
  -addext "subjectKeyIdentifier=hash" \
  -out "$CERT_DIR/cineverse-local-ca.crt"
openssl genrsa -out "$CERT_DIR/cineverse-local-server.key" 2048
openssl req -new -key "$CERT_DIR/cineverse-local-server.key" \
  -subj "/C=VN/O=CINEVERSE Local Development/CN=localhost" \
  -out "$TMP_DIR/server.csr"
openssl x509 -req -in "$TMP_DIR/server.csr" \
  -CA "$CERT_DIR/cineverse-local-ca.crt" \
  -CAkey "$CERT_DIR/cineverse-local-ca.key" \
  -CAcreateserial -out "$CERT_DIR/cineverse-local-server.crt" \
  -days 825 -sha256 -extfile "$TMP_DIR/server-ext.cnf"
rm -f "$CERT_DIR/cineverse-local-ca.srl"
chmod 600 "$CERT_DIR"/*.key
printf 'Generated local development certificate for localhost, 127.0.0.1 and %s\n' "$LAN_IP"
