from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import all_models

router = APIRouter()

# --- Seeder ---
INITIAL_FOODS = [
    {"name": "Sushi (Çiğ)", "category": "Deniz Ürünleri", "status": "BANNED", "description": "Çiğ balık listeria ve parazit riski taşır."},
    {"name": "Pişmiş Somon", "category": "Deniz Ürünleri", "status": "SAFE", "description": "Omega-3 kaynağıdır, iyi pişmiş olması şartıyla güvenlidir."},
    {"name": "Pastırma", "category": "Et Ürünleri", "status": "CAUTION", "description": "Yüksek tuz içerir ve çiğ et riski olabilir. Pişirilerek tüketiilmesi önerilir."},
    {"name": "Bitki Çayları (Adaçayı)", "category": "İçecekler", "status": "CAUTION", "description": "Rahim kasılmalarını tetikleyebilir, doktora danışılmalı."},
    {"name": "Kahve", "category": "İçecekler", "status": "CAUTION", "description": "Günlük 200mg kafein sınırı (yaklaşık 1-2 fincan) aşılmamalıdır."},
    {"name": "Yumuşak Peynirler (Küflü)", "category": "Süt Ürünleri", "status": "BANNED", "description": "Pastörize edilmemiş sütten yapılan peynirlerde listeria riski vardır."},
    {"name": "Yoğurt", "category": "Süt Ürünleri", "status": "SAFE", "description": "Kalsiyum kaynağıdır, güvenle tüketilebilir."},
    {"name": "Cıva Yüksek Balıklar", "category": "Deniz Ürünleri", "status": "BANNED", "description": "Köpekbalığı, kılıçbalığı gibi yüksek cıvalı balıklar bebeğin sinir sistemine zarar verebilir."},
    {"name": "Yumurta (İyi Pişmiş)", "category": "Et Ürünleri", "status": "SAFE", "description": "Protein kaynağıdır. Sarısı tam pişmiş olmalı."},
    {"name": "Zencefil Çayı", "category": "İçecekler", "status": "SAFE", "description": "Mide bulantısına iyi gelir, ölçülü tüketilebilir."}
]

def seed_nutrition(db: Session):
    if db.query(all_models.NutritionItem).count() == 0:
        for f in INITIAL_FOODS:
            db.add(all_models.NutritionItem(**f))
        db.commit()

# --- Endpoints ---

@router.get("/")
def get_nutrition_guide(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    seed_nutrition(db)
    
    query = db.query(all_models.NutritionItem)
    
    if search:
        query = query.filter(all_models.NutritionItem.name.ilike(f"%{search}%"))
        
    if category:
        query = query.filter(all_models.NutritionItem.category == category)
        
    items = query.all()
    
    return [{
        "id": i.id,
        "name": i.name,
        "category": i.category,
        "status": i.status,
        "description": i.description
    } for i in items]
