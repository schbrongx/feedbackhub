from fastapi import FastAPI, Depends, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import os
import json

# Load configuration
CONFIG_FILE = "config.json"
with open(CONFIG_FILE, "r") as f:
    CONFIG = json.load(f)

DATABASE_URL = CONFIG.get("database_url", "")

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
