from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from typing import List

from .dependencies import get_current_user
from .utils import upload_image_to_server
from ..models import all_models

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif"}

@router.post("/upload-image")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: all_models.User = Depends(get_current_user)
):
    """
    Uploads an image file.
    - **Method**: POST only.
    - **Auth**: Required (X-User-ID header).
    - **Validation**: Images only (jpg, png, gif), Max 5MB.
    """
    
    # 1. Validate Content Type (MIME) - Quick check before processing
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only .jpg, .png, .gif allowed.")

    # 2. Validate File Size
    file.file.seek(0, 2) # Seek to end
    file_size = file.file.tell()
    file.file.seek(0) # Reset

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # 3. Use Utility Function to Save
    try:
        file_url = await upload_image_to_server(file, request)
    except Exception as e:
        # Re-raise HTTP exceptions from util, or generic 500
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    
    return {
        "filename": file.filename, # Original name for reference
        "url": file_url, 
        "size": file_size
    }
