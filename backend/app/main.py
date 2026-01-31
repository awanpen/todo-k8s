"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth_router, tasks_router

# Create FastAPI application
app = FastAPI(
    title="Todo API",
    description="Full-stack todo application backend with JWT authentication",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(tasks_router)


@app.get("/")
@app.head("/")
def root() -> dict:
    """Root endpoint."""
    return {
        "message": "Todo API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
@app.head("/health")
def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}
