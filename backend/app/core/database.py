from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Create database engine with connection pooling
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,  # Number of permanent connections
    max_overflow=20,  # Number of connections that can be created beyond pool_size
    echo=settings.DEBUG,  # Log SQL queries in debug mode
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session
    Ensures proper session lifecycle management
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False
