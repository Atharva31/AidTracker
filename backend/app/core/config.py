from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings"""

    # Database
    MYSQL_USER: str = "aidtracker_user"
    MYSQL_PASSWORD: str = "aidtracker_pass"
    MYSQL_HOST: str = "mysql"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "aidtracker_db"
    DATABASE_URL: Optional[str] = None

    # API
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "AidTracker API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Humanitarian Aid Distribution Management System"

    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173", "http://frontend:3000"]

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def database_url(self) -> str:
        """Construct database URL if not provided"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"


settings = Settings()
