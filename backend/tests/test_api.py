import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.services.seed_service import seed_demo_data


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes tables and seeds data for testing session."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert "message" in json_data
    assert "PathForge AI" in json_data["message"]
    assert json_data["version"] == "1.0.0"


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert json_data["service"] == "pathforge-api"


def test_get_skills(client):
    response = client.get("/api/skills")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    first_skill = data[0]
    assert "name" in first_skill
    assert "current_level" in first_skill
    assert "required_level" in first_skill


def test_create_and_delete_skill(client):
    new_skill = {
        "name": "Transformer Architecture & Attention Mechanisms",
        "category": "Core AI",
        "current_level": 70.0,
        "required_level": 85.0,
        "status": "In Progress",
        "priority": "High",
        "description": "Multi-head self-attention and flash attention optimization."
    }
    create_res = client.post("/api/skills", json=new_skill)
    assert create_res.status_code == 201
    created = create_res.json()
    skill_id = created["id"]
    assert created["name"] == new_skill["name"]

    # Verify get by id
    get_res = client.get(f"/api/skills/{skill_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == skill_id

    # Clean up delete
    del_res = client.delete(f"/api/skills/{skill_id}")
    assert del_res.status_code == 204

    # Verify 404
    del_verify = client.get(f"/api/skills/{skill_id}")
    assert del_verify.status_code == 404


def test_get_courses(client):
    response = client.get("/api/courses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 6
    assert "provider" in data[0]


def test_get_projects(client):
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    assert "difficulty" in data[0]


def test_get_readiness(client):
    response = client.get("/api/readiness")
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "skill_coverage_score" in data
    assert "project_score" in data
    assert data["overall_score"] > 0


def test_get_company_matches(client):
    response = client.get("/api/company-matches")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    first_match = data[0]
    assert "company_name" in first_match
    assert "role_title" in first_match
    assert first_match["is_demo_data"] is True


def test_invalid_skill_id_returns_404(client):
    response = client.get("/api/skills/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
