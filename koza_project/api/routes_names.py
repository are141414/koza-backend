from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import all_models

router = APIRouter()

# --- Seeder ---
INITIAL_NAMES = [
    {"name": "Zeynep", "gender": "K", "meaning": "Değerli taşlar, mücevherler."},
    {"name": "Defne", "gender": "K", "meaning": "Güzel kokulu bir ağaç, defne ağacı."},
    {"name": "Yusuf", "gender": "E", "meaning": "Ah eden, inleyen. Bir peygamber ismi."},
    {"name": "Eymen", "gender": "E", "meaning": "Daha uğurlu, daha bereketli, sağ taraftaki."},
    {"name": "Deniz", "gender": "U", "meaning": "Tuzlu büyük su kütlesi."},
    {"name": "Umut", "gender": "U", "meaning": "Ummaktan doğan güven duygusu."},
    {"name": "Asya", "gender": "K", "meaning": "Dünyanın en büyük kıtası."},
    {"name": "Kerem", "gender": "E", "meaning": "Asalet, soyluluk, cömertlik."},
    {"name": "Alya", "gender": "K", "meaning": "Yüksek yer, yükseklik, gök."},
    {"name": "Alp", "gender": "E", "meaning": "Yiğit, kahraman."},
    {"name": "Toprak", "gender": "U", "meaning": "Yer kabuğunun canlılara yaşama ortamı sağlayan yüzey bölümü."},
    {"name": "Güneş", "gender": "U", "meaning": "Gezegen sisteminin merkezi olan yıldız."},
    {"name": "Lina", "gender": "K", "meaning": "Hurma ağacı fidesi."},
    {"name": "Rüzgar", "gender": "U", "meaning": "Havanın yer değiştirmesi."},
    {"name": "Atlas", "gender": "E", "meaning": "Dünyayı taşıyan mitolojik kahraman."}
]

def seed_names(db: Session):
    if db.query(all_models.BabyName).count() == 0:
        for n in INITIAL_NAMES:
            db.add(all_models.BabyName(**n))
        db.commit()

# --- Endpoints ---

@router.get("/")
def get_names(
    user_id: int, 
    gender: Optional[str] = None, # K, E, U
    search: Optional[str] = None,
    only_favorites: bool = False,
    db: Session = Depends(get_db)
):
    # Ensure seeded
    seed_names(db)
    
    query = db.query(all_models.BabyName)
    
    # Favorites Filter
    if only_favorites:
        query = query.join(all_models.FavoriteName).filter(all_models.FavoriteName.user_id == user_id)
    
    # Gender Filter
    if gender and not only_favorites:
        # If searching favorites, maybe we ignore gender trigger or combine?
        # Let's assume standard filtering
        if gender == 'U':
            query = query.filter(all_models.BabyName.gender == 'U')
        else:
            # If K or E, usually include that specific gender + Unisex? 
            # Or strict? Let's go strict for now based on request "Kız, Erkek, Üniseks buttons".
            query = query.filter(all_models.BabyName.gender == gender)
            
    # Search Filter
    if search:
        query = query.filter(all_models.BabyName.name.ilike(f"%{search}%"))
        
    results = query.all()
    
    # Check Favorites status for each
    # Allow efficient check
    user_favorites = db.query(all_models.FavoriteName.baby_name_id).filter(all_models.FavoriteName.user_id == user_id).all()
    fav_ids = {f[0] for f in user_favorites}
    
    output = []
    for n in results:
        output.append({
            "id": n.id,
            "name": n.name,
            "gender": n.gender,
            "meaning": n.meaning,
            "is_favorite": n.id in fav_ids
        })
        
    return output

@router.post("/{name_id}/favorite")
def toggle_favorite(name_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = db.query(all_models.FavoriteName).filter(
        all_models.FavoriteName.user_id == user_id,
        all_models.FavoriteName.baby_name_id == name_id
    ).first()
    
    if existing:
        db.delete(existing)
        is_fav = False
    else:
        new_fav = all_models.FavoriteName(user_id=user_id, baby_name_id=name_id)
        db.add(new_fav)
        is_fav = True
        
    db.commit()
    return {"status": "success", "is_favorite": is_fav}
