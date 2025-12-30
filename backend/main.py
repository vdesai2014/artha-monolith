"""
artha.bot - ML Robotics Platform
A cute little FastAPI backend serving the frontend and providing API endpoints.
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

app = FastAPI(
    title="artha.bot",
    description="ML Robotics Platform - Visualize robot arm training data",
    version="0.1.0",
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint - returns server status."""
    return {
        "status": "healthy",
        "service": "artha.bot",
        "version": "0.1.0",
        "message": "Robot arms are warming up...",
    }


@app.get("/api/status")
async def status():
    """Extended status endpoint with more details."""
    return {
        "status": "online",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "features": {
            "visualizer": "coming soon",
            "datasets": "coming soon",
            "experiments": "coming soon",
        },
    }


# Serve static files from the frontend build directory
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the frontend for all non-API routes."""
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"error": "Frontend not built"}
