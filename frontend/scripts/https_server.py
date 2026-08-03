#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import posixpath
import ssl
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit

SHARED_KEYS = {
    "cineverse.users.v1",
    "cineverse.profile-security.dob-migration.v1",
    "cineverse.member-data.v1",
    "cineverse.ticket-registry.v1",
    "cineverse.qr-sequence.v1",
    "cineverse.staff-users.v1",
}


class SharedStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.lock = threading.RLock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self._write({})

    def _read(self) -> dict[str, str]:
        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            payload = {}
        if not isinstance(payload, dict):
            return {}
        return {str(key): str(value) for key, value in payload.items() if key in SHARED_KEYS and value is not None}

    def _write(self, data: dict[str, str]) -> None:
        temp_path = self.path.with_suffix(".tmp")
        temp_path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
        temp_path.replace(self.path)

    def snapshot(self) -> dict[str, str]:
        with self.lock:
            return self._read()

    def set_item(self, key: str, value: Any) -> None:
        if key not in SHARED_KEYS:
            raise KeyError(key)
        with self.lock:
            data = self._read()
            if value is None:
                data.pop(key, None)
            else:
                data[key] = str(value)
            self._write(data)


class CineverseHandler(SimpleHTTPRequestHandler):
    store: SharedStore

    def _is_private_static_path(self) -> bool:
        path = unquote(urlsplit(self.path).path).replace("\\", "/")
        normalized = "/" + posixpath.normpath("/" + path.lstrip("/")).lstrip("/")
        lowered = normalized.lower()
        parts = [part for part in lowered.split("/") if part]
        return (
            lowered.startswith("/storage/")
            or lowered.startswith("/scripts/")
            or lowered.endswith(".key")
            or any(part.startswith(".") for part in parts)
        )

    def _reject_private_path(self) -> None:
        self._json_response({"ok": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)

    def end_headers(self) -> None:
        if self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def _json_response(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0 or length > 2_000_000:
            return {}
        raw = self.rfile.read(length)
        try:
            value = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return {}
        return value if isinstance(value, dict) else {}

    def do_GET(self) -> None:  # noqa: N802
        if self._is_private_static_path():
            self._reject_private_path()
            return
        if self.path == "/api/storage/snapshot":
            self._json_response({"ok": True, "mode": "lan-shared", "data": self.store.snapshot()})
            return
        if self.path == "/api/health":
            self._json_response({"ok": True, "service": "cineverse-local-lan", "sharedKeys": sorted(SHARED_KEYS)})
            return
        super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802
        if self._is_private_static_path():
            self._reject_private_path()
            return
        super().do_HEAD()

    def do_PUT(self) -> None:  # noqa: N802
        if self.path != "/api/storage/item":
            self._json_response({"ok": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)
            return
        payload = self._read_json()
        key = str(payload.get("key", ""))
        if key not in SHARED_KEYS:
            self._json_response({"ok": False, "error": "Key is not shareable"}, HTTPStatus.BAD_REQUEST)
            return
        value = payload.get("value")
        if value is not None and not isinstance(value, str):
            self._json_response({"ok": False, "error": "Value must be a JSON string or null"}, HTTPStatus.BAD_REQUEST)
            return
        self.store.set_item(key, value)
        self._json_response({"ok": True, "key": key})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve CINEVERSE over local HTTPS with LAN shared storage")
    parser.add_argument("--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=9999, help="HTTPS port (default: 9999)")
    parser.add_argument("--cert", default="certs/cineverse-local-server.crt", help="TLS certificate path")
    parser.add_argument("--key", default="certs/cineverse-local-server.key", help="TLS private key path")
    parser.add_argument("--store", default="storage/cineverse-shared-store.json", help="Shared JSON datastore path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(__file__).resolve().parent.parent
    os.chdir(project_root)
    cert_path = (project_root / args.cert).resolve()
    key_path = (project_root / args.key).resolve()
    store_path = (project_root / args.store).resolve()
    if not cert_path.is_file() or not key_path.is_file():
        raise SystemExit("Missing TLS files. Regenerate certificates before starting the server.")

    shared_store = SharedStore(store_path)
    CineverseHandler.store = shared_store
    server = ThreadingHTTPServer((args.host, args.port), CineverseHandler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=str(cert_path), keyfile=str(key_path))
    server.socket = context.wrap_socket(server.socket, server_side=True)

    print("CINEVERSE local HTTPS + LAN shared storage server")
    print(f"Project root : {project_root}")
    print(f"Shared store : {store_path}")
    print(f"Local URL    : https://localhost:{args.port}/")
    print(f"LAN URL      : https://192.168.160.124:{args.port}/")
    print(f"Admin portal : https://192.168.160.124:{args.port}/admin.html")
    print("Stop server  : Ctrl+C")
    server.serve_forever()


if __name__ == "__main__":
    main()
