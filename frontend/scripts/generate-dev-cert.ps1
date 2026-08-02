param(
  [string]$LanIp = "192.168.160.124"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$CertDir = Join-Path $ProjectRoot "certs"
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("cineverse-cert-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $CertDir, $TempDir | Out-Null
try {
  $ExtFile = Join-Path $TempDir "server-ext.cnf"
  @"
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$LanIp
"@ | Set-Content -Encoding ascii $ExtFile

  & openssl genrsa -out (Join-Path $CertDir "cineverse-local-ca.key") 3072
  & openssl req -x509 -new -nodes -key (Join-Path $CertDir "cineverse-local-ca.key") -sha256 -days 3650 -subj "/C=VN/O=CINEVERSE Local Development/CN=CINEVERSE Local CA" -addext "basicConstraints=critical,CA:TRUE,pathlen:0" -addext "keyUsage=critical,keyCertSign,cRLSign" -addext "subjectKeyIdentifier=hash" -out (Join-Path $CertDir "cineverse-local-ca.crt")
  & openssl genrsa -out (Join-Path $CertDir "cineverse-local-server.key") 2048
  & openssl req -new -key (Join-Path $CertDir "cineverse-local-server.key") -subj "/C=VN/O=CINEVERSE Local Development/CN=localhost" -out (Join-Path $TempDir "server.csr")
  & openssl x509 -req -in (Join-Path $TempDir "server.csr") -CA (Join-Path $CertDir "cineverse-local-ca.crt") -CAkey (Join-Path $CertDir "cineverse-local-ca.key") -CAcreateserial -out (Join-Path $CertDir "cineverse-local-server.crt") -days 825 -sha256 -extfile $ExtFile
  Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $CertDir "cineverse-local-ca.srl")
  Write-Host "Generated local development certificate for localhost, 127.0.0.1 and $LanIp"
} finally {
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $TempDir
}
