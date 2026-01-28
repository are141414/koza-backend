from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy.orm import Session
from . import routes_pregnancy, routes_forum, routes_tools, routes_names, routes_gallery, routes_nutrition, routes_upload, routes_auth
from ..database import engine, Base
from ..models import all_models

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Koza - Happy Mom Clone API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files (Frontend)
# Static Files (Frontend)
ui_path = os.path.join(os.path.dirname(__file__), "..", "ui")
app.mount("/ui", StaticFiles(directory=ui_path, html=True), name="ui")

# Static Files (Uploads)
static_path = os.path.join(os.path.dirname(__file__), "..", "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Include Routers
app.include_router(routes_pregnancy.router, prefix="/api/pregnancy", tags=["Pregnancy"])
app.include_router(routes_forum.router, prefix="/api/forum", tags=["Forum"])
app.include_router(routes_tools.router, prefix="/api/tools", tags=["Tools"])
app.include_router(routes_names.router, prefix="/api/names", tags=["Names"])
app.include_router(routes_gallery.router, prefix="/api/gallery", tags=["Gallery"])
app.include_router(routes_nutrition.router, prefix="/api/nutrition", tags=["Nutrition"])
app.include_router(routes_upload.router, prefix="/api", tags=["Upload"])
app.include_router(routes_auth.router, prefix="/api/auth", tags=["Auth"])

from fastapi.responses import RedirectResponse

@app.get("/")
def read_root():
    return RedirectResponse(url="/ui/")
