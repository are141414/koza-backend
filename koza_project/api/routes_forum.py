from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, Query
from typing import List, Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from ..database import get_db
from ..models import all_models

router = APIRouter()

# --- Categories Enum ---
class ForumCategory(str, Enum):
    PREGNANCY_LOG = "Hamilelik Günlüğü"
    NUTRITION = "Beslenme"
    BIRTH_PREP = "Doğum Hazırlıkları"
    BABY_CARE = "Bebek Bakımı"
    CHAT_CORNER = "Dertleşme Köşesi"

# --- Pydantic Models ---
class PostCreate(BaseModel):
    title: str
    content: str
    user_id: int
    category_id: ForumCategory # Mapping this to the requested categories

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author_badge: Optional[str] = None # New Field
    category_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    user_id: int
    post_id: int
    content: str

class CommentResponse(BaseModel):
    id: int
    post_id: int
    author_id: int
    content: str
    like_count: int
    is_helpful_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

def filter_content(text: str) -> str:
    """Basic profanity filter mock"""
    bad_words = ["kötü", "kelime"]
    for w in bad_words:
        text = text.replace(w, "***")
    return text

# --- WebSockets for Notifications ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    # Conceptual: In a real app we'd map user_id -> websocket. 
    # For now, we broadcast to all ("User X replied to Y") for simplicity in this demo.
    async def notify_user(self, user_id: int, message: str):
        # Implementation of targeted notification
        await self.broadcast(f"[Notification for User {user_id}]: {message}")

manager = ConnectionManager()

@router.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"User {user_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- Forum Endpoints ---

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    category: Optional[ForumCategory] = Query(None, description="Filter by category"), 
    q: Optional[str] = Query(None, description="Search query for title/content"),
    author_id: Optional[int] = Query(None, description="Filter by author ID"),
    db: Session = Depends(get_db)
):
    """
    List topics with optional category filtering, search, and author checking.
    """
    query = db.query(all_models.ForumPost)
    
    if category:
        query = query.filter(all_models.ForumPost.category == category.value)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                all_models.ForumPost.title.ilike(search),
                all_models.ForumPost.content.ilike(search)
            )
        )
    
    if author_id:
        query = query.filter(all_models.ForumPost.author_id == author_id)
    
    posts = query.all()
    
    # Simple mapping to match response model if column names differ slightly
    results = []
    for p in posts:
        # Fetch author badge (Optimization: could join tables instead)
        author = db.query(all_models.User).filter(all_models.User.id == p.author_id).first()
        badge = author.badge if author else "Yeni Anne"
        
        results.append(PostResponse(
            id=p.id,
            title=p.title,
            content=p.content,
            author_id=p.author_id,
            author_badge=badge,
            category_id=p.category, # Returning the stored string as category_id
            created_at=p.created_at
        ))
    return results

# --- Badge Logic ---
def update_user_badge(user_id: int, db: Session):
    """
    Calculates user stats and assigns badges:
    - Yeni Anne: Default
    - Tecrübeli Anne: 50+ messages (posts + comments)
    - Yardımsever: 100+ likes received
    """
    user = db.query(all_models.User).filter(all_models.User.id == user_id).first()
    if not user:
        return

    # Count Posts + Comments
    post_count = db.query(all_models.ForumPost).filter(all_models.ForumPost.author_id == user_id).count()
    comment_count = db.query(all_models.ForumComment).filter(all_models.ForumComment.author_id == user_id).count()
    total_messages = post_count + comment_count

    # Count Total Likes Received on Comments
    # (Simple sum query)
    from sqlalchemy import func
    total_likes = db.query(func.sum(all_models.ForumComment.like_count)).filter(all_models.ForumComment.author_id == user_id).scalar() or 0

    new_badge = "Yeni Anne"
    
    # Logic priority: Yardımsever > Tecrübeli > Yeni
    if total_likes > 100:
        new_badge = "Yardımsever 🌟"
    elif total_messages > 50:
        new_badge = "Tecrübeli Anne 🎖️"
    elif total_messages <= 10:
         new_badge = "Yeni Anne ⭐"
    
    # Only update if changed
    if user.badge != new_badge:
        user.badge = new_badge
        db.commit()

# --- Endpoints ---

@router.post("/posts", response_model=PostResponse)
async def create_post(post: PostCreate, db: Session = Depends(get_db)):
    """
    Create a new topic in a specific category.
    """
    # Filter Content
    clean_title = filter_content(post.title)
    clean_content = filter_content(post.content)

    new_post = all_models.ForumPost(
        title=clean_title, 
        content=clean_content, 
        author_id=post.user_id, 
        category=post.category_id.value # Storing the enum value
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # Update Badge
    update_user_badge(post.user_id, db)
    
    # Notify users about new post via WebSocket
    await manager.broadcast(f"New Post in {post.category_id.value}: {post.title}")
    
    # Fetch latest badge
    user = db.query(all_models.User).filter(all_models.User.id == post.user_id).first()
    badge = user.badge if user else "Yeni Anne"
    
    return PostResponse(
        id=new_post.id,
        title=new_post.title,
        content=new_post.content,
        author_id=new_post.author_id,
        author_badge=badge,
        category_id=new_post.category,
        created_at=new_post.created_at
    )

@router.post("/comments", response_model=CommentResponse)
async def create_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    # Filter Content
    clean_content = filter_content(comment.content)

    # 1. Create Comment
    new_comment = all_models.ForumComment(
        post_id=comment.post_id,
        author_id=comment.user_id,
        content=clean_content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # 2. Notify Post Author
    # Fetch post to get author_id
    post = db.query(all_models.ForumPost).filter(all_models.ForumPost.id == comment.post_id).first()
    if post:
        await manager.notify_user(post.author_id, f"Someone commented on your post '{post.title}': {comment.content[:20]}...")

    return new_comment

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(all_models.ForumComment).filter(all_models.ForumComment.post_id == post_id).all()
    return comments

@router.post("/comments/{comment_id}/like")
def like_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(all_models.ForumComment).filter(all_models.ForumComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment.like_count += 1
    db.commit()
    
    # Update Badge for the comment author
    update_user_badge(comment.author_id, db)
    
    return {"status": "success", "likes": comment.like_count}

@router.post("/comments/{comment_id}/helpful")
def mark_helpful_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(all_models.ForumComment).filter(all_models.ForumComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment.is_helpful_count += 1
    db.commit()
    return {"status": "success", "helpful_count": comment.is_helpful_count}

class ReportRequest(BaseModel):
    reason: str

@router.post("/posts/{post_id}/report")
def report_post(post_id: int, request: ReportRequest, db: Session = Depends(get_db)):
    post = db.query(all_models.ForumPost).filter(all_models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.is_flagged = True
    # If already flagged, we might append or just overwrite. Overwriting for simplicity.
    post.flag_reason = request.reason
    db.commit()
    return {"status": "reported", "post_id": post_id}

@router.post("/comments/{comment_id}/report")
def report_comment(comment_id: int, request: ReportRequest, db: Session = Depends(get_db)):
    comment = db.query(all_models.ForumComment).filter(all_models.ForumComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment.is_flagged = True
    comment.flag_reason = request.reason
    db.commit()
    return {"status": "reported", "comment_id": comment_id}

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    """
    Moderator endpoint to see flagged content.
    """
    flagged_posts = db.query(all_models.ForumPost).filter(all_models.ForumPost.is_flagged == True).all()
    flagged_comments = db.query(all_models.ForumComment).filter(all_models.ForumComment.is_flagged == True).all()
    
    return {
        "flagged_posts": [
            {"id": p.id, "title": p.title, "reason": p.flag_reason} for p in flagged_posts
        ],
        "flagged_comments": [
            {"id": c.id, "post_id": c.post_id, "content": c.content, "reason": c.flag_reason} for c in flagged_comments
        ]
    }

# --- Blocking ---
@router.post("/users/{target_id}/block")
def block_user(target_id: int, current_user_id: int = Query(..., description="ID of the blocker"), db: Session = Depends(get_db)):
    # Check if self block
    if target_id == current_user_id:
         raise HTTPException(status_code=400, detail="Cannot block yourself.")
         
    # Check if already blocked
    existing = db.query(all_models.UserBlock).filter(
        all_models.UserBlock.blocker_id == current_user_id,
        all_models.UserBlock.blocked_id == target_id
    ).first()
    
    if existing:
        return {"status": "already_blocked", "message": "User is already blocked."}
        
    new_block = all_models.UserBlock(blocker_id=current_user_id, blocked_id=target_id)
    db.add(new_block)
    db.commit()
    
    return {"status": "success", "message": f"User {target_id} blocked."}
