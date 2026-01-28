import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException, Request

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}

# Ensure directory exists (Utility level check)
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def upload_image_to_server(file: UploadFile, request: Request = None) -> str:
    """
    Saves an uploaded image with a unique UUID filename.
    
    Args:
        file: The uploaded file object.
        request: FastAPI Request object (optional, for constructing full URL).
        
    Returns:
        str: The full URL or absolute path to the uploaded image.
    """
    
    # 1. Validate Extension
    filename = file.filename
    file_ext = os.path.splitext(filename)[1].lower() if filename else ""
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Geçersiz dosya türü. Sadece .jpg, .png, .gif kabul edilir.")
        
    # 2. Generate Unique Filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # 3. Save File
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(f"File save error: {e}")
        raise HTTPException(status_code=500, detail="Dosya kaydedilemedi.")
        
    # 4. Construct Return URL
    # If request is provided, Try to build full URL: https://domain.com/static/uploads/...
    # Otherwise return absolute path /static/uploads/...
    
    relative_path = f"/static/uploads/{unique_filename}"
    
    if request:
        base_url = str(request.base_url).rstrip("/")
        full_url = f"{base_url}{relative_path}"
        return full_url
        
    return relative_path
