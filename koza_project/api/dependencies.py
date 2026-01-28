from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import all_models

def get_current_user(x_user_id: str = Header(..., alias="X-User-ID"), db: Session = Depends(get_db)):
    """
    Simulates authentication by verifying the X-User-ID header exists 
    and corresponds to a valid user in the database.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        user_id = int(x_user_id)
        user = db.query(all_models.User).filter(all_models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid User ID")
        return user
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid User ID format")
