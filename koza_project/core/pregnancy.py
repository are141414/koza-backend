from datetime import date, timedelta

def calculate_pregnancy_status(lmp_date: date):
    """
    Calculates detailed pregnancy statistics and future milestones.
    """
    today = date.today()
    days_pregnant = (today - lmp_date).days
    
    # Constants
    TOTAL_DAYS = 280
    WEEKS_IN_TRIMESTER = 13
    
    # Basic calcs
    estimated_due_date = lmp_date + timedelta(days=TOTAL_DAYS)
    days_remaining = (estimated_due_date - today).days
    
    current_week = (days_pregnant // 7) + 1
    days_into_week = days_pregnant % 7
    
    # Cap logic
    if current_week > 42:
        current_week = 42
        days_remaining = 0
    
    # Formatted String
    pretty_status = f"{current_week} weeks {days_into_week} days"
    
    # Trimester
    if current_week <= 13:
        trimester = 1
    elif current_week <= 26:
        trimester = 2
    else:
        trimester = 3

    # Calendar Projection (Milestones)
    # Automatically generate key future dates
    milestones = []
    
    # 1. Trimester Transitions
    t2_start = lmp_date + timedelta(weeks=13)
    t3_start = lmp_date + timedelta(weeks=27)
    
    if t2_start > today:
        milestones.append({"date": t2_start, "title": "Start of Trimester 2", "type": "milestone"})
    if t3_start > today:
        milestones.append({"date": t3_start, "title": "Start of Trimester 3", "type": "milestone"})
        
    # 2. Generic Medical Checkup Schedule (Approximation)
    # Monthly until w28, Bi-weekly until w36, Weekly until birth
    checkup_schedule = []
    for w in range(8, 28, 4): # Weeks 8, 12, 16, 20, 24
        checkup_schedule.append(w)
    for w in range(28, 36, 2): # Weeks 28, 30, 32, 34
        checkup_schedule.append(w)
    for w in range(36, 41, 1): # Weeks 36, 37, 38, 39, 40
        checkup_schedule.append(w)
        
    for w in checkup_schedule:
        check_date = lmp_date + timedelta(weeks=w)
        if check_date > today:
            milestones.append({
                "date": check_date, 
                "title": f"Week {w} Checkup (Projected)", 
                "type": "appointment"
            })

    # 3. Due Date
    if estimated_due_date > today:
        milestones.append({"date": estimated_due_date, "title": "Estimated Due Date 👶", "type": "milestone"})

    milestones.sort(key=lambda x: x["date"])

    return {
        "current_week": current_week,
        "days_pregnant": days_pregnant,
        "week_day_string": pretty_status,
        "days_remaining": days_remaining,
        "estimated_due_date": estimated_due_date,
        "trimester": trimester,
        "calendar_projection": milestones[:5] # Return next 5 events
    }
