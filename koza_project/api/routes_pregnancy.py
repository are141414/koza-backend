from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..core.pregnancy import calculate_pregnancy_status
from ..models import all_models

router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    user_id: int
    baby_name: Optional[str] = None
    pregnancy_count: Optional[int] = None
    city: Optional[str] = None
    district: Optional[str] = None
    last_period_date: Optional[date] = None
    estimated_due_date: Optional[date] = None

class ProfilePatchRequest(BaseModel):
    user_id: int
    height_cm: Optional[float] = None
    starting_weight_kg: Optional[float] = None
    birth_date: Optional[date] = None
    city: Optional[str] = None
    district: Optional[str] = None
    baby_name: Optional[str] = None
    pregnancy_count: Optional[int] = None
    last_period_date: Optional[date] = None # Updating this recalculates weeks
    full_name: Optional[str] = None
    username: Optional[str] = None

class LMPRequest(BaseModel):
    lmp_date: date

@router.post("/calculate")
def calculate_pregnancy(request: LMPRequest):
    """
    Returns pregnancy details based on LMP.
    """
    return calculate_pregnancy_status(request.lmp_date)

@router.get("/development/{week}")
def get_weekly_development(week: int, db: Session = Depends(get_db)):
    """
    Get baby development info for a specific week from the DB.
    """
    data = db.query(PregnancyData).filter(PregnancyData.week_number == week).first()
    if not data:
        # Return mock data if DB is empty for demo purposes
        return {
            "week": week,
            "baby_size": "Unknown (Mock)",
            "description": "Mock description for week " + str(week),
            "mother_advice": "Bol su tüketin!",
            "image_url": "https://placehold.co/100x100"
        }
    return data

@router.get("/summary/{week}")
def get_weekly_summary(week: int, db: Session = Depends(get_db)):
    """
    Specific endpoint for Home Screen Baby Status Card.
    Returns: fruit_name, fruit_image_url, progress_percentage, description.
    """
    data = db.query(PregnancyData).filter(PregnancyData.week_number == week).first()
    
    # Progress Calculation (0-100%)
    progress_percentage = min(100, max(0, int((week / 40) * 100)))

    if not data:
        # Mock / Fallback if DB is empty
        return {
             "week": week,
             "fruit_name": "Limon (Mock)", 
             "fruit_image_url": None,
             "description": "Bebeğinizin parmak izleri oluşmaya başladı.",
             "progress_percentage": progress_percentage
        }
    
    return {
        "week": week,
        "fruit_name": data.baby_size_comparison,
        "fruit_image_url": data.image_url,
        "description": data.description, # Short summary
        "progress_percentage": progress_percentage
    }

@router.get("/profile/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(all_models.User).filter(all_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if UserProfile exists, if not create empty
    profile = db.query(all_models.UserProfile).filter(all_models.UserProfile.user_id == user_id).first()
    if not profile:
        profile = all_models.UserProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "name": user.email.split('@')[0] if user.email else "Anne Adayı",
        "email": user.email,
        "photo_url": "https://cdn-icons-png.flaticon.com/512/65/65581.png",
        "badge": user.badge,
        "last_period_date": user.last_period_date,
        "estimated_due_date": user.estimated_due_date,
        # Fields from Profile
        "baby_name": profile.baby_name,
        "pregnancy_count": profile.pregnancy_count,
        "city": profile.city,
        "district": profile.district,
        "height_cm": profile.height_cm,
        "starting_weight_kg": profile.starting_weight_kg,
        "birth_date": profile.birth_date
    }

@router.patch("/profile/update")
def patch_user_profile(request: ProfilePatchRequest, db: Session = Depends(get_db)):
    """
    Updates user profile via PATCH. 
    Recalculates pregnancy status if 'last_period_date' is changed.
    """
    user = db.query(all_models.User).filter(all_models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = db.query(all_models.UserProfile).filter(all_models.UserProfile.user_id == request.user_id).first()
    if not profile:
        profile = all_models.UserProfile(user_id=request.user_id)
        db.add(profile)
    
    # Update Profile Fields
    if request.height_cm is not None: profile.height_cm = request.height_cm
    if request.starting_weight_kg is not None: profile.starting_weight_kg = request.starting_weight_kg
    if request.birth_date is not None: profile.birth_date = request.birth_date
    if request.city is not None: profile.city = request.city
    if request.district is not None: profile.district = request.district
    if request.baby_name is not None: profile.baby_name = request.baby_name
    if request.pregnancy_count is not None: profile.pregnancy_count = request.pregnancy_count
    
    # Update User Info
    if request.full_name is not None:
        user.name = request.full_name
    # Note: 'username' requested by frontend but no DB column yet. 
    # We could store in UserProfile if migrated, or just log for now.
    
    # Update User Fields (LMP logic)
    week_info = None
    if request.last_period_date is not None:
        # Validate LMP
        today = date.today()
        days_passed = (today - request.last_period_date).days
        
        if days_passed < 0:
             raise HTTPException(status_code=400, detail="Son Adet Tarihi gelecekte olamaz.")
             
        if days_passed > 300: # 42 weeks roughly max
             raise HTTPException(status_code=400, detail="Bu tarih çok eski. Bebeğiniz doğmuş olmalı! Lütfen tarihi kontrol edin.")
             
        # Warn if > 280 but < 300 (Overdue)
        warning_msg = None
        if days_passed > 280:
            warning_msg = "Tebrikler, bebeğiniz doğmuş olmalı! (40 haftayı geçti)"

        user.last_period_date = request.last_period_date
        # Recalculate estimated due date (LMP + 280 days)
        from datetime import timedelta
        user.estimated_due_date = request.last_period_date + timedelta(days=280)
        
        # Calculate new status to return
        week_info = calculate_pregnancy_status(request.last_period_date)

    db.commit()
    
    return {
        "status": "success", 
        "message": "Profile updated", 
        "warning": locals().get("warning_msg"),
        "new_calculated_status": week_info
    }
