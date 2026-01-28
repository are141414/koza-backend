from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, date
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    last_period_date = Column(Date) # LMP
    estimated_due_date = Column(Date)
    badge = Column(String, default="Yeni Anne") # Badge Status
    
    # Settings (Notifications & Privacy)
    water_reminder_enabled = Column(Boolean, default=True)
    notify_forum_replies = Column(Boolean, default=True)
    notify_weekly_summary = Column(Boolean, default=True)
    auto_anonymous_post = Column(Boolean, default=False)

    height_cm = Column(Float, default=165.0) # For BMI Calc

    # Profile Info
    baby_name = Column(String, nullable=True)
    pregnancy_count = Column(Integer, default=1)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    
    daily_logs = relationship("DailyLog", back_populates="user")
    profile = relationship("UserProfile", uselist=False, back_populates="user")
    posts = relationship("ForumPost", back_populates="author")
    comments = relationship("ForumComment", back_populates="author")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    height_cm = Column(Float, default=165.0)
    starting_weight_kg = Column(Float)
    birth_date = Column(Date, nullable=True) # User's DOB
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    baby_name = Column(String, nullable=True)
    pregnancy_count = Column(Integer, default=1)
    
    user = relationship("User", back_populates="profile")
    # posts = relationship("ForumPost", back_populates="author") # Error: ForumPost links to User, not UserProfile
    # comments = relationship("ForumComment", back_populates="author")

class PregnancyData(Base):
    __tablename__ = "pregnancy_data"

    week_number = Column(Integer, primary_key=True, index=True) # 1-42
    baby_size_comparison = Column(String) # Meyve Benzetmesi (e.g., "Avocado")
    baby_weight_grams = Column(Integer)
    baby_length_mm = Column(Integer)
    description = Column(Text) # Haftalık Gelişim Özeti
    mother_advice = Column(Text) # Anneye Tavsiyeler
    nutrition_advice = Column(Text) # Haftanın Önerilen Besini
    image_url = Column(String) # Visual reference

class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    category = Column(String, index=True) # Enum could be used here
    author_id = Column(Integer, ForeignKey("users.id"))
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="posts")
    comments = relationship("ForumComment", back_populates="post")

class ForumComment(Base):
    __tablename__ = "forum_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    like_count = Column(Integer, default=0)
    is_helpful_count = Column(Integer, default=0) # "Faydalı Bul"
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("ForumPost", back_populates="comments")
    author = relationship("User", back_populates="comments")

class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, default=datetime.utcnow().date)
    water_intake_ml = Column(Integer, default=0)
    mood = Column(String) # e.g., "Happy", "Tired"
    weight_kg = Column(Float)
    
    user = relationship("User", back_populates="daily_logs")

class UserBlock(Base):
    __tablename__ = "user_blocks"

    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.id"))
    blocked_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount_ml = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class KickLog(Base):
    __tablename__ = "kick_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    total_kicks = Column(Integer)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    weight_kg = Column(Float)
    week_no = Column(Integer)
    date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

class BabyName(Base):
    __tablename__ = "baby_names"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    gender = Column(String) # 'K', 'E', 'U' (Kız, Erkek, Üniseks)
    meaning = Column(String)
    
class FavoriteName(Base):
    __tablename__ = "favorite_names"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    baby_name_id = Column(Integer, ForeignKey("baby_names.id"))

class PhotoLog(Base):
    __tablename__ = "photo_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    week = Column(Integer)
    photo_path = Column(String) # URL/Path to stored image
    created_at = Column(DateTime, default=datetime.utcnow)

class NutritionItem(Base):
    __tablename__ = "nutrition_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String) # e.g. "Deniz Ürünleri", "Bitki Çayları"
    status = Column(String) # "SAFE", "CAUTION", "BANNED"
    description = Column(String)
