from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
import json
import os
import time
import base64
from uuid import uuid4
from datetime import datetime
from fastapi.responses import HTMLResponse

# Load API config
CONFIG_FILE = "config.json"
DATA_DIR = "data"
SCREENSHOT_DIR = os.path.join(DATA_DIR, "screenshots")
FEEDBACK_FILE = os.path.join(DATA_DIR, "feedback.json")
RATE_LIMIT_FILE = os.path.join(DATA_DIR, "rate_limit.json")

# Ensure necessary directories exist
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

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
    """Returns the valid statuses from config.json."""
    return {"valid_statuses": VALID_STATUSES}

@app.get("/", response_class=HTMLResponse)
def feedback_form():
    """Serve the feedback submission form."""
    return """
    <html>
    <body>
        <h2>Submit Feedback</h2>
        <form id="feedbackForm">
            <label for="title">Title:</label>
            <input type="text" id="title" required><br>
    
            <label for="text">Description:</label>
            <textarea id="text" required></textarea><br>
    
            <label for="tag">Tag:</label>
            <select id="tag">
                <option value="Bug">Bug</option>
                <option value="Feedback">Feedback</option>
                <option value="Suggestion">Suggestion</option>
            </select><br>
    
            <label for="screenshot">Screenshot:</label>
            <input type="file" id="screenshot"><br>
    
            <label for="contact">Contact (Optional):</label>
            <input type="text" id="contact"><br>
    
            <input type="submit" value="Submit">
        </form>
    
        <script>
            document.getElementById("feedbackForm").addEventListener("submit", async function(event) {
                event.preventDefault();  // Verhindert normales Form-Submit
    
                const title = document.getElementById("title").value;
                const text = document.getElementById("text").value;
                const tag = document.getElementById("tag").value;
                const contact = document.getElementById("contact").value;
                const fileInput = document.getElementById("screenshot");
    
                let base64Screenshot = "";
    
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    base64Screenshot = await convertToBase64(file);
                }
    
                const data = {
                    title: title,
                    text: text,
                    tag: tag,
                    screenshot: base64Screenshot,
                    contact: contact ? { "name": contact } : {}
                };
    
                const response = await fetch("/api/submit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer supersecretkey123"
                    },
                    body: JSON.stringify(data)
                });
    
                const result = await response.json();
                alert(result.message || "Error submitting feedback");
            });
    
            // Funktion zum Konvertieren einer Datei in Base64
            function convertToBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result.split(",")[1]); // Entfernt das Präfix "data:image/png;base64,"
                    reader.onerror = error => reject(error);
                });
            }
        </script>
    </body>
    </html>
    """

# Load config.json example
config_json = {
    "api_key": "supersecretkey123",
    "valid_statuses": ["submitted", "accepted", "rejected", "duplicate"]
}
with open(CONFIG_FILE, "w") as f:
    json.dump(config_json, f, indent=4)
