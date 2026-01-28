from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import all_models
import shutil
import os
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "ui/uploads" # Keeping inside ui for easy serving in this simple setup
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_photo(
    user_id: int = Form(...),
    week: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"user_{user_id}_week_{week}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create DB Record
    # Relative path for frontend access (assuming ui is served as root or similar)
    # Since visualizer serves ui/, we can access via uploads/filename
    web_path = f"uploads/{filename}"
    
    new_log = all_models.PhotoLog(
        user_id=user_id,
        week=week,
        photo_path=web_path
    )
    db.add(new_log)
    db.commit()
    
    return {"status": "success", "path": web_path}

@router.get("/photos")
def get_photos(user_id: int, db: Session = Depends(get_db)):
    photos = db.query(all_models.PhotoLog).filter(
        all_models.PhotoLog.user_id == user_id
    ).order_by(all_models.PhotoLog.week.asc()).all()
    
    return [{
        "id": p.id,
        "week": p.week,
        "url": p.photo_path,
        "date": p.created_at
    } for p in photos]

@router.delete("/{photo_id}")
def delete_photo(photo_id: int, user_id: int, db: Session = Depends(get_db)):
    photo = db.query(all_models.PhotoLog).filter(
        all_models.PhotoLog.id == photo_id
    ).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    # Ideally delete file from disk too
    # os.remove(...)
    
    db.delete(photo)
    db.commit()
    return {"status": "success"}
