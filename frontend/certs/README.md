# CINEVERSE Local HTTPS Certificates

These TLS files are for **local development and LAN testing only**. Do not reuse them for a public deployment.

The bundled server certificate is issued for:

- `localhost`
- `127.0.0.1`
- `192.168.160.124`

Install `cineverse-local-ca.crt` as a trusted local Certificate Authority on each testing device before opening the LAN URL.

The packaged server private key is provided only so the local demo can start immediately. Keep it local. Never publish it or reuse it outside this development environment.

If the laptop LAN IP changes, regenerate a fresh local CA and server certificate on your own machine:

```bash
scripts/generate-dev-cert.sh 192.168.160.124
```

or on Windows:

```bat
scripts\regenerate-dev-cert.bat 192.168.160.124
```

After regeneration, reinstall the new `cineverse-local-ca.crt` on every testing device. The generated CA private key remains local on your machine and must not be shared.
