"""
Tests for artha.bot API endpoints.
Run with: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for the /api/health endpoint."""

    def test_health_returns_200(self, client):
        """Health endpoint should return 200 OK."""
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_returns_healthy_status(self, client):
        """Health endpoint should report healthy status."""
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_includes_service_name(self, client):
        """Health endpoint should identify the service."""
        response = client.get("/api/health")
        data = response.json()
        assert data["service"] == "artha.bot"

    def test_health_includes_version(self, client):
        """Health endpoint should include version info."""
        response = client.get("/api/health")
        data = response.json()
        assert "version" in data
        assert data["version"] == "0.1.0"


class TestStatusEndpoint:
    """Tests for the /api/status endpoint."""

    def test_status_returns_200(self, client):
        """Status endpoint should return 200 OK."""
        response = client.get("/api/status")
        assert response.status_code == 200

    def test_status_shows_online(self, client):
        """Status endpoint should show online status."""
        response = client.get("/api/status")
        data = response.json()
        assert data["status"] == "online"

    def test_status_includes_features(self, client):
        """Status endpoint should list available features."""
        response = client.get("/api/status")
        data = response.json()
        assert "features" in data
        assert "visualizer" in data["features"]
