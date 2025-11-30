"""
AidTracker FastAPI Application
Main entry point for the backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import test_connection

# Import routers
from app.api import (
    distribution,
    centers,
    packages,
    households,
    inventory,
    reports
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events - startup and shutdown"""
    # Startup
    logger.info("🚀 Starting AidTracker API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.MYSQL_DATABASE}")

    # Test database connection
    if test_connection():
        logger.info("✅ Database connection verified")
    else:
        logger.error("❌ Database connection failed!")

    yield

    # Shutdown
    logger.info("👋 Shutting down AidTracker API...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(distribution.router, prefix=settings.API_V1_PREFIX)
app.include_router(centers.router, prefix=settings.API_V1_PREFIX)
app.include_router(packages.router, prefix=settings.API_V1_PREFIX)
app.include_router(households.router, prefix=settings.API_V1_PREFIX)
app.include_router(inventory.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": settings.DESCRIPTION,
        "status": "running",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    db_status = test_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected",
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
