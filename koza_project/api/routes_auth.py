from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from ..database import get_db
from ..models import all_models

router = APIRouter()

class Item(BaseModel):
    device_id: Optional[str] = None
    name: Optional[str] = None

class RegisterResponse(BaseModel):
    user_id: int
    name: Optional[str]
    message: str

@router.post("/register", response_model=RegisterResponse)
def register_user(item: Item, db: Session = Depends(get_db)):
    """
    Registers a new user silently or with connection to device_id.
    For now, simple auto-increment creation.
    """
    # Create new user
    new_user = all_models.User(
        name=item.name if item.name else "Yeni Kullanıcı",
        email=f"user_{item.device_id}@koza.com" if item.device_id else None,
        # hashed_password="...", # Not used for silent auth yet
        badge="Yeni Anne"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create associated profile
    profile = all_models.UserProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()

    return {
        "user_id": new_user.id,
        "name": new_user.name,
        "message": "User created successfully"
    }

@router.post("/login")
def login_user(item: Item, db: Session = Depends(get_db)):
    # Placeholder for future real auth
    # Check if user exists by device_id or similar
    if item.device_id:
        email = f"user_{item.device_id}@koza.com"
        user = db.query(all_models.User).filter(all_models.User.email == email).first()
        if user:
            return {"user_id": user.id, "name": user.name}
    
    return {"error": "User not found"}
