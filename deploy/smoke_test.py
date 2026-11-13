#!/usr/bin/env python3
"""Read-only smoke test for CrustCraft Artisan Bakery deployment."""

import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request


def request(opener, method, url, payload=None, headers=None):
    req_headers = {"Accept": "application/json, text/html"}
    if headers:
        req_headers.update(headers)
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        req_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with opener.open(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return resp.status, body
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace") if err.fp else ""
        return err.code, body


def run_smoke_test(base_url, smoke_email=None, smoke_password=None):
    base = base_url.rstrip("/")
    if not base:
        raise ValueError("Base URL is required")

    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    # 1. Health check (/api/health)
    status, body = request(opener, "GET", f"{base}/api/health")
    if status != 200:
        raise RuntimeError(f"FAIL /api/health: expected 200, got {status} ({body})")
    health_json = json.loads(body)
    if health_json.get("status") != "ok":
        raise RuntimeError(f"FAIL /api/health: unexpected payload {body}")
    print("PASS /api/health")

    # 2. Readiness check (/api/ready)
    status, body = request(opener, "GET", f"{base}/api/ready")
    if status != 200:
        raise RuntimeError(f"FAIL /api/ready: expected 200, got {status} ({body})")
    ready_json = json.loads(body)
    if ready_json.get("status") != "ready":
        raise RuntimeError(f"FAIL /api/ready: unexpected payload {body}")
    print("PASS /api/ready")

    # 3. Frontend root HTML (/)
    status, body = request(opener, "GET", f"{base}/")
    if status != 200 or "<html" not in body.lower():
        raise RuntimeError(f"FAIL /: expected 200 HTML page, got {status}")
    print("PASS /")

    # 4. Public bakery catalog (/api/catalog)
    status, body = request(opener, "GET", f"{base}/api/catalog")
    if status != 200:
        raise RuntimeError(f"FAIL /api/catalog: expected 200, got {status} ({body})")
    catalog_json = json.loads(body)
    items = catalog_json.get("data") if isinstance(catalog_json, dict) else catalog_json
    if not isinstance(items, list):
        raise RuntimeError(f"FAIL /api/catalog: expected list of items, got {body}")
    print("PASS /api/catalog")

    # 5. Optional read-only login check (lowest privilege account only)
    email = (smoke_email if smoke_email is not None else os.environ.get("SMOKE_EMAIL", "")).strip()
    password = (smoke_password if smoke_password is not None else os.environ.get("SMOKE_PASSWORD", "")).strip()

    if email and password:
        status, body = request(
            opener,
            "POST",
            f"{base}/api/auth/login",
            payload={"email": email, "password": password},
        )
        if status != 200:
            raise RuntimeError(f"FAIL /api/auth/login: expected 200, got {status} ({body})")
        login_json = json.loads(body)
        token = login_json.get("token") or (login_json.get("data") or {}).get("token")
        auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

        status, body = request(opener, "GET", f"{base}/api/auth/me", headers=auth_headers)
        if status != 200:
            raise RuntimeError(f"FAIL /api/auth/me: expected 200, got {status} ({body})")
        print("PASS login and authenticated /api/auth/me")

        status, body = request(opener, "POST", f"{base}/api/auth/logout", headers=auth_headers)
        if status not in (200, 204):
            raise RuntimeError(f"FAIL /api/auth/logout: expected 200/204, got {status} ({body})")
        print("PASS logout")
    else:
        print("SKIP login: optional smoke credentials not configured")


def main():
    base_url = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SERVICE_URL", "")
    if not base_url:
        print("Usage: python3 deploy/smoke_test.py <SERVICE_URL>", file=sys.stderr)
        sys.exit(2)
    try:
        run_smoke_test(base_url)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
