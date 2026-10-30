import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from schemas.common import create_envelope, APIResponseEnvelope, ErrorDetail

client = TestClient(app, raise_server_exceptions=False)


def test_01_health_backward_compatibility():
    """Verify /health returns lightweight status for backward compatibility."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
    assert "x-request-id" in response.headers
    assert "x-process-time-ms" in response.headers


def test_02_api_health_endpoint():
    """Verify /api/health returns comprehensive status, database connection, and timestamp."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["database"] == "connected"
    assert "version" in data
    assert "timestamp" in data
    assert "x-request-id" in response.headers


def test_03_request_id_correlation():
    """Verify client-supplied X-Request-ID is echoed back in response headers."""
    custom_id = "test-request-id-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom_id


def test_04_http_exception_envelope():
    """Verify HTTPException returns standardized error envelope with detail backward-compatibility."""
    response = client.get("/api/careers/non-existent-career-id-xyz")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["data"] is None
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]
    assert "detail" in data
    assert "meta" in data
    assert "request_id" in data["meta"]
    assert "timestamp" in data["meta"]


def test_05_validation_error_envelope():
    """Verify RequestValidationError (422) returns error envelope with validation details."""
    response = client.post("/api/auth/login", json={"invalid_field": "test"})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["details"] is not None
    assert "detail" in data
    assert "meta" in data
    assert "request_id" in data["meta"]


def test_06_envelope_middleware_opt_in():
    """Verify opting into envelope via X-Envelope: true wraps successful responses."""
    response = client.get("/", headers={"X-Envelope": "true"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["message"] == "PathForge AI API is running"
    assert data["error"] is None
    assert "meta" in data
    assert "timestamp" in data["meta"]
    assert "request_id" in data["meta"]
    assert "process_time_ms" in data["meta"]


def test_07_envelope_helper_utility():
    """Verify create_envelope utility generates valid schema-compliant dictionaries."""
    env = create_envelope(data={"foo": "bar"}, request_id="custom-req-999")
    assert env["success"] is True
    assert env["data"] == {"foo": "bar"}
    assert env["error"] is None
    assert env["meta"]["request_id"] == "custom-req-999"

    err_env = create_envelope(error=ErrorDetail(code="TEST_ERR", message="Test failed"), success=False)
    assert err_env["success"] is False
    assert err_env["error"]["code"] == "TEST_ERR"
    assert err_env["error"]["message"] == "Test failed"

