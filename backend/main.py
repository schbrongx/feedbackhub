# file: main.py (backend)
from fastapi import FastAPI, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import os
import json
from PIL import Image, ImageDraw

# Load configuration
CONFIG_FILE = "config.json"
with open(CONFIG_FILE, "r") as f:
    CONFIG = json.load(f)

DATABASE_URL = CONFIG.get("database_url", "postgresql://feedback_user:securepassword@localhost/feedback_db")
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database setup
Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    tag = Column(String(50), nullable=False)
    status = Column(String(50), default="submitted")
    screenshot = Column(String(255), nullable=True)
    contact = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)

# Initialize database
Base.metadata.create_all(bind=engine)

# FastAPI instance
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

def generate_dummy_screenshot(filename):
    """ Creates a dummy 800x600 screenshot with a placeholder text """
    img = Image.new("RGB", (800, 600), color=(200, 200, 200))
    draw = ImageDraw.Draw(img)
    draw.text((320, 280), "Dummy Screenshot", fill=(0, 0, 0))
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    img.save(filepath, "JPEG")
    return filename

@app.get("/", response_class=HTMLResponse)
def admin_panel():
    """ Serve the admin dashboard """
    with open("static/admin.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/update_status")
def update_status(feedback_id: int = Form(...), new_status: str = Form(...), db=Depends(get_db)):
    """ Update the status of a feedback entry """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    feedback.status = new_status
    feedback.processed = True
    db.commit()
    return RedirectResponse(url="/", status_code=303)

@app.get("/feedbacks")
def get_feedbacks(db=Depends(get_db)):
    """ Retrieve all feedbacks """
    feedback_list = db.query(Feedback).all()
    return feedback_list

@app.post("/sync_feedbacks")
def sync_feedbacks(db=Depends(get_db)):
    """ Simulates fetching new feedback from the frontend system and storing it in the database with dummy screenshots."""
    new_feedbacks = [
        {"title": "New Bug", "text": "A critical bug in the game", "tag": "Bug", "screenshot": generate_dummy_screenshot("bug1.jpg")},
        {"title": "UI Issue", "text": "Some UI elements overlap", "tag": "Feedback", "screenshot": generate_dummy_screenshot("ui1.jpg")},
        {"title": "Feature Request", "text": "We need a night mode", "tag": "Suggestion", "screenshot": generate_dummy_screenshot("feature1.jpg")}
    ]
    
    for feedback in new_feedbacks:
        db.add(Feedback(
            title=feedback["title"],
            text=feedback["text"],
            tag=feedback["tag"],
            status="submitted",
            screenshot=feedback["screenshot"],
            created_at=datetime.utcnow()
        ))
    db.commit()
    
    return JSONResponse(content={"message": "Sync completed successfully."})

@app.post("/delete_feedback")
def delete_feedback(feedback_id: int = Form(...), db=Depends(get_db)):
    """ Delete a feedback entry by ID """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(feedback)
    db.commit()
    return JSONResponse(content={"message": "Feedback deleted successfully."})

# Example for a config.json:
#{
#    "database_url": "postgresql://myuser:mypassword@localhost/feedback_db",
#    "valid_statuses": ["submitted", "reviewed", "accepted", "rejected", "duplicate", "spam"],
#    "admin_users": ["admin1", "admin2"],
#    "secret_key": "supersecretkey123"
#}
