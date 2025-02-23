# file: main.py (backend)
from fastapi import FastAPI, Request, Form, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime, timedelta
import os
import bcrypt, json, secrets
from PIL import Image, ImageDraw

# Load configuration
CONFIG_FILE = "config.json"
with open(CONFIG_FILE, "r") as f:
    CONFIG = json.load(f)

# Load users from users.json (updated to handle both dict and list)
def load_users():
    with open("users.json", "r") as f:
        data = json.load(f)
    if isinstance(data, dict):
        return data.get("users", [])
    return data

DATABASE_URL = CONFIG.get("database_url", "")
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

# Simple session management using signed cookies
def create_session(username: str, stay_logged_in: bool):
    token = secrets.token_hex(16)
    expires = timedelta(days=30) if stay_logged_in else timedelta(hours=1)
    return {"username": username, "token": token, "expires": (datetime.utcnow() + expires).isoformat()}

def verify_password(password: str, hashed: str):
    return bcrypt.checkpw(password.encode(), hashed.encode())

class AuthenticationException(Exception):
    def __init__(self, detail: str):
        self.detail = detail

@app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException):
    # Redirect to the login page, appending an error message as a query parameter.
    return RedirectResponse(url=f"/login?error={exc.detail}")

async def get_current_user(request: Request):
    session_cookie = request.cookies.get("session")
    if not session_cookie:
        raise AuthenticationException("Not authenticated")
    try:
        session = json.loads(session_cookie)
        exp = datetime.fromisoformat(session["expires"])
        if datetime.utcnow() > exp:
            raise AuthenticationException("Session expired")
        return session["username"]
    except Exception as e:
        raise AuthenticationException("Invalid session")

# Login page
@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    error = request.query_params.get("error", "")
    remembered = request.cookies.get("remembered_username", "")
    error_html = f'<div class="alert alert-danger mt-3" role="alert">{error}</div>' if error else ""
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Feedback Management - Login</title>
      <link rel="icon" type="image/x-icon" href="/static/favicon.ico">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
    </head>
    <body class="bg-dark">
      <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
        <div class="card p-3" style="max-width: 350px;">
          <h4 class="card-title text-center mb-3 text-dark">Feedback Management - Login</h4>
          <form action="/login" method="post">
            <div class="mb-2">
              <label for="username" class="form-label text-dark">Username</label>
              <input type="text" class="form-control" id="username" name="username" value="{remembered}" placeholder="Enter username">
            </div>
            <div class="mb-2">
              <label for="password" class="form-label text-dark">Password</label>
              <input type="password" class="form-control" id="password" name="password" placeholder="Enter password">
            </div>
            <div class="form-check mb-2">
              <input class="form-check-input" type="checkbox" id="remember_username" name="remember_username">
              <label class="form-check-label text-dark" for="remember_username">Remember my username</label>
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="stay_logged_in" name="stay_logged_in">
              <label class="form-check-label text-dark" for="stay_logged_in">Stay logged in</label>
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
          </form>
          {error_html}
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.post("/login")
def login(response: Response, username: str = Form(...), password: str = Form(...),
          remember_username: bool = Form(False), stay_logged_in: bool = Form(False)):
    users = load_users()
    user = next((u for u in users if u["username"] == username), None)
    if not user or not verify_password(password, user["hashed_password"]):
        return RedirectResponse(url="/login?error=Invalid+credentials", status_code=303)
    session_data = create_session(username, stay_logged_in)
    response = RedirectResponse(url="/", status_code=303)
    response.set_cookie(key="session", value=json.dumps(session_data),
                        httponly=True, max_age=60*60*24*30 if stay_logged_in else 60*60)
    if remember_username:
        response.set_cookie(key="remembered_username", value=username, max_age=60*60*24*30)
    else:
        response.delete_cookie("remembered_username")
    return response


@app.get("/logout")
def logout(response: Response):
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie("session")
    return response

def generate_dummy_screenshot(filename):
    """ Creates a dummy 800x600 screenshot with a placeholder text """
    img = Image.new("RGB", (800, 600), color=(200, 200, 200))
    draw = ImageDraw.Draw(img)
    draw.text((320, 280), "Dummy Screenshot", fill=(0, 0, 0))
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    img.save(filepath, "JPEG")
    return filename

# Admin panel, login protected
@app.get("/", response_class=HTMLResponse)
def admin_panel(request: Request, current_user: str = Depends(get_current_user)):
    with open("static/admin.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/update_status")
def update_status(feedback_id: int = Form(...), new_status: str = Form(...), db=Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    feedback.status = new_status
    feedback.processed = True
    db.commit()
    return RedirectResponse(url="/", status_code=303)

@app.get("/feedbacks")
def get_feedbacks(db=Depends(get_db)):
    feedback_list = db.query(Feedback).all()
    return feedback_list

@app.post("/sync_feedbacks")
def sync_feedbacks(db=Depends(get_db)):
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
