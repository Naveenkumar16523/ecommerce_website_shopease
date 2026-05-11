import os

class Config:
    # To generate a secure key: python -c 'import secrets; print(secrets.token_urlsafe(50))'
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("CRITICAL ERROR: SECRET_KEY environment variable is missing. "
                         "For security, the application cannot start without a secret key.")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    # Default local dev origins
    ALLOWED_ORIGINS = [
        "http://localhost:5000", 
        "http://127.0.0.1:5000", 
        "http://localhost:5173", 
        "http://localhost:3000"
    ]

class ProductionConfig(Config):
    DEBUG = False
    @property
    def ALLOWED_ORIGINS(self):
        origins = os.getenv("ALLOWED_ORIGINS")
        if not origins:
            raise RuntimeError("CRITICAL ERROR: ALLOWED_ORIGINS env var is missing in production!")
        return [o.strip() for o in origins.split(",")]

class TestingConfig(Config):
    TESTING = True
    ALLOWED_ORIGINS = ["http://localhost"]

def get_config():
    env = os.getenv("FLASK_ENV", "development").lower()
    if env == "production":
        return ProductionConfig()
    if env == "testing":
        return TestingConfig()
    return DevelopmentConfig()
