import pytest
import time
from app import app, limiter
from db_config import get_db

@pytest.fixture
def client():
    app.config['TESTING'] = True
    # Ensure limiter is in memory for tests
    app.config['RATELIMIT_STORAGE_URI'] = "memory://"
    limiter.enabled = True
    with app.test_client() as client:
        # Clear rate limits before each test
        limiter.clear()
        yield client

def test_signup_rate_limit(client):
    """Verify signup blocks after 3 attempts per minute"""
    payload = {"name": "Test", "email": "test@example.com", "password": "pass"}
    
    # 3 allowed
    for _ in range(3):
        res = client.post('/api/signup', json=payload)
        assert res.status_code in [201, 409] # Success or already exists
    
    # 4th should block
    res = client.post('/api/signup', json=payload)
    assert res.status_code == 429
    assert "retry_after" in res.get_json()

def test_login_rate_limit(client):
    """Verify login blocks after 5 attempts per minute"""
    payload = {"email": "wrong@example.com", "password": "wrong"}
    
    # 5 allowed
    for _ in range(5):
        res = client.post('/api/login', json=payload)
        assert res.status_code == 401
    
    # 6th should block
    res = client.post('/api/login', json=payload)
    assert res.status_code == 429

def test_account_lockout(client):
    """Verify email-specific lockout after 10 failures"""
    email = "lockout@test.com"
    payload = {"email": email, "password": "wrong"}
    
    # We need to bypass the IP rate limit to test the DB lockout
    # So we'll mock the limiter for this test
    limiter.enabled = False 
    
    try:
        # 10 failures
        for _ in range(10):
            res = client.post('/api/login', json=payload)
            assert res.status_code == 401
            
        # 11th should be 423 Locked
        res = client.post('/api/login', json=payload)
        assert res.status_code == 423
        assert "Account Locked" in res.get_json()['error']
    finally:
        limiter.enabled = True

def test_lockout_reset_on_success(client):
    """Verify successful login resets failed attempt counter"""
    email = "reset@test.com"
    # Create user
    client.post('/api/signup', json={"name": "User", "email": email, "password": "correct"})
    
    limiter.enabled = False
    
    # 5 failures
    for _ in range(5):
        client.post('/api/login', json={"email": email, "password": "wrong"})
        
    # Check DB
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT attempts FROM login_attempts WHERE email = %s", (email,))
        assert cursor.fetchone()[0] == 5
        
    # Successful login
    client.post('/api/login', json={"email": email, "password": "correct"})
    
    # Check DB reset
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT attempts FROM login_attempts WHERE email = %s", (email,))
        assert cursor.fetchone()[0] == 0
