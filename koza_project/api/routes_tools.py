from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, datetime # Added datetime import for KickSessionRequest
from ..database import get_db
from ..models import all_models

router = APIRouter()

class WaterLogRequest(BaseModel):
    user_id: int
    amount_ml: int

class AppointmentRequest(BaseModel):
    user_id: int
    doctor_name: str
    date: date
    notes: str

class KickSessionRequest(BaseModel):
    user_id: int
    start_time: datetime
    end_time: datetime
    total_kicks: int
    note: Optional[str] = None

class WeightLogRequest(BaseModel):
    user_id: int
    weight_kg: float
    week_no: Optional[int] = None
    date_val: Optional[date] = None # Optional override date

class WeightLogUpdate(BaseModel):
    weight_kg: float
    week_no: Optional[int] = None

class SettingsUpdate(BaseModel):
    user_id: int
    water_reminder: Optional[bool] = None
    forum_notification: Optional[bool] = None
    weekly_notification: Optional[bool] = None
    auto_anonymous: Optional[bool] = None

@router.post("/water")
def log_water(request: WaterLogRequest, db: Session = Depends(get_db)):
    """
    Logs a specific water intake (e.g., 200ml).
    Stored as a timestamped entry in water_logs.
    """
    new_log = all_models.WaterLog(
        user_id=request.user_id,
        amount_ml=request.amount_ml
    )
    db.add(new_log)
    db.commit()
    return {"status": "success", "added_ml": request.amount_ml}

@router.get("/water/today")
def get_daily_water_total(user_id: int, db: Session = Depends(get_db)):
    """
    Returns the total water intake for the current day (00:00 - 23:59).
    This logic automatically 'resets' the counter each day because it only sums 'today's' logs.
    """
    from sqlalchemy import func
    from datetime import datetime, time
    
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    
    total = db.query(func.sum(all_models.WaterLog.amount_ml)).filter(
        all_models.WaterLog.user_id == user_id,
        all_models.WaterLog.created_at >= today_start,
        all_models.WaterLog.created_at <= today_end
    ).scalar()
    
    return {"user_id": user_id, "date": date.today(), "total_ml": total or 0}

@router.get("/settings/{user_id}")
def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    user = db.query(all_models.User).filter(all_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "water_reminder": user.water_reminder_enabled,
        "forum_notification": user.notify_forum_replies,
        "weekly_notification": user.notify_weekly_summary,
        "auto_anonymous": user.auto_anonymous_post
    }

@router.post("/settings/update")
def update_settings(update: SettingsUpdate, db: Session = Depends(get_db)):
    user = db.query(all_models.User).filter(all_models.User.id == update.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update.water_reminder is not None: user.water_reminder_enabled = update.water_reminder
    if update.forum_notification is not None: user.notify_forum_replies = update.forum_notification
    if update.weekly_notification is not None: user.notify_weekly_summary = update.weekly_notification
    if update.auto_anonymous is not None: user.auto_anonymous_post = update.auto_anonymous
    
    db.commit()
    return {"status": "success"}

@router.post("/settings/reset-data")
def reset_user_data(user_id: int, db: Session = Depends(get_db)):
    """
    Deletes all user logs (Water, Kick, Weight). Keep User account active.
    """
    db.query(all_models.WaterLog).filter(all_models.WaterLog.user_id == user_id).delete()
    db.query(all_models.KickLog).filter(all_models.KickLog.user_id == user_id).delete()
    db.query(all_models.WeightLog).filter(all_models.WeightLog.user_id == user_id).delete()
    # DailyLog also contains weight info, maybe clear that too or specific columns?
    # For now assume DailyLog corresponds mainly to weight/water daily summaries
    db.query(all_models.DailyLog).filter(all_models.DailyLog.user_id == user_id).delete()
    
    db.commit()
    return {"status": "success", "message": "All tracking data has been reset."}

@router.get("/settings/export-data/{user_id}")
def export_user_data(user_id: int, db: Session = Depends(get_db)):
    """
    Exports all tracking data as JSON.
    """
    water = db.query(all_models.WaterLog).filter(all_models.WaterLog.user_id == user_id).all()
    kicks = db.query(all_models.KickLog).filter(all_models.KickLog.user_id == user_id).all()
    weights = db.query(all_models.WeightLog).filter(all_models.WeightLog.user_id == user_id).all()
    
    return {
        "user_id": user_id,
        "exported_at": datetime.utcnow(),
        "water_logs": [ {"date": w.created_at, "amount": w.amount_ml} for w in water],
        "kick_logs": [ {"start": k.start_time, "kicks": k.total_kicks} for k in kicks],
        "weight_logs": [ {"date": wl.date, "weight": wl.weight_kg} for wl in weights]
    }

# --- Reminder Logic (To be called by Scheduler/Cron) ---
async def check_and_send_water_reminders(db: Session, manager):
    """
    Checks if users with enabled reminders haven't logged water in 2 hours.
    """
    from datetime import datetime, timedelta
    
    # Threshold time (2 hours ago)
    two_hours_ago = datetime.utcnow() - timedelta(hours=2)
    
    users = db.query(all_models.User).filter(all_models.User.water_reminder_enabled == True).all()
    
    for user in users:
        # Get last log
        last_log = db.query(all_models.WaterLog).filter(
            all_models.WaterLog.user_id == user.id
        ).order_by(all_models.WaterLog.created_at.desc()).first()
        
        # Condition: No log at all OR last log older than 2 hours
        should_remind = False
        if not last_log:
            should_remind = True # If never logged, maybe remind? Or assume they just started. Let's remind.
        elif last_log.created_at < two_hours_ago:
            should_remind = True
            
        if should_remind:
            # Send Notification via WebSocket Manager
            msg = "Bebeğin ve senin için bir yudum su içmeye ne dersin? 💧"
            await manager.notify_user(user.id, msg)
            print(f"Sent reminder to User {user.id}")

@router.post("/kick-counter")
def save_kick_session(session: KickSessionRequest, db: Session = Depends(get_db)):
    """
    Saves a kick counting session.
    """
    new_log = all_models.KickLog(
        user_id=session.user_id,
        start_time=session.start_time,
        end_time=session.end_time,
        total_kicks=session.total_kicks,
        note=session.note
    )
    db.add(new_log)
    db.commit()
    
    msg = "Session saved."
    if session.total_kicks >= 10:
        msg = "Tebrikler, bebeğin bugün oldukça hareketli! 🦶🎉"
        
    return {"status": "success", "message": msg, "id": new_log.id}

@router.get("/kick-counter/history")
def get_kick_history(user_id: int, db: Session = Depends(get_db)):
    """
    Returns kick sessions (e.g., 'Bugün 14:00 - 10 Tekme (12 dk)')
    """
    logs = db.query(all_models.KickLog).filter(
        all_models.KickLog.user_id == user_id
    ).order_by(all_models.KickLog.created_at.desc()).all()
    
    history = []
    for log in logs:
        duration = (log.end_time - log.start_time).total_seconds() / 60
        history.append({
            "id": log.id,
            "date": log.start_time.strftime("%Y-%m-%d"),
            "time": log.start_time.strftime("%H:%M"),
            "kicks": log.total_kicks,
            "duration_min": int(duration)
        })
        
    return history

@router.post("/weight")
def log_weight(request: WeightLogRequest, db: Session = Depends(get_db)):
    """
    Logs weight.
    """
    # If week_no not provided, calculate it
    user = db.query(all_models.User).filter(all_models.User.id == request.user_id).first()
    week_num = request.week_no
    log_date = request.date_val or date.today()

    if week_num is None:
        if user and user.last_period_date:
            week_num = max(0, int((log_date - user.last_period_date).days / 7))
        else:
            week_num = 0

    new_log = all_models.WeightLog(
        user_id=request.user_id, 
        weight_kg=request.weight_kg, 
        week_no=week_num,
        date=log_date
    )
    db.add(new_log)
    db.commit()
    return {"status": "success", "id": new_log.id}

@router.delete("/weight/{log_id}")
def delete_weight_log(log_id: int, user_id: int, db: Session = Depends(get_db)):
    # In real app, verify user_id owns the log
    log = db.query(all_models.WeightLog).filter(all_models.WeightLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    db.commit()
    return {"status": "success"}

@router.put("/weight/{log_id}")
def update_weight_log(log_id: int, update: WeightLogUpdate, db: Session = Depends(get_db)):
    log = db.query(all_models.WeightLog).filter(all_models.WeightLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    log.weight_kg = update.weight_kg
    if update.week_no is not None:
        log.week_no = update.week_no
        
    db.commit()
    return {"status": "success"}

@router.get("/weight/history")
def get_weight_history(user_id: int, db: Session = Depends(get_db)):
    """
    Returns weight logs using WeightLog table.
    """
    user = db.query(all_models.User).filter(all_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    logs = db.query(all_models.WeightLog).filter(
        all_models.WeightLog.user_id == user_id
    ).order_by(all_models.WeightLog.date.asc()).all()

    history = []
    start_weight = 0
    
    if logs:
        start_weight = logs[0].weight_kg

    for log in logs:
        history.append({
            "id": log.id,
            "date": log.date,
            "weight": log.weight_kg,
            "week": log.week_no
        })
        
    return {
        "start_weight": start_weight,
        "current_weight": logs[-1].weight_kg if logs else start_weight,
        "history": history,
        "analysis": generate_weight_analysis(start_weight, user.height_cm or 165.0)
    }

def generate_weight_analysis(start_weight: float, height_cm: float):
    """
    Calculates BMI and generates ideal weight gain curves (Min/Max) for 40 weeks.
    Based on IOM Guidelines.
    """
    height_m = height_cm / 100.0
    bmi = start_weight / (height_m * height_m)
    
    # Guidelines (Total Gain Range in kg)
    if bmi < 18.5:
        category = "Underweight"
        gain_min, gain_max = 12.5, 18.0
    elif 18.5 <= bmi < 25.0:
        category = "Normal"
        gain_min, gain_max = 11.5, 16.0
    elif 25.0 <= bmi < 30.0:
        category = "Overweight"
        gain_min, gain_max = 7.0, 11.5
    else:
        category = "Obese"
        gain_min, gain_max = 5.0, 9.0
        
    # Generate weekly points (0 to 40)
    # Gain assumption: 
    # T1 (0-13 weeks): ~1-2 kg total (slow)
    # T2 & T3: Linear rest
    
    ideal_min_data = []
    ideal_max_data = []
    
    for week in range(41):
        if week <= 13:
            # First Trimester: minimal gain (approx 10% of total max goal)
            progress = week / 13.0
            w_min = start_weight + (1.0 * progress) # Assume 1kg gain in T1
            w_max = start_weight + (2.0 * progress) # Assume 2kg gain in T1
        else:
            # Linear gain for remaining 27 weeks
            progress = (week - 13) / 27.0
            
            # Remaining to gain
            rem_min = gain_min - 1.0
            rem_max = gain_max - 2.0
            
            w_min = (start_weight + 1.0) + (rem_min * progress)
            w_max = (start_weight + 2.0) + (rem_max * progress)
            
        ideal_min_data.append(w_min)
        ideal_max_data.append(w_max)
        
    return {
        "bmi": round(bmi, 1),
        "category": category,
        "ideal_min": ideal_min_data,
        "ideal_max": ideal_max_data
    }

@router.post("/appointments")
def schedule_appointment(request: AppointmentRequest, db: Session = Depends(get_db)):
    # Mocking Appointment scheduling (Model for Appointment wasn't strictly in 'all_models' main block but implied)
    # We will just return success for this mock
    return {"status": "success", "message": f"Appointment set with {request.doctor_name} on {request.date}"}
