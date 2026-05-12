import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY is not set in environment variables.")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_SECURE = False

class DevelopmentConfig(Config):
    DEBUG = True
    ALLOWED_ORIGINS = [
        "http://localhost:5000", 
        "http://127.0.0.1:5000",
        "http://localhost:3000", 
        "http://localhost:5173"
    ]

class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    
    @property
    def ALLOWED_ORIGINS(self):
        origins = os.environ.get('ALLOWED_ORIGINS')
        if not origins:
            raise RuntimeError("ALLOWED_ORIGINS environment variable is missing for production.")
        return [o.strip() for o in origins.split(',')]

class TestingConfig(Config):
    TESTING = True
    SESSION_COOKIE_SECURE = False
    ALLOWED_ORIGINS = ["http://localhost"]

def get_config():
    env = os.environ.get('FLASK_ENV', 'development').lower()
    if env == 'production':
        return ProductionConfig()
    if env == 'testing':
        return TestingConfig()
    return DevelopmentConfig()
