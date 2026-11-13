#!/usr/bin/env python3
"""Offline unit tests for deploy/smoke_test.py using a local mock HTTP server."""

import http.server
import importlib.util
import json
import pathlib
import threading
import unittest

SMOKE_PATH = pathlib.Path(__file__).resolve().parent.parent / "smoke_test.py"
spec = importlib.util.spec_from_file_location("smoke_test", SMOKE_PATH)
smoke_test = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke_test)


class MockCrustCraftHandler(http.server.BaseHTTPRequestHandler):
    ready_status = 200

    def log_message(self, format, *args):
        pass

    def _send_json(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            self._send_json(200, {"status": "ok"})
        elif self.path == "/api/ready":
            if self.__class__.ready_status == 200:
                self._send_json(200, {"status": "ready", "db": "connected"})
            else:
                self._send_json(503, {"status": "error", "db": "disconnected"})
        elif self.path == "/":
            html = b"<!doctype html><html><body>CrustCraft Bakery</body></html>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
        elif self.path == "/api/catalog":
            self._send_json(200, {"data": [{"id": 1, "name": "Artisan Butter Croissant", "price": 8500}]})
        elif self.path == "/api/auth/me":
            self._send_json(200, {"data": {"email": "customer1@test.com", "role": "CUSTOMER"}})
        else:
            self._send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/api/auth/login":
            self._send_json(200, {"token": "mock-jwt-token", "data": {"email": "customer1@test.com"}})
        elif self.path == "/api/auth/logout":
            self._send_json(200, {"status": "logged_out"})
        else:
            self._send_json(404, {"error": "not found"})


class SmokeTestUnitSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), MockCrustCraftHandler)
        cls.port = cls.server.server_address[1]
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        MockCrustCraftHandler.ready_status = 200

    def test_smoke_passes_without_login(self):
        smoke_test.run_smoke_test(self.base_url, smoke_email="", smoke_password="")

    def test_smoke_passes_with_login(self):
        smoke_test.run_smoke_test(
            self.base_url,
            smoke_email="customer1@test.com",
            smoke_password="mock-password",
        )

    def test_smoke_fails_when_ready_returns_503(self):
        MockCrustCraftHandler.ready_status = 503
        with self.assertRaises(RuntimeError):
            smoke_test.run_smoke_test(self.base_url, smoke_email="", smoke_password="")


if __name__ == "__main__":
    unittest.main()
