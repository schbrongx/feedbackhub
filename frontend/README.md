# Feedback Hub Frontend

## Overview
The Feedback Hub Frontend is a web application that allows users to submit feedback,
including optional screenshots. Users can fill out a form with a title, detailed
description, and select a tag. They can also attach a screenshot — either by uploading 
a file or pasting from the clipboard — and optionally provide contact information. Once 
submitted, the feedback is stored with a timestamp and a status for further processing 
by the backend.

## Tech Stack
- **Framework:** FastAPI (Python)
- **Data Modeling:** Pydantic
- **Web Server:** Uvicorn
- **Frontend Technologies:** HTML, CSS (Bootstrap), JavaScript
- **Storage:** Local JSON files for feedback data and rate limiting; file system for screenshots

## Setup & Running
### Prerequisites
- Python 3.8+
- Git

### Installation Steps
1. **Clone the Repository and Navigate to the Frontend Directory:**
    ```bash
    git clone <repository_url>
    cd frontend
    ```

2. **Set Up the Virtual Environment (Optional but Recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate      # On Windows use: venv\Scripts\activate
    ```

3. **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4. **Configuration:**
    - Review and update `config_frontend.json` as needed (e.g., API key, valid statuses).
    - Ensure the folder structure remains intact, with the `data` directory for storing 
	  feedback and screenshots, and the `static` folder for frontend assets.
	- Example config_frontend.json:
	```
	{
      "api_key": "any_secret_key_you_like_but_the_same_for_frontend_and_backend"
    }
    ```

### Running the Application
- **On Unix-based Systems:**
    ```bash
    ./start_frontend.sh
    ```
- **On Windows (PowerShell):**
    ```powershell
    .\start_frontend.ps1
    ```
- **Alternatively, run directly with Uvicorn:**
    ```bash
    uvicorn main_frontend:app --host 0.0.0.0 --port 8000 --reload
    ```

With default settings the application will be accessible at: 
[http://localhost:8000/](http://localhost:8000/)

### Running the Application with Docker
- ** Starting:**
    ```bash
    docker compose up --build     # add --detach to start 'detached' from your current shell
	```
- ** Stopping:**
    ```bash
	docke compose down     # add -v to remove all artifacts (volumes, services, ...)
	```