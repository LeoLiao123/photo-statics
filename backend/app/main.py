from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from .database import create_db_and_tables
from .routers import vote, photos

# Create database and tables on startup
create_db_and_tables()

app = FastAPI()

# CORS middleware (allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

app.include_router(vote.router)
app.include_router(photos.router)

# Determine base directory for static files
# This assumes uvicorn is run from the project root: /home/leoliao/code/personal/photo-statics/
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Serve static files for images
# The path "backend/images" is relative to PROJECT_ROOT
images_static_path = os.path.join(PROJECT_ROOT, "backend", "images")
if not os.path.exists(images_static_path):
    # This case should ideally not happen if crud.py's IMAGES_DIR logic is robust
    # or if the directory is created beforehand.
    # For safety, create it if it doesn't exist.
    os.makedirs(images_static_path, exist_ok=True)
    print(f"Created images directory at: {images_static_path}")
    # Add a .gitkeep file to ensure the directory is tracked by git if empty
    with open(os.path.join(images_static_path, ".gitkeep"), "w") as f:
        pass


app.mount("/images", StaticFiles(directory="backend/images"), name="images_static")

# Serve static files for frontend (HTML, CSS, JS)
# The path "frontend" is relative to PROJECT_ROOT
frontend_static_path = os.path.join(PROJECT_ROOT, "frontend")
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend_static")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# To run the app:
# 1. Make sure you are in the /home/leoliao/code/personal/photo-statics/ directory.
# 2. Run: uvicorn backend.app.main:app --reload
#
# Then access:
# - Voting page: http://127.0.0.1:8000/index.html (or http://127.0.0.1:8000/)
# - Admin page: http://127.0.0.1:8000/admin.html
# - API health: http://127.0.0.1:8000/api/health
