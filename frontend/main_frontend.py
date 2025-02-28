# file: main.py (frontend)
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
import json
import os
import time
import base64
from uuid import uuid4
from datetime import datetime
from fastapi import Body
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

# Load API config
CONFIG_FILE = "config_frontend.json"
DATA_DIR = "data"
SCREENSHOT_DIR = os.path.join(DATA_DIR, "screenshots")
FEEDBACK_FILE = os.path.join(DATA_DIR, "feedback.json")
RATE_LIMIT_FILE = os.path.join(DATA_DIR, "rate_limit.json")
STATIC_DIR = "static"

# Ensure necessary directories exist
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# Load API Config
def load_config():
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)

CONFIG = load_config()
API_KEY = CONFIG.get("api_key", "")
VALID_STATUSES = CONFIG.get("valid_statuses", ["submitted", "accepted", "rejected", "duplicate"])

# Load rate limit tracking
def load_rate_limit():
    if not os.path.exists(RATE_LIMIT_FILE):
        return {}
    with open(RATE_LIMIT_FILE, "r") as f:
        return json.load(f)

rate_limit = load_rate_limit()

# Feedback data model
class FeedbackEntry(BaseModel):
    title: str
    text: str
    tag: str
    screenshot: str = None  # Base64 encoded image (optional)
    contact: dict = {}

app = FastAPI()
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

def check_rate_limit(client_ip: str):
    """Check if the client has exceeded the rate limit."""
    current_time = time.time()
    if client_ip in rate_limit:
        last_submission_time = rate_limit[client_ip]
        if current_time - last_submission_time < 60:  # 1 minute limit
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
    rate_limit[client_ip] = current_time
    with open(RATE_LIMIT_FILE, "w") as f:
        json.dump(rate_limit, f)

@app.post("/api/submit")
def submit_feedback(entry: FeedbackEntry, authorization: str = Header(...), client_ip: str = Header(None)):
    """API endpoint to receive feedback submissions from the game."""
    # Check API Key
    if authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    # Enforce rate limit
    check_rate_limit(client_ip)
    
    # Generate unique ID
    entry_id = str(uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    # Save screenshot if provided
    screenshot_filename = None
    if entry.screenshot:
        try:
            screenshot_filename = f"{entry_id}.jpg"
            screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_filename)
            with open(screenshot_path, "wb") as f:
                f.write(base64.b64decode(entry.screenshot))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
    
    # Load existing feedback data
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r") as f:
            feedback_data = json.load(f)
    else:
        feedback_data = []
    
    # Append new feedback entry
    feedback_data.append({
        "id": entry_id,
        "title": entry.title,
        "text": entry.text,
        "tag": entry.tag,
        "screenshot": screenshot_filename,
        "contact": entry.contact,
        "timestamp": timestamp,
        "status": "submitted",
        "new": True
    })
    
    # Save updated feedback data
    with open(FEEDBACK_FILE, "w") as f:
        json.dump(feedback_data, f, indent=4)
    
    return {"message": "Feedback submitted successfully", "id": entry_id}

@app.get("/valid_statuses")
def get_valid_statuses():
    """Returns the valid statuses from config_frontend.json."""
    return {"valid_statuses": VALID_STATUSES}

@app.get("/", response_class=HTMLResponse)
def feedback_form():
    """Serve the feedback submission form from an external HTML file."""
    with open(os.path.join(STATIC_DIR, "index_frontend.html"), "r") as f:
        return HTMLResponse(content=f.read())

# endpoint for getting content of feedbacks
@app.get("/api/feedbacks/new")
def get_new_feedbacks():
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r") as f:
            feedback_data = json.load(f)
        # Hier kannst du optional noch filtern, z.B. nach einem Flag "new": True
        new_feedbacks = [fb for fb in feedback_data if fb.get("new", False)]
        return new_feedbacks
    return []

# endpoint for receiving screenshots
@app.post("/api/feedbacks/screenshots")
def get_feedback_screenshots(ids: dict = Body(...)):
    """
    Expects a JSON-object like: {"ids": ["id1", "id2", ...]}
    Delivers a dict: { "id1": "base64string...", "id2": "base64string...", ... }
    """
    result = {}
    requested_ids = ids.get("ids", [])
    for fb_id in requested_ids:
        # Wir nehmen an, dass im Feedback JSON im Frontend das Feld "screenshot" den Dateinamen enthält.
        # Öffne den Screenshot aus dem Screenshot-Verzeichnis:
        screenshot_path = os.path.join(SCREENSHOT_DIR, f"{fb_id}.jpg")
        if os.path.exists(screenshot_path):
            with open(screenshot_path, "rb") as f:
                image_bytes = f.read()
            # Optional: hier könnte eine Komprimierung stattfinden (im Frontend eher nicht nötig)
            b64_string = base64.b64encode(image_bytes).decode()
            result[fb_id] = b64_string
    return result
