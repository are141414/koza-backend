from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Koza API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Koza API running"}

@app.get("/api/forum/posts")
def get_forum_posts():
    return [
        {
            "id": 1,
            "title": "Hamilelik İlk Ayı",
            "content": "İlk ayda neler yaşadınız?",
            "author": "Ayşe",
            "created_at": "2026-01-27",
            "category": "pregnancy",
            "comments_count": 5
        },
        {
            "id": 2,
            "title": "Beslenme Önerileri",
            "content": "Hamilelikte hangi besinler önemli?",
            "author": "Fatma",
            "created_at": "2026-01-26",
            "category": "nutrition",
            "comments_count": 12
        }
    ]

@app.post("/api/forum/posts")
def create_forum_post(post_data: dict):
    return {"id": 999, "status": "created", "post": post_data}

@app.get("/api/pregnancy/calculate")
def calculate_pregnancy(lmp_date: str = "2025-09-01"):
    return {
        "weeks": 22,
        "days": 4,
        "due_date": "2026-06-10",
        "trimester": 2
    }

@app.get("/api/pregnancy/development/{week}")
def get_weekly_development(week: int):
    developments = {
        "1": {"week": 1, "baby_size": "Tohumlar kadar", "development": "Döllenme başladı"},
        "20": {"week": 20, "baby_size": "Muz kadar (15-20 cm)", "development": "Bebeğin tüm organları oluştu"},
    }
    return developments.get(str(week), {"week": week, "baby_size": "Bilgi yok", "development": "Bilgi yok"})

@app.post("/api/pregnancy/calculate")
def post_calculate_pregnancy(body: dict):
    return {
        "weeks": 22,
        "days": 4,
        "due_date": "2026-06-10",
        "trimester": 2
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
