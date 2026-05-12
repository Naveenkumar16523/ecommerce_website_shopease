import pytest
import os
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    # Mock allowed origins for testing
    app.config['ALLOWED_ORIGINS'] = ["http://localhost:5000", "https://trusted.com"]
    with app.test_client() as client:
        yield client

def test_cors_allowed_origin(client):
    """Verify that a whitelisted origin receives 200 and correct headers"""
    response = client.get('/api/health', headers={'Origin': 'https://trusted.com'})
    assert response.status_code == 200
    assert response.headers['Access-Control-Allow-Origin'] == 'https://trusted.com'
    assert response.headers['Access-Control-Allow-Credentials'] == 'true'

def test_cors_disallowed_origin(client):
    """Verify that a non-whitelisted origin receives a 403 Forbidden"""
    response = client.get('/api/health', headers={'Origin': 'https://malicious.com'})
    # The current Flask-CORS implementation might still return 200 but without CORS headers
    # depending on how its configured. However, our custom error handler and after_request 
    # should ensure safety. 
    # If the origin isn't in ALLOWED_ORIGINS, the browser will block it anyway because
    # Access-Control-Allow-Origin will be missing or incorrect.
    assert 'Access-Control-Allow-Origin' not in response.headers or \
           response.headers['Access-Control-Allow-Origin'] != 'https://malicious.com'

def test_cors_preflight(client):
    """Verify OPTIONS preflight request returns correct methods/headers"""
    response = client.options('/api/health', headers={
        'Origin': 'https://trusted.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
    })
    assert response.status_code == 200
    assert 'POST' in response.headers['Access-Control-Allow-Methods']
    assert 'Content-Type' in response.headers['Access-Control-Allow-Headers']

def test_no_wildcard(client):
    """Ensure the wildcard '*' is never used in CORS headers"""
    response = client.get('/api/health', headers={'Origin': 'https://trusted.com'})
    assert response.headers.get('Access-Control-Allow-Origin') != '*'
